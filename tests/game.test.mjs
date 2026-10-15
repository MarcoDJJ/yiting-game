import test from 'node:test';
import assert from 'node:assert/strict';
import { CHAPTERS,ITEMS,chaptersFor,totalStages,chapterUnlocked,stageUnlocked,nextLevel,completedStages } from '../lib/content.js';
import { freshState,normalize,buy,reward,seeded,load,save } from '../lib/state.js';
import { createGame } from '../lib/games.js';
const emptyInput=()=>({x:180,y:0,down:false,keys:new Set()});
test('Italy keeps driving before the castle and Egypt adds 97 stages',()=>{assert.equal(CHAPTERS[2].id,'drive');assert.equal(CHAPTERS[3].id,'castle');assert.equal(totalStages('italy'),109);assert.equal(totalStages('egypt'),97);assert.equal(totalStages(),206);});
test('progression opens stage 2 and the next game after the first clear',()=>{const state=freshState();assert.ok(chapterUnlocked(state,CHAPTERS[0],false));assert.ok(!chapterUnlocked(state,CHAPTERS[1],false));assert.ok(!stageUnlocked(state,CHAPTERS[0],2));reward(state,'snowman:1',120,3);assert.ok(chapterUnlocked(state,CHAPTERS[1],false));assert.ok(stageUnlocked(state,CHAPTERS[0],2));assert.equal(completedStages(state),1);assert.equal(nextLevel(state).stage,2);});
test('repeat play never gives unlimited shop currency',()=>{const state=freshState();assert.equal(reward(state,'snowman:1',100,1),45);assert.equal(reward(state,'snowman:1',200,1),0);assert.equal(reward(state,'snowman:1',300,3),20);assert.equal(state.coins,65);assert.equal(state.scores['snowman:1'].stars,3);});
test('years of daily play cannot evict permanent world progress',()=>{const state=freshState();reward(state,'snowman:1',300,3);reward(state,'cairo:1',400,3);for(let n=0;n<600;n++){const d=new Date(Date.UTC(2025,0,1+n));reward(state,'daily:'+d.toISOString().slice(0,10),200,2);}const restored=normalize(state);assert.ok(restored.scores['snowman:1']);assert.ok(restored.scores['cairo:1']);assert.equal(Object.keys(restored.scores).filter(k=>k.startsWith('daily:')).length,90);});
test('shop requires enough coins and purchases are idempotent',()=>{const state=freshState();assert.equal(buy(state,'red').ok,false);state.coins=240;assert.equal(buy(state,'red').ok,true);assert.equal(state.coins,0);assert.equal(buy(state,'red').ok,true);assert.deepEqual(state.owned,['cream','red']);assert.equal(buy(state,'unknown').ok,false);});
test('save normalization rejects unknown items, stages and malformed scores',()=>{const s=normalize({version:1,coins:-40,owned:['red','evil'],outfit:'red',accessories:['evil','red'],scores:{'snowman:99':{score:10,stars:3},'snowman:2':{score:99,stars:3},'bad:1':{score:50,stars:3}},settings:{sound:false,language:'unknown'}});assert.equal(s.coins,0);assert.deepEqual(s.owned,['cream','red']);assert.equal(s.outfit,'red');assert.deepEqual(s.accessories,[]);assert.deepEqual(Object.keys(s.scores),['snowman:2']);assert.equal(s.settings.sound,false);assert.equal(s.settings.language,'en');});
test('local save roundtrip and unavailable storage',()=>{const data=new Map(),storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)};const s=freshState();reward(s,'drive:1',110,2);assert.equal(save(s,storage),true);assert.equal(load(storage).scores['drive:1'].stars,2);assert.equal(save(s,{setItem(){throw new Error();}}),false);});
test('seeds are deterministic but distinct levels vary',()=>{const a=seeded('pasta:1'),b=seeded('pasta:1'),c=seeded('pasta:2');assert.deepEqual(Array.from({length:5},()=>a()),Array.from({length:5},()=>b()));assert.notEqual(a(),c());});
for(const chapter of CHAPTERS.filter(c=>!c.finale)){
 test(chapter.id+': starts with valid stats',()=>{for(const stage of [1,12]){const game=createGame(chapter.id,{stage});for(let n=0;n<30;n++)game.update(1/60,emptyInput());for(const key of ['score','time','lives','progress'])assert.ok(Number.isFinite(game.stats()[key]),key);}});
}
test('all summit routes can be cleared with normal move/jump controls',()=>{
 for(let stage=1;stage<=12;stage++){
  const g=createGame('summit',{stage}),input=emptyInput();input.keys.add('ArrowRight');
  for(let frame=0;frame<6000&&!g.done;frame++){
   if(g.grounded){const p=g.platforms.find(p=>g.x>=p.x-10&&g.x<=p.x+p.w+10&&Math.abs(g.y+24-p.y)<4);
    if(p&&p.x+p.w-g.x<30||g.guards.some(o=>o.x>g.x&&o.x-g.x<40))g.action('Space');}
   g.update(1/60,input);
  }assert.ok(g.won,'summit '+stage);
 }
});
