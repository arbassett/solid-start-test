import { nodeFileTrace } from '@vercel/nft';
import fs from 'node:fs'
import path from 'node:path'
const file = './.vercel/output/functions/render.func/index.js';
const { fileList } = await nodeFileTrace([file],{
    // processCwd: './.vercel/output/functions/render.func',
});

fs.writeFileSync(`${file}.nft.json`, JSON.stringify({version: 1, files: Array.from(fileList).map((file) =>  path
    .relative('./.vercel/output/functions/render.func', file)
    .replace(/\\/g, '/'))}))