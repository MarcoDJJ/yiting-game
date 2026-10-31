import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import {MusicDirector,MUSIC_BY_GAME,musicFor,isUrgent} from '../lib/music.js';
import {CHAPTERS,completionRoute,stageUnlocked,getChapter} from '../lib/content.js';
import {freshState,normalize,reward} from '../lib/state.js';
import {PHARAOH_LEVELS,REEF_LEVELS} from '../lib/puzzle-levels.js';
import {createGame} from '../lib/games.js';
function fakeContext(){
 const context={state:'suspended',currentTime:0,destination:{},created:[],resume:async()=>{context.state='running';},suspend:async()=>{context.state='suspended';},decodeAudioData:async()=>({duration:70}),createGain:()=>({gain:{value:1,setValueAtTime(v){this.value=v;},linearRampToValueAtTime(v){this.value=v;},setTargetAtTime(v){this.value=v;},cancelScheduledValues(){}},connect(){},disconnect(){}}),createBufferSource:()=>{const node={connect(){},disconnect(){},start(){this.started=true;},stop(){this.stopped=true;this.onended?.();}};context.created.push(node);return node;}};return context;
}
const response={ok:true,arrayBuffer:async()=>new ArrayBuffer(1)};
test('all 17 games have local licensed music and the menu has its own theme',()=>{
 const catalog=JSON.parse(readFileSync(new URL('../assets/music/catalog.json',import.meta.url)));
 for(const chapter of CHAPTERS.filter(c=>!c.finale))assert.ok(catalog.tracks.some(t=>t.id===MUSIC_BY_GAME[chapter.id]));
 for(const t of catalog.tracks){assert.equal(t.license,'CC BY 4.0');assert.ok(t.source.startsWith('https://incompetech.com/'));assert.equal(statSync(new URL('../'+t.src,import.meta.url)).size,t.bytes);}
 assert.equal(musicFor('journey'),'carefree');assert.equal(musicFor('play/reef/24'),'dream-culture');assert.equal(musicFor('play/crew/24',true),'cyborg-ninja');assert.equal(isUrgent({timeless:true,time:0}),false);assert.equal(isUrgent({time:14}),true);assert.equal(isUrgent({timeless:true,urgency:true}),true);
});
test('music waits for a gesture, loops, crossfades, mutes, resumes and pauses when hidden',async()=>{
 const context=fakeContext(),music=new MusicDirector({createContext:()=>context,fetchAudio:async()=>response});
 await music.configure(freshState().settings);assert.equal(context.created.length,0);await music.unlock();assert.equal(music.active.id,'carefree');assert.equal(music.active.source.loop,true);
 const first=music.active.source;await music.scene('play/pharaoh/1');assert.equal(music.active.id,'sneaky-snitch');assert.equal(first.stopped,true);assert.equal(music.sources.size,1);
 music.pause(true);assert.ok(music.master.gain.value<.1);music.pause(false);assert.equal(music.master.gain.value,.45);
 await music.visibility(true);assert.equal(context.state,'suspended');await music.visibility(false);assert.equal(context.state,'running');
 await music.configure({music:false,musicVolume:.3});assert.equal(music.active,null);assert.equal(music.sources.size,0);
 await music.configure({music:true,musicVolume:.3});assert.equal(music.active.id,'sneaky-snitch');assert.equal(music.master.gain.value,.3);
});
test('late music downloads cannot restart muted music or win a scene-change race',async()=>{
 const context=fakeContext(),pending=new Map(),music=new MusicDirector({createContext:()=>context,fetchAudio:url=>new Promise(resolve=>pending.set(url,resolve))});
 const initial=music.unlock();await Promise.resolve();const next=music.scene('play/reef/1');pending.get('/assets/music/dream-culture.mp3')(response);await next;pending.get('/assets/music/carefree.mp3')(response);await initial;assert.equal(music.active.id,'dream-culture');assert.equal(context.created.length,1);
 const last=music.scene('play/bus/1');await music.configure({music:false,musicVolume:.5});pending.get('/assets/music/cyborg-ninja.mp3')(response);await last;assert.equal(music.active,null);assert.equal(context.created.length,1);
});
test('failed download is retryable and decoded cache is bounded',async()=>{
 const context=fakeContext();let fail=true;const music=new MusicDirector({createContext:()=>context,fetchAudio:async()=>{if(fail)throw Error('offline');return response;}});
 await music.unlock();assert.ok(music.error);fail=false;await music.unlock();assert.equal(music.active.id,'carefree');
 for(const id of ['reef','bus','crew','pharaoh','detour'])await music.scene('play/'+id+'/1');assert.ok(music.cache.size<=3);
});
test('old silent default migrates once; chosen mute and volume survive later loads',()=>{
 const state=freshState();state.settings.music=false;state.settings.musicVolume=.2;assert.equal(normalize(state).settings.music,false);assert.equal(normalize(state).settings.musicVolume,.2);delete state.settings.soundtrackVersion;assert.equal(normalize(state).settings.music,true);
});
test('winning the first level advances within that game and unlocks level 2 in release mode',()=>{
 const state=freshState();for(const id of ['snowman','cairo']){const c=getChapter(id);reward(state,id+':1',100,2);assert.equal(completionRoute(c,1),'play/'+id+'/2');assert.equal(stageUnlocked(state,c,2,false),true);}
 assert.equal(completionRoute(getChapter('cairo'),24),'levels/bus');assert.equal(completionRoute(getChapter('crew'),24),'finale/egypt');assert.equal(stageUnlocked(state,getChapter('reef'),25),false);
});
test('24 distinct pyramid layouts have increasing optical complexity and reversible moves',()=>{
 assert.equal(new Set(PHARAOH_LEVELS.map(p=>JSON.stringify([p.walls,p.mirrors,p.plates,p.player]))).size,24);
 assert.ok(PHARAOH_LEVELS[23].mirrors.length>PHARAOH_LEVELS[0].mirrors.length);assert.equal(PHARAOH_LEVELS[23].stones.length,2);
 const g=createGame('pharaoh',{stage:24}),before=JSON.stringify([g.player,g.stones,g.mirrors]);const m=g.mirrors[0];g.pointer('down',{x:60+m.x*48,y:167+m.y*48});g.action('undo');assert.equal(JSON.stringify([g.player,g.stones,g.mirrors]),before);
});
test('all turtle authored solutions cover the board exactly and shortcuts do not clear',()=>{
 assert.equal(new Set(REEF_LEVELS.map(p=>JSON.stringify(p.pairs))).size,24);
 for(const board of REEF_LEVELS){const used=new Set(board.rocks);for(const path of board.pairs)for(let n=0;n<path.length;n++){const p=path[n],key=p.x+','+p.y;assert.ok(!used.has(key));used.add(key);if(n)assert.equal(Math.abs(p.x-path[n-1].x)+Math.abs(p.y-path[n-1].y),1);}assert.equal(used.size,board.n*board.n);}
 const g=createGame('reef',{stage:1});for(const p of g.pairs){p.path=[p.start,p.end];p.connected=true;}g.check();assert.equal(g.won,false);assert.equal(g.message,'Fill all the clear water');
});
