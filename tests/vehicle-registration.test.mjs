import assert from 'node:assert/strict';
import test from 'node:test';
import {existsSync} from 'node:fs';
import {VEHICLES} from '../dist/drag-only/vehicles.mjs';
import {bench, bounds, registerFrom, project, gripPose, snapMetric, morph, fitRegisteredAssembly} from '../dist/drag-only/bench-geometry.mjs';

test('tipper preserves the three approved sprite positions, matching in any order',()=>{
  const truck=VEHICLES.find(v=>v.id==='tipper');
  assert.deepEqual(Object.fromEntries(truck.parts.map(p=>[p.id,p.offset])),{cab:[2,-215],chassis:[0,0],bed:[426,-190]});
  assert.deepEqual(truck.layers,['chassis','bed','cab']);
  for(const [x,y] of [[81,59],[-120,450],[501,-21]]){
    for(const first of [0,1,2]){
      for(const second of [0,1,2].filter(i=>i!==first)){
        const third=3-first-second;
        let q={x,y,s:.71,a:0};
        q=registerFrom(truck.parts,truck.joints,first,q,second);
        assert.ok(Math.hypot(q.x-x,q.y-y)<1e-9&&q.s===.71&&q.a===0);
        q=registerFrom(truck.parts,truck.joints,second,q,third);
        assert.ok(Math.hypot(q.x-x,q.y-y)<1e-9&&q.s===.71&&q.a===0);
        assert.ok(snapMetric(truck.parts[third],q,{x,y,s:.71,a:0})<1e-9);
        const pick=project(truck.parts[third],q,truck.parts[third].pick);
        assert.ok(snapMetric(truck.parts[third],gripPose(truck.parts[third],[pick[0]+120,pick[1]],truck.parts[third].pick,q.s,0),q)>1);
      }
    }
  }
});
test('all vehicles have distinct guides, fit their stage at desktop and tablet sizes, and have assets',()=>{
  assert.equal(new Set(VEHICLES.map(v=>v.guide)).size,VEHICLES.length);
  const dist=new URL('../dist/drag-only/',import.meta.url);
  for(const model of VEHICLES){
    assert.ok(existsSync(new URL(model.guide,dist)));
    for(const p of model.parts)assert.ok(existsSync(new URL(p.file,dist)));
    for(const [width,height] of [[1920,1080],[1024,768],[768,1024],[390,844],[844,390],[360,320]]){
      const l=bench(width,height,model.parts);
      for(const p of model.parts){
        const [x,y,w,h]=bounds(p,p.installAngle||0),s=l.seat.s;
        assert.ok(l.seat.x+x*s>=l.stage.x&&l.seat.x+(x+w)*s<=l.stage.x+l.stage.w);
        assert.ok(l.seat.y+y*s>=l.stage.y&&l.seat.y+(y+h)*s<=l.stage.y+l.stage.h);
      }
    }
  }
});

test('mixer matches the approved board for all six orders and does not change scale',()=>{
  const truck=VEHICLES.find(v=>v.id==='mixer');
  assert.deepEqual(Object.fromEntries(truck.parts.map(p=>[p.id,p.offset])),{cab:[0,-276],chassis:[0,0],drum:[458,-358]});
  assert.deepEqual(truck.layers,['chassis','drum','cab']);
  assert.deepEqual(truck.parts[2].pivot,[508,80]);
  assert.equal(truck.parts[2].installAngle,-1.7*Math.PI/180);
  for(const [x,y,s] of [[36,88,.62],[-50,120,.73],[200,-90,.32]]){
    const expected=truck.parts.map(p=>({x,y,s,a:p.installAngle||0}));
    for(const first of [0,1,2])for(const second of [0,1,2].filter(i=>i!==first)){
      const third=3-first-second;
      const q=registerFrom(truck.parts,truck.joints,first,expected[first],second);
      const r=registerFrom(truck.parts,truck.joints,second,q,third);
      for(const [i,pose] of [[second,q],[third,r]])for(const k of ['x','y','s','a']){
        assert.ok(Math.abs(pose[k]-expected[i][k])<1e-9);
      }
    }
  }
});

test('roller reproduces the approved revised layout and layer order from every first piece',()=>{
  const model=VEHICLES.find(v=>v.id==='roller');
  assert.deepEqual(Object.fromEntries(model.parts.map(p=>[p.id,p.offset])),{drum:[0,177],rear:[474,0],cab:[485,-180]});
  assert.deepEqual(model.layers,['rear','drum','cab']);
  const want={x:67.5,y:104.9,s:.9,a:0};
  for(const first of [0,1,2]) for(const second of [0,1,2].filter(i=>i!==first)){
    const third=3-first-second;
    const q=registerFrom(model.parts,model.joints,first,want,second);
    const r=registerFrom(model.parts,model.joints,second,q,third);
    for(const pose of [q,r])for(const k of ['x','y','s','a'])assert.ok(Math.abs(pose[k]-want[k])<1e-9);
  }
});

test('loader reproduces the approved mounting points, bucket angle and layers in all six orders',()=>{
  const model=VEHICLES.find(v=>v.id==='loader');
  assert.deepEqual(Object.fromEntries(model.parts.map(p=>[p.id,p.offset])),{cab:[455,-203],chassis:[0,0],bucket:[-252,63]});
  assert.deepEqual(model.layers,['chassis','cab','bucket']);
  assert.deepEqual(model.parts[2].pivot,[422,116]);
  assert.equal(model.parts[2].installAngle,-5*Math.PI/180);
  const expected=model.parts.map(p=>({x:67.5,y:104.9,s:.9,a:p.installAngle||0}));
  for(const first of [0,1,2]) for(const second of [0,1,2].filter(i=>i!==first)){
    const third=3-first-second;
    const q=registerFrom(model.parts,model.joints,first,expected[first],second);
    const r=registerFrom(model.parts,model.joints,second,q,third);
    for(const [i,pose] of [[second,q],[third,r]])for(const k of ['x','y','s','a']){
      assert.ok(Math.abs(pose[k]-expected[i][k])<1e-9);
    }
  }
});

test('released catalog preserves the original nineteen vehicles in order',()=>{
  assert.deepEqual(VEHICLES.slice(0,19).map(v=>v.id),['excavator','tipper','mixer','roller','loader','dozer','mobile-crane','scissor-truck','paver','tbm','harvester','grader','drill-jumbo','mining-truck','tower-crane','crawler-crane','concrete-pump','wheeled-excavator','reach-stacker']);
});
test('new vehicles preserve the review-board fit from all starting pieces',()=>{
  for(const [id,layers,offsets] of [
    ['dozer',['chassis','cab','blade'],{chassis:[0,0],cab:[525,-223],blade:[-421,274]}],
    ['mobile-crane',['carrier','boom','turntable'],{carrier:[0,0],boom:[-225,-159],turntable:[556,-158]}],
    ['scissor-truck',['chassis','scissor','platform'],{chassis:[0,0],scissor:[921,-145],platform:[696,-599]}],
    ['paver',['chassis','screed','cab'],{chassis:[0,0],screed:[754,260],cab:[649,-64]}],
    ['tbm',['gantry','shield','cutter'],{cutter:[0,0],shield:[42,0],gantry:[602,137]}],
    ['harvester',['chassis','cab','boom'],{chassis:[0,0],cab:[219,-502],boom:[-445,-599]}],
    ['grader',['chassis','cab','front'],{front:[-37,193],chassis:[0,0],cab:[767,-280]}],
    ['drill-jumbo',['chassis','cab','booms'],{booms:[-929,-75],chassis:[0,0],cab:[62,-249]}],
    ['tower-crane',['base','mast','top'],{base:[749,871],mast:[1041,183],top:[0,0]}],
    ['crawler-crane',['chassis','cab','boom'],{chassis:[0,0],cab:[191,-377],boom:[-419,-608]}],
    ['concrete-pump',['carrier','pump','boom'],{carrier:[0,0],pump:[441,45],boom:[477,-66]}],
    ['wheeled-excavator',['chassis','upper','arm'],{chassis:[0,0],upper:[253,-310],arm:[-479,-392]}],
    ['reach-stacker',['chassis','container','boom-spreader'],{chassis:[0,0],'boom-spreader':[-677,-267],container:[-665.882505,-38.55674]}],
  ]){
    const model=VEHICLES.find(v=>v.id===id);
    assert.deepEqual(model.layers,layers);
    assert.deepEqual(Object.fromEntries(model.parts.map(p=>[p.id,p.offset])),offsets);
    const expected=model.parts.map(p=>({x:75,y:105,s:.7,a:p.installAngle||0}));
    for(const first of [0,1,2])for(const second of [0,1,2].filter(i=>i!==first)){
      const third=3-first-second;
      const q=registerFrom(model.parts,model.joints,first,expected[first],second);
      const r=registerFrom(model.parts,model.joints,second,q,third);
      for(const [i,pose] of [[second,q],[third,r]])for(const k of ['x','y','s','a']){
        assert.ok(Math.abs(pose[k]-expected[i][k])<1e-9);
      }
    }
  }
});

test('the revised crane keeps the enlarged carrier and accurate pin positions',()=>{
  const m=VEHICLES.find(v=>v.id==='mobile-crane');
  assert.deepEqual(m.parts.find(p=>p.id==='carrier').silhouette,[1,1,1047,332]);
  assert.deepEqual(m.joints,[null,[746,118],[913,-57]]);
  assert.equal(m.parts.find(p=>p.id==='boom').installAngle,2.5*Math.PI/180);
});

test('mining truck has two parts and matches the approved seated bed from either starting piece',()=>{
  const model=VEHICLES.find(v=>v.id==='mining-truck');
  assert.deepEqual(model.layers,['lower','bed']);
  assert.deepEqual(model.joints,[null,[940,25]]);
  assert.deepEqual(model.foreground,{part:'lower',with:'bed',maxX:551});
  assert.deepEqual(model.parts.map(p=>p.offset),[[-54,-205],[-158,-250]]);
  for(const [x,y,s] of [[21,86,.66],[-55,180,.43]]){
    for(const first of [0,1]){
      const ref={x,y,s,a:0}, second=1-first;
      const got=registerFrom(model.parts,model.joints,first,ref,second);
      for(const k of ['x','y','s','a'])assert.ok(Math.abs(got[k]-ref[k])<1e-9);
    }
  }
});

test('tower crane uses larger independent tray pieces and fits the whole assembled silhouette',()=>{
  const m=VEHICLES.find(v=>v.id==='tower-crane');
  assert.deepEqual(m.joints,[null,[1101,932],[1076,198]]);
  assert.equal(m.fitWholeAssembly,true);
  for(const [w,h] of [[1920,1080],[1024,768],[768,1024],[390,844],[844,390]]){
    const l=bench(w,h,m.parts);
    for(const [i,p] of m.parts.entries()){
      const box=l.cards[i],home=l.home[i],[x,y,pw,ph]=p.silhouette;
      assert.ok(home.x+x*home.s>=box.x&&home.x+(x+pw)*home.s<=box.x+box.w);
      assert.ok(home.y+y*home.s>=box.y&&home.y+(y+ph)*home.s<=box.y+box.h);
      const grab=project(p,home,p.pick);
      assert.ok(Math.abs(morph(p,l,grab,p.pick).s-home.s)<1e-10);
      if(p.id==='base')assert.ok(home.s>l.tray);
      const q=fitRegisteredAssembly(m.parts,m.joints,i,{...l.seat,x:1e5,y:1e5,a:0},l.stage);
      for(const [j,part] of m.parts.entries()){
        const k=registerFrom(m.parts,m.joints,i,q,j),[u,v,bw,bh]=part.silhouette;
        assert.ok(k.x+u*k.s>=l.stage.x-1e-8&&k.x+(u+bw)*k.s<=l.stage.x+l.stage.w+1e-8,JSON.stringify({w,h,i,j,k,u,v,bw,bh,q,stage:l.stage}));
        assert.ok(k.y+v*k.s>=l.stage.y-1e-8&&k.y+(v+bh)*k.s<=l.stage.y+l.stage.h+1e-8);
      }
    }
  }
});

test('wheeled excavator matches the approved rigid arm pose and exact pin locations',()=>{
  const m=VEHICLES.find(v=>v.id==='wheeled-excavator');
  assert.deepEqual(m.joints,[null,[541,28],[298,-77]]);
  assert.equal(m.parts[2].installAngle,-27.5*Math.PI/180);
  assert.equal(m.fitWholeAssembly,true);
});

test('reach stacker treats the arm and spreader as one part, securing the separate container',()=>{
  const m=VEHICLES.find(v=>v.id==='reach-stacker');
  assert.deepEqual(m.parts.map(p=>p.id),['chassis','boom-spreader','container']);
  assert.deepEqual(m.joints,[null,[677,177],[-260,-19]]);
  for(const [w,h] of [[1920,1080],[1024,768],[390,844]]){
    const l=bench(w,h,m.parts);
    for(const [i,p] of m.parts.entries()){
      const box=l.cards[i],home=l.home[i],[x,y,pw,ph]=p.silhouette;
      assert.ok(home.x+x*home.s>=box.x&&home.x+(x+pw)*home.s<=box.x+box.w);
      assert.ok(home.y+y*home.s>=box.y&&home.y+(y+ph)*home.s<=box.y+box.h);
    }
  }
});
