import { ITEMS, getChapter } from './content.js';
export const STORAGE_KEY = 'yiting-passport-v1';
export function freshState() { return { version: 1, name: 'Yiting', coins: 0, scores: {}, owned: ['cream'], outfit: 'cream', accessories: [], marcoOutfit: null, lastPlayed: null, createdAt: new Date().toISOString(), updatedAt: null, daily: {}, settings: { language: 'en', music: false, sound: true, vibration: false, reducedMotion: false, leftHanded: false } }; }
export function normalize(input) {
  const result = freshState();
  if (!input || typeof input !== 'object' || input.version !== 1) return result;
  result.coins = Math.max(0, Math.min(1000000, Math.floor(Number(input.coins) || 0)));
  for (const [key, score] of Object.entries(input.scores || {}).slice(0,2000)) {
    const [chapterId, stageText] = key.split(':'); const stage = Number(stageText); const chapter = getChapter(chapterId);
    if ((chapter && Number.isInteger(stage) && key===chapterId+':'+stage && stage >= 1 && stage <= chapter.stages) || /^daily:\d{4}-\d{2}-\d{2}$/.test(key)) {
      if (score && Number.isFinite(score.score) && Number.isFinite(score.stars)) result.scores[key] = { score: Math.max(0,Math.floor(score.score)), stars: Math.max(1,Math.min(3,Math.floor(score.stars))), at: typeof score.at === 'string' ? score.at : '' };
    }
  }
  result.owned = [...new Set(['cream',...(Array.isArray(input.owned) ? input.owned : []).filter(id => ITEMS.some(i => i.id === id))])];
  result.outfit = result.owned.includes(input.outfit) && ITEMS.some(i => i.id === input.outfit && i.category === 'outfit') ? input.outfit : 'cream';
  result.accessories = (Array.isArray(input.accessories) ? input.accessories : []).filter(id => result.owned.includes(id) && ITEMS.some(i=>i.id===id && i.category==='accessory')).slice(0,3);
  result.marcoOutfit = result.owned.includes(input.marcoOutfit) && ITEMS.some(i=>i.id===input.marcoOutfit && i.category==='marco') ? input.marcoOutfit : null;
  if (input.lastPlayed && getChapter(input.lastPlayed.chapter) && Number.isInteger(Number(input.lastPlayed.stage)) && Number(input.lastPlayed.stage) >= 1 && Number(input.lastPlayed.stage) <= getChapter(input.lastPlayed.chapter).stages) result.lastPlayed = {chapter: input.lastPlayed.chapter, stage: Number(input.lastPlayed.stage)};
  for(const key of ['createdAt','updatedAt']) if(typeof input[key]==='string') result[key]=input[key];
  for(const key of ['music','sound','vibration','reducedMotion','leftHanded']) if(typeof input.settings?.[key]==='boolean') result.settings[key]=input.settings[key];
  if(['en','it','zh-TW'].includes(input.settings?.language)) result.settings.language=input.settings.language;
  trimDaily(result);return result;
}
function trimDaily(state){const keys=Object.keys(state.scores).filter(k=>k.startsWith('daily:')).sort().reverse();for(const key of keys.slice(90))delete state.scores[key];}
export function load(storage = globalThis.localStorage) { try { return normalize(JSON.parse(storage.getItem(STORAGE_KEY))); } catch { return freshState(); } }
export function save(state, storage = globalThis.localStorage) { state.updatedAt = new Date().toISOString(); try {storage.setItem(STORAGE_KEY,JSON.stringify(state));return true;}catch{return false;} }
export function reward(state, key, score, stars) {
  const old = state.scores[key]; const bestStars = Math.max(old?.stars || 0,stars);
  const amount = old ? Math.max(0,bestStars-old.stars)*10 : 30+stars*15;
  state.coins += amount;
  state.scores[key] = { score: Math.max(old?.score || 0,Math.floor(score)), stars: bestStars, at: new Date().toISOString() };
  if(key.startsWith('daily:'))trimDaily(state);
  return amount;
}
export function buy(state, id) { const item=ITEMS.find(i=>i.id===id); if(!item)return {ok:false,reason:'Not found'}; if(state.owned.includes(id))return {ok:true,alreadyOwned:true}; if(state.coins<item.price)return {ok:false,reason:'Earn a few more coins in a level first.'};state.coins-=item.price;state.owned.push(id);return {ok:true}; }
export function seeded(seed) { let n=2166136261; for(const ch of String(seed)) {n^=ch.charCodeAt(0);n=Math.imul(n,16777619);}return ()=>{n+=0x6D2B79F5;let t=n;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;}; }
export function today() { const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
