import {build} from 'esbuild';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';

await mkdir('.cache',{recursive:true});
const output=resolve('.cache/prerender.mjs');
await build({entryPoints:['src/prerender.tsx'],outfile:output,bundle:true,platform:'node',format:'esm',packages:'external',jsx:'automatic',logLevel:'warning'});
const {render}=await import(pathToFileURL(output).href);
const markup=render();
assert(markup.includes('Experience'));
assert(markup.includes('100-day project journey'));
assert(markup.includes('Conestoga College'));
const template=await readFile('dist/index.html','utf8');
assert(template.includes('<div id="root"></div>'));
await writeFile('dist/index.html',template.replace('<div id="root"></div>','<div id="root">'+markup+'</div>'));
console.log('Pre-rendered portfolio content into the initial HTML.');
