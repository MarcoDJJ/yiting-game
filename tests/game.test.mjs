import test from 'node:test';
import assert from 'node:assert/strict';
import { CHAPTERS,ITEMS,chapterUnlocked,stageUnlocked,nextLevel,completedStages } from '../lib/content.js';
import { freshState,normalize,buy,reward,seeded,load,save } from '../lib/state.js';
import { createGame } from '../lib/games.js';
const emptyInput=()=>({x:180,y:0,down:false,keys:new Set()});
test('the chapter order puts mountain driving before the castle',()=>{assert.equal(CHAPTERS[2].id,'drive');assert.equal(CHAPTERS[3].id,'castle');assert.equal(CHAPTERS.reduce((sum,c)=>sum+c.stages,0),109);});
test('progression opens stage 2 and the next game after the first clear',()=>{const state=freshState();assert.ok(chapterUnlocked(state,CHAPTERS[0]));assert.ok(!chapterUnlocked(state,CHAPTERS[1]));assert.ok(!stageUnlocked(state,CHAPTERS[0],2));reward(state,'snowman:1',120,3);assert.ok(chapterUnlocked(state,CHAPTERS[1]));assert.ok(stageUnlocked(state,CHAPTERS[0],2));assert.equal(completedStages(state),1);assert.equal(nextLevel(state).stage,2);});
test('repeat play never gives unlimited shop currency',()=>{const state=freshState();assert.equal(reward(state,'snowman:1',100,1),45);assert.equal(reward(state,'snowman:1',200,1),0);assert.equal(reward(state,'snowman:1',300,3),20);assert.equal(state.coins,65);assert.equal(state.scores['snowman:1'].stars,3);});
test('shop requires enough coins and purchases are idempotent',()=>{const state=freshState();assert.equal(buy(state,'red').ok,false);state.coins=240;assert.equal(buy(state,'red').ok,true);assert.equal(state.coins,0);assert.equal(buy(state,'red').ok,true);assert.deepEqual(state.owned,['cream','red']);assert.equal(buy(state,'unknown').ok,false);});
test('save normalization rejects unknown items, stages and malformed scores',()=>{const s=normalize({version:1,coins:-40,owned:['red','evil'],outfit:'red',accessories:['evil','red'],scores:{'snowman:99':{score:10,stars:3},'snowman:2':{score:99,stars:3},'bad:1':{score:50,stars:3}},settings:{sound:false,language:'unknown'}});assert.equal(s.coins,0);assert.deepEqual(s.owned,['cream','red']);assert.equal(s.outfit,'red');assert.deepEqual(s.accessories,[]);assert.deepEqual(Object.keys(s.scores),['snowman:2']);assert.equal(s.settings.sound,false);assert.equal(s.settings.language,'en');});
test('local save roundtrip and unavailable storage',()=>{const data=new Map(),storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)};const s=freshState();reward(s,'drive:1',110,2);assert.equal(save(s,storage),true);assert.equal(load(storage).scores['drive:1'].stars,2);assert.equal(save(s,{setItem(){throw new Error();}}),false);});
test('seeds are deterministic but distinct levels vary',()=>{const a=seeded('pasta:1'),b=seeded('pasta:1'),c=seeded('pasta:2');assert.deepEqual(Array.from({length:5},()=>a()),Array.from({length:5},()=>b()));assert.notEqual(a(),c());});
for(const chapter of CHAPTERS.filter(c=>c.id!=='date')){
  test(`${chapter.id}: stages 1 and 12 start and eventually end without invalid stats`,()=>{
    for(const stage of [1,12]){const game=createGame(chapter.id,{stage});const input=emptyInput();for(let frame=0;frame<10000&&!game.done;frame++){game.update(1/60,input);const stats=game.stats();for(const field of ['score','time','lives','progress'])assert.ok(Number.isFinite(stats[field]),`${field} is finite`);}assert.ok(game.done);assert.ok(game.result().stars>=0&&game.result().stars<=3);}
  });
}
test('camera bonus removes food and gives coin rain',()=>{const game=createGame('photo',{stage:1});game.items=[{x:180,y:446,kind:'camera',w:27,h:27},{x:70,y:240,kind:'food'}];game.update(.01,emptyInput());assert.ok(game.flash>0);assert.ok(game.items.every(i=>i.kind!=='food'));});
test('photo: one food collision cannot take all three hearts at once',()=>{const g=createGame('photo',{stage:1});g.items=Array.from({length:3},()=>({x:180,y:446,kind:'food',w:27,h:27}));g.update(.01,emptyInput());assert.equal(g.lives,2);assert.ok(!g.done);});
test('photo: reaching the coin target completes the round without forced waiting',()=>{const g=createGame('photo',{stage:1});g.score=g.target-20;g.items=[{x:180,y:446,kind:'coin',w:27,h:27}];g.update(.01,emptyInput());assert.ok(g.won);});
test('drive: tapping push frees the car without losing a life',()=>{const g=createGame('drive',{stage:1});g.stuck=.1;for(let n=0;n<5;n++)g.action('Space');g.update(.01,emptyInput());assert.equal(g.stuck,0);assert.equal(g.lives,3);});
test('market: every basket can be completed with valid touch coordinates',()=>{for(let stage=1;stage<=12;stage++){const g=createGame('market',{stage});while(!g.done){for(const id of [...g.required]){const index=g.tiles.findIndex(i=>i.id===id);g.pointer('down',{x:69+index%3*106,y:243+Math.floor(index/3)*81});}g.update(.01);}assert.ok(g.won);}});
test('pasta: all four recipe phases are genuinely playable',()=>{const g=createGame('pasta',{stage:12});while(g.phase===0)g.pointer('down',{x:180,y:200});for(let n=0;n<500&&g.phase===1;n++){const angle=n*.12,p={x:180+Math.cos(angle)*75,y:280+Math.sin(angle)*75};g.pointer(n===0?'down':'move',p);}assert.equal(g.phase,2);g.timer=0;g.pointer('down',{x:180,y:300});assert.equal(g.phase,3);for(let n=0;n<4;n++)g.pointer('down',{x:51+n*86,y:430});assert.ok(g.won);});
test('all shop catalog prices are finite and nonnegative',()=>{for(const i of ITEMS){assert.ok(Number.isInteger(i.price)&&i.price>=0);}});
test('all 24 platform routes can be cleared with normal move/jump controls',()=>{
  for(const mode of ['summit','castle'])for(let stage=1;stage<=12;stage++){
    const g=createGame(mode,{stage}),input=emptyInput();input.keys.add('ArrowRight');
    for(let frame=0;frame<6000&&!g.done;frame++){
      if(g.grounded){const p=g.platforms.find(p=>g.x>=p.x-10&&g.x<=p.x+p.w+10&&Math.abs(g.y+24-p.y)<4);
        if(p&&p.x+p.w-g.x<30||g.guards.some(o=>o.x>g.x&&o.x-g.x<40)||mode==='castle'&&!g.key&&Math.abs(g.keyX-g.x)<40)g.action('Space');}
      g.update(1/60,input);
    }
    assert.ok(g.won,`${mode} ${stage} is clearable`);
  }
});
test('every gelato stage can be cleared by aligning the cone under each scoop',()=>{
  for(let stage=1;stage<=12;stage++){const g=createGame('gelato',{stage}),input=emptyInput();input.down=true;
    for(let frame=0;frame<6000&&!g.done;frame++){if(g.falling)input.x=g.falling.x;g.update(1/60,input);}
    assert.ok(g.won,`gelato ${stage} is clearable`);}
});
test('every snowman stage has enough fresh snow to reach its target',()=>{
  for(let stage=1;stage<=12;stage++){const g=createGame('snowman',{stage}),input=emptyInput();input.down=true;
    for(let frame=0;frame<6000&&!g.done;frame++){
      const near=g.items.filter(o=>o.y>340).sort((a,b)=>b.y-a.y)[0];
      if(near)input.x=near.kind==='rock'?(near.x<180?330:30):near.x;
      g.update(1/60,input);
    }assert.ok(g.won,`snowman ${stage} is clearable`);}
});
