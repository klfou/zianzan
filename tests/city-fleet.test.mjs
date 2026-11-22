import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {VEHICLES} from '../dist/drag-only/vehicles.mjs';
import {project, registerFrom, snapMetric} from '../dist/drag-only/bench-geometry.mjs';

test('city expansion appends exactly 30 unique documented vehicles without replacing the previous fleet',()=>{
  const expected=readFileSync(new URL('../scripts/city-fleet-v52.txt',import.meta.url),'utf8').trim().split(/\s+/);
  assert.equal(VEHICLES.length,79);
  assert.equal(VEHICLES[48].id,'aerial-ladder-truck');
  assert.equal(VEHICLES[78].id,'pumper-fire-engine');
  assert.deepEqual(VEHICLES.slice(49).map(v=>v.id),expected);
  assert.equal(new Set(VEHICLES.map(v=>v.id)).size,79);
  assert.ok(VEHICLES.slice(49).every(v=>v.assetVersion===52&&v.guide.endsWith('?v=52')));
});

test('every new city vehicle registers fitted parts from each possible start, with unchanged proportions',()=>{
  for(const v of VEHICLES.slice(49)){
    assert.ok(v.parts.length>=2&&v.parts.length<=4,v.id);
    const base={x:331.71,y:190.25,s:.36,a:0};
    for (let first=0;first<v.parts.length;first++) {
      for (let second=0;second<v.parts.length;second++){
        const next=registerFrom(v.parts,v.joints,first,base,second);
        const p=v.parts[second];
        assert.ok(snapMetric(p,base,next)<1e-9,v.id+': '+p.id);
        assert.ok(Math.abs(next.s-base.s)<1e-9,v.id+': size changed');
        const at=project(p,next,p.pick);
        assert.ok(at.every(Number.isFinite),v.id+': non-finite grip');
      }
    }
  }
});
