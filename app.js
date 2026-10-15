import {WORLDS,CHAPTERS,ITEMS,getChapter,chaptersFor,chapterUnlocked,stageUnlocked,nextLevel,completedStages} from './lib/content.js';
import {load,save,buy,reward,normalize,STORAGE_KEY,today} from './lib/state.js';
import {GameRunner,loadSprites} from './lib/engine.js';
import {translate} from './lib/i18n.js';
import {createViews,WORLD_INFO,escape,spriteFor,marcoSpriteFor} from './lib/views.js';
import {icon} from './lib/icons.js';
const app=document.querySelector('#app'),modalRoot=document.querySelector('#modal-root');
let state=load(),runner=null,shopCategory='all',session={configured:false,signedIn:false},storageKey=STORAGE_KEY,revision=0,saveQueue=Promise.resolve(),pendingSaves=0,cloudError=false,cloudDirty=false,modalClose=null,audio=null,musicTimer=null;
let welcomed=false;try{welcomed=localStorage.getItem('passport-welcome')==='1';}catch{}
const T=(text,params={})=>translate(text,state.settings.language,params);
const H=(text,params={})=>escape(T(text,params));
async function api(url,options={}){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),7000);try{return await fetch(url,{...options,signal:controller.signal});}finally{clearTimeout(timer);}}
function toast(message){const el=document.querySelector('#toast');el.textContent=T(message);el.classList.add('toast-visible');clearTimeout(el._timeout);el._timeout=setTimeout(()=>el.classList.remove('toast-visible'),3500);}
function persist(){const storage={getItem:k=>localStorage.getItem(k),setItem:(k,v)=>localStorage.setItem(storageKey,v)};const localOk=save(state,storage);if(!localOk)toast('This browser could not save. Export a backup in Settings.');if(session.signedIn){try{localStorage.setItem(`${storageKey}:dirty`,'1');}catch{}}if(session.signedIn&&!cloudError){const snapshot=JSON.parse(JSON.stringify(state));cloudDirty=true;pendingSaves++;saveQueue=saveQueue.then(async()=>{if(cloudError)return;const res=await api('/api/save',{method:'PUT',headers:{'Content-Type':'application/json','If-Match':String(revision)},body:JSON.stringify(snapshot)});if(res.status===409){cloudError=true;toast('Your cloud save changed on another device. Reconnect before continuing.');return;}if(!res.ok)throw new Error('Save unavailable');const data=await res.json();revision=data.revision;}).catch(()=>{cloudError=true;toast('Saved on this device. Cloud sync paused: reconnect in Settings.');}).finally(()=>{pendingSaves--;if(!pendingSaves&&!cloudError){cloudDirty=false;try{localStorage.removeItem(`${storageKey}:dirty`);}catch{}}updateSaveBadge();});}updateSaveBadge();}
async function getSession(){try{const response=await api('/api/session',{cache:'no-store'});if(!response.ok||!response.headers.get('content-type')?.includes('application/json'))throw new Error('Unavailable');session=await response.json();if(session.signedIn)localStorage.setItem('passport-cloud-owner',session.user);else localStorage.removeItem('passport-cloud-owner');}catch{const owner=localStorage.getItem('passport-cloud-owner');if(['yiting','marco'].includes(owner)){session={configured:true,signedIn:true,user:owner};cloudError=true;}}return session;}
async function connectCloud(user,code){const r=await api('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({user,code})});const data=await r.json();if(!r.ok)throw new Error(data.error||'Could not connect');session={configured:true,signedIn:true,user:data.user};storageKey=`${STORAGE_KEY}:cloud:${data.user}`;localStorage.setItem('passport-cloud-owner',data.user);revision=data.revision;cloudError=false;if(data.state){const dirty=localStorage.getItem(`${storageKey}:dirty`)==='1';if(dirty){state=normalize(JSON.parse(localStorage.getItem(storageKey)));cloudError=true;closeModal();render();toast('Unsynced device progress kept. Reconnect to choose your latest save.');return;}state=normalize(data.state);localStorage.setItem(storageKey,JSON.stringify(state));closeModal();render();toast('Your cloud passport is open.');}else{state=load();persist();closeModal();render();toast('Your passport is connected. Local progress uploaded.');}}
function playNote(freq=550,len=.1){if(!state.settings.sound)return;try{audio ||= new (window.AudioContext||window.webkitAudioContext)();audio.resume();const osc=audio.createOscillator(),g=audio.createGain();osc.type='sine';osc.frequency.value=freq;g.gain.setValueAtTime(.025,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+len);osc.connect(g);g.connect(audio.destination);osc.start();osc.stop(audio.currentTime+len);}catch{}}
function startMusic(){clearInterval(musicTimer);musicTimer=null;if(!state.settings.music)return;try{audio ||= new (window.AudioContext||window.webkitAudioContext)();audio.resume();let step=0;const notes=[261.63,329.63,392,329.63,293.66,349.23,440,349.23];musicTimer=setInterval(()=>{if(document.hidden)return;const osc=audio.createOscillator(),g=audio.createGain();osc.type='sine';osc.frequency.value=notes[step++%notes.length];g.gain.setValueAtTime(.013,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.7);osc.connect(g);g.connect(audio.destination);osc.start();osc.stop(audio.currentTime+.8);},700);}catch{}}
function updateSaveBadge(){
  const el=document.querySelector('.save-badge');if(el)el.textContent=T(!navigator.onLine?'Offline · saved locally':session.signedIn?(cloudError?'Cloud sync paused':cloudDirty?'Syncing…':'Cloud connected'):'Saved on this device');
  const counter=document.querySelector('[data-coins]');if(counter)counter.textContent=state.coins.toLocaleString();
}
function navigate(route){closeModal();if(currentRoute()===route)render();else location.hash=route;}
function currentRoute(){return location.hash.slice(1)||'journey';}
function render(){
  runner?.destroy();runner=null;const route=currentRoute(),parts=route.split('/'),views=createViews(state,{...session,error:cloudError,dirty:cloudDirty},shopCategory);let content;
  if(parts[0]==='world')content=views.world(parts[1]);
  else if(parts[0]==='levels'){const c=getChapter(parts[1]);if(!c||c.finale||!chapterUnlocked(state,c)){navigate(c?'world/'+c.world:'journey');return;}content=views.levels(c.id);}
  else if(parts[0]==='play'){const c=getChapter(parts[1]),stage=Number(parts[2]),daily=parts[3]==='daily';if(!c||c.finale||!Number.isInteger(stage)||stage<1||stage>c.stages||!chapterUnlocked(state,c)||(!daily&&!stageUnlocked(state,c,stage))){navigate(c?'world/'+c.world:'journey');return;}content=views.play(c.id,stage,daily);}
  else if(parts[0]==='shop'||parts[0]==='wardrobe')content=views.shop(parts[0]==='wardrobe',WORLD_INFO[parts[1]]?parts[1]:undefined);
  else if(parts[0]==='passport')content=views.passport();
  else if(parts[0]==='album')content=views.album();
  else if(parts[0]==='settings')content=views.settings();
  else if(parts[0]==='finale')content=views.finale(WORLD_INFO[parts[1]]?parts[1]:'italy');
  else content=views.journey();
  app.innerHTML=views.shell(route,content);document.body.classList.toggle('is-playing',parts[0]==='play');document.body.classList.toggle('reduce-motion',state.settings.reducedMotion);document.documentElement.lang=state.settings.language;document.title=T('Yiting’s Passport')+' · '+T('Our little world');updateSaveBadge();
  if(parts[0]==='play')prepareGame(parts[1],Number(parts[2]),parts[3]==='daily');window.scrollTo({top:0,behavior:'instant'});
}
function prepareGame(id,stage,daily){
  const canvas=document.querySelector('#game-canvas'),config={stage,sprite:spriteFor(state),marcoSprite:marcoSpriteFor(state),accessories:[...state.accessories],marcoOutfit:state.marcoOutfit,language:state.settings.language,reducedMotion:state.settings.reducedMotion,onFeedback:(kind)=>{playNote(kind==='hit'?180:kind==='perfect'?880:620,.07);if(kind==='hit'&&state.settings.vibration&&navigator.vibrate)navigator.vibrate(30);},seed:daily?id+':'+today():id+':'+stage};
  runner=new GameRunner(canvas,id,config,status=>{
    document.querySelector('#hud-score').textContent=status.score;document.querySelector('#hud-time').textContent=status.timeless?'—':T('{n}s',{n:status.time});
    const lives=Math.max(0,Math.min(3,status.lives));document.querySelector('#hud-lives').textContent='♥ '.repeat(lives)+'♡ '.repeat(3-lives);
    document.querySelector('#hud-progress').style.width=status.progress*100+'%';document.querySelector('#hud-message').textContent=T(status.message);if(status.paused)pauseGame();
  },result=>finishGame(id,stage,daily,result));
}
function showModal(content,closable=true,onClose=null){
  closeModal();const previous=document.activeElement;modalRoot.innerHTML=`<div class="modal-backdrop"><section class="modal" role="dialog" aria-modal="true" aria-label="${H('Passport dialog')}">${closable?`<button class="round close" data-close aria-label="${H('Close')}">${icon('close')}</button>`:''}${content}</section></div>`;
  modalClose=()=>{modalRoot.innerHTML='';modalClose=null;onClose?.();previous?.focus?.();};setTimeout(()=>modalRoot.querySelector('button,input')?.focus(),0);
}
function closeModal(){modalClose?.();}
function welcome(){showModal(`<img class="welcome-hero" src="/assets/egypt.webp" alt="${H('Illustrated travel landscape')}"><span class="eyebrow welcome-tag">${H('A little gift for Yiting')}</span><h2>${H('Your passport to our little world.')}</h2><p class="welcome-letter">${H('Some places stay with us. Some people make them home.')}</p><p>${H('Play through our adventures, collect memories and find a little piece of us in every detour.')}</p><button class="primary" data-welcome>${H('Open my passport')}${icon('passport')}</button><div class="onboarding-note">${H('Explore Egypt and Italia. Guest saves stay on this device.')}</div>`,false);}
function pauseGame(){
  if(!runner?.running)return;runner.pause(true);showModal(`${icon('pause')}<h2>${H('A little pause.')}</h2><p>${H('Your adventure will be right here.')}</p><button class="primary" data-resume>${H('Keep playing')}${icon('arrow')}</button><button class="text-button modal-secondary" data-exit>${H('Leave this level')}</button>`,true,()=>runner?.pause(false));
}
function finishGame(id,stage,daily,result){
  playNote(result.won?660:240,.22);if(state.settings.vibration&&navigator.vibrate)navigator.vibrate(40);const c=getChapter(id),list=chaptersFor(c.world),nextGame=list[list.indexOf(c)+1];let earned=0;
  if(result.won){earned=reward(state,daily?'daily:'+today():id+':'+stage,result.score,result.stars);persist();}
  const next=stage===1&&nextGame?(nextGame.finale?'finale/'+c.world:'levels/'+nextGame.id):stage<c.stages?'play/'+id+'/'+(stage+1):nextGame?(nextGame.finale?'finale/'+c.world:'levels/'+nextGame.id):'world/'+c.world;
  showModal(`${result.won?`<div class="results-stars">${'★'.repeat(result.stars)+'☆'.repeat(3-result.stars)}</div>`:icon(c.icon)}<h2>${H(result.won?'A little victory!':'One more little try?')}</h2><p>${H(result.won?c.memory:'No coins lost. No waiting for lives. Try again whenever you like.')}</p><div class="result-stat">${result.score}</div><p>${result.won?H('+{n} Memory Coins',{n:earned}):H('A scenic detour, not the end of the road.')}</p>${result.won&&earned===0?`<p>${H('Improve your stars for a bonus.')}</p>`:''}<div class="result-actions"><button class="secondary" data-retry="${id}:${stage}:${daily}">${H('Play again')}</button><button class="primary" data-go="${result.won&&!daily?next:daily?'journey':'levels/'+id}">${H(result.won&&!daily?(stage===1&&nextGame?'Next game':'Next level'):'Back')}${icon('arrow')}</button></div>`,false);
}
async function showAuth(){
  await saveQueue;
  if(session.signedIn&&!cloudError){showModal(`<h2>${H('Close your cloud passport?')}</h2><p>${H('Cloud progress stays safe. This device returns to its separate guest save.')}</p><button class="primary" data-signout>${H('Sign out')}</button>`);return;}
  if(cloudError){try{await getSession();if(session.signedIn){const r=await api('/api/save');if(r.ok){const data=await r.json();showModal(`<h2>${H('Choose your latest adventure.')}</h2><p>${H('Cloud: {cloud} completed levels. Device: {local}. Choosing one replaces the other; export a backup first if needed.',{cloud:Object.keys(data.state?.scores||{}).length,local:Object.keys(state.scores).length})}</p><button class="primary" id="use-cloud">${H('Use cloud progress')}</button><button class="secondary modal-secondary" id="use-local">${H('Upload this device’s progress')}</button>`);
    document.querySelector('#use-cloud').onclick=()=>{state=normalize(data.state);revision=data.revision;cloudError=false;cloudDirty=false;localStorage.removeItem(storageKey+':dirty');localStorage.setItem(storageKey,JSON.stringify(state));closeModal();render();};
    document.querySelector('#use-local').onclick=()=>{revision=data.revision;cloudError=false;persist();closeModal();render();};return;}}}catch{toast('The online passport is unavailable. Try again when connected.');return;}}
  if(!session.configured){showModal(`<div class="modal-icon">${icon('cloud')}</div><h2>${H('Cloud saves, coming next.')}</h2><p>${H('Online saves are not activated yet. Keep playing on this device, or export a backup to move your progress.')}</p><button class="primary" data-close>${H('Keep exploring')}</button>`);return;}
  showModal(`<div class="modal-icon">${icon('passport')}</div><h2>${H('Open your cloud passport.')}</h2><p>${H('Use the personal code Marco gives you. Existing cloud progress takes priority over a guest save.')}</p><form id="login-form"><label for="passport-user">${H('Passport owner')}</label><select id="passport-user"><option value="yiting">Yiting</option><option value="marco">${H('Marco · testing')}</option></select><label for="passport-code">${H('Your personal passport code')}</label><input id="passport-code" type="password" autocomplete="current-password" required minlength="20"><p id="auth-error" role="alert"></p><button class="primary" type="submit">${H('Open passport')}${icon('arrow')}</button></form>`);
  document.querySelector('#login-form').onsubmit=async e=>{e.preventDefault();const b=e.target.querySelector('button');b.disabled=true;try{await connectCloud(document.querySelector('#passport-user').value,document.querySelector('#passport-code').value);}catch(err){document.querySelector('#auth-error').textContent=T(err.name==='AbortError'?'The online passport is unavailable. Try again when connected.':err.message);b.disabled=false;}};
}
function openPostcard(id){
  const info=WORLD_INFO[id],c=info&&getChapter(info.finale);if(!c||!chapterUnlocked(state,c))return;
  if(!state.scores[c.id+':1']){reward(state,c.id+':1',500,3);persist();}
  showModal(`<div class="modal-icon">${icon('heart')}</div><h2>${H('Ciao, amore.')}</h2><p class="welcome-letter">${H(info.letter)}</p><p>${H('You earned the {world} passport stamp. So many little adventures are still waiting.',{world:T(WORLDS.find(w=>w.id===id).name)})}</p><button class="primary" data-go="passport">${H('Stamp my passport')}${icon('passport')}</button>`,false);
}
app.addEventListener('click',e=>{
  const el=e.target.closest('button');if(!el)return;
  if(el.dataset.go)navigate(el.dataset.go);
  else if(el.dataset.continue){const last=state.lastPlayed,c=last&&getChapter(last.chapter);const next=c&&!state.scores[c.id+':'+last.stage]&&stageUnlocked(state,c,last.stage)?{chapter:c,stage:last.stage}:nextLevel(state,el.dataset.continue);navigate(next.chapter.finale?'finale/'+next.chapter.world:'play/'+next.chapter.id+'/'+next.stage);}
  else if(el.dataset.world){const w=WORLDS.find(w=>w.id===el.dataset.world);if(!w)return;if(w.available)navigate('world/'+w.id);else showModal(`<div class="modal-icon">${icon(w.icon)}</div><h2>${H(w.name)}</h2><p>${H(w.note)}</p><p>${H('This journey is still being made. Explore Egypt or Italia while we prepare the next chapter.')}</p><button class="primary" data-go="world/egypt">${H('Visit Egypt')}${icon('arrow')}</button>`);}
  else if(el.dataset.play){const[id,n]=el.dataset.play.split(':');navigate('play/'+id+'/'+n);}
  else if(el.hasAttribute('data-start')&&runner){if(!currentRoute().endsWith('/daily'))state.lastPlayed={chapter:runner.mode,stage:runner.config.stage};persist();document.querySelector('#game-overlay').classList.add('hidden');playNote();if(state.settings.music&&!musicTimer)startMusic();runner.start();}
  else if(el.hasAttribute('data-pause'))pauseGame();
  else if(el.dataset.filter){shopCategory=el.dataset.filter;render();}
  else if(el.dataset.buy){const result=buy(state,el.dataset.buy);if(result.ok){persist();playNote(750);toast('Packed into your suitcase!');render();}else toast(result.reason);}
  else if(el.dataset.equip){const id=el.dataset.equip,item=ITEMS.find(i=>i.id===id);if(!item||!state.owned.includes(id))return;if(item.category==='outfit')state.outfit=id;else if(item.category==='accessory')state.accessories=state.accessories.includes(id)?state.accessories.filter(a=>a!==id):[...state.accessories.slice(-2),id];else if(item.category==='marco')state.marcoOutfit=state.marcoOutfit===id?null:id;persist();render();}
  else if(el.dataset.setting){const key=el.dataset.setting;state.settings[key]=!state.settings[key];persist();if(key==='music')startMusic();render();}
  else if(el.hasAttribute('data-auth'))showAuth();
  else if(el.hasAttribute('data-export')){const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='yiting-passport-'+today()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}
  else if(el.hasAttribute('data-import'))document.querySelector('#import-file').click();
  else if(el.hasAttribute('data-daily')){const choices=CHAPTERS.filter(c=>!c.finale&&chapterUnlocked(state,c)),index=Math.floor(Date.now()/86400000)%choices.length,c=choices[index];navigate('play/'+c.id+'/'+Math.min(12,3+Math.floor(completedStages(state)/8))+'/daily');}
  else if(el.dataset.date)openPostcard(el.dataset.date);
});
modalRoot.addEventListener('click',async e=>{
  const el=e.target.closest('button');if(!el)return;
  if(el.hasAttribute('data-close')||el.hasAttribute('data-resume'))closeModal();
  else if(el.hasAttribute('data-welcome')){try{localStorage.setItem('passport-welcome','1');}catch{}welcomed=true;closeModal();}
  else if(el.hasAttribute('data-exit')){const id=runner?.mode||'snowman';navigate('levels/'+id);}
  else if(el.dataset.go)navigate(el.dataset.go);
  else if(el.dataset.retry){const[id,n,daily]=el.dataset.retry.split(':');navigate('play/'+id+'/'+n+(daily==='true'?'/daily':''));}
  else if(el.hasAttribute('data-signout')){await saveQueue;if(cloudError){toast('Cloud sync is paused. Export a backup before signing out.');return;}try{const r=await api('/api/logout',{method:'POST'});if(!r.ok)throw new Error();session={configured:true,signedIn:false};localStorage.removeItem('passport-cloud-owner');storageKey=STORAGE_KEY;state=load();cloudError=false;cloudDirty=false;closeModal();render();}catch{toast('Could not sign out. Please try again.');}}
});
document.addEventListener('pointerdown',e=>{const b=e.target.closest('[data-control]');if(b&&runner){e.preventDefault();b.setPointerCapture(e.pointerId);runner.control(b.dataset.control,true);}});
document.addEventListener('pointercancel',e=>{const b=e.target.closest('[data-control]');if(b&&runner)runner.control(b.dataset.control,false);});
document.addEventListener('pointerup',e=>{const b=e.target.closest('[data-control]');if(b&&runner)runner.control(b.dataset.control,false);});
document.addEventListener('pointercancel',()=>runner?.input.keys.clear());
document.addEventListener('keydown',e=>{if(!modalRoot.firstChild)return;if(e.key==='Escape'&&modalRoot.querySelector('[data-close]'))closeModal();if(e.key==='Tab'){const f=[...modalRoot.querySelectorAll('button:not(:disabled),input,select')],first=f[0],last=f.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}});
app.addEventListener('change',async e=>{
  if(e.target.id==='language'){state.settings.language=e.target.value;persist();render();}
  if(e.target.id==='import-file'){const file=e.target.files[0];if(!file)return;if(file.size>100000){toast('That save is too large.');return;}try{const data=JSON.parse(await file.text());if(data?.version!==1)throw new Error();const restored=normalize(data);showModal(`<h2>${H('Restore this passport?')}</h2><p>${H('{n} completed adventures, {coins} coins. This replaces the current save.',{n:Object.keys(restored.scores).length,coins:restored.coins})}</p>${session.signedIn?`<p>${H('This also replaces your cloud copy.')}</p>`:''}<button class="primary" id="confirm-import">${H('Restore progress')}</button>`);document.querySelector('#confirm-import').onclick=()=>{state=restored;persist();closeModal();render();toast('Passport restored.');};}catch{toast('This file is not a valid passport backup.');}}
});
window.addEventListener('hashchange',()=>{closeModal();render();});window.addEventListener('offline',updateSaveBadge);window.addEventListener('online',()=>{updateSaveBadge();if(session.signedIn&&cloudError)toast('Back online. Reconnect in Settings to sync safely.');});
async function initializeCloud(){await getSession();if(session.signedIn){storageKey=STORAGE_KEY+':cloud:'+session.user;try{const cached=localStorage.getItem(storageKey);if(cached)state=normalize(JSON.parse(cached));if(localStorage.getItem(storageKey+':dirty')==='1')cloudError=true;if(!cloudError){const r=await api('/api/save');if(!r.ok)throw new Error();const data=await r.json();if(data.state)state=normalize(data.state);revision=data.revision;localStorage.setItem(storageKey,JSON.stringify(state));}}catch{cloudError=true;}render();}updateSaveBadge();}
render();loadSprites().then(()=>runner?.draw());await initializeCloud();if(!welcomed)welcome();if('serviceWorker'in navigator)navigator.serviceWorker.register('/sw.js').catch(()=>{});
