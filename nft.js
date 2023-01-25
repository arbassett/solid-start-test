import { nodeFileTrace } from '@vercel/nft';
import fs from 'node:fs'
const file = './.vercel/output/functions/render.func/index.js';
const { fileList } = await nodeFileTrace([file]);

fs.writeFileSync(`${file}.nft.json`, JSON.stringify({version: 1, files: Array.from(fileList)}))