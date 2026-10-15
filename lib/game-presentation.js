import {scene,actor,label,round,coin,clamp} from './engine.js';
import {panel,note,prop,rock,turtle,ring,travelProp,Effects} from './visuals.js';

export function polishGame(game,mode){
  const renderers={summit:drawSummit,bus:drawBus,pharaoh:drawPharaoh,reef:drawReef,snapshots:drawSnapshots,crew:drawCabin};
  if(!renderers[mode])return game;
  game.fx=new Effects();game.motion={x:game.x||180,y:game.y||410,walk:false,facing:1,hostessY:305};
  const update=game.update.bind(game);
  game.update=(dt,input)=>{const x=game.x??game.player?.x??0,y=game.y??game.player?.y??0,score=game.score,lives=game.lives;update(dt,input);game.fx.update(dt);
    const nx=game.x??game.player?.x??0,ny=game.y??game.player?.y??0;game.motion.walk=Math.abs(nx-x)+Math.abs(ny-y)>.001;if(nx!==x)game.motion.facing=Math.sign(nx-x);
    if(game.score>score)game.fx.burst(mode==='summit'?game.x-game.camera:180,mode==='crew'?220:330,'#f5cf83',16);
    if(game.lives<lives){game.fx.shake=.2;game.fx.burst(180,390,'#ec967e');}
    if(mode==='crew'){const target=game.selected===null?310:145+Math.floor(game.selected/2)*75;game.motion.hostessY+=(target-game.motion.hostessY)*Math.min(1,dt*4);}
    if(mode==='pharaoh'){game.motion.x+=(game.player.x-game.motion.x)*Math.min(1,dt*15);game.motion.y+=(game.player.y-game.motion.y)*Math.min(1,dt*15);}
  };
  if(mode==='pharaoh'){game.motion.x=game.player.x;game.motion.y=game.player.y;}
  game.draw=ctx=>{ctx.animTime=game.time;renderers[mode](ctx,game);game.fx.draw(ctx);};
  return game;
}
function drawSummit(ctx,g){
  scene(ctx,'summit',g.time);ctx.save();ctx.fillStyle='#accbd133';ctx.fillRect(0,260,360,280);
  for(const p of g.platforms){const x=p.x-g.camera;if(x>390||x+p.w< -30)continue;
    const grad=ctx.createLinearGradient(x,p.y,x,p.y+120);grad.addColorStop(0,'#6e8d99');grad.addColorStop(1,'#334d61');round(ctx,x,p.y+6,p.w,540-p.y,4,grad);
    ctx.fillStyle='#e8f4ed';ctx.beginPath();ctx.moveTo(x-3,p.y);ctx.quadraticCurveTo(x+p.w*.2,p.y-9,x+p.w*.5,p.y-3);ctx.quadraticCurveTo(x+p.w*.8,p.y-8,x+p.w+3,p.y);ctx.lineTo(x+p.w,p.y+10);ctx.lineTo(x,p.y+10);ctx.fill();
    for(let n=0;n<p.w/20;n++){ctx.fillStyle='#cbe4e5';ctx.beginPath();ctx.moveTo(x+n*20+4,p.y+9);ctx.lineTo(x+n*20+8,p.y+22+n%3*5);ctx.lineTo(x+n*20+12,p.y+9);ctx.fill();}
    for(let n=0;n<3;n++)rock(ctx,x+22+n*39,p.y+60+n%2*28,22);
  }
  for(const c of g.coins)if(!c.taken){ctx.save();ctx.translate(c.x-g.camera,c.y+Math.sin(g.time*3+c.x)*3);ctx.scale(.75+Math.sin(g.time*4)*.2,1);coin(ctx,0,0,10);ctx.restore();}
  for(const ob of g.guards)rock(ctx,ob.x-g.camera,ob.y+7,33);
  const end=g.width-g.camera;ctx.strokeStyle='#ebe7d4';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(end,340);ctx.lineTo(end,440);ctx.stroke();ctx.fillStyle='#d5745c';ctx.beginPath();ctx.moveTo(end,340);ctx.bezierCurveTo(end+14,328+Math.sin(g.time*5)*4,end+26,354,end+43,340);ctx.lineTo(end+38,369);ctx.lineTo(end,365);ctx.fill();
  if(g.checkpoint>40){const cx=g.checkpoint-g.camera;ctx.strokeStyle='#cd8c5d';ctx.beginPath();ctx.moveTo(cx,403);ctx.lineTo(cx,448);ctx.stroke();round(ctx,cx-2,400,27,17,3,'#e5c07c');label(ctx,'✓',cx+10,409,13);}
  if(!g.invincible||Math.floor(g.invincible*10)%2)actor(ctx,{...g.c,pose:!g.grounded?'jump':g.motion.walk?'run':'idle',facing:g.motion.facing},g.x-g.camera,g.y-12,82);
  ctx.restore();panel(ctx,'Summit Sprint','Jump between ledges. Reach the summit.',g.progress);note(ctx,g.grounded?'Move and jump. Watch the gaps!':'Airborne!');
}
function drawBus(ctx,g){
  scene(ctx,'night',g.time);const horizon=173;
  for(let n=0;n<3;n++){ctx.fillStyle=n===1?'#32475bc9':'#243c50b5';ctx.beginPath();ctx.moveTo(157+n*15,horizon);ctx.lineTo(172+n*15,horizon);ctx.lineTo((n+1)*120,540);ctx.lineTo(n*120,540);ctx.closePath();ctx.fill();}
  ctx.strokeStyle='#e8c78b88';ctx.lineWidth=2;for(const edge of[1,2]){ctx.beginPath();ctx.moveTo(157+edge*15,horizon);ctx.lineTo(edge*120,540);ctx.stroke();}
  for(let n=0;n<10;n++){const p=((n/10+g.distance/1200)%1),y=horizon+p*p*367;ctx.fillStyle='#c2e8df55';ctx.fillRect(178-p*2,y,4*p+1,12*p+1);}
  const by=137+Math.sin(g.time)*2;travelProp(ctx,'bus-rear',180,by+17,66,70);
  for(const o of [...g.items].sort((a,b)=>a.y-b.y)){
    const z=clamp((o.y-75)/365,.04,1.25),y=horizon+z*z*280,x=180+(o.lane-1)*106*z,sz=18+z*23;
    if(o.kind==='coin'){coin(ctx,x,y,sz*.3);continue;}
    if(o.kind==='ticket'){round(ctx,x-sz*.6,y-sz*.3,sz*1.2,sz*.6,3,'#f6d387');label(ctx,'BUS',x,y,Math.max(6,sz*.25));continue;}
    if(o.kind==='barrier'){round(ctx,x-sz,y-sz,sz*2,9*z+3,3,'#e3b768');round(ctx,x-sz,y-sz,5*z+2,sz*1.5,2,'#93a7b2');round(ctx,x+sz-5,y-sz,5*z+2,sz*1.5,2,'#93a7b2');if(z>.5)label(ctx,'SLIDE',x,y-sz-12,10,'#ffebbb');}
    else if(o.kind==='luggage'){round(ctx,x-sz*.6,y-sz*.65,sz*1.2,sz*.9,7*z,'#b88967');ctx.strokeStyle='#eed8a8';ctx.lineWidth=2;ctx.strokeRect(x-sz*.2,y-sz*.85,sz*.4,sz*.2);round(ctx,x-sz*.45,y+sz*.25,6*z,6*z,2,'#263e50');round(ctx,x+sz*.3,y+sz*.25,6*z,6*z,2,'#263e50');if(z>.5)label(ctx,'JUMP',x,y-sz-9,10,'#ffebbb');}
    else{round(ctx,x-sz*.7,y-sz,sz*1.4,sz*1.5,5,'#608c90');prop(ctx,'bread',x,y-sz*.8,sz);if(z>.5)label(ctx,'SWITCH',x,y-sz-14,10,'#ffebbb');}
  }
  const target=80+g.lane*100;g.motion.x+=(target-g.motion.x)*.24;const jump=g.jump?Math.sin(g.jump/.72*Math.PI)*73:0;
  actor(ctx,{...g.c,pose:g.slide?'slide':g.jump?'jump':'run'},g.motion.x,441-jump,g.slide?67:89);
  panel(ctx,'Midnight Bus Run',g.ticket?'Ticket collected':'Collect the golden bus ticket',g.progress);note(ctx,'Swipe: change lanes, jump, slide');
}
function drawPharaoh(ctx,g){
  scene(ctx,'temple',g.time);const open=g.gateOpen();round(ctx,22,129,316,365,15,'#182d36dd');
  for(let y=0;y<7;y++)for(let x=0;x<6;x++){const xx=36+x*48,yy=143+y*48,w=g.walls.has(x+','+y);round(ctx,xx,yy+4,45,45,5,w?'#534c48':'#8b7653');round(ctx,xx,yy,45,w?38:41,5,w?'#8e7a5e':'#c8ad78');if(w){ctx.strokeStyle='#d8b67a88';ctx.strokeRect(xx+8,yy+7,29,23);}else{ctx.fillStyle='#e9d19555';ctx.fillRect(xx+4,yy+3,37,2);}}
  round(ctx,42+g.plate.x*48,149+g.plate.y*48,33,33,7,'#568e81');label(ctx,'◇',60+g.plate.x*48,167+g.plate.y*48,27,'#b7e5bb');
  const ex=60+g.exit.x*48,ey=167+g.exit.y*48;round(ctx,ex-19,ey-23,38,46,13,open?'#f4d584':'#4e554d');if(open){ctx.save();ctx.shadowColor='#f9d988';ctx.shadowBlur=22;round(ctx,ex-11,ey-18,22,33,8,'#fff3b5');ctx.restore();}else label(ctx,'◇',ex,ey,26,'#d6b777');
  const beam=g.beam();ctx.save();ctx.strokeStyle='#fff5a7';ctx.shadowColor='#f6cd68';ctx.shadowBlur=12;ctx.lineWidth=3+Math.sin(g.time*3)*.6;ctx.beginPath();beam.points.forEach((p,n)=>{const x=60+p.x*48,y=167+p.y*48;n?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();ctx.restore();
  for(const m of g.mirrors){const x=60+m.x*48,y=167+m.y*48;ctx.fillStyle='#5b9492';ctx.beginPath();ctx.arc(x,y,18,0,7);ctx.fill();ctx.strokeStyle='#dcfff2';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(x-11,y+(m.slash==='/'?11:-11));ctx.lineTo(x+11,y+(m.slash==='/'?-11:11));ctx.stroke();label(ctx,'↻',x+13,y-15,13,'#fff2be');}
  const sx=60+g.stone.x*48,sy=167+g.stone.y*48;rock(ctx,sx,sy,35);label(ctx,'◆',sx,sy,16,'#e2d3a0');
  actor(ctx,{...g.c,pose:Math.abs(g.motion.x-g.player.x)+Math.abs(g.motion.y-g.player.y)>.08?'walk':'idle'},60+g.motion.x*48,160+g.motion.y*48,48);
  panel(ctx,'Pharaoh’s Secret','Rotate mirrors. Push the stone.',g.progress);
  ['Light','Plate'].forEach((s,n)=>{const ready=n?g.stone.x===g.plate.x&&g.stone.y===g.plate.y:beam.lit;round(ctx,31+n*158,81,141,31,10,ready?'#4c9785':'#183c4cd9');label(ctx,s,101+n*158,97,12,'#fff0c6');});
  note(ctx,open?'Gate open. Walk to the golden doorway.':'Tap mirrors. Move with the arrows.');
}
function drawReef(ctx,g){
  scene(ctx,'reef',g.time);round(ctx,g.left-10,g.top-10,g.n*g.cell+18,g.n*g.cell+18,18,'#123f50d9');
  for(let y=0;y<g.n;y++)for(let x=0;x<g.n;x++){round(ctx,g.left+x*g.cell,g.top+y*g.cell,g.cell-2,g.cell-2,6,'#d0eee518');if(g.rocks.has(x+','+y))rock(ctx,g.left+(x+.5)*g.cell,g.top+(y+.5)*g.cell,29);}
  const center=p=>({x:g.left+(p.x+.5)*g.cell,y:g.top+(p.y+.5)*g.cell});
  g.pairs.forEach((pair,n)=>{
    ctx.save();ctx.strokeStyle=pair.color;ctx.shadowColor=pair.color;ctx.shadowBlur=pair.connected?12:2;ctx.lineWidth=8;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();pair.path.forEach((p,k)=>{const q=center(p);k?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y);});ctx.stroke();ctx.restore();
    const end=center(pair.end);ring(ctx,end.x,end.y,15,1,pair.color);label(ctx,String(n+1),end.x,end.y,11,'#fff2d2');
    let start=center(pair.start);if(pair.connected&&pair.path.length>1){const at=(g.time*.9)%(pair.path.length-1),a=center(pair.path[Math.floor(at)]),b=center(pair.path[Math.ceil(at)]);start={x:a.x+(b.x-a.x)*(at%1),y:a.y+(b.y-a.y)*(at%1)};}
    turtle(ctx,start.x,start.y,32,g.time,pair.color);label(ctx,String(n+1),center(pair.start).x-14,center(pair.start).y-16,10,'#fff4d3');
  });
  panel(ctx,'Turtle Trails','Connect matching colors. No crossing.',g.progress);label(ctx,g.pairs.filter(p=>p.connected).length+' / '+g.pairs.length+' turtles connected',180,98,13,'#edffeb');note(ctx,'Draw a path from each turtle to its ring');
}
function drawSnapshots(ctx,g){
  scene(ctx,'sunset',g.time);const x=180+Math.sin(g.time*.67)*44,bob=Math.sin(g.time*1.5)*4,good=g.indicators();
  ctx.fillStyle='#815a40';ctx.beginPath();ctx.moveTo(x-125,343+bob);ctx.lineTo(x+125,343+bob);ctx.quadraticCurveTo(x+89,393+bob,x-84,389+bob);ctx.closePath();ctx.fill();round(ctx,x-115,333+bob,230,12,5,'#d7b28a');
  ctx.strokeStyle='#e4d7b5';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(x+80,166);ctx.lineTo(x+80,340);ctx.stroke();ctx.fillStyle='#e5d9bfbb';ctx.beginPath();ctx.moveTo(x+76,171);ctx.lineTo(x-58,306);ctx.lineTo(x+76,306);ctx.fill();
  actor(ctx,{...g.c,pose:good.pose?'wave':'idle'},x-35,291+bob,125);actor(ctx,{...g.c,pose:good.pose?'idle':'wave'},x+35,291+bob,128,true);
  ctx.fillStyle='#fff1a4';ctx.globalAlpha=.08+Math.max(0,Math.sin(g.time*1.2))*.12;ctx.fillRect(0,110,360,290);ctx.globalAlpha=1;
  ctx.strokeStyle=good.frame?'#91e5be':'#fff4dc';ctx.lineWidth=3;ctx.strokeRect(g.x-81,184,162,177);ctx.strokeStyle='#fff7';ctx.lineWidth=1;for(let n=1;n<3;n++){ctx.beginPath();ctx.moveTo(g.x-81+n*54,184);ctx.lineTo(g.x-81+n*54,361);ctx.moveTo(g.x-81,184+n*59);ctx.lineTo(g.x+81,184+n*59);ctx.stroke();}
  ['Frame','Light','Pose'].forEach((name,n)=>{const ok=[good.frame,good.light,good.pose][n];round(ctx,21+n*108,415,102,45,12,ok?'#5ba28ae8':'#183f50e8');label(ctx,name,72+n*108,437,12,'#fff2d7');});
  panel(ctx,'Sunset Snapshots','Frame the couple. Wait for the green lights.',g.progress);note(ctx,g.count+' / '+g.target+' postcards');
  if(g.shot>.6){ctx.fillStyle='#fff';ctx.globalAlpha=(g.shot-.6)*4;ctx.fillRect(0,0,360,540);ctx.globalAlpha=1;}
}
function drawCabin(ctx,g){
  const gr=ctx.createLinearGradient(0,0,360,0);gr.addColorStop(0,'#cedbe0');gr.addColorStop(.45,'#f4eee1');gr.addColorStop(.55,'#f4eee1');gr.addColorStop(1,'#cedbe0');ctx.fillStyle=gr;ctx.fillRect(0,0,360,540);
  for(const side of[0,1])for(let n=0;n<3;n++){round(ctx,side?334:6,123+n*75,20,37,9,'#819ba8');round(ctx,side?337:9,126+n*75,14,30,7,'#b1d4df');ctx.fillStyle='#fff9';ctx.beginPath();ctx.ellipse((side?344:16)+Math.sin(g.time*.3+n)*3,141+n*75,9,4,0,0,7);ctx.fill();}
  round(ctx,164,105,32,229,4,'#6c8d98');for(let y=110;y<335;y+=14)round(ctx,177,y,5,5,2,'#c1c8b655');
  for(const p of g.passengers){const x=22+p.id%2*163,y=109+Math.floor(p.id/2)*75;round(ctx,x,y+5,151,66,13,'#4f7083');round(ctx,x+5,y,141,58,12,g.selected===p.id?'#82b5a5':'#7596a8');
    actor(ctx,p.id===0?{...g.c,pose:p.order?'wave':'idle'}:{npc:p.id%2?'traveler-woman':'traveler-man',pose:p.order?'wave':'idle'},x+25,y+35,45,p.id===0||p.id%2===0);
    if(p.order){round(ctx,x+43,y+5,101,43,9,'#fff5e1');prop(ctx,p.order.meal?'bread':'pasta',x+67,y+26,35);prop(ctx,p.order.drink?'juice':'water',x+115,y+26,33);round(ctx,x+44,y+54,95,4,2,'#365766');round(ctx,x+44,y+54,95*clamp(p.order.patience/(64-g.stage*1.7),0,1),4,2,p.order.patience<14?'#ee9d7f':'#bde5ba');}
    else label(ctx,'✓',x+95,y+30,24,'#d5eac5');
    if(p.id===0)label(ctx,'Marco',x+25,y+59,8,'#fff7df');
  }
  actor(ctx,{...g.c,pose:Math.abs(g.motion.hostessY-(g.selected===null?310:145+Math.floor(g.selected/2)*75))>3?'walk':'cook'},180,g.motion.hostessY,49);
  travelProp(ctx,'trolley',197,g.motion.hostessY+17,33,33);
  round(ctx,14,341,332,153,16,'#213c50');label(ctx,'Meal',180,356,11,'#dbece6');
  for(let n=0;n<2;n++){round(ctx,28+n*159,371,145,49,10,g.meal===n?'#f0d298':'#466577');prop(ctx,n?'bread':'pasta',100+n*159,395,49);}
  label(ctx,'Drink',180,430,10,'#dbece6');for(let n=0;n<2;n++){round(ctx,28+n*159,444,145,42,10,g.drink===n?'#f0d298':'#466577');prop(ctx,n?'juice':'water',100+n*159,465,39);}
  panel(ctx,'Homebound Crew',g.served+' / '+g.target+' orders served',g.progress);
  if(g.turbulence>0){round(ctx,30,238,300,78,15,'#edd09af5');label(ctx,'Turbulence! Stow the tray.',180,262,14);label(ctx,g.stowed?'Ready':'Waiting',180,291,13);}
  note(ctx,g.selected===null?'Select an order':'Choose a meal and a drink, then serve');
}
