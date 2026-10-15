import {seeded} from './state.js';
import {W,H,clamp,hit,round,label,emoji,coin,scene,actor,art} from './engine.js';
class Adventure {
  constructor(c){this.c=c;this.stage=c.stage||1;this.rand=seeded(c.seed||c.mode+':'+this.stage);this.time=0;this.score=0;this.lives=3;this.progress=0;this.done=false;this.won=false;this.limit=65;this.message='';this.invincible=0;}
  tick(dt){this.time+=dt;this.invincible=Math.max(0,this.invincible-dt);if(this.time>=this.limit||this.lives<=0)this.end(false);}
  end(won){this.done=true;this.won=won;}
  damage(){if(this.invincible||this.done)return false;this.lives--;this.invincible=1.3;return true;}
  stats(){return{score:Math.floor(this.score),time:Number.isFinite(this.limit)?Math.max(0,Math.ceil(this.limit-this.time)):0,timeless:!Number.isFinite(this.limit),lives:this.lives,progress:clamp(this.progress,0,1),message:this.message};}
  result(){return{won:this.won,score:Math.floor(this.score),stars:this.won?Math.max(1,this.lives):0};}
  title(ctx,text){round(ctx,15,17,330,37,12,'#fff8ebed');label(ctx,text,180,36,12);}
}
class NightBus extends Adventure {
  constructor(c){super(c);this.lane=1;this.jump=0;this.slide=0;this.distance=0;this.target=4200+this.stage*155;this.items=[];this.spawn=1;this.ticket=false;this.ticketDrops=0;this.gesture=null;this.limit=60;this.message='Bus arriving in five minutes. Apparently.';}
  action(code){if(code==='ArrowLeft')this.lane=Math.max(0,this.lane-1);if(code==='ArrowRight')this.lane=Math.min(2,this.lane+1);if(['ArrowUp','Space'].includes(code)&&!this.jump){this.jump=.72;this.slide=0;}if(code==='ArrowDown'&&!this.slide){this.slide=.8;this.jump=0;}}
  pointer(type,p){if(type==='down')this.gesture=p;if(type==='up'&&this.gesture){const dx=p.x-this.gesture.x,dy=p.y-this.gesture.y;if(Math.max(Math.abs(dx),Math.abs(dy))>22)this.action(Math.abs(dx)>Math.abs(dy)?(dx>0?'ArrowRight':'ArrowLeft'):(dy<0?'ArrowUp':'ArrowDown'));this.gesture=null;}}
  update(dt){
    this.tick(dt);if(this.done)return;this.jump=Math.max(0,this.jump-dt);this.slide=Math.max(0,this.slide-dt);const speed=170+this.stage*9;this.distance+=speed*dt;this.progress=this.distance/this.target;this.spawn-=dt;
    if(this.ticketDrops<2&&this.progress>.2+this.ticketDrops*.35){this.items.push({lane:1,y:88,kind:'ticket'});this.ticketDrops++;this.spawn=1.15;}
    if(this.spawn<=0){this.spawn=.95-this.stage*.025+this.rand()*.25;const lane=Math.floor(this.rand()*3);this.items.push({lane,y:88,kind:['luggage','barrier','cart'][Math.floor(this.rand()*3)]});if(this.stage>7&&this.rand()<.3)this.items.push({lane:(lane+1)%3,y:88,kind:'luggage'});if(this.rand()<.6)this.items.push({lane:(lane+2)%3,y:88,kind:'coin'});}
    for(const o of this.items){o.y+=speed*dt;if(!o.used&&o.y>405&&o.y<462&&o.lane===this.lane){o.used=true;if(o.kind==='coin')this.score+=25;else if(o.kind==='ticket'){this.ticket=true;this.score+=80;}else if((o.kind==='luggage'&&!this.jump)||(o.kind==='barrier'&&!this.slide)||o.kind==='cart')this.damage();}}
    this.items=this.items.filter(o=>!o.used&&o.y<570);this.message=this.ticket?'Ticket collected':'Find your ticket';if(this.progress>=1){this.score+=this.ticket?250:0;this.end(this.ticket&&this.lives>0);}
  }
  draw(ctx){
    scene(ctx,'night');for(let n=0;n<3;n++){ctx.fillStyle=n%2?'#59677b':'#4d5a70';ctx.beginPath();ctx.moveTo(150+n*20,110);ctx.lineTo(170+n*20,110);ctx.lineTo(80+n*100+40,540);ctx.lineTo(80+n*100-40,540);ctx.fill();}
    for(const o of this.items){const x=80+o.lane*100;if(o.kind==='coin')coin(ctx,x,o.y,10);else if(o.kind==='barrier'){round(ctx,x-37,o.y-24,74,9,3,'#e8bb70');round(ctx,x-33,o.y-15,6,37,2,'#ecd5a5');round(ctx,x+27,o.y-15,6,37,2,'#ecd5a5');}else emoji(ctx,o.kind==='ticket'?'🎫':o.kind==='cart'?'🛒':'🧳',x,o.y,36);}
    const x=80+this.lane*100,y=445-(this.jump?Math.sin(this.jump/.72*Math.PI)*70:0);actor(ctx,this.c,x,y,this.slide?40:76);
    this.title(ctx,'Midnight Bus Run · jump, slide, keep going');label(ctx,this.ticket?'Ticket collected':'Find your ticket',180,76,11,'#f3ddac');
  }
}
const DELTAS={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};
const cellKey=(x,y)=>x+','+y;
export function solvePharaoh(g){
  const start=[g.player.x,g.player.y,g.stone.x,g.stone.y],queue=[{s:start,route:[]}],seen=new Set([start.join(',')]);let at=0;
  while(at<queue.length){const {s,route}=queue[at++],[px,py,sx,sy]=s;if(sx===g.plate.x&&sy===g.plate.y&&px===g.exit.x&&py===g.exit.y)return route;
    for(const [code,[dx,dy]] of Object.entries(DELTAS)){const nx=px+dx,ny=py+dy;if(nx<0||ny<0||nx>=6||ny>=7||g.walls.has(cellKey(nx,ny)))continue;let bx=sx,by=sy;if(nx===sx&&ny===sy){bx+=dx;by+=dy;if(bx<0||by<0||bx>=6||by>=7||g.walls.has(cellKey(bx,by)))continue;}
      if(nx===g.exit.x&&ny===g.exit.y&&(bx!==g.plate.x||by!==g.plate.y))continue;
      const next=[nx,ny,bx,by],key=next.join(',');if(!seen.has(key)){seen.add(key);queue.push({s:next,route:[...route,code]});}
    }
  }return null;
}
class Pharaoh extends Adventure {
  constructor(c){super(c);this.limit=Infinity;this.moves=0;this.reset();}
  reset(){
    this.rand=seeded(this.c.seed||this.c.mode+':'+this.stage);
    this.player={x:0,y:6};this.exit={x:5,y:0};this.plate=this.stage%3===0?{x:1,y:2}:this.stage%3===1?{x:4,y:5}:{x:1,y:5};this.stone=this.stage%3===0?{x:1,y:4}:this.stage%3===1?{x:2,y:5}:{x:3,y:5};this.walls=new Set();
    this.mirrors=[{x:2,y:1,slash:this.rand()<.5?'/':'\\'},{x:2,y:3,slash:this.rand()<.5?'/':'\\'},{x:5,y:3,slash:this.rand()<.5?'/':'\\'}];this.mirrors[0].slash='/';
    const solution=solvePharaoh(this),protectedCells=new Set([cellKey(0,6),cellKey(this.stone.x,this.stone.y),cellKey(this.plate.x,this.plate.y)]);
    let px=0,py=6,sx=this.stone.x,sy=this.stone.y;for(const code of solution){const [dx,dy]=DELTAS[code];px+=dx;py+=dy;if(px===sx&&py===sy){sx+=dx;sy+=dy;protectedCells.add(cellKey(sx,sy));}protectedCells.add(cellKey(px,py));}
    for(let x=0;x<=2;x++)protectedCells.add(cellKey(x,1));for(let y=1;y<=3;y++)protectedCells.add(cellKey(2,y));for(let x=2;x<=5;x++)protectedCells.add(cellKey(x,3));for(let y=0;y<=3;y++)protectedCells.add(cellKey(5,y));
    const candidates=[];for(let y=0;y<7;y++)for(let x=0;x<6;x++)if(!protectedCells.has(cellKey(x,y)))candidates.push(cellKey(x,y));
    for(let n=0;n<Math.min(candidates.length,2+this.stage);n++){const index=Math.floor(this.rand()*candidates.length);this.walls.add(candidates.splice(index,1)[0]);}
    this.moves=0;this.message='The door needs light and a stone on the plate.';this.progress=0;this.done=false;this.won=false;this.lives=3;
  }
  beam(){
    let x=-1,y=1,dx=1,dy=0;const points=[{x,y}];let lit=false;
    for(let n=0;n<60;n++){x+=dx;y+=dy;points.push({x,y});if(x<0||x>=6||y<0||y>=7||this.walls.has(cellKey(x,y))||x===this.stone.x&&y===this.stone.y)break;if(x===this.exit.x&&y===this.exit.y){lit=true;break;}const m=this.mirrors.find(m=>m.x===x&&m.y===y);if(m)[dx,dy]=m.slash==='/'?[-dy,-dx]:[dy,dx];}
    return{points,lit};
  }
  pointer(type,p){if(type!=='down'||this.done)return;const x=Math.floor((p.x-36)/48),y=Math.floor((p.y-143)/48),m=this.mirrors.find(m=>m.x===x&&m.y===y);if(m){m.slash=m.slash==='/'?'\\':'/';this.moves++;}}
  action(code){
    if(code==='reset'){this.reset();return;}if(this.done||!DELTAS[code])return;const [dx,dy]=DELTAS[code],x=this.player.x+dx,y=this.player.y+dy;if(x<0||x>5||y<0||y>6||this.walls.has(cellKey(x,y)))return;
    if(x===this.stone.x&&y===this.stone.y){const sx=x+dx,sy=y+dy;if(sx<0||sx>5||sy<0||sy>6||this.walls.has(cellKey(sx,sy))||sx===this.exit.x&&sy===this.exit.y)return;this.stone={x:sx,y:sy};}
    if(x===this.exit.x&&y===this.exit.y&&!this.gateOpen())return;this.player={x,y};this.moves++;if(x===this.exit.x&&y===this.exit.y&&this.gateOpen()){this.score=500+Math.max(0,120-this.moves)*3;this.end(true);}
  }
  gateOpen(){return this.beam().lit&&this.stone.x===this.plate.x&&this.stone.y===this.plate.y;}
  update(dt){this.time+=dt;const lit=this.beam().lit,plate=this.stone.x===this.plate.x&&this.stone.y===this.plate.y;this.progress=(Number(lit)+Number(plate))/3;this.message=this.gateOpen()?'Gate open. Walk to the golden doorway.':'The door needs light and a stone on the plate.';}
  draw(ctx){
    scene(ctx,'temple');this.title(ctx,'Rotate mirrors. Push the stone.');label(ctx,'Light',81,88,12);label(ctx,this.beam().lit?'Ready':'Waiting',81,111,11);label(ctx,'Plate',261,88,12);label(ctx,this.stone.x===this.plate.x&&this.stone.y===this.plate.y?'Ready':'Waiting',261,111,11);
    for(let y=0;y<7;y++)for(let x=0;x<6;x++)round(ctx,36+x*48,143+y*48,45,45,4,this.walls.has(cellKey(x,y))?'#8b775f':'#e8cf9d');
    round(ctx,42+this.plate.x*48,149+this.plate.y*48,33,33,7,'#8cba9a');round(ctx,39+this.exit.x*48,146+this.exit.y*48,39,39,6,this.gateOpen()?'#e2b344':'#92764e');emoji(ctx,this.gateOpen()?'☀️':'🔒',60+this.exit.x*48,167+this.exit.y*48,24);
    ctx.strokeStyle='#fff4a0';ctx.lineWidth=4;ctx.beginPath();this.beam().points.forEach((p,i)=>{const x=60+p.x*48,y=167+p.y*48;i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();
    for(const m of this.mirrors){round(ctx,40+m.x*48,147+m.y*48,37,37,7,'#d4e8e3');label(ctx,m.slash,60+m.x*48,167+m.y*48,28,'#437f80');}
    round(ctx,41+this.stone.x*48,148+this.stone.y*48,35,35,6,'#98866e');actor(ctx,this.c,60+this.player.x*48,163+this.player.y*48,43);label(ctx,'Pharaoh’s Secret',180,508,14);
  }
}
const PATH_COLORS=['#e68b64','#e7bc50','#83b7df','#bc97c2','#7cb994'];
class Reef extends Adventure {
  constructor(c){super(c);this.limit=Infinity;this.n=5+Math.floor((this.stage-1)/4);this.cell=42;this.left=(360-this.n*this.cell)/2;this.top=151;this.reset();}
  reset(){
    let snake=[];for(let y=0;y<this.n;y++)for(let p=0;p<this.n;p++)snake.push({x:y%2?this.n-1-p:p,y});if(this.stage%2)snake=snake.map(p=>({x:this.n-1-p.x,y:p.y}));if(this.stage%3===0)snake=snake.map(p=>({x:p.y,y:p.x}));
    const count=Math.min(5,2+Math.floor((this.stage-1)/3)),length=Math.floor(snake.length/count);this.pairs=[];this.rocks=new Set();for(let n=0;n<count;n++){const path=snake.slice(n*length,n===count-1?snake.length:(n+1)*length-1);this.pairs.push({start:path[0],end:path.at(-1),solution:path,color:PATH_COLORS[n],path:[],connected:false});if(n<count-1){const rock=snake[(n+1)*length-1];this.rocks.add(cellKey(rock.x,rock.y));}}
    this.active=null;this.progress=0;this.done=false;this.won=false;this.message='Connect matching colors. No crossing.';
  }
  at(p){const x=Math.floor((p.x-this.left)/this.cell),y=Math.floor((p.y-this.top)/this.cell);return x>=0&&x<this.n&&y>=0&&y<this.n?{x,y}:null;}
  extend(pos){const pair=this.pairs[this.active],last=pair.path.at(-1);if(pair.connected||Math.abs(last.x-pos.x)+Math.abs(last.y-pos.y)!==1||this.rocks.has(cellKey(pos.x,pos.y)))return false;const previous=pair.path.findIndex(p=>p.x===pos.x&&p.y===pos.y);if(previous>=0){pair.path.splice(previous+1);return true;}if(this.pairs.some((other,index)=>index!==this.active&&(other.path.some(p=>p.x===pos.x&&p.y===pos.y)||other.start.x===pos.x&&other.start.y===pos.y||other.end.x===pos.x&&other.end.y===pos.y)))return false;pair.path.push(pos);if(pos.x===pair.end.x&&pos.y===pair.end.y)pair.connected=true;return true;}
  pointer(type,p){
    if(this.done)return;const pos=this.at(p);if(type==='up'){this.active=null;return;}if(!pos)return;
    if(type==='down'){const index=this.pairs.findIndex(pair=>pair.start.x===pos.x&&pair.start.y===pos.y);if(index<0)return;this.active=index;const pair=this.pairs[index];pair.path=[pos];pair.connected=false;}
    if(type==='move'&&this.active!==null){for(let steps=0;steps<this.n*2;steps++){const last=this.pairs[this.active].path.at(-1),dx=pos.x-last.x,dy=pos.y-last.y;if(!dx&&!dy)break;const next=Math.abs(dx)>=Math.abs(dy)?{x:last.x+Math.sign(dx),y:last.y}:{x:last.x,y:last.y+Math.sign(dy)};if(!this.extend(next))break;}}this.check();
  }
  action(code){if(code==='reset')this.reset();}
  check(){const done=this.pairs.filter(p=>p.connected).length;this.progress=done/this.pairs.length;this.message=done+' / '+this.pairs.length+' turtles connected';if(done===this.pairs.length){this.score=350+this.stage*35;this.end(true);}}
  update(dt){this.time+=dt;this.check();}
  draw(ctx){
    scene(ctx,'reef');this.title(ctx,'Turtle Trails · take your time');label(ctx,this.pairs.filter(p=>p.connected).length+' / '+this.pairs.length+' turtles connected',180,91,13,'#f4fbec');for(let y=0;y<this.n;y++)for(let x=0;x<this.n;x++){round(ctx,this.left+x*this.cell,this.top+y*this.cell,this.cell-2,this.cell-2,5,'#d7efdfdc');if(this.rocks.has(cellKey(x,y)))emoji(ctx,'🪨',this.left+(x+.5)*this.cell,this.top+(y+.5)*this.cell,25);}
    const center=p=>[this.left+(p.x+.5)*this.cell,this.top+(p.y+.5)*this.cell];this.pairs.forEach((pair,index)=>{ctx.strokeStyle=pair.color;ctx.lineWidth=10;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();pair.path.forEach((p,n)=>{const[x,y]=center(p);n?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();for(const [p,symbol]of[[pair.start,'🐢'],[pair.end,'🐚']]){const[x,y]=center(p);ctx.fillStyle=pair.color;ctx.beginPath();ctx.arc(x,y,17,0,Math.PI*2);ctx.fill();emoji(ctx,symbol,x,y,21);label(ctx,String(index+1),x+13,y-12,9,'#fff');}});label(ctx,'Connect matching colors. No crossing.',180,488,12,'#f5fae9');
  }
}
class Snapshots extends Adventure {
  constructor(c){super(c);this.x=180;this.count=0;this.target=3+Math.floor(this.stage/4);this.shot=0;this.limit=70;this.message='Just one more photo, amore.';}
  indicators(){return{frame:Math.abs(this.x-(180+Math.sin(this.time*.67)*44))<25-this.stage*.6,light:Math.sin(this.time*1.2)>-.35,pose:Math.cos(this.time*.83)>.05};}
  action(code){if(!['Space','shoot'].includes(code)||this.shot>0||this.done)return;const s=this.indicators();if(s.frame&&s.light&&s.pose){this.count++;this.score+=100;this.shot=.8;this.message='One more photo. Beautiful!';if(this.count>=this.target)this.end(true);}else{this.damage();this.shot=.6;this.message='A little steadier. Try again.';}}
  update(dt,i){this.tick(dt);if(this.done)return;this.shot=Math.max(0,this.shot-dt);this.x=clamp(i.down?i.x:this.x+((i.keys.has('ArrowRight')?1:0)-(i.keys.has('ArrowLeft')?1:0))*150*dt,65,295);this.progress=this.count/this.target;}
  draw(ctx){
    scene(ctx,'sunset');art(ctx,'egypt',0,112,360,252);ctx.fillStyle='#f0c49735';ctx.fillRect(0,112,360,252);const targetX=180+Math.sin(this.time*.67)*44;round(ctx,targetX-81,258,162,71,16,'#8d6d4b');actor(ctx,this.c,targetX-25,270,90);actor(ctx,this.c,targetX+25,270,90,true);
    const good=this.indicators();ctx.strokeStyle=good.frame?'#cee6c0':'#fff6e8';ctx.lineWidth=3;ctx.strokeRect(this.x-81,181,162,170);ctx.strokeStyle='#fff8df55';ctx.beginPath();ctx.moveTo(this.x-81,237);ctx.lineTo(this.x+81,237);ctx.moveTo(this.x-27,181);ctx.lineTo(this.x-27,351);ctx.stroke();this.title(ctx,'Sunset Snapshots · wait for green');
    ['Frame','Light','Pose'].forEach((name,n)=>{const ok=[good.frame,good.light,good.pose][n];round(ctx,28+n*105,383,94,44,10,ok?'#cfe1b9':'#e8cbb4');label(ctx,name,75+n*105,406,12);});label(ctx,this.count+' / '+this.target+' postcards',180,469,15);if(this.shot>.6){ctx.fillStyle='#fff8';ctx.fillRect(0,0,360,540);}
  }
}
export class CabinCrew extends Adventure {
  constructor(c){super(c);this.limit=95;this.target=5+Math.floor(this.stage/2);this.served=0;this.passengers=Array.from({length:6},(_,id)=>({id,order:null}));this.selected=null;this.meal=0;this.drink=0;this.spawn=.4;this.turbulence=0;this.nextTurbulence=18;this.stowed=false;this.message='Select an order';}
  order(){const free=this.passengers.filter(p=>!p.order);if(!free.length)return;const passenger=free.find(p=>p.id===0)||free[Math.floor(this.rand()*free.length)];passenger.order={meal:Math.floor(this.rand()*2),drink:Math.floor(this.rand()*2),patience:64-this.stage*1.7};}
  serve(){if(this.done)return;if(this.turbulence>0){this.damage();this.message='Turbulence! Stow the tray.';return;}const p=this.passengers[this.selected];if(!p?.order){this.message='Select an order';return;}if(p.order.meal!==this.meal||p.order.drink!==this.drink){this.damage();this.message='Check the meal and drink.';return;}p.order=null;this.selected=null;this.served++;this.score+=80;this.message='A happy passenger!';if(this.served>=this.target)this.end(true);}
  action(code){if(['Space','serve'].includes(code))this.serve();if(['KeyD','stow'].includes(code)&&this.turbulence>0){this.stowed=true;this.message='A little patience, Marco.';}if(code==='ArrowUp')this.meal=1-this.meal;if(code==='ArrowDown')this.drink=1-this.drink;if(['ArrowLeft','ArrowRight'].includes(code)){const active=this.passengers.filter(p=>p.order);if(active.length){let at=active.findIndex(p=>p.id===this.selected);at=(at+(code==='ArrowRight'?1:-1)+active.length)%active.length;this.selected=active[at].id;}}}
  pointer(type,p){if(type!=='down'||this.done)return;if(p.y>=109&&p.y<334){const col=Math.floor((p.x-22)/163),row=Math.floor((p.y-109)/75);if(col>=0&&col<2&&row>=0&&row<3){const id=row*2+col;if(this.passengers[id].order)this.selected=id;}return;}if(p.x>=28&&p.x<=331&&p.y>=371&&p.y<425)this.meal=p.x<180?0:1;if(p.x>=28&&p.x<=331&&p.y>=444&&p.y<486)this.drink=p.x<180?0:1;}
  update(dt){
    this.tick(dt);if(this.done)return;this.progress=this.served/this.target;if(this.time>=this.nextTurbulence&&this.turbulence<=0){this.turbulence=5;this.stowed=false;this.nextTurbulence=this.time+19;this.message='Turbulence! Stow the tray.';}
    if(this.turbulence>0){const old=this.turbulence;this.turbulence=Math.max(0,this.turbulence-dt);if(old>3&&this.turbulence<=3&&!this.stowed){this.damage();this.stowed=true;}if(!this.turbulence){this.stowed=false;this.message='Select an order';}return;}
    this.spawn-=dt;const maxOrders=Math.min(5,2+Math.floor(this.stage/3));if(this.spawn<=0&&this.passengers.filter(p=>p.order).length<maxOrders){this.order();this.spawn=2.5-this.stage*.07;}for(const p of this.passengers)if(p.order){p.order.patience-=dt;if(p.order.patience<=0){p.order=null;this.lives--;if(this.selected===p.id)this.selected=null;this.message='A little patience, Marco.';}}
  }
  draw(ctx){
    ctx.fillStyle='#e4ebeb';ctx.fillRect(0,0,360,540);round(ctx,164,92,31,247,4,'#a8c4c2');this.title(ctx,'Homebound Crew · meals with love');label(ctx,this.served+' / '+this.target+' orders served',180,77,12);
    for(const p of this.passengers){const x=22+p.id%2*163,y=109+Math.floor(p.id/2)*75;round(ctx,x,y,151,66,9,this.selected===p.id?'#c4dec9':'#fff9eb');label(ctx,p.id===0?'Marco':'Passenger '+(p.id+1),x+75,y+14,10);if(p.id===0)actor(ctx,this.c,x+21,y+39,36,true);else emoji(ctx,p.id%2?'👩':'👨',x+21,y+38,26);if(p.order){emoji(ctx,p.order.meal?'🥖':'🍝',x+64,y+39,24);emoji(ctx,p.order.drink?'🧃':'💧',x+105,y+39,23);round(ctx,x+42,y+57,94,4,2,'#dfd8bf');round(ctx,x+42,y+57,94*clamp(p.order.patience/(64-this.stage*1.7),0,1),4,2,p.order.patience<14?'#db9477':'#88b696');}else label(ctx,'✓',x+86,y+39,21,'#7e9d86');}
    label(ctx,'Meal',180,352,11);for(let n=0;n<2;n++){round(ctx,28+n*159,371,145,49,9,this.meal===n?'#cadfbd':'#fff8e8');emoji(ctx,n?'🥖':'🍝',100+n*159,395,31);}label(ctx,'Drink',180,429,10);for(let n=0;n<2;n++){round(ctx,28+n*159,444,145,42,9,this.drink===n?'#cadfbd':'#fff8e8');emoji(ctx,n?'🧃':'💧',100+n*159,465,27);}
    if(this.turbulence>0){round(ctx,30,238,300,75,13,'#ead0a7f5');label(ctx,'Turbulence! Stow the tray.',180,266,14);label(ctx,this.stowed?'Ready':'Waiting',180,294,12);}label(ctx,this.selected===null?'Select an order':this.selected===0?'Marco':'Passenger '+(this.selected+1),180,516,11);
  }
}
export function createEgyptGame(mode,c){switch(mode){case'bus':return new NightBus(c);case'pharaoh':return new Pharaoh(c);case'reef':return new Reef(c);case'snapshots':return new Snapshots(c);case'crew':return new CabinCrew(c);default:return null;}}
