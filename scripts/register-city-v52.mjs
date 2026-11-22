// Registers only the checked V52 game packs. Re-running against V52 is idempotent.
import {readFileSync,writeFileSync} from 'node:fs';
import {strict as check} from 'node:assert';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
const root='dist/drag-only';
const catalogPath=root+'/vehicles.mjs';
const catalog=readFileSync(catalogPath,'utf8');
const ids=readFileSync('scripts/city-fleet-v52.txt','utf8').trim().split(/\s+/);
check.equal(ids.length,30);
check.equal(new Set(ids).size,30);
check.ok(ids.every(k=>/^[a-z][a-z0-9-]*$/.test(k)));
const installed=(await import(pathToFileURL(resolve(catalogPath)))).VEHICLES;
for (const id of ids) {
  const m=(await import(pathToFileURL(resolve(root,id,'config.mjs')))).default;
  check.equal(m.id,id);
  check.equal(m.assetVersion,52);
  check.ok(!installed.some(v=>v.id===id&&v.assetVersion!==52),'Duplicate existing vehicle: '+id);
}
const module='city-fleet-v52.mjs';
const expected=ids.map((id,i)=>"import v"+i+" from './"+id+"/config.mjs?v=52';").join('\n')+'\nexport default ['+ids.map((_,i)=>'v'+i).join(',')+'];\n';
writeFileSync(root+'/'+module,expected);
if(!catalog.includes(module)){
  check.equal(installed.length,49);
  check.ok(catalog.includes('  ...batch51,'));
  writeFileSync(catalogPath,"import batch52 from './"+module+"?v=52';\n"+catalog.replace('  ...batch51,','  ...batch51,\n  ...batch52,'));
}
for(const [file,dep] of [['dist/index.html','bench'],[root+'/bench.mjs','vehicles']]){
  const old=readFileSync(file,'utf8');
  check.ok(old.includes(dep+'.mjs?v=51')||old.includes(dep+'.mjs?v=52'),file);
  if(old.includes(dep+'.mjs?v=51'))writeFileSync(file,old.replace(dep+'.mjs?v=51',dep+'.mjs?v=52'));
}
