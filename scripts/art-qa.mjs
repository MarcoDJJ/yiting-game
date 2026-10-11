import { createRequire } from 'node:module';
import { readFile,writeFile } from 'node:fs/promises';
import { createGame } from '../lib/games.js';
import { loadSprites } from '../lib/engine.js';
const require=createRequire(import.meta.url);const {createCanvas,loadImage}=require(require.resolve('@napi-rs/canvas',{paths:[process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES]}));
globalThis.Image=class {set src(path){loadImage(`.${path}`).then(image=>{Object.assign(this,{width:image.width,height:image.height});this.image=image;this.onload?.();}).catch(()=>this.onerror?.());}};
await loadSprites();
// Deterministic icon rasterization and game-render smoke sheets. Not a browser test.
for(const size of [192,512]){const image=await loadImage(await readFile('assets/icon.svg'));const c=createCanvas(size,size),ctx=c.getContext('2d');ctx.drawImage(image,0,0,size,size);await writeFile(`assets/icon-${size}.png`,c.toBuffer('image/png'));}
const c=createCanvas(1080,1620),ctx=c.getContext('2d');
const drawImage=ctx.drawImage.bind(ctx);ctx.drawImage=(image,...args)=>drawImage(image.image||image,...args);
for(const [i,mode] of ['snowman','summit','drive','castle','rowing','photo','gelato','market','pasta'].entries()){ctx.save();ctx.translate(i%3*360,Math.floor(i/3)*540);const game=createGame(mode,{stage:1});if(game.items)game.items=[{x:90,y:310,kind:'coin',w:30,h:30},{x:250,y:265,kind:mode==='drive'?'snow':mode==='rowing'?'buoy':mode==='photo'?'food':'decoration',dish:'🍝',w:30,h:30}];if(mode==='gelato')game.scoops=[{color:'#cda482',offset:0},{color:'#c9dbc4',offset:1},{color:'#f5d7d9',offset:-1}];if(mode==='castle'){game.x=game.width-185;game.camera=game.width-330;}game.draw(ctx);ctx.restore();}
await writeFile('/tmp/yiting-game-render-qa.png',c.toBuffer('image/png'));
console.log('Icons rasterized; nine minigame canvas screens rendered to scratch for inspection.');
