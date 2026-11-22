import {turn} from './dock-motion.mjs?v=17';
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const project=(p,q,xy)=>{
  const [u,v]=turn(xy,p.pivot,q.a);
  return [q.x+q.s*u,q.y+q.s*v];
};
export const invert=(p,q,[x,y])=>turn([(x-q.x)/q.s,(y-q.y)/q.s],p.pivot,-q.a);
export function gripPose(p,[x,y],grip,s,a){
  const [u,v]=turn(grip,p.pivot,a);
  return {x:x-u*s,y:y-v*s,s,a};
}
export function bounds(p,a=0){
  const [x,y,w,h]=p.silhouette;
  if(!a)return [x,y,w,h];
  const pts=(p.outline||[[x,y],[x+w,y],[x,y+h],[x+w,y+h]]).map(pt=>turn(pt,p.pivot,a));
  const xx=pts.map(pt=>pt[0]),yy=pts.map(pt=>pt[1]);
  return [Math.min(...xx),Math.min(...yy),Math.max(...xx)-Math.min(...xx),Math.max(...yy)-Math.min(...yy)];
}
export function bench(w,h,parts,safeBottom=0){
  const pad=clamp(w*.036,12,56),gap=clamp(w*.013,7,21),top=clamp(h*.024,10,24);
  const trayH=clamp(h*.215,71,208),footer=clamp(h*.024,10,24)+safeBottom,trayTop=h-footer-trayH;
  const stage={x:pad,y:top,w:w-2*pad,h:trayTop-top-gap};
  const ww=(stage.w-gap*(parts.length-1))/parts.length;
  const cards=parts.map((p,i)=>({x:pad+i*(ww+gap),y:trayTop,w:ww,h:trayH}));
  const bb=parts.map(p=>bounds(p,p.installAngle||0));
  const l=Math.min(...bb.map(t=>t[0])),t=Math.min(...bb.map(t=>t[1]));
  const r=Math.max(...bb.map(t=>t[0]+t[2])),b=Math.max(...bb.map(t=>t[1]+t[3]));
  const s=Math.min(stage.w*.93/(r-l),stage.h*.83/(b-t));
  const tray= Math.min(s*.78,...parts.map(p=>{const o=bounds(p);return Math.min(ww*.86/o[2],trayH*.75/o[3]);}));
  const seat={x:stage.x+stage.w*.5-(r+l)*.5*s,y:stage.y+stage.h*.535-(b+t)*.5*s,s};
  const trayScales=new Map(parts.filter(p=>p.ownTrayScale).map(p=>{
    const [,,pw,ph]=bounds(p);
    return [p.id,Math.min(s*.9,ww*.86/pw,trayH*.75/ph)];
  }));
  const home=parts.map((p,i)=>{
    const [x,y,bw,bh]=bounds(p),box=cards[i],size=trayScales.get(p.id)??tray;
    return {x:box.x+box.w*.5-(x+bw*.5)*size,y:box.y+box.h*.5-(y+bh*.5)*size,a:0,s:size};
  });
  return {stage,cards,seat,home,tray,trayScales,homeFor:new Map(parts.map((p,i)=>[p.id,home[i]]))};
}
export function morph(p,layout,[x,y],grip){
  const gate=layout.cards[0].y;
  const end=layout.stage.y+layout.stage.h,home=layout.homeFor?.get(p.id);
  const start=Math.max(end+1,Math.min(gate+layout.cards[0].h*.28,home?project(p,home,grip)[1]:Infinity));
  const v=clamp((start-y)/(start-end),0,1);
  const m=v*v*(3-2*v),size=layout.trayScales?.get(p.id)??layout.tray;
  return gripPose(p,[x,y],grip,size+(layout.seat.s-size)*m,(p.installAngle||0)*m);
}
export function snapMetric(p,pose,seat){
  const [x,y]=project(p,pose,p.pivot),[u,v]=project(p,seat,p.pivot);
  return Math.hypot((x-u)/clamp(seat.s*65,16,55),(y-v)/clamp(seat.s*50,15,43));
}

export function dockTo(parent,parentPose,joint,child,targetJoint=child.pivot,relative=(child.installAngle||0)){
  const pin=project(parent,parentPose,joint);
  return gripPose(child,pin,targetJoint,parentPose.s,parentPose.a+relative);
}

// Walk the registered mechanical links in either direction. If a middle part
// is missing, its calculated pose is still available to locate the next joint.
export function registerFrom(parts,joints,anchorIndex,pose,targetIndex){
  const step=Math.sign(targetIndex-anchorIndex);
  for(let i=anchorIndex;i!==targetIndex;i+=step){
    const j=i+step,source=parts[i],dest=parts[j],pin=joints[Math.max(i,j)];
    const turn=(dest.installAngle||0)-(source.installAngle||0);
    pose=dockTo(source,pose,pin,dest,pin,turn);
  }
  return pose;
}

export function fitRegisteredAssembly(parts,joints,index,pose,stage,margin=8){
  const extents=parts.map((part,i)=>{
    const q=registerFrom(parts,joints,index,pose,i);
    const [x,y,w,h]=bounds(part,q.a);
    const left=q.x-pose.x+x*q.s,top=q.y-pose.y+y*q.s;
    return [left,top,left+w*q.s,top+h*q.s];
  });
  for(let i=1;i<parts.length;i++){
    const adjacent=registerFrom(parts,joints,index,pose,i-1);
    const [x,y]=project(parts[i-1],adjacent,joints[i]);
    extents.push([x-pose.x,y-pose.y,x-pose.x,y-pose.y]);
  }
  const left=Math.min(...extents.map(b=>b[0])),top=Math.min(...extents.map(b=>b[1]));
  const right=Math.max(...extents.map(b=>b[2])),bottom=Math.max(...extents.map(b=>b[3]));
  const axis=(value,lo,hi)=>lo<=hi?clamp(value,lo,hi):(lo+hi)*.5;
  return {...pose,
    x:axis(pose.x,stage.x+margin-left,stage.x+stage.w-margin-right),
    y:axis(pose.y,stage.y+margin-top,stage.y+stage.h-margin-bottom)};
}

export function installedForeground(parts,rule){
  if(!rule||rule.part===rule.with||!Number.isFinite(rule.maxX))return null;
  const valid=id=>parts.find(p=>p.id===id&&p.phase==='mounted'&&Math.abs(p.pose?.a)<=1e-9);
  const part=valid(rule.part),mate=valid(rule.with);
  if(!part||!mate||rule.maxX<=part.offset[0])return null;
  return {part,maxX:rule.maxX};
}
