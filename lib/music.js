// All recordings are local, attributed CC BY 4.0 loops. No third-party requests.
export const MUSIC_BY_GAME={snowman:'monkeys',summit:'cyborg-ninja',drive:'cipher',castle:'sneaky-snitch',rowing:'bossa-antigua',photo:'monkeys',gelato:'monkeys',market:'the-builder',pasta:'the-builder',cairo:'cipher',bus:'cyborg-ninja',pharaoh:'sneaky-snitch',detour:'cipher',breathe:'dream-culture',reef:'dream-culture',snapshots:'bossa-antigua',crew:'the-builder'};
export function musicFor(route,urgent=false){const [screen,id]=route.split('/');return screen==='play'?(urgent?'cyborg-ninja':MUSIC_BY_GAME[id]||'carefree'):screen==='finale'?'bossa-antigua':'carefree';}
export function isUrgent(status){return Boolean(status.urgency||!status.timeless&&status.time>0&&status.time<=15);}
export class MusicDirector {
  constructor({createContext=()=>new (globalThis.AudioContext||globalThis.webkitAudioContext)(),fetchAudio=url=>fetch(url),onStatus=()=>{}}={}){
    this.onStatus=onStatus;this.createContext=createContext;this.fetchAudio=fetchAudio;this.context=null;this.master=null;this.cache=new Map();this.active=null;this.sources=new Set();this.route='journey';this.enabled=true;this.volume=.45;this.urgent=false;this.paused=false;this.hidden=false;this.request=0;this.pending=null;this.unlocked=false;this.error=null;
  }
  report(){this.onStatus({enabled:this.enabled,playing:Boolean(this.enabled&&this.active&&this.context?.state==='running'&&!this.hidden),track:this.active?.id,error:Boolean(this.error)});}
  configure(settings){this.enabled=Boolean(settings.music);this.volume=Math.max(0,Math.min(1,Number(settings.musicVolume) || 0));this.gain();this.report();return this.sync();}
  async unlock(){
    // Called directly in a trusted pointer/keyboard event, before awaiting fetches.
    if(!this.enabled||this.hidden)return;
    try{if(!this.context){this.context=this.createContext();this.master=this.context.createGain();this.master.connect(this.context.destination);this.context.onstatechange=()=>this.report();this.gain();}this.unlocked=true;await this.context.resume();return this.sync();}catch(err){this.error=err;}
  }
  scene(route){this.route=route;this.urgent=false;this.paused=false;this.gain();return this.sync();}
  urgency(value){if(this.urgent===Boolean(value))return;this.urgent=Boolean(value);return this.sync();}
  pause(value){this.paused=Boolean(value);this.gain();}
  gain(){if(this.master){const now=this.context.currentTime;this.master.gain.cancelScheduledValues(now);this.master.gain.setTargetAtTime(this.enabled?this.volume*(this.paused?.18:1):0,now,.08);}}
  async visibility(hidden){this.hidden=hidden;if(hidden){this.request++;this.pending=null;try{await this.context?.suspend();}catch{}}else if(this.unlocked&&this.enabled){try{await this.context.resume();await this.sync();}catch{}}}
  stopSource(node,fade=.45){if(!node)return;const now=this.context.currentTime;node.gain.gain.cancelScheduledValues(now);node.gain.gain.setValueAtTime(node.gain.gain.value,now);node.gain.gain.linearRampToValueAtTime(0,now+fade);try{node.source.stop(now+fade+.02);}catch{};}
  buffer(id){
    if(!this.cache.has(id)){const promise=this.fetchAudio('/assets/music/'+id+'.mp3').then(r=>{if(!r.ok)throw Error('Music unavailable');return r.arrayBuffer();}).then(b=>this.context.decodeAudioData(b)).catch(error=>{this.cache.delete(id);throw error;});this.cache.set(id,promise);}
    return this.cache.get(id);
  }
  async sync(){
    if(!this.enabled){this.request++;this.pending=null;for(const node of this.sources)this.stopSource(node,.08);this.active=null;this.report();return;}
    if(!this.unlocked||this.hidden||!this.context)return;
    const id=musicFor(this.route,this.urgent);if(this.active?.id===id){if(this.pending){this.request++;this.pending=null;}return;}if(this.pending===id)return;
    const request=++this.request;this.pending=id;
    try{
      const buffer=await this.buffer(id);if(request!==this.request||!this.enabled||this.hidden)return;
      const source=this.context.createBufferSource(),gain=this.context.createGain();source.buffer=buffer;source.loop=true;source.connect(gain);gain.connect(this.master);
      const node={id,source,gain};this.sources.add(node);source.onended=()=>{source.disconnect();gain.disconnect();this.sources.delete(node);};
      const now=this.context.currentTime;gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(1,now+.65);source.start();this.stopSource(this.active,.65);this.active=node;this.error=null;this.report();
      // Keep memory bounded on phones. Each stereo PCM buffer is around 25 MB.
      while(this.cache.size>3){const key=[...this.cache.keys()].find(k=>k!==id&&k!==this.active?.id);this.cache.delete(key);}
    }catch(error){this.error=error;this.report();}finally{if(request===this.request)this.pending=null;}
  }
}
