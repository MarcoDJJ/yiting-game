import { createRequire } from 'node:module';
import { readFile,writeFile } from 'node:fs/promises';
import { createGame } from '../lib/games.js';
import { loadSprites } from '../lib/engine.js';
import { CHAPTERS } from '../lib/content.js';
const require=createRequire(import.meta.url);const {createCanvas,loadImage}=require(require.resolve('@napi-rs/canvas',{paths:[process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES]}));
globalThis.Image=class {set src(path){loadImage(`.${path}`).then(image=>{Object.assign(this,{width:image.width,height:image.height});this.image=image;this.onload?.();}).catch(()=>this.onerror?.());}};
await loadSprites();
// Deterministic icon rasterization and game-render smoke sheets. Not a browser test.
for(const size of [192,512]){const image=await loadImage(await readFile('assets/icon.svg'));const c=createCanvas(size,size),ctx=c.getContext('2d');ctx.drawImage(image,0,0,size,size);await writeFile(`assets/icon-${size}.png`,c.toBuffer('image/png'));}
const c=createCanvas(1080,1620),ctx=c.getContext('2d');
const drawImage=ctx.drawImage.bind(ctx);ctx.drawImage=(image,...args)=>drawImage(image.image||image,...args);
for(const [i,mode] of ['snowman','summit','drive','castle','rowing','photo','gelato','market','pasta'].entries()){ctx.save();ctx.translate(i%3*360,Math.floor(i/3)*540);const game=createGame(mode,{stage:1});if(game.items)game.items=[{x:90,y:310,kind:'coin',w:30,h:30},{x:250,y:265,kind:mode==='drive'?'snow':mode==='rowing'?'buoy':mode==='photo'?'food':'decoration',dish:'🍝',w:30,h:30}];if(mode==='gelato')game.scoops=[{color:'#cda482',offset:0},{color:'#c9dbc4',offset:1},{color:'#f5d7d9',offset:-1}];if(mode==='castle'){game.x=game.width-185;game.camera=game.width-330;}game.draw(ctx);ctx.restore();}
await writeFile('/tmp/yiting-game-render-qa.png',c.toBuffer('image/png'));
const egypt=createCanvas(1440,1080),ec=egypt.getContext('2d'),originalDraw=ec.drawImage.bind(ec);ec.drawImage=(image,...args)=>originalDraw(image.image||image,...args);
const textLog=[],originalText=ec.fillText.bind(ec);ec.fillText=(value,...args)=>{textLog.push(value);originalText(value,...args);};
for(const [i,chapter]of CHAPTERS.filter(c=>c.world==='egypt'&&!c.finale).entries()){ec.save();ec.translate(i%4*360,Math.floor(i/4)*540);const game=createGame(chapter.id,{stage:1,sprite:'yiting-egypt',marcoSprite:'marco-desert'});game.update(.5,{x:180,y:290,down:false,keys:new Set()});if(game.order)game.order();ec.gameLanguage='en';game.draw(ec);ec.gameLanguage='zh-TW';game.draw(ec);ec.gameLanguage='en';game.draw(ec);ec.restore();}
await writeFile('/tmp/yiting-egypt-render-qa.png',egypt.toBuffer('image/png'));
await writeFile('/tmp/yiting-egypt-text-qa.json',JSON.stringify(textLog,null,2));
console.log('Icons and all 17 minigame canvas screens rendered; English/Traditional Chinese labels exercised. Native canvas smoke test, not browser QA.');
