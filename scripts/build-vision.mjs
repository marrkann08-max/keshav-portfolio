import {build} from 'esbuild';
import {mkdir,readdir,copyFile,access,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
await access('public/vision/hand_landmarker.task');
await mkdir('public/vision/wasm',{recursive:true});
const source='node_modules/@mediapipe/tasks-vision/wasm';
for(const name of await readdir(source)){
 if((name.endsWith('.js')||name.endsWith('.wasm'))&&!name.includes('module_internal'))await copyFile(join(source,name),join('public/vision/wasm',name));
}
await build({entryPoints:['src/vision-worker.ts'],outfile:'public/vision/hand-worker.js',bundle:true,format:'iife',platform:'browser',target:'es2022',minify:true,logLevel:'warning'});
await writeFile('public/vision/NOTICE.txt','MediaPipe Tasks Vision and Hand Landmarker model — Google. Apache-2.0.\nPackage: https://www.npmjs.com/package/@mediapipe/tasks-vision\nModel: https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task\nDocs: https://developers.google.com/edge/mediapipe/solutions/vision/hand_landmarker/web_js\n');
console.log('Built the local camera worker and self-hosted MediaPipe runtime.');
