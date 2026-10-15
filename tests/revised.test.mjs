import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame} from '../lib/games.js';
import {GAME_BRIEFS} from '../lib/game-briefs.js';
import {hasTranslation} from '../lib/i18n.js';
const input=(x=180,y=300,down=false,keys=[])=>({x,y,down,keys:new Set(keys)});
const advance=(g,seconds,i=input())=>{for(let n=0;n<seconds*60&&!g.done;n++)g.update(1/60,i);};
function move(g,x,y){g.pointer('down',{x:x-(g.camera||0),y});for(let n=0;n<1500&&!g.done;n++){if(Math.hypot(g.player.x-x,g.player.y-y)<5)break;g.update(1/60,input());}g.pointer('up',{x,y});}
test('all revised objectives and tutorial steps are fully translated',()=>{
  for(const b of Object.values(GAME_BRIEFS))for(const text of [b.genre,b.goal,b.controls,...b.steps])for(const lang of ['it','zh-TW'])assert.ok(hasTranslation(text,lang),text);
});
test('all snow workshop stages complete through circle, drag and decoration gestures',()=>{
  for(let stage=1;stage<=12;stage++){const g=createGame('snowman',{stage});
    while(g.phase!=='dress'){g.pointer('down',{x:260,y:340});for(let n=1;n<1000&&g.phase==='roll';n++)g.pointer('move',{x:180+Math.cos(n*.12)*80,y:340+Math.sin(n*.12)*80});g.pointer('up',{x:260,y:340});assert.equal(g.phase,'stack');const p=g.target();g.pointer('down',{...g.pos});g.pointer('move',p);g.pointer('up',p);}
    for(let n=0;n<3;n++)g.pointer('down',{x:65+n*115,y:455});assert.ok(g.won,'snow '+stage);
  }
});
test('all alpine roads are drivable with steering and braking',()=>{
  for(let stage=1;stage<=12;stage++){const g=createGame('drive',{stage});for(let n=0;n<8000&&!g.done;n++){const ice=Math.sin(g.distance*.008)>.55;g.update(1/60,input(g.road(g.distance),420,true,ice?['Space']:[]));}assert.ok(g.won,'drive '+stage);assert.equal(g.lives,3);}
});
test('snow recovery needs repeated pushes and returns control',()=>{
  const g=createGame('drive',{stage:1});g.stuck=.1;for(let n=0;n<5;n++)g.action('Space');assert.equal(g.stuck,0);assert.equal(g.lives,3);
});
test('castle walls block movement and hiding has a cooldown',()=>{
  const g=createGame('castle',{stage:1});move(g,55,220);move(g,180,220);assert.ok(g.player.x<115);g.action('Space');assert.equal(g.hide,3);g.update(1,input());g.action('Space');assert.equal(g.hide,2);
});
test('all castle routes are completable with movement and timed hiding',()=>{
  for(let stage=1;stage<=12;stage++){const g=createGame('castle',{stage});
    move(g,55,165);move(g,72,165);move(g,72,319);g.action('Space');move(g,180,319);move(g,180,438);move(g,292,438);move(g,292,410);
    while(g.hideCooldown>0&&!g.done)advance(g,.05);
    g.action('Space');move(g,292,263);move(g,320,263);move(g,320,150);move(g,292,150);assert.ok(g.won,'castle '+stage+' '+JSON.stringify(g.stats()));
  }
});
test('all rowing stages reward actual alternating beats',()=>{
  for(let stage=1;stage<=12;stage++){const g=createGame('rowing',{stage});for(let n=0;n<6000&&!g.done;n++){if(Math.abs(g.time-g.next)<.025)g.pointer('down',{x:g.side==='left'?80:280,y:439});g.update(1/60,input());}assert.ok(g.won,'rowing '+stage);assert.equal(g.lives,3);}
});
test('wrong oar and early photography do not award a clear',()=>{
  const row=createGame('rowing',{stage:1});row.time=row.next;row.action('KeyD');assert.equal(row.strokes,0);
  const photo=createGame('photo',{stage:1});photo.action('KeyD');assert.equal(photo.course,0);
});
test('all dinner courses can be focused and photographed while holding Marco back',()=>{
  for(let stage=1;stage<=12;stage++){const g=createGame('photo',{stage});for(let n=0;n<6000&&!g.done;n++){if(g.hunger>.4&&!g.distract)g.pointer('down',{x:180,y:190});g.pointer('down',{x:180,y:340});g.update(1/60,input());if(g.focus>=.99){g.pointer('up',{x:180,y:340});g.pointer('down',{x:180,y:474});}}assert.ok(g.won,'dinner '+stage);}
});
test('all gelato orders can be stacked through flavor choice and timed drops',()=>{
  for(let stage=1;stage<=12;stage++){const g=createGame('gelato',{stage});for(let n=0;n<8000&&!g.done;n++){g.pointer('down',{x:65+g.request*108,y:473});const tip=g.x+g.scoops.reduce((v,s)=>v+s.offset,0);if(!g.falling&&Math.abs(g.scoopX()-tip)<3)g.pointer('down',{x:180,y:200});g.update(1/60,input());}assert.ok(g.won,'gelato '+stage);}
});
test('every market recipe completes through real drag-and-drop coordinates',()=>{
  for(let stage=1;stage<=12;stage++){const g=createGame('market',{stage});for(let n=0;n<50&&!g.done;n++){const id=g.required.find(id=>!g.basket.includes(id)),p=g.slot(g.stock.indexOf(id));g.pointer('down',p);g.pointer('move',{x:180,y:449});g.pointer('up',{x:180,y:449});}assert.ok(g.won,'market '+stage);}
});
test('all four cooking phases are completed with slice, stir, heat and plating inputs',()=>{
  for(let stage=1;stage<=12;stage++){const g=createGame('pasta',{stage});
    while(g.phase===0){g.pointer('down',{x:180,y:220});g.pointer('up',{x:180,y:355});}
    g.pointer('down',{x:250,y:290});for(let n=1;n<500&&g.phase===1;n++)g.pointer('move',{x:180+Math.cos(n*.12)*70,y:290+Math.sin(n*.12)*70});g.pointer('up',{x:250,y:290});assert.equal(g.phase,2);
    for(let n=0;n<1000&&g.phase===2;n++){g.pointer('down',{x:180,y:440});g.update(1/60,input());}assert.equal(g.phase,3);
    for(let n=0;n<4;n++){g.pointer('down',{x:45+n*90,y:445});g.pointer('move',{x:180,y:285});g.pointer('up',{x:180,y:285});}assert.ok(g.won,'pasta '+stage);
  }
});
test('all road trips can follow their route and refuse every stop',()=>{
  for(let stage=1;stage<=12;stage++){const g=createGame('detour',{stage});for(let n=0;n<8000&&!g.done;n++){g.action(g.route[g.junction]==='left'?'KeyA':'KeyD');if(g.temptation)g.pointer('down',{x:180,y:300});g.update(1/60,input());}assert.ok(g.won,'detour '+stage);assert.equal(g.patience,100);}
});
test('diver surfaces to breathe, collects all memories and returns to the boat',()=>{
  for(let stage=1;stage<=12;stage++){const g=createGame('breathe',{stage});
    for(const p of g.treasures){move(g,g.player.x,145);move(g,p.x,145);move(g,p.x,p.y);move(g,p.x,145);}
    move(g,90,145);assert.ok(g.won,'diver '+stage);assert.equal(g.lives,3);
  }
});
test('Cairo destinations require real collection before the hotel opens',()=>{
  const g=createGame('cairo',{stage:1});move(g,52,475);move(g,290,475);move(g,290,440);assert.equal(g.visited,1);assert.equal(g.won,false);
});
test('all Cairo routes can be crossed safely through visible traffic gaps',()=>{
  for(let stage=1;stage<=12;stage++){
    const g=createGame('cairo',{stage});move(g,52,475);move(g,290,475);move(g,290,440);move(g,290,405);
    while(g.cars[0].x>=160&&g.cars[0].x<=340&&!g.done)advance(g,.02);
    move(g,290,278);g.action('Space');move(g,55,278);move(g,55,265);
    while(g.cars[1].x>=0&&g.cars[1].x<=180&&!g.done)advance(g,.02);
    move(g,55,175);move(g,292,175);move(g,292,155);
    while(g.bonusCooldown>0&&!g.done)advance(g,.02);
    g.action('Space');move(g,180,133);assert.ok(g.won,'Cairo '+stage+' '+JSON.stringify(g.stats()));
  }
});
test('all bus routes can collect a ticket and clear hazards with real lane/jump/slide controls',()=>{
  for(let stage=1;stage<=12;stage++){
    const g=createGame('bus',{stage});
    for(let n=0;n<6000&&!g.done;n++){
      const close=g.items.filter(o=>!o.used&&o.y>350&&o.y<460);
      const ticket=close.find(o=>o.kind==='ticket');
      let lane=ticket?.lane??g.lane;
      if(close.some(o=>o.lane===lane&&o.kind==='cart'))lane=[0,1,2].find(l=>!close.some(o=>o.lane===l&&o.kind==='cart'))??lane;
      if(lane!==g.lane)g.action(lane<g.lane?'ArrowLeft':'ArrowRight');
      const hazard=close.find(o=>o.lane===g.lane&&['luggage','barrier'].includes(o.kind)&&o.y>380);
      if(hazard)g.action(hazard.kind==='luggage'?'ArrowUp':'ArrowDown');
      g.update(1/60,input());
    }
    assert.ok(g.won,'bus '+stage);
  }
});

test('a refused detour offer cannot reappear or award repeated coins at one junction',()=>{
  const g=createGame('detour',{stage:1});advance(g,3.05);assert.ok(g.temptation);g.action('Space');const score=g.score;advance(g,.2);g.action('Space');assert.equal(g.temptation,null);assert.equal(g.score,score);
});
test('cooking requires four distinct garnishes',()=>{
  const g=createGame('pasta',{stage:1});g.phase=3;
  for(let n=0;n<4;n++){g.pointer('down',{x:45,y:445});g.pointer('up',{x:180,y:285});}
  assert.equal(g.plated,1);assert.equal(g.won,false);
});
test('rally keyboard steering can turn at a playable speed',()=>{
  const g=createGame('drive',{stage:1});g.cooldown=2;advance(g,.4,input(180,300,false,['ArrowRight']));assert.ok(g.x>220);
});
