import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame} from '../lib/games.js';
import {solvePharaoh} from '../lib/egypt-games.js';
import {chaptersFor,getChapter,chapterUnlocked,completedStages} from '../lib/content.js';
import {freshState,normalize,reward} from '../lib/state.js';
const input=()=>({x:180,y:290,down:false,keys:new Set()});
test('Egypt starts independently; driving comes before both sea games',()=>{
  const list=chaptersFor('egypt'),state=freshState();assert.deepEqual(list.map(c=>c.id),['cairo','bus','pharaoh','detour','breathe','reef','snapshots','crew','egypt-date']);
  assert.ok(chapterUnlocked(state,getChapter('cairo')));assert.ok(!chapterUnlocked(state,getChapter('bus')));reward(state,'cairo:1',300,3);assert.ok(chapterUnlocked(state,getChapter('bus')));assert.ok(!chapterUnlocked(state,getChapter('summit')));
});
test('legacy Italy progress, purchases and language survive the new world',()=>{
  const s=freshState();s.coins=420;s.owned.push('red');s.outfit='red';s.settings.language='zh-TW';reward(s,'snowman:1',300,3);reward(s,'cairo:1',350,3);const saved=normalize(JSON.parse(JSON.stringify(s)));
  assert.equal(saved.outfit,'red');assert.equal(saved.settings.language,'zh-TW');assert.equal(saved.coins,s.coins);assert.equal(completedStages(saved,'italy'),1);assert.equal(completedStages(saved,'egypt'),1);
});
test('all pyramid boards are solvable through real mirror and arrow controls',()=>{
  for(let stage=1;stage<=12;stage++){const g=createGame('pharaoh',{stage});
    for(const [n,orientation]of['\\','\\','/'].entries()){const mirror=g.mirrors[n];if(mirror.slash!==orientation)g.pointer('down',{x:60+mirror.x*48,y:167+mirror.y*48});}
    const route=solvePharaoh(g);assert.ok(route?.length, 'route for stage '+stage);for(const code of route)g.action(code);assert.ok(g.won,'pyramid '+stage);assert.ok(g.beam().lit);
  }
});
test('pyramid reset restores the same solvable board and puzzles never time out',()=>{
  const g=createGame('pharaoh',{stage:8,seed:'test-board'}),walls=[...g.walls],mirrors=JSON.stringify(g.mirrors);g.pointer('down',{x:156,y:215});g.action('ArrowRight');g.action('reset');
  assert.deepEqual([...g.walls],walls);assert.equal(JSON.stringify(g.mirrors),mirrors);g.update(10000);assert.equal(g.done,false);assert.equal(g.stats().timeless,true);
});
test('all twelve turtle puzzles can be solved with noncrossing touch paths',()=>{
  for(let stage=1;stage<=12;stage++){const g=createGame('reef',{stage}),point=p=>({x:g.left+(p.x+.5)*g.cell,y:g.top+(p.y+.5)*g.cell});
    for(const pair of g.pairs){g.pointer('down',point(pair.start));for(const p of pair.solution.slice(1))g.pointer('move',point(p));g.pointer('up',point(pair.end));}assert.ok(g.won,'reef '+stage);
  }
});
test('reef interpolates fast drags into adjacent cells and rejects rocks',()=>{
  const g=createGame('reef',{stage:1}),a=g.pairs[0],point=p=>({x:g.left+(p.x+.5)*g.cell,y:g.top+(p.y+.5)*g.cell});g.pointer('down',point(a.start));
  const end=a.solution[2];g.pointer('move',point(end));assert.equal(a.path.length,3);for(const p of a.solution.slice(3))g.pointer('move',point(p));const last=a.path.at(-1);g.pointer('up',point(last));const b=g.pairs[1];g.pointer('down',point(b.start));const rock=[...g.rocks][0].split(',').map(Number);g.pointer('move',point({x:rock[0],y:rock[1]}));assert.equal(b.path.length,1);assert.ok(a.connected);g.update(10000);assert.equal(g.done,false);
});
test('Cairo bonus clears hazards without removing coins',()=>{
  const g=createGame('cairo',{stage:1});g.items=[{x:180,y:440,kind:'poop'},{x:90,y:200,kind:'coin'}];g.action('Space');assert.equal(g.items.length,1);assert.equal(g.items[0].kind,'coin');assert.ok(g.bonus>0);g.action('Space');assert.equal(g.cooldown,13);
});
test('the driver loses patience and slows down after a distraction',()=>{
  const g=createGame('detour',{stage:1});g.items=[{x:180,y:440,kind:'coffee',w:28,h:31}];g.update(.01,input());assert.equal(g.patience,82);assert.ok(g.slow>0);assert.equal(g.done,false);
});
test('night bus swipe, jump and slide avoid the correct obstacles',()=>{
  const g=createGame('bus',{stage:1});g.pointer('down',{x:160,y:320});g.pointer('up',{x:250,y:320});assert.equal(g.lane,2);
  g.action('ArrowUp');g.items=[{lane:2,y:405,kind:'luggage'}];g.update(.01);assert.equal(g.lives,3);g.action('ArrowDown');g.items=[{lane:2,y:405,kind:'barrier'}];g.update(.01);assert.equal(g.lives,3);
});
test('Marco collects air and multiple hazards only cause one hit',()=>{
  const g=createGame('breathe',{stage:1}),i=input();i.x=95;i.down=true;g.air=25;g.items=[{x:95,y:290,kind:'bubble',w:30,h:30}];g.update(.01,i);assert.ok(g.air>50);
  g.items=Array.from({length:3},()=>({x:95,y:290,kind:'rock',w:30,h:30}));g.update(.01,i);assert.equal(g.lives,2);
});
test('all photography stages can be completed using the visible green indicators',()=>{
  for(let stage=1;stage<=12;stage++){const g=createGame('snapshots',{stage}),i=input();i.down=true;
    for(let f=0;f<6000&&!g.done;f++){i.x=180+Math.sin(g.time*.67)*44;g.update(1/60,i);const s=g.indicators();if(s.frame&&s.light&&s.pose)g.action('Space');}
    assert.ok(g.won,'photos '+stage);}
});
test('all cabin stages are completable through actual order and tray controls',()=>{
  for(let stage=1;stage<=12;stage++){const g=createGame('crew',{stage});
    for(let f=0;f<6000&&!g.done;f++){g.update(1/60);if(g.turbulence){g.action('KeyD');continue;}const p=g.passengers.find(p=>p.order);if(p){g.pointer('down',{x:97+p.id%2*163,y:140+Math.floor(p.id/2)*75});g.pointer('down',{x:p.order.meal?259:100,y:395});g.pointer('down',{x:p.order.drink?259:100,y:465});g.action('Space');}}
    assert.ok(g.won,'cabin '+stage);assert.equal(g.lives,3);}
});
test('wrong cabin order costs one heart; stowing protects during turbulence',()=>{
  const g=createGame('crew',{stage:1});g.order();g.selected=0;g.meal=1-g.passengers[0].order.meal;g.drink=g.passengers[0].order.drink;g.action('Space');assert.equal(g.lives,2);assert.equal(g.served,0);
  for(let frame=0;frame<1100&&!g.turbulence;frame++)g.update(1/60);g.action('KeyD');g.update(2.1);assert.equal(g.lives,2);
});
