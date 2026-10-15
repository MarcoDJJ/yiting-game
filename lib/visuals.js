import {MOTION_FRAMES,TRAVEL_PROPS} from './motion-frames.js';
import {clamp,round,label,getImage} from './engine.js';

export const SCENES={mountain:['italy',0],summit:['italy',1],castle:['italy',2],water:['italy',3],rome:['italy',3],restaurant:['italy',4],south:['italy',5],market:['italy',5],kitchen:['italy',5],cairo:['egypt',0],night:['egypt',1],temple:['egypt',2],desert:['egypt',3],reef:['egypt',4],sunset:['egypt',5]};
export function atlas(ctx,name,index,cols,rows,x,y,w,h,cover=false){
  const im=getImage(name);if(!im)return false;const cw=im.width/cols,ch=im.height/rows;
  let sw=cw,sh=ch;if(cover){const s=Math.max(w/cw,h/ch);sw=w/s;sh=h/s;}
  ctx.drawImage(im,index%cols*cw+(cw-sw)/2,Math.floor(index/cols)*ch+(ch-sh)/2,sw,sh,x,y,w,h);return true;
}
export function travelProp(ctx,name,x,y,w,h,rotation=0){
  const im=getImage('travel-props'),f=TRAVEL_PROPS.frames.find(f=>f.name===name);if(!im||!f)return false;
  ctx.save();ctx.translate(x,y);ctx.rotate(rotation);ctx.drawImage(im,f.x,f.y,f.w,f.h,-w/2,-h/2,w,h);ctx.restore();return true;
}
export function backdrop(ctx,theme,time=0,pan=0){
  const data=SCENES[theme]||SCENES.mountain;
  if(!atlas(ctx,'scenes-'+data[0],data[1],3,2,-16+Math.sin(time*.12)*6-pan%8,-4,392,552,true))return false;
  const shade=ctx.createLinearGradient(0,0,0,540);shade.addColorStop(0,'#0b18302b');shade.addColorStop(.55,'#152d3810');shade.addColorStop(1,'#10203944');ctx.fillStyle=shade;ctx.fillRect(0,0,360,540);
  ctx.save();
  for(let n=0;n<22;n++){const x=((n*71+Math.sin(time*.3+n)*13)%380+380)%380,y=(n*47+time*(theme==='reef'?-13:theme==='mountain'?18:2)+5400)%560;
    if(theme==='reef'){ctx.strokeStyle='#dcffff55';ctx.lineWidth=1;ctx.beginPath();ctx.arc(x,y,2+n%4,0,Math.PI*2);ctx.stroke();}
    else if(['mountain','summit','night','temple'].includes(theme)){ctx.fillStyle=theme==='temple'?'#ffd88366':'#ffffffaa';ctx.beginPath();ctx.arc(x,y,theme==='night'?1:1+n%3*.6,0,Math.PI*2);ctx.fill();}
  }
  if(['reef','water','sunset'].includes(theme)){ctx.strokeStyle='#d5fff128';ctx.lineWidth=2;for(let n=0;n<15;n++){ctx.beginPath();for(let x=0;x<=360;x+=10){const y=160+n*27+Math.sin(x*.025+time*1.2+n)*4;x?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();}}
  ctx.restore();return true;
}
const PROP_IDS=['tomato','garlic','basil','pasta','aubergine','cheese','lemon','bread','pepper','olive','pizza','strawberry','coffee','water','juice','camera'];
const EMOJI_IDS={'🍅':'tomato','🧄':'garlic','🌿':'basil','🍝':'pasta','🍆':'aubergine','🧀':'cheese','🍋':'lemon','🥖':'bread','🌶️':'pepper','🫒':'olive','🍕':'pizza','🍓':'strawberry','☕':'coffee','📷':'camera'};
export function prop(ctx,id,x,y,size=34,rotation=0){id=EMOJI_IDS[id]||id;const n=PROP_IDS.indexOf(id);ctx.save();ctx.translate(x,y);ctx.rotate(rotation);const ok=n>=0&&atlas(ctx,'food-props',n,4,4,-size/2,-size/2,size,size);if(!ok){ctx.fillStyle={tomato:'#e46e52',basil:'#5d9b6e',lemon:'#f7ca51',pasta:'#e4b85c',cheese:'#f7ce78',aubergine:'#76518a',garlic:'#eadfc8'}[id]||'#e6ae78';ctx.beginPath();ctx.ellipse(0,0,size*.33,size*.4,-.3,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ffffff55';ctx.beginPath();ctx.ellipse(-size*.1,-size*.13,size*.1,size*.13,-.3,0,Math.PI*2);ctx.fill();}ctx.restore();return ok;}
export function illustratedEmoji(ctx,text,x,y,size){if(EMOJI_IDS[text]){prop(ctx,text,x,y,size);return true;}if(text==='🐢'){turtle(ctx,x,y,size,ctx.animTime||0);return true;}if(text==='🪨'){rock(ctx,x,y,size);return true;}return false;}
function limb(ctx,x,y,length,angle,color,width,hand=false){ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,length);ctx.stroke();if(hand){ctx.fillStyle='#f2c6a7';ctx.beginPath();ctx.arc(0,length+1,width*.48,0,Math.PI*2);ctx.fill();}ctx.restore();}
// Illustrated motion frames for the everyday clothes; textured articulated pieces
// preserve every purchased wardrobe illustration instead of discarding its outfit.
export function motionFrame(pose,t){return pose==='run'||pose==='walk'?1+Math.floor(t*(pose==='run'?9:6))%2:pose==='jump'||pose==='slide'?3:pose==='swim'?4:pose==='wave'?5:0;}
function accessories(ctx,c,t,pose){
  const items=c.accessories||[],swim=pose==='swim',hx=swim?28:pose==='run'||pose==='walk'?14:0,hy=swim?-3:-28;
  if(items.includes('scarf')){round(ctx,hx-10,hy+15,21,5,2,'#d9a842');round(ctx,hx+6,hy+17,5,13+Math.sin(t*5)*3,2,'#d9a842');}
  if(items.includes('camera'))prop(ctx,'camera',swim?12:6,swim?4:3,17);
  if(items.includes('sunglasses')){round(ctx,hx-10,hy,9,5,2,'#253c42');round(ctx,hx+1,hy,9,5,2,'#253c42');ctx.strokeStyle='#253c42';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(hx-2,hy+1);ctx.lineTo(hx+2,hy+1);ctx.stroke();}
  if(items.includes('backpack'))round(ctx,-22,-7,9,22,4,'#aa7557');
  if(items.includes('turtle-pin'))turtle(ctx,8,1,9,t);
  if(items.includes('gelato-pin')){ctx.fillStyle='#d7a46d';ctx.beginPath();ctx.moveTo(4,0);ctx.lineTo(12,0);ctx.lineTo(8,10);ctx.fill();ctx.fillStyle='#e6a7aa';ctx.beginPath();ctx.arc(8,-1,4,0,Math.PI*2);ctx.fill();}
  if(swim||items.includes('snorkel')){ctx.strokeStyle='#63c5c2';ctx.lineWidth=2.2;ctx.strokeRect(hx-12,hy-2,25,10);ctx.beginPath();ctx.moveTo(hx+13,hy+4);ctx.lineTo(hx+19,hy+4);ctx.lineTo(hx+19,hy-13);ctx.stroke();}
}
function texturedWardrobe(ctx,im,pose,t,frame=null){
  ctx.save();
  const fw=frame?.w||im.width,fh=frame?.h||im.height,fx=frame?.x||0,fy=frame?.y||0;
  const w=fw/fh*100,phase=t*(pose==='run'?11:7),moving=['walk','run','swim','row','cook'].includes(pose),swing=moving?Math.sin(phase):0;
  const piece=(sx,sy,sw,sh,px,py,angle)=>{ctx.save();ctx.translate(px,py);ctx.rotate(angle);ctx.drawImage(im,fx+sx*fw,fy+sy*fh,sw*fw,sh*fh,sx*w-w/2-px,sy*100-50-py,sw*w,sh*100);ctx.restore();};
  if(pose==='swim')ctx.rotate(Math.PI/2);if(pose==='slide')ctx.rotate(-.8);
  // Each segment uses the original painted clothing and its transparent silhouette.
  for(const side of[-1,1])piece(side<0?0:.5,.64,.5,.36,side*w*.13,14,pose==='jump'?side*.28:swing*side*.21);
  for(const side of[-1,1])piece(side<0?0:.73,.37,.27,.38,side*w*.27,-11,pose==='jump'?side*1.6:pose==='wave'&&side>0?-1.8+Math.sin(t*7)*.15:pose==='cook'?side*.35+Math.sin(phase)*.12:pose==='row'?side*(.35+swing*.2):swing*side*.22);
  piece(.22,.37,.56,.33,0,0,Math.sin(t*1.7)*.012);
  piece(0,0,1,.41,0,-18,Math.sin(t*1.7)*.018);ctx.restore();
}
export function character(ctx,c,x,y,height=80,marco=false){
  if(c.npc){
    const im=getImage('travel-props'),f=TRAVEL_PROPS.frames.find(f=>f.name===(typeof c.npc==='string'?c.npc:marco?'traveler-man':'traveler-woman'));
    if(im&&f){const t=c.animTime??ctx.animTime??0;ctx.save();ctx.translate(x,y-Math.sin(t*5)*height*.012);ctx.scale(height/100*(c.facing===-1?-1:1),height/100);texturedWardrobe(ctx,im,c.pose||'idle',t,f);ctx.restore();}else fallbackCharacter(ctx,c,x,y,height,marco);return;
  }
  const t=c.animTime??ctx.animTime??0,pose=c.pose||'idle',base=marco?'marco':'yiting',name=marco?(c.marcoSprite||base):(c.sprite||base),im=getImage(name),sheet=getImage(base+'-motion');
  if(!im&&!sheet){fallbackCharacter(ctx,c,x,y,height,marco);return;}
  ctx.save();ctx.translate(x,y);ctx.scale(height/100,height/100);if(c.facing===-1)ctx.scale(-1,1);
  if(pose!=='swim'){ctx.fillStyle='#102b3333';ctx.beginPath();ctx.ellipse(0,49,19,3.5,0,0,Math.PI*2);ctx.fill();}
  const moving=pose==='run'||pose==='walk',bob=moving?Math.abs(Math.sin(t*10))*1.7:pose==='swim'?Math.sin(t*3)*2:Math.sin(t*2)*.7;
  ctx.translate(0,-bob);
  if(name!==base||pose==='row'||pose==='cook')texturedWardrobe(ctx,im||getImage(base),pose,t);
  else if(sheet){
    const data=MOTION_FRAMES[base],f=data.frames[motionFrame(pose,t)],scale=100/data.frames[0].h,sw=f.w*scale,sh=f.h*scale;
    if(pose==='slide')ctx.rotate(-.78);if(pose==='wave')ctx.rotate(Math.sin(t*4)*.025);
    if(pose==='swim'){
      for(let n=0;n<12;n++){const a=n/12,b=(n+1)/12;ctx.drawImage(sheet,f.x+f.w*a,f.y,f.w*(b-a),f.h,-sw/2+sw*a,-sh/2+Math.sin(t*6+n*.35)*1.3,sw*(b-a)+.1,sh);}
    }else ctx.drawImage(sheet,f.x,f.y,f.w,f.h,-sw/2,50-sh,sw,sh);
  }else texturedWardrobe(ctx,im,pose,t);
  accessories(ctx,c,t,pose);ctx.restore();
}
function fallbackCharacter(ctx,c,x,y,height=80,marco=false){
  const t=c.animTime??ctx.animTime??0,pose=c.pose||'idle',moving=['walk','run','swim','row','cook'].includes(pose),speed=pose==='run'?13:7;
  const phase=t*speed,walk=moving?Math.sin(phase):Math.sin(t*1.7)*.06,air=pose==='jump',swim=pose==='swim';
  const name=marco?(c.marcoSprite||'marco'):(c.sprite||'yiting'),im=c.npc?null:getImage(name);
  const winter=name.includes('winter'),dress=/egypt|burgundy|evening/.test(name)&&!marco;
  const top=marco?(name.includes('striped')?'#6f9db8':name.includes('desert')?'#c8b590':'#f4eedb'):(name.includes('red')?'#b85f50':winter?'#759bb5':dress?name.includes('burgundy')?'#7e4851':name.includes('evening')?'#faf0dc':'#c5aa89':'#eee1bd');
  ctx.save();ctx.translate(x,y);ctx.scale(height/100,height/100);
  ctx.fillStyle='#102b3328';ctx.beginPath();ctx.ellipse(0,47,20,4,0,0,Math.PI*2);ctx.fill();
  const bob=moving?Math.abs(Math.sin(phase))*2:Math.sin(t*2)*.8;
  ctx.translate(0,-bob);if(c.facing===-1)ctx.scale(-1,1);if(swim)ctx.rotate(-Math.PI*.42);if(pose==='slide')ctx.rotate(-.85);
  const trousers=marco?'#354956':'#6f91a9';
  for(const side of[-1,1]){
    ctx.save();ctx.translate(side*6,17);ctx.rotate(air?side*.45:walk*side*(swim?.5:.45));
    limb(ctx,0,0,25,0,trousers,9);limb(ctx,0,23,6,-.8,'#fff9e8',10);ctx.restore();
  }
  limb(ctx,-15,-8,26,air?1.7:pose==='cook'?-.9:pose==='row'?-.8+walk*.4:walk*.6,top,9,true);
  limb(ctx,15,-8,26,air?-1.7:pose==='cook'?-1.1+Math.sin(phase)*.3:pose==='wave'?-2.1+Math.sin(t*8)*.25:-walk*.6,top,9,true);
  round(ctx,-14,-14,28,35,10,top);if(dress){ctx.fillStyle=top;ctx.beginPath();ctx.moveTo(-13,8);ctx.lineTo(-23+walk,35);ctx.quadraticCurveTo(0,43,23+walk,35);ctx.lineTo(13,8);ctx.fill();}
  if(name.includes('striped')||winter){ctx.save();ctx.globalAlpha=.55;ctx.strokeStyle='#f9edce';ctx.lineWidth=2;for(let n=-9;n<14;n+=7){ctx.beginPath();ctx.moveTo(n,-11);ctx.lineTo(n,18);ctx.stroke();}ctx.restore();}
  ctx.save();ctx.translate(0,-25);ctx.rotate(Math.sin(t*1.8)*.025+(pose==='cook'?.1:0));
  if(im){const sh=im.height*.34,scale=43/sh;ctx.drawImage(im,0,0,im.width,sh,-im.width*scale/2,-29,im.width*scale,43);}
  else{ctx.fillStyle='#efc5a3';ctx.beginPath();ctx.ellipse(0,-7,14,18,0,0,Math.PI*2);ctx.fill();ctx.fillStyle=marco?'#3c2c27':'#554437';ctx.beginPath();ctx.arc(0,-13,15,Math.PI,0);ctx.fill();ctx.fillStyle='#263d41';ctx.beginPath();ctx.arc(-5,-7,1.6,0,7);ctx.arc(5,-7,1.6,0,7);ctx.fill();ctx.strokeStyle='#b17d68';ctx.beginPath();ctx.arc(0,-3,5,.2,2.9);ctx.stroke();}
  ctx.restore();if((c.accessories||[]).includes('scarf')){round(ctx,-14,-15,28,5,2,'#d9a842');round(ctx,8,-13,6,19+Math.sin(t*5)*3,2,'#d9a842');}
  if((c.accessories||[]).includes('camera'))prop(ctx,'camera',10,8,18);
  if((c.accessories||[]).includes('sunglasses')){round(ctx,-12,-35,10,5,2,'#253c42');round(ctx,2,-35,10,5,2,'#253c42');}
  if((c.accessories||[]).includes('backpack'))round(ctx,-24,-8,10,24,4,'#aa7557');
  if((c.accessories||[]).includes('turtle-pin'))turtle(ctx,9,1,10,t);
  if(swim||(c.accessories||[]).includes('snorkel')){ctx.strokeStyle='#63c5c2';ctx.lineWidth=3;ctx.strokeRect(-14,-38,28,12);ctx.beginPath();ctx.moveTo(15,-31);ctx.lineTo(21,-31);ctx.lineTo(21,-51);ctx.stroke();}
  ctx.restore();
}
export function panel(ctx,title,sub='',progress=0){
  ctx.save();round(ctx,12,12,336,55,15,'#102e3ee8');label(ctx,title,26,32,15,'#fff5dc','left');if(sub)label(ctx,sub,26,52,10,'#a9dcd7','left');round(ctx,25,63,310,2,1,'#ffffff22');round(ctx,25,63,310*clamp(progress,0,1),2,1,'#e9c781');ctx.restore();
}
export function note(ctx,text){round(ctx,18,497,324,28,10,'#102e3ee6');label(ctx,text,180,511,11,'#fff3dc');}
export function ring(ctx,x,y,r,fraction,color='#f2c878'){ctx.strokeStyle='#fff8';ctx.lineWidth=5;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.stroke();ctx.strokeStyle=color;ctx.beginPath();ctx.arc(x,y,r,-Math.PI/2,-Math.PI/2+Math.PI*2*clamp(fraction,0,1));ctx.stroke();}
export function rock(ctx,x,y,s=30){ctx.save();ctx.translate(x,y);ctx.fillStyle='#344e5a40';ctx.beginPath();ctx.ellipse(3,s*.3,s*.5,s*.18,0,0,7);ctx.fill();ctx.fillStyle='#8a9998';ctx.beginPath();ctx.moveTo(-s*.5,s*.15);ctx.lineTo(-s*.3,-s*.3);ctx.lineTo(s*.1,-s*.43);ctx.lineTo(s*.48,-s*.1);ctx.lineTo(s*.4,s*.3);ctx.lineTo(-s*.3,s*.34);ctx.closePath();ctx.fill();ctx.fillStyle='#c5cfcb';ctx.beginPath();ctx.moveTo(-s*.3,-s*.3);ctx.lineTo(s*.1,-s*.43);ctx.lineTo(s*.48,-s*.1);ctx.lineTo(-s*.1,-s*.04);ctx.fill();ctx.restore();}
export function turtle(ctx,x,y,size=32,t=0,color='#7bb69c'){
  ctx.save();ctx.translate(x,y);ctx.scale(size/40,size/40);ctx.fillStyle=color;
  for(const s of[-1,1])for(const end of[-1,1]){ctx.save();ctx.translate(s*13,end*9);ctx.rotate(s*end*(.6+Math.sin(t*4)*.2));ctx.beginPath();ctx.ellipse(0,0,5,11,.5,0,7);ctx.fill();ctx.restore();}
  ctx.beginPath();ctx.ellipse(0,-19,7,9,0,0,7);ctx.fill();ctx.fillStyle='#375f57';ctx.beginPath();ctx.ellipse(0,0,15,19,0,0,7);ctx.fill();ctx.strokeStyle=color;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-12,-5);ctx.lineTo(0,-10);ctx.lineTo(12,-5);ctx.lineTo(9,8);ctx.lineTo(0,13);ctx.lineTo(-9,8);ctx.closePath();ctx.moveTo(0,-10);ctx.lineTo(0,13);ctx.stroke();ctx.fillStyle='#153d38';ctx.beginPath();ctx.arc(-3,-22,1,0,7);ctx.arc(3,-22,1,0,7);ctx.fill();ctx.restore();
}
export function vehicle(ctx,x,y,scale=1,angle=0,color='#dd8666'){
  if(travelProp(ctx,color==='#6caaa5'?'car-teal':color==='#e1b85c'?'taxi':'car-red',x,y,56*scale,82*scale,angle))return;
  ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.scale(scale,scale);ctx.fillStyle='#152d3944';ctx.beginPath();ctx.ellipse(5,8,25,43,0,0,7);ctx.fill();
  for(const side of[-1,1])for(const yy of[-22,20])round(ctx,side*22-3,yy-7,7,17,3,'#233746');
  const g=ctx.createLinearGradient(-20,0,20,0);g.addColorStop(0,color);g.addColorStop(.6,'#f6d4a5');g.addColorStop(1,color);round(ctx,-22,-40,44,79,12,g);
  round(ctx,-17,-22,34,19,5,'#263f55');round(ctx,-15,16,30,12,4,'#355c6b');round(ctx,-15,-37,10,4,2,'#fff4b6');round(ctx,6,-37,10,4,2,'#fff4b6');round(ctx,-18,34,8,3,1,'#b33f48');round(ctx,10,34,8,3,1,'#b33f48');ctx.restore();
}
export class Effects{
  constructor(){this.dots=[];this.words=[];this.shake=0;}
  burst(x,y,color='#f2c878',count=12){for(let n=0;n<count;n++){const a=n/count*Math.PI*2;this.dots.push({x,y,vx:Math.cos(a)*(30+n%4*18),vy:Math.sin(a)*(30+n%3*20)-30,age:0,color});}}
  text(x,y,text){this.words.push({x,y,text,age:0});}
  update(dt){for(const p of this.dots){p.age+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=65*dt;}for(const p of this.words){p.age+=dt;p.y-=25*dt;}this.dots=this.dots.filter(p=>p.age<.7);this.words=this.words.filter(p=>p.age<1);this.shake=Math.max(0,this.shake-dt);}
  draw(ctx){ctx.save();for(const p of this.dots){ctx.globalAlpha=1-p.age/.7;ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,2.8,0,7);ctx.fill();}for(const p of this.words){ctx.globalAlpha=1-p.age;label(ctx,p.text,p.x,p.y,16,'#fff6c7');}ctx.restore();}
}
