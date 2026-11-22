import assert from 'node:assert/strict';
import test from 'node:test';
import {bench,morph,project,bounds,invert,snapMetric} from '../dist/drag-only/bench-geometry.mjs';
import {SPRITES as source} from '../dist/drag-only/sprites.mjs';
const parts=Object.values(source).map((p,i)=>({...p,pick:i===0?[1120,756]:p.pick}));
const sizes=[[1920,1080],[1363,936],[1024,768],[768,1024],[390,844],[844,390],[2560,1080],[360,320]];
test('all three bay parts fit, and the unchanged installed art fits inside the stage',()=>{
  function check(p,q,r){
    const [u,v,w,h]=bounds(p,q.a),t=1e-6;
    assert.ok(q.x+q.s*u>=r.x-t&&q.y+q.s*v>=r.y-t);
    assert.ok(q.x+q.s*(u+w)<=r.x+r.w+t&&q.y+q.s*(v+h)<=r.y+r.h+t);
  }
  for(const [w,h] of sizes){
    const layout=bench(w,h,parts);
    parts.forEach((p,i)=>{
      check(p,layout.home[i],layout.cards[i]);
      check(p,{...layout.seat,a:p.installAngle||0},layout.stage);
    });
  }
});
test('drag keeps the original grab point, grows smoothly and only fitting poses can snap',()=>{
  for(const [w,h] of sizes){
    const layout=bench(w,h,parts);
    parts.forEach((p,i)=>{
      const q=layout.home[i],initial=project(p,q,p.pick),grip=invert(p,q,initial);
      const s={...layout.seat,a:p.installAngle||0},target=project(p,s,grip);
      const settled=morph(p,layout,target,grip);
      assert.ok(settled.s>q.s&&Math.abs(settled.s-s.s)<1e-7&&snapMetric(p,settled,s)<1e-7);
      const mid=[initial[0]+12,layout.cards[i].y],g=morph(p,layout,mid,grip);
      assert.ok(g.s>q.s&&g.s<settled.s);
      const [u,v]=project(p,g,grip);
      assert.ok(Math.hypot(u-mid[0],v-mid[1])<1e-7);
      assert.ok(snapMetric(p,morph(p,layout,[target[0]+w*.35,target[1]],grip),s)>1);
    });
  }
});

test('assembly area starts near the top without reserved toolbar space',()=>{
  for(const [w,h] of sizes)assert.ok(bench(w,h,parts).stage.y<=24);
});

test('moving the mounted crawler moves both true mechanical joints by the same amount',async()=>{
  const {dockTo}=await import('../dist/drag-only/bench-geometry.mjs');
  const {JOINTS}=await import('../dist/drag-only/sprites.mjs');
  const [chassis,body,arm]=parts;
  const q={x:120,y:120,s:.6,a:0};
  const verify=(p)=> {
    const b=dockTo(chassis,p,JOINTS.slew,body);
    const a=dockTo(body,b,JOINTS.boom,arm);
    assert.deepEqual(project(body,b,body.pivot),project(chassis,p,JOINTS.slew));
    assert.deepEqual(project(arm,a,arm.pivot),project(body,b,JOINTS.boom));
    assert.equal(b.s,p.s);assert.equal(a.s,p.s);
    return [project(body,b,body.pivot),project(arm,a,arm.pivot)];
  };
  const left=verify(q),right=verify({...q,x:q.x+150,y:q.y+55});
  right.forEach((p,i)=>{assert.ok(Math.abs(p[0]-left[i][0]-150)<1e-9);assert.ok(Math.abs(p[1]-left[i][1]-55)<1e-9);});
});

test('any of the six installation orders yields the same mechanical assembly',async()=>{
  const {registerFrom}=await import('../dist/drag-only/bench-geometry.mjs');
  const {JOINTS}=await import('../dist/drag-only/sprites.mjs');
  const pins=[null,JOINTS.slew,JOINTS.boom];
  const orders=[[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]];
  for(const [x,y] of [[77,105],[-102,205],[220,-15]])for(const order of orders){
    const expected=parts.map(p=>({x,y,s:.63,a:p.installAngle||0}));
    let i=order[0],pose=expected[i];
    for(const j of order.slice(1)){
      pose=registerFrom(parts,pins,i,pose,j);
      for(const field of ['x','y','s','a'])assert.ok(Math.abs(pose[field]-expected[j][field])<1e-9,order.join(''));
      i=j;
    }
  }
});

const fixture=(count)=>Array.from({length:count},(_,i)=>({
  id:'p'+i,offset:[-140+i*225,-45-i*10],pivot:[i*225,0],
  pick:[35+i*225,42],silhouette:[-140+i*225,-45-i*10,292,132+i*17],installAngle:(i-1)*.045
}));
const fixtureJoints=(count)=>Array.from({length:count},(_,i)=>i?[i*225-23,i*11-35]:null);
const permutations=values=>values.length<2?[values]:values.flatMap((first,i)=>permutations(values.filter((_,j)=>j!==i)).map(t=>[first,...t]));
function within(p,q,rect) {
  const [x,y,w,h]=bounds(p,q.a),e=1e-6;
  assert.ok(q.x+x*q.s>=rect.x-e && q.x+(x+w)*q.s<=rect.x+rect.w+e);
  assert.ok(q.y+y*q.s>=rect.y-e && q.y+(y+h)*q.s<=rect.y+rect.h+e);
}
test('two and four complete trays preserve grip and fit every size; old 3-column widths unchanged',()=>{
  for(const [w,h] of sizes){
    const legacy=bench(w,h,parts),gap=legacy.cards[1].x-legacy.cards[0].x-legacy.cards[0].w;
    assert.ok(Math.abs(legacy.cards[0].w-(legacy.stage.w-2*gap)/3)<1e-9);
    for(const n of [2,4]){
      const ps=fixture(n),layout=bench(w,h,ps,5);
      assert.equal(layout.cards.length,n);
      assert.equal(layout.home.length,n);
      assert.ok(Math.abs(layout.cards[n-1].x+layout.cards[n-1].w-(layout.stage.x+layout.stage.w))<1e-8);
      ps.forEach((p,i)=>{
        within(p,layout.home[i],layout.cards[i]);
        const q={...layout.seat,a:p.installAngle};
        within(p,q,layout.stage);
        const pick=project(p,layout.home[i],p.pick), grip=invert(p,layout.home[i],pick);
        const target=project(p,q,grip),m=morph(p,layout,target,grip);
        const t=project(p,m,grip);
        assert.ok(Math.hypot(t[0]-target[0],t[1]-target[1])<1e-8);
        assert.ok(Math.abs(m.s-q.s)<1e-8);
        assert.ok(snapMetric(p,m,q)<1e-8);
      });
    }
  }
});

test('every 2- and 4-piece order preserves the joint chain after fitting and moving from any anchor',async()=>{
  const {fitRegisteredAssembly,registerFrom}=await import('../dist/drag-only/bench-geometry.mjs');
  for(const n of [2,4]){
    const ps=fixture(n),joints=fixtureJoints(n),orders=permutations(ps.map((_,i)=>i));
    assert.equal(orders.length,n===2?2:24);
    for(const [w,h] of sizes)for(const order of orders)for(const [x,y] of [[-10000,10000],[10000,-10000]]){
      const first=order[0],layout=bench(w,h,ps);
      const initial={x,y,s:layout.seat.s*.94,a:ps[first].installAngle};
      const fitted=fitRegisteredAssembly(ps,joints,first,initial,layout.stage);
      let i=first,q=fitted;
      for(const j of order){
        q=registerFrom(ps,joints,i,q,j);i=j;
        const direct=registerFrom(ps,joints,first,fitted,j);
        for(const field of ['x','y','s','a'])assert.ok(Math.abs(q[field]-direct[field])<1e-8);
        within(ps[j],q,layout.stage);
      }
    }
  }
});

test('foreground redraw is disabled until both nominated parts have mounted without rotation',async()=>{
  const {installedForeground}=await import('../dist/drag-only/bench-geometry.mjs');
  const p={id:'lower',phase:'mounted',pose:{x:110,y:85,s:.5,a:0},offset:[-54,-205]};
  const bed={id:'bed',phase:'mounted',pose:{x:110,y:85,s:.5,a:0},offset:[-120,-193]};
  const rule={part:'lower',with:'bed',maxX:551};
  assert.deepEqual(installedForeground([p,bed],rule),{part:p,maxX:551});
  assert.deepEqual(installedForeground([bed,p],rule),{part:p,maxX:551});
  assert.equal(installedForeground([p,bed]),null);
  assert.equal(installedForeground([p,{...bed,phase:'snapping'}],rule),null);
  assert.equal(installedForeground([p,{...bed,pose:{...bed.pose,a:.01}}],rule),null);
  assert.equal(installedForeground([{...p,offset:[551,0]},bed],rule),null);
  assert.equal(installedForeground([p],rule),null);
});
