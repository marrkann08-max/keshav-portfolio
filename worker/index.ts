import type {D1Database, Fetcher} from '@cloudflare/workers-types';

export interface Env { DB:D1Database; ASSETS:Fetcher; COOKIE_SECRET:string }
const COOKIE='km_mark';
const encoder=new TextEncoder();
const hex=(bytes:ArrayBuffer)=>[...new Uint8Array(bytes)].map(b=>b.toString(16).padStart(2,'0')).join('');
async function signature(value:string,secret:string){const key=await crypto.subtle.importKey('raw',encoder.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);return hex(await crypto.subtle.sign('HMAC',key,encoder.encode(value)))}
function equal(a:string,b:string){if(a.length!==b.length)return false;let diff=0;for(let i=0;i<a.length;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);return diff===0}
async function identity(request:Request,secret:string){const value=request.headers.get('Cookie')?.split(';').map(v=>v.trim()).find(v=>v.startsWith(COOKIE+'='))?.slice(COOKIE.length+1);if(value){const [id,sig]=value.split('.');if(/^[0-9a-f-]{36}$/.test(id||'')&&sig&&equal(sig,await signature(id,secret)))return {id,newCookie:null}}const id=crypto.randomUUID();return {id,newCookie:COOKIE+'='+id+'.'+await signature(id,secret)+'; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax'+(new URL(request.url).protocol==='https:'?'; Secure':'')}}
function json(value:unknown,status=200,cookie:string|null=null){const headers=new Headers({'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});if(cookie)headers.set('Set-Cookie',cookie);return new Response(JSON.stringify(value),{status,headers})}
async function state(db:D1Database,visitorKey:string){const [total,mark]=await Promise.all([db.prepare('SELECT COUNT(*) AS count FROM marks').first<{count:number}>(),db.prepare('SELECT 1 AS found FROM marks WHERE visitor_key = ?').bind(visitorKey).first<{found:number}>()]);return {count:total?.count??0,marked:!!mark}}

export async function guestbook(request:Request,env:Env):Promise<Response>{
  if(!['GET','POST'].includes(request.method))return new Response(null,{status:405,headers:{Allow:'GET, POST'}});
  if(!env.DB||!env.COOKIE_SECRET||env.COOKIE_SECRET.length<32)return json({error:'The live guestbook is not configured yet.'},503);
  if(request.method==='POST'&&request.headers.get('Origin')!==new URL(request.url).origin)return json({error:'This request must come from this portfolio.'},403);
  try{
    const visitor=await identity(request,env.COOKIE_SECRET),visitorKey=await signature('visitor:'+visitor.id,env.COOKIE_SECRET);
    const current=await state(env.DB,visitorKey);
    if(request.method==='GET'||current.marked)return json(current,200,visitor.newCookie);
    const now=Math.floor(Date.now()/1000),window=Math.floor(now/600);
    // Store only a short-lived keyed hash for abuse control, never a raw IP address.
    const bucket=await signature('rate:'+(request.headers.get('CF-Connecting-IP')||'local')+':'+window,env.COOKIE_SECRET);
    const limit=await env.DB.prepare('INSERT INTO rate_limits (bucket_key, requests, expires_at) VALUES (?, 1, ?) ON CONFLICT(bucket_key) DO UPDATE SET requests = requests + 1 RETURNING requests').bind(bucket,(window+1)*600).first<{requests:number}>();
    if((limit?.requests??11)>10)return json({error:'Too many marks from this connection. Please try again in a few minutes.'},429,visitor.newCookie);
    await env.DB.batch([env.DB.prepare('INSERT OR IGNORE INTO marks (visitor_key) VALUES (?)').bind(visitorKey),env.DB.prepare('DELETE FROM rate_limits WHERE expires_at < ?').bind(now)]);
    return json(await state(env.DB,visitorKey),200,visitor.newCookie);
  }catch{ return json({error:'The live guestbook is temporarily unavailable. Please try again.'},503) }
}

export default {
  async fetch(request:Request,env:Env):Promise<Response>{
    const url=new URL(request.url);
    if(url.hostname==='www.keshavmarkan.com'){url.hostname='keshavmarkan.com';url.protocol='https:';return Response.redirect(url.toString(),308)}
    const path=url.pathname;
    if(path==='/.well-known/ard.json'||path==='/.well-known/ai-catalog.json')return new Response('Not found',{status:404,headers:{'Content-Type':'text/plain; charset=utf-8'}});
    if(path==='/api/guestbook')return guestbook(request,env);
    if(path.startsWith('/api/'))return json({error:'Not found'},404);
    return env.ASSETS.fetch(request as unknown as Parameters<Fetcher['fetch']>[0]) as unknown as Promise<Response>;
  }
};

