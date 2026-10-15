import {backdrop,character,illustratedEmoji} from './visuals.js';
import { createGame } from './games.js';
import { ITEMS } from './content.js';
import { translate } from './i18n.js';
export const W=360,H=540;
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function hit(a,b) { return Math.abs(a.x-b.x)<((a.w||30)+(b.w||30))/2 && Math.abs(a.y-b.y)<((a.h||30)+(b.h||30))/2; }
export function round(ctx,x,y,w,h,r=9,fill='#fff9ed') { ctx.fillStyle=fill;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill(); }
export function label(ctx,text,x,y,size=14,color='#263e35',align='center') {text=translate(text,ctx.gameLanguage||'en');ctx.font=`600 ${size}px system-ui, "PingFang TC", "Microsoft JhengHei", sans-serif`;ctx.fillStyle=color;ctx.textAlign=align;ctx.textBaseline='middle';ctx.fillText(text,x,y,align==='center'?Math.min(W-24,Math.max(50,2*Math.min(x,W-x))):W-x-12);}
export function emoji(ctx,text,x,y,size=27) {if(illustratedEmoji(ctx,text,x,y,size))return;ctx.font=`${size}px Apple Color Emoji, Segoe UI Emoji, sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,x,y);}
export function coin(ctx,x,y,r=8) {ctx.fillStyle='#d9a84c';ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#f6db85';ctx.lineWidth=2;ctx.stroke();label(ctx,'·',x,y,14,'#8c6b2c');}
export function scene(ctx,theme,time=ctx.animTime||0) {if(backdrop(ctx,theme,time))return;
  if(['cairo','night','temple','reef','sunset'].includes(theme)){egyptScene(ctx,theme,time);return;}
  const colors={mountain:['#d4e5e7','#eff4ee'],rome:['#d9d7c9','#f0e5d3'],south:['#f5e2c3','#ead5aa'],water:['#b7d8cc','#689c99']};const [top,bottom]=colors[theme]||colors.mountain;
  const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,top);g.addColorStop(1,bottom);ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  ctx.fillStyle='#fff8df';ctx.beginPath();ctx.arc(286,68,26,0,Math.PI*2);ctx.fill();
  if(theme==='mountain') {
    for(let i=0;i<4;i++){const x=i*130-30;ctx.fillStyle=i%2?'#b4c8c9':'#a0b9b8';ctx.beginPath();ctx.moveTo(x-90,215);ctx.lineTo(x+65,66+i*19);ctx.lineTo(x+200,215);ctx.fill();ctx.fillStyle='#eff5ef';ctx.beginPath();ctx.moveTo(x+19,112+i*19);ctx.lineTo(x+65,66+i*19);ctx.lineTo(x+104,109+i*19);ctx.lineTo(x+63,103+i*19);ctx.fill();}
  } else if(theme==='rome') {
    for(let i=0;i<7;i++){const x=i*60;round(ctx,x,140+(i%3)*12,50,90,2,i%2?'#c3b29c':'#b3a88d');ctx.fillStyle='#ecdfc5';ctx.beginPath();ctx.arc(x+25,141+(i%3)*12,25,Math.PI,0);ctx.fill();}
  } else if(theme==='water'){for(let i=0;i<12;i++){ctx.strokeStyle='#ffffff28';ctx.lineWidth=2;ctx.beginPath();const y=185+i*32;ctx.moveTo(0,y);ctx.bezierCurveTo(90,y+6,170,y-6,360,y+3);ctx.stroke();}}
  else{for(let i=0;i<6;i++){round(ctx,i*67-13,162+i%2*14,60,69,3,i%2?'#ccad80':'#cf9470');round(ctx,i*67+2,152+i%2*14,31,8,2,'#d9bda2');}}
}
const images={};
export function getImage(name){return images[name];}
export const SPRITES=[...new Set(['yiting','marco','italy','egypt','scenes-italy','scenes-egypt','food-props','yiting-motion','marco-motion','travel-props',...ITEMS.filter(i=>i.sprite).map(i=>i.sprite)])];
export async function loadSprites() {await Promise.all(SPRITES.map(name=>new Promise(resolve=>{const im=new Image();im.onload=()=>{images[name]=im;resolve();};im.onerror=()=>resolve();im.src=`/assets/${name}.webp`;})));}
export function art(ctx,name,x,y,w,h){const image=images[name];if(!image)return false;const ratio=Math.max(w/image.width,h/image.height),sw=w/ratio,sh=h/ratio;ctx.drawImage(image,(image.width-sw)/2,(image.height-sh)/2,sw,sh,x,y,w,h);return true;}
function egyptScene(ctx,theme,time){
  const shades={cairo:['#eecb94','#dcc28b'],night:['#26324a','#687082'],temple:['#d6b788','#a18768'],reef:['#93d5ca','#34718e'],sunset:['#f1cda3','#d79683']},[a,b]=shades[theme],g=ctx.createLinearGradient(0,0,0,540);g.addColorStop(0,a);g.addColorStop(1,b);ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  if(theme==='night'){ctx.fillStyle='#fff1bd';ctx.beginPath();ctx.arc(278,72,23,0,Math.PI*2);ctx.fill();for(let n=0;n<15;n++){ctx.fillStyle='#e6d6b7';ctx.fillRect((n*79)%350,22+(n*33)%135,2,2);}}
  if(theme==='cairo'||theme==='night'){for(let n=0;n<7;n++){const x=n*63-15,y=132+n%3*17;round(ctx,x,y,55,109,3,theme==='night'?'#404c63':n%2?'#bd9768':'#c6a879');ctx.fillStyle=theme==='night'?'#e7bd75':'#977853';for(let row=0;row<3;row++)for(let col=0;col<2;col++)ctx.fillRect(x+10+col*22,y+18+row*25,10,13);}ctx.fillStyle=theme==='night'?'#f0cc90':'#d8b276';ctx.beginPath();ctx.moveTo(80,136);ctx.lineTo(140,56);ctx.lineTo(210,136);ctx.fill();}
  if(theme==='temple'){for(let n=0;n<5;n++){round(ctx,n*85-20,94,62,450,6,n%2?'#b39770':'#bca57d');round(ctx,n*85-25,98,72,16,2,'#c9b48c');}for(let y=145;y<540;y+=43){ctx.strokeStyle='#9a835955';ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(360,y);ctx.stroke();}}
  if(theme==='reef'){for(let n=0;n<12;n++){ctx.strokeStyle='#d2f4dc33';ctx.lineWidth=2;ctx.beginPath();const x=n*45;ctx.moveTo(x,-10);ctx.lineTo(x-130,540);ctx.stroke();}for(let n=0;n<9;n++){const x=n*47-12,y=502+n%2*20;ctx.strokeStyle=n%2?'#e4ac88':'#91bdb0';ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(x,y+32);ctx.lineTo(x,y-15);ctx.moveTo(x,y+9);ctx.lineTo(x-14,y-8);ctx.moveTo(x,y+6);ctx.lineTo(x+13,y-17);ctx.stroke();}}
  if(theme==='sunset'){ctx.fillStyle='#fff0bf';ctx.beginPath();ctx.arc(265,153,37,0,Math.PI*2);ctx.fill();ctx.fillStyle='#95bab3';ctx.fillRect(0,264,360,276);for(let n=0;n<8;n++){ctx.strokeStyle='#f7dcbe80';ctx.beginPath();ctx.moveTo(0,298+n*31);ctx.lineTo(360,298+n*31+Math.sin(time)*4);ctx.stroke();}}
}
export function actor(ctx,config,x,y,height=65,marco=false) {character(ctx,config,x,y,height,marco);}
export class GameRunner {
  constructor(canvas,mode,config,onStatus,onFinish) {
    this.canvas=canvas;this.ctx=canvas.getContext('2d');this.config=config;this.mode=mode;this.onStatus=onStatus;this.onFinish=onFinish;this.game=createGame(mode,config);this.running=false;this.paused=false;this.destroyed=false;this.input={x:W/2,y:H/2,down:false,keys:new Set()};this.last=0;this.elapsed=0;this.listeners=[];this.frame=0;
    canvas.width=W*2;canvas.height=H*2;this.ctx.scale(2,2);
    const listen=(target,event,fn,opts)=>{target.addEventListener(event,fn,opts);this.listeners.push(()=>target.removeEventListener(event,fn,opts));};
    const point=e=>{const rect=canvas.getBoundingClientRect();return{x:(e.clientX-rect.left)*W/rect.width,y:(e.clientY-rect.top)*H/rect.height};};
    listen(canvas,'pointerdown',e=>{e.preventDefault();canvas.setPointerCapture(e.pointerId);const p=point(e);Object.assign(this.input,p,{down:true});if(this.running&&!this.paused)this.game.pointer?.('down',p,this);});
    listen(canvas,'pointermove',e=>{if(!this.input.down)return;const p=point(e);Object.assign(this.input,p);if(this.running&&!this.paused)this.game.pointer?.('move',p,this);});
    const up=e=>{const p=point(e);this.input.down=false;if(this.running&&!this.paused)this.game.pointer?.('up',p,this);};listen(canvas,'pointerup',up);listen(canvas,'pointercancel',()=>{this.input.down=false;this.game.focusHeld=false;this.game.gesture=null;this.game.angle=null;this.game.held=null;this.game.drag=null;});
    listen(window,'keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space','KeyA','KeyD','KeyS','KeyE','KeyR'].includes(e.code)){e.preventDefault();const fresh=!this.input.keys.has(e.code);this.input.keys.add(e.code);if(fresh&&this.running&&!this.paused)this.game.action?.(e.code,this);}});
    listen(window,'keyup',e=>this.input.keys.delete(e.code));
    listen(document,'visibilitychange',()=>{if(document.hidden&&this.running){this.pause(true);this.onStatus({...this.game.stats(),paused:true});}});
    this.draw();
  }
  start(){if(this.destroyed)return;this.running=true;this.paused=false;this.last=performance.now();this.loop(this.last);}
  pause(value=!this.paused){this.paused=value;this.input.keys.clear();this.input.down=false;this.game.focusHeld=false;this.game.gesture=null;this.game.angle=null;this.game.held=null;this.game.drag=null;this.last=performance.now();}
  loop(now){if(this.destroyed||!this.running)return;const dt=Math.min(.033,Math.max(0,(now-this.last)/1000));this.last=now;if(!this.paused){this.elapsed+=dt;const score=this.game.score,lives=this.game.lives;if(!this.game.done)this.game.update(dt,this.input,this);else{this.game.time+=dt;this.game.fx?.update(dt);}
if(this.game.score>score)this.config.onFeedback?.(this.game.combo>2?'perfect':'gain');if(this.game.lives<lives)this.config.onFeedback?.('hit');this.draw();if(this.frame++%8===0)this.onStatus(this.game.stats());if(this.game.done){this.finishDelay=(this.finishDelay||0)+dt;if(this.finishDelay>(this.game.won?1.1:.45)){this.running=false;this.onFinish(this.game.result());return;}}}this.raf=requestAnimationFrame(t=>this.loop(t));}
  draw(){this.ctx.animTime=this.game.time||0;this.ctx.gameLanguage=this.config.language||'en';this.ctx.save();this.ctx.clearRect(0,0,W,H);if(this.game.fx?.shake&&!this.config.reducedMotion)this.ctx.translate(Math.sin(this.elapsed*80)*3,Math.cos(this.elapsed*95)*2);this.game.draw(this.ctx,this);if(this.game.done&&this.game.won){this.ctx.fillStyle='#18364166';this.ctx.fillRect(0,0,W,H);round(this.ctx,65,222,230,85,22,'#173f50ed');label(this.ctx,'Beautifully done!',180,253,24,'#ffe1a3');label(this.ctx,'★ '.repeat(this.game.result().stars).trim(),180,284,21,'#eac478');}this.ctx.restore();}
  control(code,down){if(down){this.input.keys.add(code);if(this.running&&!this.paused)this.game.action?.(code,this);}else this.input.keys.delete(code);}
  destroy(){this.destroyed=true;this.running=false;cancelAnimationFrame(this.raf);for(const stop of this.listeners)stop();}
}
