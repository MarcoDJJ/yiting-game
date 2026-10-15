import {seeded} from './state.js';
import {clamp,round,label,coin,scene,actor} from './engine.js';
import {panel,note,prop,ring,rock,turtle,vehicle,travelProp,Effects} from './visuals.js';

const inputAxis=(i,a,b)=>(i?.keys?.has(b)?1:0)-(i?.keys?.has(a)?1:0);
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
class Play {
  constructor(c){this.c=c;this.stage=c.stage||1;this.time=0;this.limit=100;this.score=0;this.lives=3;this.progress=0;this.done=false;this.won=false;this.message='';this.fx=new Effects();this.rand=seeded(c.seed||c.mode+':'+this.stage);this.cooldown=0;this.combo=0;}
  update(dt){if(this.done)return;this.time+=dt;this.cooldown=Math.max(0,this.cooldown-dt);this.fx.update(dt);if(this.time>=this.limit||this.lives<=0)this.end(false);}
  end(won){if(this.done)return;this.won=won;this.done=true;if(won){this.progress=1;this.score+=150+this.lives*35;}}
  hurt(x=180,y=280){if(this.cooldown||this.done)return;this.lives--;this.cooldown=1.4;this.combo=0;this.fx.burst(x,y,'#f19782');this.fx.shake=.22;if(this.lives<=0)this.end(false);}
  gain(n,x=180,y=280){this.score+=n;this.fx.burst(x,y);this.fx.text(x,y,'+'+n);}
  stats(){return{score:Math.floor(this.score),time:Number.isFinite(this.limit)?Math.max(0,Math.ceil(this.limit-this.time)):0,timeless:!Number.isFinite(this.limit),lives:this.lives,progress:clamp(this.progress,0,1),message:this.message};}
  result(){return{won:this.won,score:Math.floor(this.score),stars:this.won?Math.max(1,this.lives):0};}
  finishDraw(ctx,title,hint){panel(ctx,title,hint,this.progress);this.fx.draw(ctx);}
}

// A tactile construction toy: roll, lift, balance and dress three snowballs.
export class SnowWorkshop extends Play {
  constructor(c){super(c);this.limit=Infinity;this.phase='roll';this.ball=0;this.rolled=0;this.turns=0;this.angle=null;this.placed=[];this.decorated=new Set();this.held=null;this.pos={x:180,y:350};this.message='Roll circles in the snow';}
  required(){return Math.PI*2*(1.2+this.stage*.1);}
  radius(){return[48,35,24][this.ball]||24;}
  target(){return{x:180,y:[421,349,296][this.ball]||296};}
  pointer(type,p){
    if(this.done)return;
    if(this.phase==='roll'){
      if(type==='down'&&p.y>150){this.angle=Math.atan2(p.y-340,p.x-180);this.held=p;}
      if(type==='move'&&this.angle!==null){const a=Math.atan2(p.y-340,p.x-180);let d=a-this.angle;while(d>Math.PI)d-=Math.PI*2;while(d< -Math.PI)d+=Math.PI*2;const r=Math.hypot(p.x-180,p.y-340);if(r>25&&r<140)this.rolled+=Math.min(.35,Math.abs(d));this.angle=a;this.held=p;this.checkRoll();}
      if(type==='up'){this.angle=null;this.held=null;}
    }else if(this.phase==='stack'){
      if(type==='down'&&dist(p,this.pos)<this.radius()+25)this.held={x:p.x-this.pos.x,y:p.y-this.pos.y};
      if(type==='move'&&this.held)this.pos={x:p.x-this.held.x,y:p.y-this.held.y};
      if(type==='up'&&this.held){this.held=null;this.place();}
    }else if(this.phase==='dress'&&type==='down'){
      const n=Math.round((p.x-65)/115);if(p.y>430&&n>=0&&n<3){if(this.decorated.has(n))return;this.decorated.add(n);this.gain(30,65+n*115,440);if(this.decorated.size===3)this.end(true);}
    }
  }
  checkRoll(){if(this.rolled>=this.required()){this.phase='stack';this.pos={x:75,y:230};this.held=null;this.angle=null;this.message='Drag the snowball onto the glowing outline';this.gain(40,180,340);}}
  place(){const target=this.target();if(dist(this.pos,target)<30-this.stage*.6){this.placed.push({r:this.radius(),...target});this.gain(60,target.x,target.y);this.ball++;this.rolled=0;if(this.ball===3){this.phase='dress';this.message='Choose the carrot, scarf and hat';}else{this.phase='roll';this.message='Roll circles in the snow';}}else{this.pos={x:75,y:230};this.message='Line up the snowball with the outline';}}
  action(code){if(code!=='Space')return;if(this.phase==='roll'){this.rolled+=.5;this.checkRoll();}else if(this.phase==='stack'){this.pos=this.target();this.place();}else if(this.phase==='dress')this.pointer('down',{x:65+this.decorated.size*115,y:450});}
  update(dt,i){super.update(dt);if(this.done)return;this.progress=(this.ball+(this.phase==='roll'?this.rolled/this.required():.8))/3.3;}
  drawBall(ctx,p){const g=ctx.createRadialGradient(p.x-p.r*.3,p.y-p.r*.4,2,p.x,p.y,p.r);g.addColorStop(0,'#ffffff');g.addColorStop(.75,'#eaf7fb');g.addColorStop(1,'#a8c8d4');ctx.fillStyle=g;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#ffffffaa';ctx.lineWidth=2;ctx.stroke();}
  draw(ctx){
    scene(ctx,'mountain',this.time);round(ctx,0,395,360,145,0,'#e4f0efbd');
    actor(ctx,{...this.c,pose:this.held?'cook':'wave'},297,366,109);
    if(this.phase==='roll'){const r=12+this.radius()*clamp(this.rolled/this.required(),0,1);ctx.strokeStyle='#5a99b5aa';ctx.lineWidth=4;ctx.setLineDash([4,9]);ctx.beginPath();ctx.arc(180,340,92,0,7);ctx.stroke();ctx.setLineDash([]);this.drawBall(ctx,{x:180+Math.cos(this.rolled)*40,y:340+Math.sin(this.rolled)*22,r});ring(ctx,180,340,110,this.rolled/this.required());label(ctx,'↻',180,340,50,'#437e98');}
    else{for(const p of this.placed)this.drawBall(ctx,p);if(this.phase==='stack'){const p=this.target();ctx.strokeStyle='#fff3b0';ctx.lineWidth=4;ctx.setLineDash([5,7]);ctx.beginPath();ctx.arc(p.x,p.y,this.radius(),0,7);ctx.stroke();ctx.setLineDash([]);this.drawBall(ctx,{...this.pos,r:this.radius()});}}
    if(this.phase==='dress'||this.done){for(const p of this.placed)this.drawBall(ctx,p);ctx.fillStyle='#294656';for(const x of[172,188]){ctx.beginPath();ctx.arc(x,292,2.4,0,7);ctx.fill();}if(this.decorated.has(0)){ctx.fillStyle='#e79a54';ctx.beginPath();ctx.moveTo(180,299);ctx.lineTo(201,302);ctx.lineTo(181,305);ctx.fill();}if(this.decorated.has(1)){round(ctx,155,319,51,9,4,'#c96861');round(ctx,192,321,10,39,3,'#c96861');}if(this.decorated.has(2)){round(ctx,155,274,50,7,2,'#324d5c');round(ctx,163,251,34,27,5,'#324d5c');}['Carrot','Scarf','Hat'].forEach((s,n)=>{round(ctx,24+n*115,439,83,43,12,this.decorated.has(n)?'#96bfaa':'#fff2d6');label(ctx,s,65+n*115,461,12);});}
    this.finishDraw(ctx,'Snowman Mania',this.message);note(ctx,this.phase==='dress'?'Tap the three decorations':this.phase==='stack'?'Lift, align, release':'Draw circles with your finger');
  }
}

// A winding rally with continuous steering, braking and grip, rather than falling items.
export class AlpineRally extends Play {
  constructor(c){super(c);this.x=180;this.speed=0;this.distance=0;this.target=2200+this.stage*100;this.limit=85;this.grip=1;this.stuck=0;this.push=0;this.brake=false;this.message='Steer into bends. Brake on ice.';this.passed=new Set();}
  road(d){return 180+Math.sin(d*.004)*62+Math.sin(d*.009)*19;}
  action(code){if(code==='Space'){if(this.stuck){this.push++;if(this.push>=5){this.stuck=0;this.push=0;this.cooldown=2;this.gain(20,this.x,415);}}else this.brake=true;}}
  pointer(type,p){if(type==='down'&&this.stuck)this.action('Space');}
  update(dt,i){super.update(dt);if(this.done)return;if(this.stuck){this.stuck+=dt;if(this.stuck>6){this.hurt();this.stuck=0;this.x=this.road(this.distance);this.cooldown=2;}return;}
    this.brake=Boolean(i?.keys?.has('Space'));const ice=Math.sin(this.distance*.008)> .65,desired=this.brake?42:100+this.stage*4;
    this.speed+=(desired-this.speed)*dt*2;this.distance+=this.speed*dt;this.grip=ice?.52:1;
    if(i?.down)this.x+=(clamp(i.x,25,335)-this.x)*Math.min(1,dt*12*this.grip);else this.x=clamp(this.x+inputAxis(i,'ArrowLeft','ArrowRight')*150*dt*this.grip,25,335);this.x+=Math.cos(this.distance*.004)*this.speed*.12*(ice?1.8:1)*dt;
    const center=this.road(this.distance),off=Math.abs(this.x-center);
    if(off>72&&!this.cooldown){this.stuck=.01;this.push=0;this.message='Snow problem. Tap Push!';}
    const mark=Math.floor(this.distance/240);if(!this.passed.has(mark)&&Math.abs(this.x-center)<30){this.passed.add(mark);this.combo++;this.gain(25+this.combo*5,this.x,400);}
    this.progress=this.distance/this.target;if(this.progress>=1)this.end(true);if(!this.stuck)this.message=ice?'Ice ahead. Hold Brake!':'Follow the racing line';
  }
  draw(ctx){
    scene(ctx,'summit',this.time);
    const edge=(y,side,pad=0)=>{const d=this.distance+(420-y)*1.9;return this.road(d)+side*(35+(y-140)/400*45+pad);};
    for(const pad of[12,0]){ctx.fillStyle=pad?'#ebf5f1':'#4f6671';ctx.beginPath();for(let y=140;y<=540;y+=4)ctx.lineTo(edge(y,-1,pad),y);for(let y=540;y>=140;y-=4)ctx.lineTo(edge(y,1,pad),y);ctx.closePath();ctx.fill();}
    for(let y=140;y<540;y+=4){const d=this.distance+(420-y)*1.9;if(Math.sin(d*.008)>.65){ctx.fillStyle='#a4d4e1';ctx.beginPath();ctx.moveTo(edge(y,-1),y);ctx.lineTo(edge(y,1),y);ctx.lineTo(edge(y+4,1),y+4);ctx.lineTo(edge(y+4,-1),y+4);ctx.closePath();ctx.fill();}}
    ctx.save();ctx.strokeStyle='#f8e7ad';ctx.lineWidth=2;ctx.setLineDash([13,18]);ctx.lineDashOffset=this.distance/1.9;ctx.beginPath();for(let y=140;y<=540;y+=4){const x=this.road(this.distance+(420-y)*1.9);y===140?ctx.moveTo(x,y):ctx.lineTo(x,y);}ctx.stroke();ctx.restore();
    for(let n=0;n<7;n++){const d=n*170+Math.floor(this.distance/1190)*1190,y=420-(d-this.distance)/1.9;if(y<140||y>530)continue;const c=this.road(d);rock(ctx,c-99,y,32);coin(ctx,c,y,8);}
    vehicle(ctx,this.x,423,1,clamp((this.x-this.road(this.distance))*.008,-.4,.4));
    if(this.speed>70){ctx.strokeStyle='#ffffff55';for(let s of[-1,1]){ctx.beginPath();ctx.moveTo(this.x+s*22,463);ctx.lineTo(this.x+s*29,490);ctx.stroke();}}
    round(ctx,18,83,100,43,11,'#132d42d9');label(ctx,Math.round(this.speed)+' km/h',68,104,16,'#fff1d1');label(ctx,this.brake?'BRAKE':'DRIVE',284,105,12,'#fff1d1');
    if(this.stuck){round(ctx,32,220,296,105,18,'#fff3dcf5');label(ctx,'We’re stuck. Again.',180,248,20);label(ctx,'Tap Push!',180,278,16);ring(ctx,180,301,11,this.push/5);}
    this.finishDraw(ctx,'Snowbound Drive',this.message);
  }
}

// Continuous top-down stealth, two keys and a gate switch.
export class CastleRescue extends Play {
  constructor(c){super(c);this.limit=Infinity;this.player={x:55,y:447};this.destination=null;this.keys=[{x:72,y:165,taken:false},{x:291,y:263,taken:false}];this.lever=false;this.hide=0;this.hideCooldown=0;this.moving=false;this.facing=1;this.walls=[{x:115,y:132,w:24,h:160},{x:115,y:348,w:24,h:108},{x:220,y:232,w:22,h:160}];this.guards=[{x:180,y:195,base:180,dir:1},{x:290,y:369,base:290,dir:-1}];this.message='Find two keys and open the gate';}
  blocked(p){return p.x<30||p.x>330||p.y<128||p.y>474||this.walls.some(w=>p.x>w.x-9&&p.x<w.x+w.w+9&&p.y>w.y-9&&p.y<w.y+w.h+9);}
  pointer(type,p){if(type==='down'||type==='move')this.destination={x:clamp(p.x,32,328),y:clamp(p.y,130,470)};}
  action(code){if(code==='Space'&&!this.hideCooldown){this.hide=3;this.hideCooldown=7;}if(code==='reset'){this.player={x:55,y:447};this.destination=null;}}
  update(dt,i){super.update(dt);if(this.done)return;this.hide=Math.max(0,this.hide-dt);this.hideCooldown=Math.max(0,this.hideCooldown-dt);
    let dx=inputAxis(i,'ArrowLeft','ArrowRight'),dy=inputAxis(i,'ArrowUp','ArrowDown');if(dx||dy)this.destination=null;
    if(this.destination){const d=dist(this.player,this.destination);if(d>4){dx=(this.destination.x-this.player.x)/d;dy=(this.destination.y-this.player.y)/d;}else this.destination=null;}
    const speed=this.hide?60:104;this.moving=Boolean(dx||dy);if(dx)this.facing=Math.sign(dx);
    for(const [axis,v]of[['x',dx],['y',dy]]){const p={...this.player,[axis]:this.player[axis]+v*speed*dt};if(!this.blocked(p))this.player=p;}
    for(const k of this.keys)if(!k.taken&&dist(this.player,k)<26){k.taken=true;this.gain(80,k.x,k.y);}
    if(dist(this.player,{x:291,y:447})<28&&!this.lever){this.lever=true;this.gain(60,291,447);}
    for(const [n,g]of this.guards.entries()){const old=g.x;g.x=g.base+Math.sin(this.time*(.65+this.stage*.025)+n)*35;g.dir=Math.sign(g.x-old)||g.dir;const dx=this.player.x-g.x,dy=this.player.y-g.y;const visible=dx*g.dir>0&&Math.abs(dx)<85&&Math.abs(dy)<Math.abs(dx)*.5+8;const blockedSight=this.walls.some(w=>g.y>w.y&&g.y<w.y+w.h&&Math.min(g.x,this.player.x)<w.x&&Math.max(g.x,this.player.x)>w.x+w.w);if((visible&&!blockedSight||dist(g,this.player)<19)&&!this.hide&&!this.cooldown){this.hurt(g.x,g.y);this.player={x:55,y:447};this.destination=null;}}
    const n=this.keys.filter(k=>k.taken).length;this.progress=(n+Number(this.lever))/4;
    this.message=n<2?'Find two keys and open the gate':!this.lever?'Pull the switch in the lower room':'The gate is open. Reach Yiting!';
    if(n===2&&this.lever&&dist(this.player,{x:291,y:150})<35)this.end(true);
  }
  draw(ctx){
    scene(ctx,'castle',this.time);round(ctx,20,118,320,367,16,'#b8a68acb');
    for(let y=126;y<480;y+=30)for(let x=27;x<332;x+=32){ctx.strokeStyle='#6e615a55';ctx.lineWidth=1;ctx.strokeRect(x,y,30,28);}
    for(const w of this.walls){round(ctx,w.x+3,w.y+7,w.w,w.h,3,'#283d4c66');round(ctx,w.x,w.y,w.w,w.h,3,'#6b6a68');for(let y=w.y+5;y<w.y+w.h;y+=17){ctx.strokeStyle='#b4aa91';ctx.beginPath();ctx.moveTo(w.x,y);ctx.lineTo(w.x+w.w,y);ctx.stroke();}}
    for(const g of this.guards){ctx.fillStyle=this.hide?'#f7ca6a22':'#ffc45e66';ctx.beginPath();ctx.moveTo(g.x,g.y);ctx.lineTo(g.x+g.dir*90,g.y-47);ctx.lineTo(g.x+g.dir*90,g.y+47);ctx.closePath();ctx.fill();actor(ctx,{npc:'guard',pose:'walk',facing:g.dir},g.x,g.y,49,true);}
    for(const k of this.keys)if(!k.taken){ring(ctx,k.x,k.y,17,1);ctx.save();ctx.translate(k.x,k.y);ctx.rotate(-.6);ctx.strokeStyle='#ffe49a';ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,-6,5,0,Math.PI*2);ctx.moveTo(0,-1);ctx.lineTo(0,11);ctx.lineTo(6,11);ctx.moveTo(0,6);ctx.lineTo(5,6);ctx.stroke();ctx.restore();}
    round(ctx,272,434,38,23,5,this.lever?'#7bc6a9':'#c37d66');ctx.strokeStyle='#fff3cd';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(285,451);ctx.lineTo(this.lever?301:280,437);ctx.stroke();ctx.fillStyle='#fff3cd';ctx.beginPath();ctx.arc(this.lever?301:280,437,4,0,7);ctx.fill();
    actor(ctx,{...this.c,pose:'wave'},291,151,64);if(!this.lever||this.keys.some(k=>!k.taken)){for(let x=264;x<320;x+=12)round(ctx,x,123,3,61,1,'#384853');}
    ctx.save();ctx.globalAlpha=this.hide?.4:1;actor(ctx,{...this.c,pose:this.moving?'walk':'idle',facing:this.facing},this.player.x,this.player.y,58,true);ctx.restore();
    if(this.destination){ctx.strokeStyle='#fff7ba88';ctx.beginPath();ctx.arc(this.destination.x,this.destination.y,8,0,7);ctx.stroke();}
    this.finishDraw(ctx,'Escape the Castle',this.message);note(ctx,this.hide?'Stay quiet…':this.hideCooldown?'Hiding is recharging':'Tap a destination. Hide from the guards.');
  }
}

export class RhythmRowing extends Play {
  constructor(c){super(c);this.limit=85;this.beat=1.1-Math.min(this.stage,12)*.025;this.next=1.5;this.side='left';this.strokes=0;this.target=14+this.stage;this.distance=0;this.lastStroke=-3;this.lastSide='left';this.message='Alternate oars when the ring meets the circle';this.misses=0;}
  row(side){if(this.done)return;const error=Math.abs(this.time-this.next);this.lastSide=side;this.lastStroke=this.time;
    if(side===this.side&&error<.28){this.combo++;this.strokes++;this.gain(error<.12?40:20,side==='left'?84:276,372);this.message=error<.12?'Perfect rhythm!':'Good stroke!';this.advance();if(this.strokes>=this.target)this.end(true);}
    else if(this.time>this.next-.55){this.combo=0;this.misses++;this.message='Wait for the ring';if(this.misses%4===0)this.hurt();this.advance();}
  }
  advance(){this.next=Math.max(this.next+this.beat,this.time+.5);this.side=this.side==='left'?'right':'left';}
  action(code){if(['KeyA','ArrowLeft'].includes(code))this.row('left');if(['KeyD','ArrowRight'].includes(code))this.row('right');}
  pointer(type,p){if(type==='down')this.row(p.x<180?'left':'right');}
  update(dt){super.update(dt);if(this.done)return;if(this.time>this.next+.3){this.misses++;this.combo=0;if(this.misses%4===0)this.hurt();this.advance();}this.distance+=(this.strokes*2+15)*dt;this.progress=this.strokes/this.target;}
  draw(ctx){
    scene(ctx,'water',this.time);const bob=Math.sin(this.time*2)*4,x=180+Math.sin(this.time*.7)*13,y=295+bob;
    ctx.strokeStyle='#d7fff2aa';ctx.lineWidth=2;for(let n=0;n<4;n++){ctx.beginPath();ctx.ellipse(x,y+70+n*16,22+n*12,7,0,0,7);ctx.stroke();}
    ctx.save();ctx.translate(x,y);ctx.rotate(Math.sin(this.time*.9)*.04);if(!travelProp(ctx,'rowboat',0,0,106,210)){ctx.fillStyle='#8d5839';ctx.beginPath();ctx.ellipse(0,0,48,105,0,0,7);ctx.fill();}for(const side of[-1,1]){const active=(side<0?'left':'right')===this.lastSide;const a=active&&this.time-this.lastStroke<.5?Math.sin((this.time-this.lastStroke)*6)*.7:0;ctx.save();ctx.translate(side*29,10);ctx.rotate(side*(.3+a));limbOar(ctx,side);ctx.restore();}ctx.restore();
    actor(ctx,{...this.c,pose:'row'},x,y-39,66);actor(ctx,{...this.c,pose:'row',animTime:this.time+.4},x,y+27,69,true);
    for(const [n,side]of['left','right'].entries()){const xx=84+n*192;round(ctx,xx-40,405,80,73,24,'#143f4adb');ring(ctx,xx,439,24,1,side===this.side?'#f7d58e':'#6b8c90');if(side===this.side){const r=24+clamp((this.next-this.time)/this.beat,0,1)*34;ctx.strokeStyle='#fff6c7';ctx.lineWidth=3;ctx.beginPath();ctx.arc(xx,439,r,0,7);ctx.stroke();}label(ctx,side==='left'?'L':'R',xx,439,21,'#ffefd1');}
    this.finishDraw(ctx,'Row, Row, Rome',this.message);note(ctx,'Follow the ring. Left, then right.');
  }
}
function limbOar(ctx,side){ctx.strokeStyle='#724a32';ctx.lineWidth=5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(side*58,35);ctx.stroke();ctx.save();ctx.translate(side*58,35);ctx.rotate(side*.6);round(ctx,-5,-12,11,32,5,'#cda36d');ctx.restore();}

export class GelatoAtelier extends Play {
  constructor(c){super(c);this.limit=100;this.x=180;this.scoops=[];this.target=5+Math.floor(this.stage/3);this.selected=0;this.request=0;this.falling=null;this.swing=0;this.wobble=0;this.message='Choose the flavor, then release the scoop';this.colors=['#efb3ad','#adc39b','#a87456'];}
  scoopX(){return 180+Math.sin(this.time*(1.1+this.stage*.055))*105;}
  action(code){if(code==='KeyA')this.selected=(this.selected+2)%3;if(code==='KeyD')this.selected=(this.selected+1)%3;if(code==='Space'&&!this.falling&&!this.done){this.falling={x:this.scoopX(),y:205,vy:0,color:this.selected};}}
  pointer(type,p){if(type!=='down')return;if(p.y>435){this.selected=clamp(Math.floor((p.x-18)/108),0,2);}else this.action('Space');}
  update(dt,i){super.update(dt);if(this.done)return;this.wobble*=Math.pow(.08,dt);this.x=clamp(this.x+inputAxis(i,'ArrowLeft','ArrowRight')*85*dt,80,280);
    if(this.falling){const f=this.falling;f.vy+=380*dt;f.y+=f.vy*dt;const y=403-this.scoops.length*25,tip=this.x+this.scoops.reduce((a,s)=>a+s.offset,0);
      if(f.y>=y){if(Math.abs(f.x-tip)<32&&f.color===this.request){const offset=(f.x-tip)*.28;this.scoops.push({color:f.color,offset});this.wobble=(f.x-tip)*.01;this.gain(Math.abs(f.x-tip)<10?70:40,f.x,y);this.request=(this.scoops.length+this.stage-1)%3;this.message='Beautiful! The next flavor is on the card';if(this.scoops.length>=this.target)this.end(true);}else{this.hurt(f.x,y);this.message=f.color!==this.request?'Check the requested flavor':'Release when the scoop is above the cone';}this.falling=null;}}
    this.progress=this.scoops.length/this.target;
  }
  draw(ctx){
    scene(ctx,'restaurant',this.time);round(ctx,0,406,360,134,0,'#dcb68fee');actor(ctx,{...this.c,pose:'cook'},298,299,108);
    round(ctx,22,82,176,63,13,'#fff3d9ee');label(ctx,'Next scoop',77,104,12);this.scoop(ctx,158,112,20,this.request);label(ctx,this.scoops.length+' / '+this.target,77,127,13);
    ctx.fillStyle='#bd804b';ctx.beginPath();ctx.moveTo(this.x-23,401);ctx.lineTo(this.x+23,401);ctx.lineTo(this.x,454);ctx.fill();ctx.strokeStyle='#e7b978';ctx.lineWidth=2;for(let n=0;n<5;n++){ctx.beginPath();ctx.moveTo(this.x-19+n*8,405);ctx.lineTo(this.x+4+n*2,437);ctx.stroke();}
    let x=this.x;this.scoops.forEach((s,n)=>{x+=s.offset;this.scoop(ctx,x+Math.sin(this.time*4)*this.wobble*n,403-n*25,25,s.color);});
    if(this.falling)this.scoop(ctx,this.falling.x,this.falling.y,25,this.falling.color);else{const x=this.scoopX();ctx.strokeStyle='#dfe8df';ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(x,154);ctx.lineTo(x,194);ctx.stroke();this.scoop(ctx,x,205,25,this.selected);ctx.setLineDash([3,9]);ctx.strokeStyle='#fff8';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,235);ctx.lineTo(x,391-this.scoops.length*25);ctx.stroke();ctx.setLineDash([]);}
    ['Strawberry','Pistachio','Chocolate'].forEach((s,n)=>{round(ctx,18+n*108,455,99,35,10,this.selected===n?'#f9dfb5':'#fff6e6');this.scoop(ctx,36+n*108,473,10,n);label(ctx,s,83+n*108,473,9);});
    this.finishDraw(ctx,'Gelato Tower',this.message);note(ctx,'Choose a flavor. Tap to drop.');
  }
  scoop(ctx,x,y,r,n){const g=ctx.createRadialGradient(x-r*.3,y-r*.4,2,x,y,r);g.addColorStop(0,'#fff0da');g.addColorStop(.3,this.colors[n]);g.addColorStop(1,n===2?'#70472f':n===1?'#779265':'#c37e7b');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fill();for(let k=0;k<4;k++){ctx.fillStyle='#fff4';ctx.beginPath();ctx.arc(x+Math.cos(k*2)*r*.55,y+Math.sin(k*2)*r*.5,2,0,7);ctx.fill();}}
}

export class CairoCrossing extends Play {
  constructor(c){super(c);this.limit=100;this.player={x:52,y:455};this.destination=null;this.facing=1;this.moving=false;this.safe=0;this.bonusCooldown=0;this.stops=[{x:290,y:440},{x:55,y:278},{x:292,y:155}];this.visited=0;this.cars=[{x:65,y:365,dir:1},{x:265,y:223,dir:-1}];this.sellers=[{x:175,y:293},{x:132,y:145}];this.mess=[{x:160,y:440},{x:74,y:151}];this.message='Collect your souvenirs, then reach the hotel';}
  pointer(type,p){if(type==='down'||type==='move')this.destination={x:clamp(p.x,27,333),y:clamp(p.y,128,476)};}
  action(code){if(code==='Space'&&!this.bonusCooldown){this.safe=3;this.bonusCooldown=8;this.message='No, thank you!';this.fx.burst(this.player.x,this.player.y,'#f0c77b',20);}}
  update(dt,i){super.update(dt);if(this.done)return;this.safe=Math.max(0,this.safe-dt);this.bonusCooldown=Math.max(0,this.bonusCooldown-dt);let dx=inputAxis(i,'ArrowLeft','ArrowRight'),dy=inputAxis(i,'ArrowUp','ArrowDown');if(dx||dy)this.destination=null;
    if(this.destination){const d=dist(this.player,this.destination);if(d>4){dx=(this.destination.x-this.player.x)/d;dy=(this.destination.y-this.player.y)/d;}else this.destination=null;}
    this.moving=!!(dx||dy);if(dx)this.facing=Math.sign(dx);this.player.x=clamp(this.player.x+dx*105*dt,27,333);this.player.y=clamp(this.player.y+dy*105*dt,130,475);
    for(const car of this.cars){car.x+=car.dir*(64+this.stage*3)*dt;if(car.x>410)car.x=-50;if(car.x< -50)car.x=410;if(Math.abs(car.x-this.player.x)<37&&Math.abs(car.y-this.player.y)<23&&!this.cooldown){this.hurt(this.player.x,this.player.y);this.player.y=clamp(car.y+52,130,475);this.destination=null;}}
    for(const [n,s]of this.sellers.entries()){s.x=160+Math.sin(this.time*.9+n*2)*66;if(dist(s,this.player)<27&&!this.safe&&!this.cooldown){this.hurt(s.x,s.y);this.player.x=clamp(this.player.x-40,30,330);this.message='A very persistent sales pitch!';}}
    for(const p of this.mess)if(dist(p,this.player)<20&&!this.cooldown)this.hurt(p.x,p.y);
    const stop=this.stops[this.visited];if(stop&&dist(stop,this.player)<25){this.visited++;this.gain(100,stop.x,stop.y);}
    this.progress=this.visited/4;if(this.visited===3&&dist(this.player,{x:180,y:133})<30)this.end(true);
  }
  draw(ctx){
    scene(ctx,'cairo',this.time);round(ctx,16,116,328,372,13,'#d7b885bd');
    for(const y of[223,365]){round(ctx,17,y-31,326,62,0,'#6d7779dd');ctx.setLineDash([18,15]);ctx.strokeStyle='#f7dfb6';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(20,y);ctx.lineTo(340,y);ctx.stroke();ctx.setLineDash([]);for(let n=0;n<6;n++)round(ctx,71,y-27+n*10,32,5,0,'#eee2bd');}
    for(const car of this.cars)vehicle(ctx,car.x,car.y,.69,car.dir*Math.PI/2,'#e1b85c');
    for(const p of this.mess){for(let n=0;n<3;n++){ctx.fillStyle='#866042';ctx.beginPath();ctx.ellipse(p.x,p.y-n*5,11-n*3,5,0,0,7);ctx.fill();}}
    for(const s of this.sellers){actor(ctx,{npc:'shopkeeper',pose:'walk'},s.x,s.y,54);round(ctx,s.x-35,s.y-46,70,19,7,'#fff3db');label(ctx,'Special price!',s.x,s.y-36,8);}
    this.stops.forEach((p,n)=>{if(n>=this.visited){ring(ctx,p.x,p.y,20,n===this.visited?1:.25);prop(ctx,['camera','lemon','coffee'][n],p.x,p.y,30);label(ctx,String(n+1),p.x,p.y+28,12,'#fff');}});
    round(ctx,147,119,66,25,6,this.visited===3?'#65af98':'#775b45');label(ctx,'HOTEL',180,132,11,'#fff3d5');
    actor(ctx,{...this.c,pose:this.moving?'walk':'idle',facing:this.facing},this.player.x,this.player.y,62);
    if(this.safe)ring(ctx,this.player.x,this.player.y,33,this.safe/3,'#f2c65d');
    this.finishDraw(ctx,'Cairo Chaos',this.message);note(ctx,'Cross carefully. Follow the numbered stops.');
  }
}

export class RoadNegotiation extends Play {
  constructor(c){super(c);this.limit=95;this.junction=0;this.target=5+Math.floor(this.stage/3);this.timer=6;this.choice=null;this.patience=100;this.temptation=null;this.temptTime=0;this.route=this.buildRoute();this.x=180;this.message='Follow the route. Keep the driver moving.';}
  buildRoute(){return Array.from({length:this.target},()=>this.rand()>.5?'left':'right');}
  action(code){if(['KeyA','ArrowLeft'].includes(code))this.choice='left';if(['KeyD','ArrowRight'].includes(code))this.choice='right';if(code==='Space'&&this.temptation){this.temptation=null;this.temptTime=-1;this.gain(25,180,320);this.message='Straight to Marsa Alam!';}}
  pointer(type,p){if(type!=='down')return;if(this.temptation&&p.y>220&&p.y<390)this.action('Space');else this.action(p.x<180?'KeyA':'KeyD');}
  update(dt){super.update(dt);if(this.done)return;this.timer-=dt;const target=this.choice==='left'?99:this.choice==='right'?261:180;this.x+=(target-this.x)*Math.min(1,dt*6);
    if(this.timer<3&&this.timer>2.8&&!this.temptation&&!this.temptTime){this.temptation=['coffee','bread','camera'][this.junction%3];this.temptTime=2.2;}
    if(this.temptation){this.temptTime-=dt;if(this.temptTime<=0){this.patience-=25;this.temptation=null;this.temptTime=-1;this.message='Another stop. The beach is waiting.';this.fx.text(180,315,'−25');}}
    if(this.timer<=0){if(this.choice!==this.route[this.junction]){this.patience-=20;this.message='Wrong turn. Check the route card.';}else{this.gain(75,this.x,419);this.junction++;}this.timer=6.2-Math.min(this.stage,12)*.12;this.choice=null;this.temptation=null;this.temptTime=0;}
    this.lives=Math.max(0,Math.ceil(this.patience/34));if(this.lives<=0)this.end(false);this.progress=this.junction/this.target;if(this.junction>=this.target)this.end(true);
  }
  draw(ctx){
    scene(ctx,'desert',this.time);ctx.fillStyle='#5c6a6be8';ctx.beginPath();ctx.moveTo(134,540);ctx.lineTo(230,540);ctx.lineTo(220,334);ctx.lineTo(330,196);ctx.lineTo(265,183);ctx.lineTo(180,286);ctx.lineTo(95,183);ctx.lineTo(30,196);ctx.lineTo(139,334);ctx.closePath();ctx.fill();ctx.strokeStyle='#f8dfaa';ctx.lineWidth=3;ctx.setLineDash([16,16]);ctx.lineDashOffset=-this.time*35;ctx.beginPath();ctx.moveTo(180,540);ctx.lineTo(180,310);ctx.lineTo(63,189);ctx.moveTo(180,310);ctx.lineTo(297,189);ctx.stroke();ctx.setLineDash([]);
    round(ctx,26,83,308,78,14,'#fff0d9ee');label(ctx,'Route to Marsa Alam',180,104,13);for(let n=0;n<this.target;n++){const x=43+n*274/Math.max(1,this.target-1);label(ctx,this.route[n]==='left'?'↖':'↗',x,137,22,n<this.junction?'#b8bdad':n===this.junction?'#c16f47':'#536e74');}
    for(const [n,s]of['left','right'].entries()){round(ctx,27+n*214,180,92,40,8,this.choice===s?'#67b99f':'#254a5d');label(ctx,n?'RIGHT':'LEFT',73+n*214,200,14,'#fff3d4');}
    vehicle(ctx,this.x,418,1.05,(this.x-180)*.003,'#6caaa5');ring(ctx,180,466,17,this.timer/6.2);
    if(this.temptation){round(ctx,47,247,266,127,20,'#fff5e4f7');prop(ctx,this.temptation,95,295,53);label(ctx,'One little stop?',215,279,14);label(ctx,'Keep going!',215,311,16,'#397d70');label(ctx,'Tap to refuse',180,350,11);}
    this.finishDraw(ctx,'One Last Stop',this.message);note(ctx,'Choose the turn. Refuse the extra stops.');
  }
}

export class ReefExpedition extends Play {
  constructor(c){super(c);this.limit=Infinity;this.player={x:90,y:155};this.destination=null;this.air=100;this.camera=0;this.facing=1;this.moving=false;this.width=940;this.treasures=[{x:250,y:400,taken:false},{x:510,y:302,taken:false},{x:810,y:422,taken:false}];this.bubbles=[{x:330,y:210,charge:1},{x:650,y:190,charge:1}];this.urchins=[{x:392,y:365},{x:710,y:300}];this.message='Find three reef memories, then return to the boat';}
  pointer(type,p){if(type==='down'||type==='move')this.destination={x:clamp(p.x+this.camera,30,this.width-30),y:clamp(p.y,130,470)};}
  update(dt,i){super.update(dt);if(this.done)return;let dx=inputAxis(i,'ArrowLeft','ArrowRight'),dy=inputAxis(i,'ArrowUp','ArrowDown');if(dx||dy)this.destination=null;if(this.destination){const d=dist(this.player,this.destination);if(d>4){dx=(this.destination.x-this.player.x)/d;dy=(this.destination.y-this.player.y)/d;}else this.destination=null;}
    this.moving=!!(dx||dy);if(dx)this.facing=Math.sign(dx);this.player.x=clamp(this.player.x+dx*115*dt,30,this.width-30);this.player.y=clamp(this.player.y+dy*105*dt,130,472);this.camera=clamp(this.player.x-150,0,this.width-360);
    this.air-=dt*(2.6+this.stage*.12);if(this.player.y<161)this.air=Math.min(100,this.air+dt*35);
    for(const b of this.bubbles){b.charge=Math.min(1,b.charge+dt*.06);if(b.charge>.9&&dist(b,this.player)<30){this.air=Math.min(100,this.air+55);b.charge=0;this.gain(25,b.x-this.camera,b.y);}}
    for(const p of this.treasures)if(!p.taken&&dist(p,this.player)<30){p.taken=true;this.gain(100,p.x-this.camera,p.y);}
    for(const u of this.urchins)if(dist(u,this.player)<28&&!this.cooldown){this.hurt(u.x-this.camera,u.y);this.air=Math.max(10,this.air-15);}
    if(this.air<=0){this.hurt(this.player.x-this.camera,this.player.y);this.player.y=145;this.air=100;this.destination=null;}
    const n=this.treasures.filter(p=>p.taken).length;this.progress=n/4;this.message=this.air<30?'Air is low. Swim up to the surface!':n===3?'Bring the memories back to Yiting’s boat':'Find three reef memories, then return to the boat';if(n===3&&this.player.x<130&&this.player.y<175)this.end(true);
  }
  draw(ctx){
    scene(ctx,'reef',this.time);ctx.save();ctx.globalAlpha=.5;for(let n=0;n<8;n++){const x=(n*137-this.camera*.35+this.time*9+1080)%500-70,y=230+n%3*50;ctx.fillStyle=n%2?'#f5c477':'#b8e0df';ctx.beginPath();ctx.ellipse(x,y,12,5,0,0,7);ctx.fill();ctx.beginPath();ctx.moveTo(x-10,y);ctx.lineTo(x-19,y-7);ctx.lineTo(x-19,y+7);ctx.fill();}ctx.restore();
    ctx.fillStyle='#d4fff155';ctx.fillRect(0,126,360,31);label(ctx,'Surface · breathe here',180,143,10,'#fff9e5');
    for(const b of this.bubbles){const x=b.x-this.camera;ctx.strokeStyle='#c6ffff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,b.y,8+b.charge*13,0,7);ctx.stroke();ring(ctx,x,b.y,26,b.charge);}
    for(const p of this.treasures){const x=p.x-this.camera;if(!p.taken){ring(ctx,x,p.y,21,1,'#f4ce8f');turtle(ctx,x,p.y,31,this.time);}}
    for(const u of this.urchins){const x=u.x-this.camera;for(let n=0;n<12;n++){ctx.strokeStyle='#484b69';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x,u.y);ctx.lineTo(x+Math.cos(n*.53)*21,u.y+Math.sin(n*.53)*21);ctx.stroke();}ctx.fillStyle='#686080';ctx.beginPath();ctx.arc(x,u.y,13,0,7);ctx.fill();}
    actor(ctx,{...this.c,pose:'swim',facing:this.facing},this.player.x-this.camera,this.player.y,81,true);
    if(this.camera<140){round(ctx,46-this.camera,168,91,16,6,'#b98257');actor(ctx,{...this.c,pose:'wave'},90-this.camera,139,55);}
    this.finishDraw(ctx,'Marco, Breathe!',this.message);round(ctx,35,84,290,15,7,'#102e4cbb');round(ctx,35,84,290*this.air/100,15,7,this.air<30?'#f08d78':'#a4e6cf');label(ctx,'Air',180,112,11,'#eff9e8');note(ctx,'Explore the reef. Return to the boat.');
  }
}

export function createRevisedGame(mode,c){
  const constructors={snowman:SnowWorkshop,drive:AlpineRally,castle:CastleRescue,rowing:RhythmRowing,photo:DinnerDirector,market:MarketBasket,pasta:CookingStudio,gelato:GelatoAtelier,cairo:CairoCrossing,detour:RoadNegotiation,breathe:ReefExpedition};
  const Game=constructors[mode];return Game?new Game(c):null;
}

export class DinnerDirector extends Play {
  constructor(c){super(c);this.limit=90;this.course=0;this.target=3+Math.floor(this.stage/4);this.focus=0;this.hunger=0;this.distract=0;this.focusHeld=false;this.flash=0;this.message='Photograph dinner before Marco steals a bite';}
  action(code){if(code==='KeyA'&&!this.distract){this.hunger=Math.max(0,this.hunger-.55);this.distract=1.6;this.message='Hands off, Marco!';}
    if(code==='KeyD')this.shoot();
  }
  shoot(){if(this.done)return;if(this.focus>=.98&&this.hunger<1){this.gain(120,180,291);this.course++;this.flash=.35;this.focus=0;this.hunger=0;this.message='Photo first. Now you can eat!';if(this.course>=this.target)this.end(true);}else{this.message='Hold on the plate to focus first';this.fx.text(180,280,'Focus');}}
  pointer(type,p){if(type==='down'){if(p.y<245)this.action('KeyA');else if(p.y>445)this.shoot();else this.focusHeld=true;}if(type==='up')this.focusHeld=false;}
  update(dt,i){super.update(dt);if(this.done)return;this.distract=Math.max(0,this.distract-dt);this.flash=Math.max(0,this.flash-dt);this.hunger+=dt*(.23+this.stage*.01)*(this.distract?.15:1);const holding=this.focusHeld||i?.keys?.has('Space');this.focus=clamp(this.focus+(holding?.4:-.12)*dt,0,1);if(this.hunger>=1){this.hurt(180,230);this.hunger=.1;this.focus=0;this.message='Too late! Marco took a bite.';}this.progress=this.course/this.target;}
  draw(ctx){
    scene(ctx,'restaurant',this.time);actor(ctx,{...this.c,pose:this.distract?'wave':'cook'},180,236,165,true);round(ctx,0,256,360,284,30,'#b7865ada');
    ctx.fillStyle='#f9eee0';ctx.beginPath();ctx.ellipse(180,348,112,77,0,0,7);ctx.fill();ctx.strokeStyle='#d5ba90';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(180,348,99,65,0,0,7);ctx.stroke();if(this.course%4===0)travelProp(ctx,'pasta-plate',180,342,191,147);else prop(ctx,['pasta','pizza','bread','tomato'][this.course%4],180,340,126);
    ctx.strokeStyle='#ebc29e';ctx.lineWidth=12;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(213,237);ctx.bezierCurveTo(240,250,244,270,220,254+this.hunger*86);ctx.stroke();round(ctx,210,248+this.hunger*86,24,14,6,'#f2c9a7');
    ring(ctx,180,344,88,this.focus,'#80d5b7');round(ctx,121,406,118,27,10,'#24495ae6');label(ctx,this.focus>=.98?'Ready!':'Hold to focus',180,420,14,'#fff2ce');
    round(ctx,30,86,300,25,10,'#122f40d9');round(ctx,35,91,290*this.hunger,15,6,this.hunger>.75?'#f49076':'#e7bd76');label(ctx,'Marco’s appetite',180,98,10,'#fff');
    round(ctx,105,458,150,32,12,this.focus>=.98?'#73b9a1':'#24495a');prop(ctx,'camera',126,474,28);label(ctx,'Shoot!',193,474,15,'#fff1d8');
    if(this.flash){ctx.fillStyle='#fff';ctx.globalAlpha=this.flash*2;ctx.fillRect(0,0,360,540);ctx.globalAlpha=1;}
    this.finishDraw(ctx,'Wait, Marco!',this.message);
  }
}

const FOOD=['tomato','garlic','basil','pasta','aubergine','cheese','lemon','bread','pepper','olive'];
const DISHES=[['tomato','pasta','basil','cheese'],['garlic','pasta','olive','pepper'],['aubergine','tomato','pasta','basil']];
export class MarketBasket extends Play {
  constructor(c){super(c);this.limit=100;this.round=0;this.target=2+Math.floor(this.stage/5);this.basket=[];this.drag=null;this.point=null;this.message='Drag recipe ingredients into your basket';this.cost=0;this.makeStall();}
  makeStall(){this.required=DISHES[(this.stage+this.round-1)%DISHES.length];this.stock=[...FOOD].sort(()=>this.rand()-.5);this.basket=[];}
  pointer(type,p){if(this.done)return;if(type==='down'){const n=this.stock.findIndex((id,n)=>dist(p,this.slot(n))<32);if(n>=0&&!this.basket.includes(this.stock[n])){this.drag=this.stock[n];this.point=p;}}
    if(type==='move'&&this.drag)this.point=p;if(type==='up'&&this.drag){if(p.y>420&&p.y<495&&p.x>75&&p.x<285)this.buy(this.drag);this.drag=null;this.point=null;}}
  slot(n){return{x:55+n%4*83,y:220+Math.floor(n/4)*78};}
  buy(id){if(this.required.includes(id)&&!this.basket.includes(id)){this.basket.push(id);this.cost+=2;this.gain(35,180,449);this.message='Fresh ingredients, happy kitchen';if(this.basket.length===this.required.length){this.round++;if(this.round>=this.target)this.end(true);else this.makeStall();}}else{this.fx.text(180,420,'Not on the list');this.message='Check the recipe on your shopping list';this.time+=2;}}
  action(code){if(code==='Space'){const id=this.required.find(id=>!this.basket.includes(id));if(id)this.buy(id);}}
  update(dt){super.update(dt);if(this.done)return;this.progress=(this.round+this.basket.length/4)/this.target;}
  draw(ctx){
    scene(ctx,'market',this.time);round(ctx,15,79,330,89,14,'#fff2d9ed');label(ctx,'Today’s recipe',180,97,13);this.required.forEach((id,n)=>{prop(ctx,id,76+n*70,132,42);if(this.basket.includes(id))label(ctx,'✓',76+n*70,145,25,'#2b8b72');});
    for(let row=0;row<3;row++){round(ctx,17,186+row*78,326,72,5,'#a7734c');round(ctx,22,191+row*78,316,60,5,'#d5ac74');}
    this.stock.forEach((id,n)=>{const p=this.slot(n);if(!this.basket.includes(id)&&this.drag!==id)prop(ctx,id,p.x,p.y+Math.sin(this.time+n)*1.3,53);});
    travelProp(ctx,'basket',180,447,184,93);
    this.basket.forEach((id,n)=>prop(ctx,id,115+n*43,454,37));if(this.drag)prop(ctx,this.drag,this.point.x,this.point.y,65);
    this.finishDraw(ctx,'Mercato di Sicilia',this.message);note(ctx,'Choose ingredients. Drag them into the basket.');
  }
}

export class CookingStudio extends Play {
  constructor(c){super(c);this.limit=120;this.phase=0;this.cuts=0;this.required=5+Math.floor(this.stage/3);this.stir=0;this.angle=null;this.gesture=null;this.heat=.2;this.cooked=0;this.plated=0;this.garnishes=new Set();this.drag=null;this.point=null;this.cutAnim=0;this.message='Slice across the ingredient';}
  pointer(type,p){if(this.done)return;
    if(this.phase===0){if(type==='down')this.gesture=p;if(type==='up'&&this.gesture){if(Math.abs(p.y-this.gesture.y)>38&&Math.abs(p.x-180)<95&&Math.min(p.y,this.gesture.y)<335&&Math.max(p.y,this.gesture.y)>240)this.chop();this.gesture=null;}}
    else if(this.phase===1){if(type==='down')this.angle=Math.atan2(p.y-290,p.x-180);if(type==='move'&&this.angle!==null){const a=Math.atan2(p.y-290,p.x-180),r=Math.hypot(p.x-180,p.y-290);let d=a-this.angle;while(d>Math.PI)d-=Math.PI*2;while(d< -Math.PI)d+=Math.PI*2;if(r>25&&r<115)this.stir+=Math.min(.4,Math.abs(d));this.angle=a;this.checkStir();}if(type==='up')this.angle=null;}
    else if(this.phase===2&&(type==='down'||type==='move')){if(p.y>390)this.heat=clamp((p.x-48)/264,0,1);}
    else if(this.phase===3){if(type==='down'&&p.y>407){const n=clamp(Math.floor(p.x/90),0,3);if(!this.garnishes.has(n)){this.drag=n;this.point=p;}}if(type==='move'&&this.drag!==null)this.point=p;if(type==='up'&&this.drag!==null){if(Math.hypot(p.x-180,p.y-285)<90){this.garnishes.add(this.drag);this.plated=this.garnishes.size;this.gain(35,p.x,p.y);if(this.plated===4)this.end(true);}this.drag=null;}}
  }
  chop(){this.cuts++;this.cutAnim=.25;this.gain(15,180,280);if(this.cuts>=this.required){this.phase=1;this.message='Stir in circles around the pan';}}
  checkStir(){if(this.stir>=Math.PI*5){this.phase=2;this.message='Keep the heat in the green zone';}}
  action(code){if(code==='Space'){if(this.phase===0)this.chop();else if(this.phase===1){this.stir+=.65;this.checkStir();}else if(this.phase===3){const n=[0,1,2,3].find(n=>!this.garnishes.has(n));if(n!==undefined){this.garnishes.add(n);this.plated=this.garnishes.size;this.gain(35);if(this.plated>=4)this.end(true);}}}}
  update(dt,i){super.update(dt);if(this.done)return;this.cutAnim=Math.max(0,this.cutAnim-dt);
    if(this.phase===2){this.heat=clamp(this.heat+inputAxis(i,'ArrowLeft','ArrowRight')*.5*dt+Math.sin(this.time*1.7)*.045*dt,0,1);if(this.heat>.38&&this.heat<.64)this.cooked+=dt;else if(this.heat>.85){this.cooked=Math.max(0,this.cooked-dt*.4);if(!this.cooldown)this.hurt();}
      if(this.cooked>5+this.stage*.2){this.phase=3;this.message='Drag the garnishes onto the pasta';}}
    this.progress=(this.phase+(this.phase===0?this.cuts/this.required:this.phase===1?this.stir/(Math.PI*5):this.phase===2?this.cooked/(5+this.stage*.2):this.plated/4))/4;
  }
  draw(ctx){
    scene(ctx,'kitchen',this.time);round(ctx,0,170,360,370,0,'#d7b68bcc');
    if(this.phase===0){round(ctx,29,192,302,222,20,'#8f5a37');round(ctx,37,199,286,203,16,'#d8af73');for(let n=0;n<12;n++){ctx.strokeStyle='#9a6a4430';ctx.beginPath();ctx.moveTo(48,210+n*15);ctx.lineTo(310,216+n*15);ctx.stroke();}for(let n=0;n<this.cuts;n++)prop(ctx,'tomato',89+n*25,331,31,n*.2);prop(ctx,'tomato',180,278,105);
      ctx.save();ctx.translate(232,247+Math.sin(this.cutAnim/.25*Math.PI)*40);ctx.rotate(-.4);round(ctx,-5,-50,12,47,3,'#584634');round(ctx,-9,-8,17,83,3,'#eef7f3');ctx.restore();ctx.setLineDash([5,5]);ctx.strokeStyle='#fff8';ctx.beginPath();ctx.moveTo(180,220);ctx.lineTo(180,355);ctx.stroke();ctx.setLineDash([]);label(ctx,'↓',180,365,30,'#fff3d4');}
    else if(this.phase===1||this.phase===2){ctx.fillStyle='#2b3b41';ctx.beginPath();ctx.arc(180,290,110,0,7);ctx.fill();round(ctx,276,275,75,22,8,'#35434a');ctx.fillStyle=this.phase===1?'#c66b42':'#d49b58';ctx.beginPath();ctx.arc(180,290,96,0,7);ctx.fill();for(let n=0;n<10;n++){const a=n*.63+this.stir*.3;prop(ctx,n%2?'basil':'tomato',180+Math.cos(a)*65,290+Math.sin(a)*65,27);}for(let n=0;n<8;n++){ctx.strokeStyle='#fff4ce55';ctx.lineWidth=2;ctx.beginPath();const x=118+n*19,y=235-(this.time*25+n*15)%100;ctx.moveTo(x,y);ctx.bezierCurveTo(x-8,y-10,x+8,y-20,x,y-30);ctx.stroke();}
      if(this.phase===1){ctx.strokeStyle='#d8b57b';ctx.lineWidth=7;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(180+Math.cos(this.stir)*65,290+Math.sin(this.stir)*65);ctx.lineTo(280,170);ctx.stroke();ring(ctx,180,290,116,this.stir/(Math.PI*5));}
      else{round(ctx,48,428,264,22,10,'#69746a');round(ctx,48+264*.38,428,264*.26,22,5,'#86c99f');round(ctx,48+this.heat*264-8,420,16,38,5,'#fff4da');label(ctx,'Heat',180,472,13);}}
    else{ctx.fillStyle='#fff7e7';ctx.beginPath();ctx.ellipse(180,285,112,96,0,0,7);ctx.fill();prop(ctx,'pasta',180,285,150);for(const n of this.garnishes)prop(ctx,['basil','cheese','tomato','olive'][n],140+n%2*75,265+Math.floor(n/2)*40,31);['basil','cheese','tomato','olive'].forEach((id,n)=>{if(!this.garnishes.has(n))prop(ctx,id,45+n*90,445,47);});if(this.drag!==null&&this.point)prop(ctx,['basil','cheese','tomato','olive'][this.drag],this.point.x,this.point.y,48);}
    this.finishDraw(ctx,'Pasta di Casa',this.message);note(ctx,['Swipe down to slice','Trace circles with your finger','Slide to control the heat','Drag the finishing touches'][this.phase]);
  }
}
