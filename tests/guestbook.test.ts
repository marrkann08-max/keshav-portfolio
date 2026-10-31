import {afterAll,beforeAll,beforeEach,describe,expect,it} from 'vitest';
import {Miniflare} from 'miniflare';
import {build} from 'esbuild';
import {readFile,mkdtemp,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {guestbook,type Env} from '../worker/index';

let mf:Miniflare,script:string,statePath:string;
const origin='https://portfolio.test';
const make=()=>new Miniflare({modules:true,script,compatibilityDate:'2026-08-06',d1Databases:{DB:'test-guestbook'},d1Persist:statePath,bindings:{COOKIE_SECRET:'test-secret-at-least-thirty-two-characters-long'}});
const request=(method='GET',cookie='',ip='192.0.2.1',requestOrigin=origin)=>mf.dispatchFetch(origin+'/api/guestbook',{method,headers:{Cookie:cookie,Origin:requestOrigin,'CF-Connecting-IP':ip}});
const cookieOf=(response:Response)=>response.headers.get('Set-Cookie')!.split(';')[0];

beforeAll(async()=>{const bundle=await build({entryPoints:['worker/index.ts'],bundle:true,write:false,format:'esm',platform:'browser'});script=bundle.outputFiles[0].text;statePath=await mkdtemp(join(process.cwd(),'.guestbook-test-'));mf=make();const db=await mf.getD1Database('DB');const sql=await readFile('migrations/0001_guestbook.sql','utf8');for(const statement of sql.split(';').map(s=>s.trim()).filter(Boolean))await db.prepare(statement).run()},30000);
beforeEach(async()=>{const db=await mf.getD1Database('DB');await db.exec('DELETE FROM marks; DELETE FROM rate_limits;')});
afterAll(async()=>{await mf?.dispose();if(statePath)await rm(statePath,{recursive:true,force:true})},30000);

describe('shared guestbook with real local D1',()=>{
 it('returns an honest unavailable response when the database is not configured',async()=>{const response=await guestbook(new Request(origin+'/api/guestbook'),{} as Env);expect(response.status).toBe(503);const body=await response.json() as Record<string,unknown>;expect(body).not.toHaveProperty('count');expect(body).toHaveProperty('error')});
 it('does not count page views and issues a private browser cookie',async()=>{const response=await request();expect(await response.json()).toEqual({count:0,marked:false});expect(response.headers.get('Set-Cookie')).toContain('HttpOnly');expect(response.headers.get('Set-Cookie')).toContain('Secure');expect(response.headers.get('Cache-Control')).toBe('no-store')});
 it('counts two browsers and does not recount repeat clicks or reloads',async()=>{const a=cookieOf(await request()),b=cookieOf(await request());expect(await(await request('POST',a)).json()).toEqual({count:1,marked:true});expect(await(await request('POST',a)).json()).toEqual({count:1,marked:true});expect(await(await request('POST',b)).json()).toEqual({count:2,marked:true});expect(await(await request('GET',a)).json()).toEqual({count:2,marked:true})});
 it('deduplicates concurrent double clicks at the database level',async()=>{const cookie=cookieOf(await request());await Promise.all(Array.from({length:5},()=>request('POST',cookie)));expect(await(await request('GET',cookie)).json()).toEqual({count:1,marked:true})});
 it('rejects cross-origin writes',async()=>{const cookie=cookieOf(await request());expect((await request('POST',cookie,'192.0.2.1','https://elsewhere.test')).status).toBe(403);expect(await(await request()).json()).toEqual({count:0,marked:false})});
 it('limits attempts to create many new browser identities from one connection',async()=>{for(let i=0;i<10;i++){const cookie=cookieOf(await request());expect((await request('POST',cookie)).status).toBe(200)}const cookie=cookieOf(await request());expect((await request('POST',cookie)).status).toBe(429);expect((await request('POST',cookie,'192.0.2.2')).status).toBe(200)});
 it('keeps marks when the Worker restarts',async()=>{const cookie=cookieOf(await request());await request('POST',cookie);await mf.dispose();mf=make();expect(await(await request('GET',cookie)).json()).toEqual({count:1,marked:true})});
 it('does not trust an altered signed cookie',async()=>{const cookie=cookieOf(await request());await request('POST',cookie);const altered=cookie.slice(0,-1)+(cookie.endsWith('0')?'1':'0');const response=await request('GET',altered);expect(await response.json()).toEqual({count:1,marked:false});expect(response.headers.get('Set-Cookie')).toBeTruthy()});
 it('rejects unsupported methods',async()=>{expect((await request('DELETE')).status).toBe(405)});
});
