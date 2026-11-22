import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createSpriteCache} from '../dist/drag-only/sprite-cache.mjs';
test('decoded vehicle cache coalesces pending loads and evicts least recently used vehicles',async()=>{
  const read=createSpriteCache(2);
  let calls=0;
  const load=()=>++calls;
  const first=read('a',load);
  assert.equal(first,read('a',load));
  assert.equal(await first,1);
  assert.equal(await read('b',load),2);
  assert.equal(await read('a',load),1);
  assert.equal(await read('c',load),3);
  assert.equal(await read('b',load),4);
});
test('failed loads can retry and outdated errors do not evict a newer entry',async()=>{
  const read=createSpriteCache(1);
  let fail;
  const old=read('a',()=>new Promise((_,reject)=>{fail=reject;}));
  await Promise.resolve();
  await read('b',()=>0);
  const updated=read('a',()=>1);
  fail(new Error('decode failed'));
  await assert.rejects(old);
  assert.equal(await updated,1);
  assert.equal(read('a',()=>2),updated);
  await assert.rejects(read('broken',()=>{throw Error('decode failed');}));
  assert.equal(await read('broken',()=>3),3);
});
