import { mkdir,cp } from 'node:fs/promises';
await mkdir('dist',{recursive:true});
for(const path of ['index.html','style.css','app.js','sw.js','manifest.webmanifest','_headers','_routes.json','lib','assets']) await cp(path,`dist/${path}`,{recursive:true});
console.log('Static game built in dist/. Pages Functions are compiled by Cloudflare from functions/.');
