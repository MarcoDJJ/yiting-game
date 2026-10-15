import {createRevisedGame} from './revised-games.js';
import {polishGame} from './game-presentation.js';
import { seeded } from './state.js';
import { createEgyptGame } from './egypt-games.js';
import { W,H,clamp,hit,round,label,emoji,coin,scene,actor } from './engine.js';
class Base {
  constructor(config){this.c=config;this.stage=config.stage||1;this.rand=seeded(config.seed||`${config.mode}:${this.stage}`);this.time=0;this.score=0;this.lives=3;this.done=false;this.won=false;this.limit=55;this.progress=0;this.message='';}
  tick(dt){this.time+=dt;if(this.time>=this.limit)this.end(this.progress>=1);if(this.lives<=0)this.end(false);}
  end(won){this.done=true;this.won=won;}
  stats(){return{score:Math.floor(this.score),time:Math.max(0,Math.ceil(this.limit-this.time)),lives:this.lives,progress:clamp(this.progress,0,1),message:this.message};}
  result(){return{won:this.won,score:Math.floor(this.score),stars:this.won?(this.lives===3?3:this.lives===2?2:1):0};}
  title(ctx,txt){round(ctx,32,19,296,34,12,'#fffbefdb');label(ctx,txt,180,36,12);}
}
class Platform extends Base {
  constructor(c,castle){super(c);this.castle=castle;this.width=1500+this.stage*95;this.x=40;this.y=415;this.vy=0;this.grounded=true;this.checkpoint=40;this.camera=0;this.key=false;this.invincible=0;this.limit=85;this.platforms=[{x:0,w:360,y:460}];this.coins=[];this.guards=[];for(let x=360;x<this.width;x+=180){const y=460-(Math.floor(this.rand()*3)*28);this.platforms.push({x,w:128+(this.stage<4?15:0),y});this.coins.push({x:x+55,y:y-40,taken:false});if(x>660&&Math.floor(x/180)%3===0)this.guards.push({base:x+40,x:x+40,y:y-25,w:26,h:32});}this.platforms.push({x:this.width-130,w:220,y:440});this.keyX=this.width*.65;this.keyY=370;this.message=castle?'A key first. A rescue second.':'Keep climbing. The view is waiting.';}
  jump(){if(this.grounded){this.vy=-425;this.grounded=false;}}
  action(code){if(code==='Space'||code==='ArrowUp'||code==='jump')this.jump();}
  update(dt,i){this.tick(dt);if(this.done)return;this.invincible=Math.max(0,this.invincible-dt);const direction=(i.keys.has('ArrowRight')?1:0)-(i.keys.has('ArrowLeft')?1:0);this.x=clamp(this.x+direction*(145+this.stage*2)*dt,18,this.width+20);const previous=this.y;this.vy+=900*dt;this.y+=this.vy*dt;this.grounded=false;for(const p of this.platforms){if(this.x+10>=p.x&&this.x-10<=p.x+p.w&&this.vy>=0&&previous+24<=p.y+4&&this.y+24>=p.y){this.y=p.y-24;this.vy=0;this.grounded=true;break;}}if(this.grounded&&this.x>this.checkpoint+300)this.checkpoint=this.x;
    for(const c of this.coins){if(!c.taken&&Math.hypot(this.x-c.x,this.y-c.y)<37){c.taken=true;this.score+=35;}}
    for(const g of this.guards){g.x=g.base+Math.sin(this.time*1.6)*27;if(hit({x:this.x,y:this.y,w:20,h:35},g)&&!this.invincible){this.lives--;this.invincible=2;this.x=Math.max(30,this.x-80);this.vy=-260;}}
    if(this.y>H+30){this.lives--;this.x=this.checkpoint;this.y=260;this.vy=0;this.invincible=2;}
    if(this.castle&&!this.key&&Math.abs(this.x-this.keyX)<38&&Math.abs(this.y-this.keyY)<68){this.key=true;this.score+=100;this.message='“Great. Now come get me, Marco!”';}
    this.camera=clamp(this.x-100,0,this.width-330);this.progress=this.x/this.width;if(this.x>=this.width-30){if(!this.castle||this.key){this.score+=250+Math.max(0,this.limit-this.time)*3;this.end(true);}else this.message='Find the golden key before opening the cell!';}}
  draw(ctx){scene(ctx,this.castle?'rome':'mountain');if(this.castle){ctx.fillStyle='#918d7e';ctx.fillRect(0,213,W,327);for(let y=230;y<H;y+=34){ctx.strokeStyle='#aaa697';ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();for(let x=(y%68?0:30);x<W;x+=60){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y+34);ctx.stroke();}}}for(const p of this.platforms){const x=p.x-this.camera;if(x>W||x+p.w<0)continue;round(ctx,x,p.y,p.w,12,3,this.castle?'#cbbb9d':'#fbfcf4');round(ctx,x,p.y+11,p.w,H-p.y,1,this.castle?'#6f7363':'#9cae9f');}for(const c of this.coins)if(!c.taken)coin(ctx,c.x-this.camera,c.y,9);for(const g of this.guards)emoji(ctx,this.castle?'💂':'🪨',g.x-this.camera,g.y,29);if(this.castle&&!this.key)emoji(ctx,'🔑',this.keyX-this.camera,this.keyY,30);const end=this.width-this.camera;if(this.castle){actor(ctx,this.c,end-5,392,68,false);for(let n=0;n<5;n++)round(ctx,end-33+n*14,344,4,96,1,'#586553');emoji(ctx,'🔒',end,419,20);}else{ctx.strokeStyle='#65735c';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(end,340);ctx.lineTo(end,440);ctx.stroke();ctx.fillStyle='#d6745b';ctx.beginPath();ctx.moveTo(end,340);ctx.lineTo(end+31,350);ctx.lineTo(end,365);ctx.fill();}if(!this.invincible||Math.floor(this.invincible*9)%2===0)actor(ctx,this.c,this.x-this.camera,this.y-7,72,this.castle);this.title(ctx,this.castle?(this.key?'Key found! Yiting is waiting.':'Find the golden key. Rescue Yiting.'):'Summit Sprint · jump toward the red flag');}
}
export function createGame(mode,config={}){
  config={...config,mode};
  const revised=createRevisedGame(mode,config);if(revised)return revised;
  const egypt=createEgyptGame(mode,config);if(egypt)return polishGame(egypt,mode);
  if(mode==='summit')return polishGame(new Platform(config,false),mode);
  throw new Error('Unknown game: '+mode);
}
