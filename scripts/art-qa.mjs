import {createRequire} from 'node:module';
import {writeFile} from 'node:fs/promises';
import {createGame} from '../lib/games.js';
import {loadSprites,actor} from '../lib/engine.js';
import {CHAPTERS,ITEMS} from '../lib/content.js';
const require=createRequire(import.meta.url);
const {createCanvas,loadImage,GlobalFonts}=require(require.resolve('@napi-rs/canvas',{paths:[process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES]}));
GlobalFonts.registerFromPath('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf','system-ui');
GlobalFonts.registerFromPath('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf','system-ui');
globalThis.Image=class{set src(path){loadImage('.'+path).then(image=>{Object.assign(this,{width:image.width,height:image.height,image});this.onload?.();}).catch(()=>this.onerror?.());}};
await loadSprites();
const input={x:180,y:300,down:false,keys:new Set()};
for(const world of ['italy','egypt']){
 const chapters=CHAPTERS.filter(c=>c.world===world&&!c.finale),canvas=createCanvas(1080,Math.ceil(chapters.length/3)*540),ctx=canvas.getContext('2d'),drawImage=ctx.drawImage.bind(ctx);
 ctx.drawImage=(image,...args)=>drawImage(image.image||image,...args);
 for(const [n,c]of chapters.entries()){
  const g=createGame(c.id,{stage:1,sprite:'yiting',marcoSprite:'marco'});
  for(let f=0;f<60;f++)g.update(1/60,input);
  if(c.id==='snowman'){g.phase='stack';g.ball=1;g.placed=[{x:180,y:421,r:48}];g.pos={x:85,y:245};}
  if(c.id==='gelato'){g.scoops=[{color:0,offset:2},{color:1,offset:-1},{color:2,offset:0}];g.request=0;}
  if(c.id==='photo'){g.focus=.6;g.hunger=.5;}
  if(c.id==='pasta'){g.phase=1;g.stir=5;}
  if(c.id==='bus'){g.items=[{lane:0,y:335,kind:'luggage'},{lane:2,y:290,kind:'barrier'},{lane:1,y:220,kind:'ticket'}];}
  if(c.id==='detour'){g.temptation='coffee';g.temptTime=2;}
  if(c.id==='breathe'){g.player={x:440,y:280};g.camera=290;}
  if(c.id==='reef'){g.pairs[0].path=g.pairs[0].solution;g.pairs[0].connected=true;}
  if(c.id==='crew'){g.order();g.order();g.selected=0;}
  ctx.save();ctx.translate(n%3*360,Math.floor(n/3)*540);ctx.animTime=g.time;ctx.gameLanguage='en';g.draw(ctx);ctx.restore();
 }
 await writeFile('/tmp/yiting-'+world+'-v3-qa.png',canvas.toBuffer('image/png'));
}
const canvas=createCanvas(1440,540),ctx=canvas.getContext('2d'),drawImage=ctx.drawImage.bind(ctx);ctx.drawImage=(im,...args)=>drawImage(im.image||im,...args);
const g=createGame('summit',{stage:1});for(let n=0;n<4;n++){for(let f=0;f<15;f++)g.update(1/60,{...input,keys:new Set(['ArrowRight'])});if(n===1)g.action('Space');ctx.save();ctx.translate(n*360,0);ctx.animTime=g.time;g.draw(ctx);ctx.restore();}
await writeFile('/tmp/yiting-motion-v3-qa.png',canvas.toBuffer('image/png'));
console.log('All 17 illustrated game scenes and a four-frame character motion strip rendered. Native canvas inspection, not browser QA.');

const outfits=['yiting','marco',...ITEMS.filter(i=>i.sprite&&i.sprite!=='yiting').map(i=>i.sprite)];
const poses=['idle','run','jump','wave','swim'],wardrobe=createCanvas(650,outfits.length*150),wc=wardrobe.getContext('2d'),wd=wc.drawImage.bind(wc);wc.drawImage=(im,...args)=>wd(im.image||im,...args);wc.fillStyle='#e8e5d9';wc.fillRect(0,0,wardrobe.width,wardrobe.height);
for(const [row,name]of outfits.entries())for(const [col,pose]of poses.entries()){wc.animTime=.65;actor(wc,{sprite:name,marcoSprite:name,pose},col*130+65,row*150+74,100,name.startsWith('marco'));wc.font='10px system-ui';wc.fillStyle='#234';wc.fillText(name+' '+pose,col*130+5,row*150+144);}
await writeFile('/tmp/yiting-wardrobe-v3-qa.png',wardrobe.toBuffer('image/png'));
