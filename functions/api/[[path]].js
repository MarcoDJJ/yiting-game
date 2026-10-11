import { normalize } from '../../lib/state.js';
const COOKIE='passport_session';
const SESSION_MS=30*86400000;
export async function hash(value){const data=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));return [...new Uint8Array(data)].map(b=>b.toString(16).padStart(2,'0')).join('');}
function json(body,status=200,headers={}){return Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers}});}
function cookie(value,maxAge=2592000){return `${COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;}
function invitationConfig(env){try{const codes=JSON.parse(env.PASSPORT_CODES||'{}');return Object.fromEntries(Object.entries(codes).filter(([user,digest])=>['yiting','marco'].includes(user)&&/^[a-f0-9]{64}$/.test(digest)));}catch{return {};}}
async function currentSession(request,db){const token=request.headers.get('Cookie')?.split(';').map(s=>s.trim()).find(s=>s.startsWith(`${COOKIE}=`))?.slice(COOKIE.length+1);if(!token||!/^[a-f0-9]{64}$/.test(token))return null;const session=await db.prepare('SELECT user_id, expires_at FROM sessions WHERE token_hash = ? AND expires_at > ?').bind(await hash(token),Date.now()).first();return session;}
async function readSave(db,user){const row=await db.prepare('SELECT data, revision FROM saves WHERE user_id = ?').bind(user).first();return{state:row?JSON.parse(row.data):null,revision:row?.revision||0};}
function secureEqual(a,b){if(a.length!==b.length)return false;let diff=0;for(let n=0;n<a.length;n++)diff|=a.charCodeAt(n)^b.charCodeAt(n);return diff===0;}
async function readBody(request){const length=Number(request.headers.get('Content-Length'));if(length>65000)throw new Error('Too large');const text=await request.text();if(text.length>65000)throw new Error('Too large');return JSON.parse(text);}
export async function onRequest({request,env}){
  const url=new URL(request.url),route=url.pathname.replace(/^\/api\/?/,'');const codes=invitationConfig(env);const configured=Boolean(env.PASSPORT_DB&&Object.keys(codes).length);
  if(!['GET','POST','PUT'].includes(request.method))return json({error:'Method not allowed'},405);
  if(request.method!=='GET'&&request.headers.get('Origin')!==url.origin)return json({error:'Origin not allowed'},403);
  if(!configured){if(route==='session'&&request.method==='GET')return json({configured:false,signedIn:false});return json({error:'Online passports are not configured yet.'},503);}
  const db=env.PASSPORT_DB;
  try {
    if(route==='login'&&request.method==='POST'){
      // Throttle even invalid usernames; the database row is keyed by a hashed IP.
      const ipKey=await hash(request.headers.get('CF-Connecting-IP')||'unknown');const windowStart=Math.floor(Date.now()/900000)*900000;
      await db.prepare('INSERT INTO login_attempts (ip_hash, window_start, attempts) VALUES (?, ?, 1) ON CONFLICT(ip_hash) DO UPDATE SET attempts = CASE WHEN window_start = excluded.window_start THEN attempts + 1 ELSE 1 END, window_start = excluded.window_start').bind(ipKey,windowStart).run();
      const attempt=await db.prepare('SELECT attempts FROM login_attempts WHERE ip_hash = ?').bind(ipKey).first();
      if(attempt.attempts>10)return json({error:'Too many attempts. Please wait fifteen minutes.'},429);
      let input;try{input=await readBody(request);}catch{return json({error:'Invalid request'},400);}
      if(!input||typeof input!=='object')return json({error:'Invalid request'},400);
      const user=String(input.user||'').toLowerCase(),code=String(input.code||'');const expected=codes[user]||'0'.repeat(64);const digest=await hash(code);
      if(!codes[user]||code.length<20||code.length>200||!secureEqual(digest,expected))return json({error:'That passport code is not valid.'},401);
      const token=[...crypto.getRandomValues(new Uint8Array(32))].map(b=>b.toString(16).padStart(2,'0')).join('');
      await db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)').bind(await hash(token),user,Date.now()+SESSION_MS).run();
      await db.prepare('DELETE FROM sessions WHERE expires_at <= ?').bind(Date.now()).run();
      await db.prepare('DELETE FROM login_attempts WHERE window_start < ?').bind(windowStart-900000).run();
      const saved=await readSave(db,user);return json({user,...saved},200,{'Set-Cookie':cookie(token)});
    }
    const session=await currentSession(request,db);
    if(route==='session'&&request.method==='GET')return json({configured:true,signedIn:Boolean(session),...(session?{user:session.user_id}:{})});
    if(route==='logout'&&request.method==='POST'){
      const token=request.headers.get('Cookie')?.split(';').map(s=>s.trim()).find(s=>s.startsWith(`${COOKIE}=`))?.slice(COOKIE.length+1);if(token)await db.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(await hash(token)).run();return json({ok:true},200,{'Set-Cookie':cookie('',0)});
    }
    if(!session)return json({error:'Open your passport first.'},401);
    if(route==='save'&&request.method==='GET')return json(await readSave(db,session.user_id));
    if(route==='save'&&request.method==='PUT'){
      const expected=Number(request.headers.get('If-Match'));if(!Number.isInteger(expected)||expected<0||!request.headers.has('If-Match'))return json({error:'A save revision is required.'},400);
      let input;try{input=await readBody(request);}catch{return json({error:'Invalid save data'},400);}if(!input||input.version!==1)return json({error:'Unsupported save version'},400);
      const data=JSON.stringify(normalize(input));let result;
      if(expected===0)result=await db.prepare('INSERT INTO saves (user_id, data, revision, updated_at) VALUES (?, ?, 1, ?) ON CONFLICT(user_id) DO NOTHING').bind(session.user_id,data,Date.now()).run();
      else result=await db.prepare('UPDATE saves SET data = ?, revision = revision + 1, updated_at = ? WHERE user_id = ? AND revision = ?').bind(data,Date.now(),session.user_id,expected).run();
      if(result.meta.changes!==1)return json({error:'This passport changed on another device.'},409);
      return json({ok:true,revision:expected+1});
    }
    return json({error:'Not found'},404);
  }catch{return json({error:'The online passport is unavailable. Check the D1 schema and binding. Local progress is safe.'},503);}
}
