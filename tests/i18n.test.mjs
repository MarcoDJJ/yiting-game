import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CHAPTERS,WORLDS,ITEMS,ZONES,EGYPT_ZONES} from '../lib/content.js';
import {freshState,reward} from '../lib/state.js';
import {hasTranslation,translate} from '../lib/i18n.js';
import {createViews} from '../lib/views.js';
test('every world, chapter, instruction, memory and shop description has both translations',()=>{
  const texts=[...CHAPTERS.flatMap(c=>[c.title,c.subtitle,c.goal,c.controls,c.memory]),...WORLDS.flatMap(w=>[w.name,w.note]),...ITEMS.flatMap(i=>[i.name,i.note]),...Object.values({...ZONES,...EGYPT_ZONES}).flatMap(z=>[z.name,z.note])];
  for(const lang of ['zh-TW','it'])for(const text of texts)assert.ok(hasTranslation(text,lang),lang+': '+text);
});
test('every literal UI translation key is covered in Traditional Chinese and Italian',()=>{
  for(const file of ['../app.js','../lib/views.js']){const source=readFileSync(new URL(file,import.meta.url),'utf8');
    for(const m of source.matchAll(/\b(?:T|H)\('([^']+)'/g)){if(!/[A-Za-z]/.test(m[1]))continue;for(const lang of ['zh-TW','it'])assert.ok(hasTranslation(m[1],lang),file+': '+m[1]);}
  }
});
test('dynamic gameplay messages translate numbers and nested world names',()=>{
  assert.equal(translate('Snowman size 32 / 65','zh-TW'),'雪人大小 32 / 65');
  assert.equal(translate('Bonus in 12s','zh-TW'),'12 秒後可用獎勵');
  assert.equal(translate('Connected as yiting','zh-TW'),'已連線為 yiting');
  assert.equal(translate('Level {n} / {total}','it',{n:4,total:12}),'Livello 4 / 12');
});
test('whole page views switch descriptions, instructions, memories and wardrobe text',()=>{
  const state=freshState();state.settings.language='zh-TW';state.owned=ITEMS.map(i=>i.id);for(const c of CHAPTERS)reward(state,c.id+':1',300,3);
  const views=createViews(state,{configured:true,signedIn:true,user:'yiting'});
  const pages=[views.journey(),views.world('italy'),views.world('egypt'),views.settings(),views.shop(),views.shop(true),views.passport(),views.album(),views.finale('italy'),views.finale('egypt'),...CHAPTERS.filter(c=>!c.finale).flatMap(c=>[views.levels(c.id),views.play(c.id,1)])];
  for(const page of pages){const text=page.replace(/<[^>]*>/g,' ');assert.doesNotMatch(text,/\b(?:Play|Complete|instructions|Souvenirs|adventure|collected|camera|first|minutes|reconnect|progress|Snowman|Crew|Marsa)\b/i);}
  assert.ok(views.world('egypt').includes('繁忙街道'));assert.ok(views.levels('bus').includes('左右滑動換道'));assert.ok(views.shop().includes('米色洋裝'));
});
