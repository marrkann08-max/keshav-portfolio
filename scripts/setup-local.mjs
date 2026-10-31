import {existsSync,writeFileSync,mkdirSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';

if(!existsSync('.dev.vars'))writeFileSync('.dev.vars','COOKIE_SECRET='+randomBytes(32).toString('hex')+'\n');
mkdirSync('.wrangler/local-config',{recursive:true});
const result=spawnSync(process.execPath,[resolve('node_modules/wrangler/bin/wrangler.js'),'d1','migrations','apply','portfolio-guestbook','--local'],{stdio:['ignore','inherit','inherit'],env:{...process.env,WRANGLER_SEND_METRICS:'false',WRANGLER_LOG_PATH:resolve('.wrangler/logs'),XDG_CONFIG_HOME:resolve('.wrangler/local-config')}});
process.exitCode=result.status??1;
