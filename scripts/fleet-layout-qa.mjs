// Geometry QA for exactly the new release's packs; no effect on the app.
import {VEHICLES} from '../dist/drag-only/vehicles.mjs';
import {strict as check} from 'node:assert';
import {bench,bounds,registerFrom,project,fitRegisteredAssembly,morph} from '../dist/drag-only/bench-geometry.mjs';
const expected=Number(process.argv[2]||30);
const release=Number(process.argv[3]||51);
const fleet=VEHICLES.filter(v=>v.assetVersion===release);
check.equal(fleet.length,expected);
check.equal(new Set(VEHICLES.map(v=>v.id)).size,VEHICLES.length);
function within(v,a,b){return v>=a-1e-7&&v<=b+1e-7;}
let samples=0;
for(const m of fleet)for(const [width,height] of [[1920,1080],[1366,768],[1080,810],[1024,768],[768,1024],[844,390],[390,844],[360,320]]){
  const loose=[...m.parts].sort((p,q)=>p.slot-q.slot);
  const l=bench(width,height,loose);
  for(let i=0;i<loose.length;i++){
    const p=loose[i],q=l.home[i],card=l.cards[i],b=bounds(p);
    check.ok(within(q.x+b[0]*q.s,card.x,card.x+card.w)&&within(q.x+(b[0]+b[2])*q.s,card.x,card.x+card.w),m.id+': tray-x');
    check.ok(within(q.y+b[1]*q.s,card.y,card.y+card.h)&&within(q.y+(b[1]+b[3])*q.s,card.y,card.y+card.h),m.id+': tray-y');
    const pick=project(p,q,p.pick);
    check.ok(within(pick[0],card.x,card.x+card.w)&&within(pick[1],card.y,card.y+card.h),m.id+': tray pick');
    check.ok(Math.abs(morph(p,l,pick,p.pick).s-q.s)<1e-7,m.id+': drag starts at natural scale');
  }
  for(let start=0;start<m.parts.length;start++)for(const [x,y] of [[1e4,1e4],[-1e4,-1e4]]){
    const anchor=fitRegisteredAssembly(m.parts,m.joints,start,{...l.seat,x,y,a:0},l.stage),s=anchor.s;
    for(let i=0;i<m.parts.length;i++){
      const p=m.parts[i],[x,y,w,h]=bounds(p);
      const q=registerFrom(m.parts,m.joints,start,anchor,i);
      check.ok(within(q.x+x*s,l.stage.x,l.stage.x+l.stage.w)&&within(q.x+(x+w)*s,l.stage.x,l.stage.x+l.stage.w),m.id+': stage-x');
      check.ok(within(q.y+y*s,l.stage.y,l.stage.y+l.stage.h)&&within(q.y+(y+h)*s,l.stage.y,l.stage.y+l.stage.h),m.id+': stage-y');
      check.ok(Math.hypot(anchor.x-q.x,anchor.y-q.y)<1e-7,m.id+': incorrect registered offset');
    }
    samples++;
  }
}
console.log('Validated '+fleet.length+' vehicles and '+samples+' edge fits, including phone and tablet layouts.');
