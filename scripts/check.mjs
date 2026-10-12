import { readdir,readFile,access } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { SPRITES } from '../lib/engine.js';
const list=[];async function walk(path){for(const f of await readdir(path,{withFileTypes:true})){if(['node_modules','dist','.git'].includes(f.name))continue;const full=`${path}/${f.name}`;if(f.isDirectory())await walk(full);else if(/\.(js|mjs)$/.test(f.name))list.push(full);}}await walk('.');
for(const file of list){const p=spawnSync(process.execPath,['--check',file],{stdio:'inherit'});if(p.status!==0)process.exit(p.status);}
for(const path of [...SPRITES.map(name=>`assets/${name}.webp`),'assets/icon-192.png','assets/icon-512.png'])await access(path);
const manifest=JSON.parse(await readFile('manifest.webmanifest','utf8'));if(manifest.display!=='standalone')throw new Error('PWA manifest is invalid');
console.log(`${list.length} JavaScript files parsed; all runtime image assets and the PWA manifest are present.`);
