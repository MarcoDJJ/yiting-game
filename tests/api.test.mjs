import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { onRequest,hash } from '../functions/api/[[path]].js';
import { freshState } from '../lib/state.js';
function db(){const sqlite=new DatabaseSync(':memory:');sqlite.exec(readFileSync(new URL('../db/schema.sql',import.meta.url),'utf8'));return{sqlite,prepare(sql){const stmt=sqlite.prepare(sql);let args=[];return{bind(...values){args=values;return this;},async first(){return stmt.get(...args)||null;},async run(){const r=stmt.run(...args);return{meta:{changes:Number(r.changes)}};}};}};}
const origin='https://example.pages.dev';
function req(path,{method='GET',body,cookie,revision,otherOrigin}={}){const headers={'CF-Connecting-IP':'192.0.2.1'};if(method!=='GET')headers.Origin=otherOrigin||origin;if(body!==undefined)headers['Content-Type']='application/json';if(cookie)headers.Cookie=cookie;if(revision!==undefined)headers['If-Match']=String(revision);return new Request(origin+'/api/'+path,{method,headers,...(body!==undefined?{body:JSON.stringify(body)}:{})});}
test('unconfigured cloud explicitly reports guest mode',async()=>{const r=await onRequest({request:req('session'),env:{}});assert.deepEqual(await r.json(),{configured:false,signedIn:false});});
test('unauthenticated saves are not exposed; CSRF origins fail',async()=>{const database=db(),env={PASSPORT_DB:database,PASSPORT_CODES:JSON.stringify({yiting:await hash('a'.repeat(48))})};assert.equal((await onRequest({request:req('save'),env})).status,401);assert.equal((await onRequest({request:req('login',{method:'POST',body:{},otherOrigin:'https://evil.test'}),env})).status,403);database.sqlite.close();});
test('login, two independent users, save revisions, conflicts and logout',async()=>{
  const database=db(),code='a'.repeat(48),marcoCode='b'.repeat(48),env={PASSPORT_DB:database,PASSPORT_CODES:JSON.stringify({yiting:await hash(code),marco:await hash(marcoCode)})};
  const r=await onRequest({request:req('login',{method:'POST',body:{user:'yiting',code}}),env});assert.equal(r.status,200);const login=await r.json();assert.equal(login.state,null);const c=r.headers.get('Set-Cookie');assert.ok(c.includes('HttpOnly')&&c.includes('Secure')&&c.includes('SameSite=Strict'));
  const s=freshState();s.coins=100;assert.equal((await onRequest({request:req('save',{method:'PUT',body:s,cookie:c,revision:0}),env})).status,200);
  const saved=await(await onRequest({request:req('save',{cookie:c}),env})).json();assert.equal(saved.state.coins,100);assert.equal(saved.revision,1);
  assert.equal((await onRequest({request:req('save',{method:'PUT',body:s,cookie:c,revision:0}),env})).status,409);
  assert.equal((await onRequest({request:req('save',{method:'PUT',body:s,cookie:c}),env})).status,400);
  const r2=await onRequest({request:req('login',{method:'POST',body:{user:'marco',code:marcoCode}}),env});assert.equal((await r2.json()).state,null);
  const logout=await onRequest({request:req('logout',{method:'POST',cookie:c}),env});assert.equal(logout.status,200);assert.equal((await onRequest({request:req('save',{cookie:c}),env})).status,401);database.sqlite.close();
});
test('login throttling is enforced',async()=>{const database=db(),env={PASSPORT_DB:database,PASSPORT_CODES:JSON.stringify({yiting:await hash('a'.repeat(48))})};for(let n=0;n<10;n++)assert.equal((await onRequest({request:req('login',{method:'POST',body:{user:'yiting',code:'wrong'}}),env})).status,401);assert.equal((await onRequest({request:req('login',{method:'POST',body:{user:'yiting',code:'wrong'}}),env})).status,429);database.sqlite.close();});
