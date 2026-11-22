// Run once after every pack for the release has passed its visual review.
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
const ids=process.argv.slice(2);
if(ids.length!==30||new Set(ids).size!==ids.length||ids.some(x=>!/^([a-z][a-z0-9-]*)$/.test(x)))throw Error('Expected 30 unique pack IDs');
const file='dist/drag-only/vehicles.mjs',catalog=readFileSync(file,'utf8');
if(catalog.includes('fleet-v51.mjs'))throw Error('Release catalog already registered');
for(const id of ids){
  if(!existsSync(resolve('dist/drag-only',id,'config.mjs'))||catalog.includes("'"+id+"'"))throw Error('Missing or duplicate pack '+id);
}
const out='dist/drag-only/fleet-v51.mjs';
writeFileSync(out,ids.map((id,i)=>"import v"+i+" from './"+id+"/config.mjs?v=51';").join('\n')+'\nexport default ['+ids.map((_,i)=>'v'+i).join(',')+'];\n');
writeFileSync(file,"import batch51 from './fleet-v51.mjs?v=51';\n"+catalog.replace(/\n\];\s*$/,'\n  ...batch51,\n];\n'));
for(const x of ['dist/index.html','dist/drag-only/bench.mjs']){
  const old=readFileSync(x,'utf8');
  const dep=x.endsWith('.html')?'bench':'vehicles';
  if(!old.includes(dep+'.mjs?v=50'))throw Error('Unexpected prior version for '+x);
  writeFileSync(x,old.replace(dep+'.mjs?v=50',dep+'.mjs?v=51'));
}
