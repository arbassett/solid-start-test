import { nodeFileTrace } from "@vercel/nft";
import fs from "node:fs/promises";
import nodePath from "node:path";

const getDirectories = async (source) =>
  (await fs.readdir(source, { withFileTypes: true }))
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

const getIndexFromDirectory = async (source) =>
  (await fs.readFile(source, { withFileTypes: true }))
    .filter(
      (file) => file.isFile() && console.log(file) && file.name === "index.js"
    )
    .map((file) => file.name);

const getVercelFunctionFolders = async (path) => {
  const functions = await getDirectories(path);
  return functions
    .filter((func) => func.endsWith(".func"))
    .map((func) => `${path}/${func}`);
};

const functions = await getVercelFunctionFolders(".vercel/output/functions");

functions.forEach(async (func) => {
  console.log("func", func);
  const handler = "index.js";
  console.log("index", handler);
  const { fileList, warnings } = await nodeFileTrace([`${func}/index.js`], {});

  // adpated from https://github.com/withastro/astro/blob/9c298aa5ae235e8b2555f26b1f19394aaab55da8/packages/integrations/vercel/src/lib/nft.ts#L30-L46
  for (const error of warnings) {
    if (error.message.startsWith("Failed to resolve dependency")) {
      const [, module, file] =
        /Cannot find module '(.+?)' loaded from (.+)/.exec(error.message);

      if (entryPath === file) {
        console.warn(
          `[Vercel dep scan] The module "${module}" couldn't be resolved. This may not be a problem, but it's worth checking.`
        );
      } else {
        console.warn(
          `[Vercel dep scan] The module "${module}" inside the file "${file}" couldn't be resolved. This may not be a problem, but it's worth checking.`
        );
      }
    }
    // parse errors are likely not js and can safely be ignored,
    // such as this html file in "main" meant for nw instead of node:
    // https://github.com/vercel/nft/issues/311
    else if (error.message.startsWith("Failed to parse")) {
      continue;
    } else {
      throw error;
    }
  }

  const results = [...fileList].filter(
    (file) => !file.includes(func) && file !== "package.json"
  );

  console.log("results", results);

  for (const origin of results) {
    console.log("origin", origin);
    const destFolder = nodePath.dirname(`${func}/${origin}`);
    console.log(destFolder);

    const isSymlink = (await fs.stat(origin)).isSymbolicLink();
    const isDir = (await fs.stat(origin)).isDirectory();

    console.log("isDir", isDir, isSymlink);

    // Create directories recursively
    if (isDir && !isSymlink) {
      // see comment below on if why im not sure if this works
      console.log("make dir", `../${destFolder}`);
      await fs.mkdir(`../${destFolder}`, { recursive: true });
    } else {
      console.log("make dir", `./${destFolder}`);
      await fs.mkdir(destFolder, { recursive: true });
    }

    if (isSymlink) {
      // Not really sure if this works due to astro heavly using URLs and gereates a function that mimics the file structure from root
      // The whole generate a path from the root fs might be perfectly fine in the vercel build context but i have not looked into it yet

      // this may not be necessary due to how solid bundles vs astro ... astro doesn't always bundle everything into a single file
      // ex. @prisma/client is not bundled into the handler while solidjs is
      // and due to that the nft path is a direct path where the symlink would resolve to
      const realpath = await fs.realpath(origin);
      console.log("realpath", realpath);

      await fs.symlink(
        nodePath.relative(`${func}/${origin}`, realpath),
        destFolder,
        isDir ? "dir" : "file"
      );
    } else if (!isDir) {
      console.log("copy", `${func}/${origin}`);
      await fs.copyFile(origin, `${func}/${origin}`);
    }
  }
});
