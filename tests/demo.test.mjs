import test from 'node:test';
import assert from 'node:assert/strict';
import {CHAPTERS,chapterUnlocked,stageUnlocked} from '../lib/content.js';
import {freshState,reward,normalize} from '../lib/state.js';
import {createViews} from '../lib/views.js';

test('demo opens every minigame without completing levels or granting currency',()=>{
  const state=freshState(),before=JSON.stringify(state);
  for(const c of CHAPTERS){
    assert.equal(chapterUnlocked(state,c),!c.finale);
    assert.equal(stageUnlocked(state,c,1),!c.finale);
    if(!c.finale){
      assert.equal(stageUnlocked(state,c,2),false);
      const view=createViews(state).levels(c.id);
      assert.match(view,new RegExp('data-play="'+c.id+':1"  aria-label'));
      assert.match(view,new RegExp('data-play="'+c.id+':2" disabled'));
      assert.match(createViews(state).world(c.world),new RegExp('data-go="levels/'+c.id+'" >'));
    }
  }
  assert.equal(JSON.stringify(state),before);
});

test('turning demo off restores progression without losing real play or purchases',()=>{
  const state=freshState();reward(state,'crew:1',100,2);
  const restored=normalize(JSON.parse(JSON.stringify(state)));
  for(const c of CHAPTERS.filter(c=>!c.finale)){
    assert.equal(chapterUnlocked(restored,c,false),c.unlock===0);
  }
  assert.equal(stageUnlocked(restored,CHAPTERS.find(c=>c.id==='crew'),2,true),true);
  assert.equal(stageUnlocked(restored,CHAPTERS.find(c=>c.id==='crew'),2,false),false);
  assert.equal(restored.coins,state.coins);
  assert.deepEqual(restored.scores,state.scores);
  assert.deepEqual(restored.owned,state.owned);
});
