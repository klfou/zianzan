import {VEHICLES} from './vehicles.mjs?v=52';
import {bench,bounds,clamp,project,invert,morph,snapMetric,gripPose,registerFrom,fitRegisteredAssembly,installedForeground} from './bench-geometry.mjs?v=51';
import {createSpriteCache} from './sprite-cache.mjs?v=51';
const $=id=>document.getElementById(id);
const canvas=$('yard'),ctx=canvas.getContext('2d',{alpha:true}),status=$('status');
const menu=$('bench-controls'),showGuide=$('show-guide'),replay=$('replay'),prevRound=$('prev-round'),nextRound=$('next-round'),
  guide=$('guide'),closeGuide=$('close-guide'),guidePicture=$('guide-picture'),guideError=$('guide-error');
let round=1,vehicleIndex=0,trayRotation=0,vehicle=VEHICLES[0],parts=[],loading=false;
const spriteCache=createSpriteCache(4);
const error=$('error');
function getSprites(model){
  return spriteCache(model.id,async()=>{
    const pending=model.parts.map(({file})=>{
      const image=new Image();
      image.src=new URL(file+'?v='+(model.assetVersion??(model.id==='excavator'?17:29)),import.meta.url).href;
      return image;
    });
    await Promise.all(pending.map(image=>load({image})));
    const surface=document.createElement('canvas'),draw=surface.getContext('2d',{willReadFrequently:true});
    return pending.map(image=>{
      surface.width=image.naturalWidth;surface.height=image.naturalHeight;
      draw.drawImage(image,0,0);
      const rgba=draw.getImageData(0,0,surface.width,surface.height).data,alpha=new Uint8Array(surface.width*surface.height);
      for(let i=0;i<alpha.length;i++)alpha[i]=rgba[4*i+3];
      return {image,alpha};
    });
  });
}
function activate(model,sprites){
  vehicle=model;
  parts=model.parts.map((p,i)=>({...p,...sprites[i],i,phase:'loose',z:i}));
  canvas.dataset.vehicle=model.id;
  canvas.dataset.mode=({2:'two-piece-bench',3:'three-piece-bench',4:'four-piece-bench'})[parts.length]||'multi-piece-bench';
  canvas.dataset.pieces=String(parts.length);
  $('stage').setAttribute('aria-label',model.name+'拼装');
  guidePicture.removeAttribute('src');
  guidePicture.alt=model.guideAlt;
  guideError.hidden=true;
  layout=null;
  ready=true;
  resize();reset();menu.hidden=false;
  // Paint the new round in the same task as the switch, after all art has decoded.
  if(frame)cancelAnimationFrame(frame);
  draw(performance.now());
}
const proof=new URLSearchParams(location.search).has('qa')?Object.assign(document.createElement('output'),{id:'drag-proof',hidden:true}):null;
if(proof)document.body.append(proof);
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let ready=false,layout,w,h,frame=0,drag=null,keyboard=null,z=2,installedRank=0;
const mounted=()=>parts.filter(p=>p.phase==='mounted').length;
const mostRecent=()=>parts.reduce((a,p)=>p.phase==='mounted'&&(!a||p.rank>a.rank)?p:a,null);
const register=(anchor,pose,p)=>registerFrom(parts,vehicle.joints,anchor.i,pose,p.i);
const seat=p=>{
  if(p.phase==='mounted')return p.pose;
  const anchor=mostRecent();
  return anchor?register(anchor,anchor.pose,p):null;
};
const freeToInstall=()=>!parts.some(p=>p.phase==='snapping');
const nominal=p=>({...layout.seat,a:p.installAngle||0});
const slot=p=>((p.slot??p.i)+trayRotation)%parts.length;
const trayCard=p=>layout.cards[slot(p)];
const home=p=>layout.home[slot(p)];
function inside([x,y],r){return x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h;}
function announce(t){status.textContent=t;}
function update(){
  const count=mounted();canvas.dataset.installed=String(count);canvas.dataset.round=String(round);
  prevRound.disabled=nextRound.disabled=showGuide.disabled=loading;
  nextRound.classList.toggle('is-complete',count===parts.length);
  replay.disabled=loading;
}
function load(p){return p.image.decode?p.image.decode():new Promise((ok,no)=>{if(p.image.complete&&p.image.naturalWidth)return ok();p.image.onload=ok;p.image.onerror=no;});}
function invalidate(){if(!frame)frame=requestAnimationFrame(draw);}
function resize(){
  const rect=canvas.getBoundingClientRect(),old=layout,ow=w,oh=h;
  [w,h]=[rect.width,rect.height];if(!w||!h)return;
  if(drag)cancel();
  const placed=parts.filter(p=>p.phase==='mounted'||p.motion?.install).sort((a,b)=>a.rank-b.rank)[0];
  const previous=old&&placed?project(placed,placed.motion?.to||placed.pose,placed.pivot):null;
  const dpr=Math.max(.6,Math.min(2,devicePixelRatio||1,Math.sqrt(3600000/(w*h))));
  canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
  layout=bench(w,h,parts.slice().sort((a,b)=>slot(a)-slot(b)),parseFloat(getComputedStyle(menu).paddingBottom)||0);
  const area=layout.stage;
  Object.assign(menu.style,{left:area.x+'px',top:area.y+'px',width:area.w+'px',height:area.h+'px'});
  if(placed&&previous){
    const sx=layout.stage.x+(previous[0]-old.stage.x)*layout.stage.w/old.stage.w;
    const sy=layout.stage.y+(previous[1]-old.stage.y)*layout.stage.h/old.stage.h;
    placed.pose=fitStage(placed,gripPose(placed,[sx,sy],placed.pivot,layout.seat.s,placed.installAngle||0));
  }
  for(const p of parts){
    if(p.motion?.install)p.phase='mounted';
    if(p.motion&&!p.motion.install)p.atHome=true;
    p.motion=null;
    if(p.phase==='mounted'){
      if(p!==placed)p.pose=register(placed,placed.pose,p);
    }else if(p.atHome||!old){p.atHome=true;p.pose={...home(p)};}
    else{
      const center=project(p,p.pose,p.pick);
      p.pose=fit(p,morph(p,layout,[center[0]*w/ow,center[1]*h/oh],p.pick));
    }
  }
  update();invalidate();
}
function rounded(x,y,bw,bh,r){
  r=Math.min(r,bw*.5,bh*.5);ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+bw,y,x+bw,y+bh,r);
  ctx.arcTo(x+bw,y+bh,x,y+bh,r);ctx.arcTo(x,y+bh,x,y,r);ctx.arcTo(x,y,x+bw,y,r);ctx.closePath();
}
function card(r,lit,first){
  rounded(r.x,r.y,r.w,r.h,clamp(w*.014,9,22));ctx.fillStyle=lit?'#fff':'#ffffffd9';ctx.fill();ctx.strokeStyle=first?'#d3b880':'#dce5ec';ctx.lineWidth=1;ctx.stroke();
}
function drawFrame(){
  const r=layout.stage;
  rounded(r.x,r.y,r.w,r.h,clamp(w*.017,12,26));
  const g=ctx.createRadialGradient(r.x+r.w*.47,r.y+r.h*.43,0,r.x+r.w*.47,r.y+r.h*.43,Math.hypot(r.w,r.h)*.62);
  g.addColorStop(0,'#fff');g.addColorStop(1,'#eaf0f4');
  ctx.fillStyle=g;ctx.fill();ctx.strokeStyle='#dfe8ee';ctx.lineWidth=1;ctx.stroke();
  for(const p of parts)card(trayCard(p),p.atHome,drag?.p===p&&!drag.group);
}
function drawPart(p,clipX){
  const q=p.pose,[u,v]=p.pivot;
  ctx.save();ctx.translate(q.x,q.y);ctx.scale(q.s,q.s);ctx.translate(u,v);ctx.rotate(q.a);ctx.translate(-u,-v);
  if(clipX!==undefined){
    const [x,y]=p.offset;
    ctx.beginPath();ctx.rect(x,y,Math.min(p.width,clipX-x),p.height);ctx.clip();
  }
  ctx.drawImage(p.image,...p.offset);ctx.restore();
}
function hint(p,metric){
  if(metric>2.8&&!(drag?.xy&&inside(drag.xy,layout.stage)))return;
  const [x,y]=project(p,seat(p),p.pivot),r=clamp(layout.seat.s*24,9,18);
  ctx.save();ctx.beginPath();ctx.ellipse(x,y,r,r*.56,0,0,Math.PI*2);
  ctx.strokeStyle=metric<=1?'#a66b0e':metric<=2.8?'#9b7a459d':'#a181496e';ctx.lineWidth=metric<=1?2.3:1.5;ctx.stroke();ctx.restore();
}
function draw(now){
  frame=0;if(!ready||!layout)return;
  let active=false;
  for(const p of parts){
    const a=p.motion;if(!a)continue;
    const u=clamp((now-a.t)/a.ms,0,1),v=u*u*(3-2*u);
    p.pose=Object.fromEntries(['x','y','s','a'].map(k=>[k,a.from[k]+(a.to[k]-a.from[k])*v]));
    if(u===1){
      p.motion=null;p.pose=a.to;
      if(a.install){p.phase='mounted';update();announce(mounted()<parts.length?p.name+'装好了，可以继续组装剩余零件。':parts.length===3?'三件都装好了。':'全部零件都装好了。');}
    }else active=true;
  }
  ctx.setTransform(canvas.width/w,0,0,canvas.height/h,0,0);ctx.clearRect(0,0,w,h);
  ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  drawFrame();
  const on=vehicle.layers.map(id=>parts.find(p=>p.id===id)).filter(p=>p.phase==='mounted');
  for(const p of on)drawPart(p);
  const foreground=installedForeground(parts,vehicle.foreground);
  if(foreground)drawPart(foreground.part,foreground.maxX);
  const p=drag?.p||keyboard;
  if(p&&p.phase==='loose'&&seat(p)&&freeToInstall())hint(p,snapMetric(p,p.pose,seat(p)));
  const loose=parts.filter(p=>p.phase!=='mounted'&&p!==drag?.p).sort((a,b)=>a.z-b.z);
  for(const p of loose)drawPart(p);
  if(drag&&!drag.group)drawPart(drag.p);
  canvas.classList.add('ready');
  if(proof)proof.textContent=JSON.stringify({installed:mounted(),round,vehicle:vehicle.id,anchor:mostRecent()?.id??null,stage:layout.stage,scale:layout.seat.s,tray:layout.tray,drag:drag?.p.id,parts:parts.map(p=>({id:p.id,phase:p.phase,pose:p.pose,atHome:p.atHome,point:project(p,p.pose,p.pick),previewTarget:project(p,nominal(p),p.pick),target:seat(p)?project(p,seat(p),p.pick):null,joint:seat(p)?project(p,seat(p),p.pivot):null}))});
  if(active)invalidate();
}
function fit(p,q){
  const [u,v,a,b]=bounds(p,q.a),margin=4;
  return {...q,x:clamp(q.x,margin-u*q.s,w-margin-(u+a)*q.s),y:clamp(q.y,margin-v*q.s,h-margin-(v+b)*q.s)};
}
function fitStage(p,q){
  if(parts.length!==3||vehicle.fitWholeAssembly)return fitRegisteredAssembly(parts,vehicle.joints,p.i,q,layout.stage);
  const [u,v,a,b]=bounds(p,q.a),r=layout.stage,m=8;
  const middle=parts[1],box=register(p,q,middle);
  // Leave both real joints in reach, including when the middle piece is missing.
  const points=vehicle.joints.slice(1).map(pin=>project(middle,box,pin));
  const xs=points.map(pin=>pin[0]-q.x),ys=points.map(pin=>pin[1]-q.y);
  return {...q,
    x:clamp(q.x,r.x+m-Math.min(u*q.s,...xs),r.x+r.w-m-Math.max((u+a)*q.s,...xs)),
    y:clamp(q.y,r.y+m-Math.min(v*q.s,...ys),r.y+r.h-m-Math.max((v+b)*q.s,...ys))};
}
function getMounted(pt){
  if(parts.some(p=>p.phase==='snapping'))return;
  const front=installedForeground(parts,vehicle.foreground);
  if(front&&invert(front.part,front.part.pose,pt)[0]<front.maxX&&hit(front.part,pt))return front.part;
  return vehicle.layers.slice().reverse().map(id=>parts.find(p=>p.id===id)).find(p=>p.phase==='mounted'&&hit(p,pt));
}
function shiftGroup(d,xy){
  const x=xy[0]-d.at[0],y=xy[1]-d.at[1];
  const {p,from}=d.group[0];
  const fixed=fitStage(p,{...from,x:from.x+x,y:from.y+y});
  const dx=fixed.x-from.x,dy=fixed.y-from.y;
  for(const {p,from} of d.group)p.pose={...from,x:from.x+dx,y:from.y+dy};
}
function hit(p,pt){
  const [x,y]=invert(p,p.pose,pt),a=Math.floor(x-p.offset[0]),b=Math.floor(y-p.offset[1]);
  return a>=0&&b>=0&&a<p.width&&b<p.height&&p.alpha[b*p.width+a]>=44;
}
function getLoose(pt){
  const list=parts.filter(p=>p.phase==='loose'&&!p.motion).sort((a,b)=>b.z-a.z);
  const exact=list.find(p=>hit(p,pt));
  if(exact)return exact;
  // A narrow lattice is still easy to grab, including the spaces between braces.
  return list.find(p=>{
    if(!p.looseGrabPadding)return false;
    const [x,y,w,h]=bounds(p),[px,py]=invert(p,p.pose,pt),pad=p.looseGrabPadding/p.pose.s;
    return px>=x-pad&&px<=x+w+pad&&py>=y-pad&&py<=y+h+pad;
  });
}
function at(e){const r=canvas.getBoundingClientRect();return [e.clientX-r.left,e.clientY-r.top];}
function press(e){
  if(!guide.hidden||!ready||loading||drag||e.isPrimary===false||e.button!==0)return;
  const xy=at(e),loose=getLoose(xy),p=loose||getMounted(xy);
  if(!p)return;
  const grip=invert(p,p.pose,xy);
  e.preventDefault();canvas.setPointerCapture(e.pointerId);
  drag={p,grip,from:{...p.pose},at:xy,pointer:e.pointerId,moved:false,wasHome:p.atHome};
  if(!loose)drag.group=parts.filter(q=>q.phase==='mounted').sort((a,b)=>a.rank-b.rank).map(q=>({p:q,from:{...q.pose}}));
  p.z=++z;keyboard=null;canvas.classList.add('grabbing');invalidate();
}
function move(e){
  if(!ready)return;
  const xy=at(e);
  if(!drag){if(e.pointerType==='mouse')canvas.classList.toggle('can-grab',!!(getLoose(xy)||getMounted(xy)));return;}
  if(e.pointerId!==drag.pointer)return;
  e.preventDefault();
  if(!drag.moved&&Math.hypot(xy[0]-drag.at[0],xy[1]-drag.at[1])<4)return;
  drag.moved=true;drag.xy=xy;
  if(drag.group)shiftGroup(drag,xy);
  else{drag.p.atHome=false;drag.p.pose=morph(drag.p,layout,xy,drag.grip);}
  invalidate();
}
function ungrab(){
  const d=drag;drag=null;canvas.classList.remove('grabbing','can-grab');
  if(d&&canvas.hasPointerCapture(d.pointer))canvas.releasePointerCapture(d.pointer);
  return d;
}
function cancel(e){
  if(!drag||e&&e.pointerId!==drag.pointer)return;
  const d=ungrab();if(d.group){for(const item of d.group)item.p.pose=item.from;}else{d.p.pose=d.from;d.p.atHome=d.wasHome;}invalidate();
}
function glide(p,to,install=false){
  p.motion={from:{...p.pose},to,t:performance.now(),ms:reduced.matches?1:install?155:175,install};
  if(install){p.phase='snapping';p.rank=++installedRank;}
  invalidate();
}
function complete(e){
  if(!drag||e.pointerId!==drag.pointer)return;
  move(e);const d=ungrab(),p=d.p;
  if(d.group){invalidate();return;}
  if(!d.moved){p.pose=d.from;p.atHome=d.wasHome;invalidate();return;}
  const xy=at(e),target=seat(p);
  if(freeToInstall()&&inside(xy,layout.stage)){
    if(!target){glide(p,fitStage(p,p.pose),true);return;}
    if(target&&snapMetric(p,p.pose,target)<=1){glide(p,target,true);return;}
  }
  if(inside(xy,trayCard(p))){p.atHome=true;glide(p,{...home(p)});return;}
  p.pose=fit(p,p.pose);
  announce('还没对准接合位置，可以继续拖动。');
  invalidate();
}
function reset(){
  if(!layout)return;
  ungrab();keyboard=null;z=parts.length-1;installedRank=0;
  for(const p of parts){p.phase='loose';p.rank=0;p.z=p.i;p.motion=null;p.atHome=true;p.pose={...home(p)};}
  update();announce('任选一件零件放到中央。');invalidate();
}
canvas.addEventListener('pointerdown',press);canvas.addEventListener('pointermove',move);
canvas.addEventListener('pointerup',complete);canvas.addEventListener('pointercancel',cancel);canvas.addEventListener('lostpointercapture',cancel);
canvas.addEventListener('keydown',e=>{
  if(!layout||loading)return;
  if(/^[1-4]$/.test(e.key)){const p=parts[+e.key-1];if(p?.phase==='loose'&&!p.motion){e.preventDefault();keyboard=p;announce('已选择'+p.name+'，用方向键移动。');invalidate();}return;}
  if(!keyboard)return;
  const p=keyboard,dirs={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};
  if(dirs[e.key]){e.preventDefault();const [dx,dy]=dirs[e.key],[x,y]=project(p,p.pose,p.pick);p.atHome=false;p.pose=fit(p,morph(p,layout,[x+dx*12,y+dy*12],p.pick));invalidate();}
  else if(e.key==='Enter'){
    e.preventDefault();
    const target=seat(p);
    if(freeToInstall()&&!target&&p.pose.s===layout.seat.s&&inside(project(p,p.pose,p.pick),layout.stage)){
      keyboard=null;glide(p,fitStage(p,p.pose),true);
    }else if(freeToInstall()&&target&&snapMetric(p,p.pose,target)<=1){
      keyboard=null;glide(p,target,true);
    }
  }
  else if(e.key==='Escape'){e.preventDefault();keyboard=null;p.atHome=true;glide(p,{...home(p)});}
});
function showHint(){
  if(!ready||loading||!guide.hidden)return;
  cancel();keyboard=null;invalidate();
  if(!guidePicture.hasAttribute('src')){
    guideError.hidden=true;
    guidePicture.src=new URL(vehicle.guide,import.meta.url).href;
  }
  guide.hidden=false;
  closeGuide.focus();
}
function hideHint(){
  if(guide.hidden)return;
  guide.hidden=true;showGuide.focus();
}
showGuide.onclick=showHint;closeGuide.onclick=hideHint;
guide.onclick=e=>{if(e.target===guide)hideHint();};
guidePicture.onerror=()=>{guideError.hidden=false;guidePicture.removeAttribute('src');};
document.addEventListener('keydown',e=>{
  if(guide.hidden)return;
  if(e.key==='Escape'){e.preventDefault();hideHint();}
  if(e.key==='Tab'){e.preventDefault();closeGuide.focus();}
});
replay.onclick=()=>{error.hidden=true;reset();};
async function switchVehicle(direction,button){
  if(!ready||loading||!guide.hidden)return;
  const count=VEHICLES.length, index=(vehicleIndex+direction+count)%count;
  const model=VEHICLES[index];
  cancel();keyboard=null;
  error.hidden=true;loading=true;menu.setAttribute('aria-busy','true');update();
  try{
    const sprites=await getSprites(model);
    if(direction>0&&index===0)trayRotation++;
    if(direction<0&&vehicleIndex===0)trayRotation=Math.max(0,trayRotation-1);
    vehicleIndex=index;loading=false;round++;activate(model,sprites);
    announce((direction<0?'上一辆：':'下一辆：')+model.name+'。任选一件零件放到中央。');
    if(document.activeElement===document.body)button.focus();
  }catch(e){
    console.error(e);loading=false;update();
    error.textContent='车辆没能加载，点原来的箭头重试。';error.hidden=false;
    announce(error.textContent);button.focus();
  }finally{
    menu.removeAttribute('aria-busy');
  }
}
prevRound.onclick=()=>switchVehicle(-1,prevRound);
nextRound.onclick=()=>switchVehicle(1,nextRound);
window.addEventListener('resize',()=>{if(ready)resize();},{passive:true});
getSprites(vehicle).then(sprites=>{
  canvas.dataset.partShadows='off';canvas.dataset.docking='any-order-relative';
  activate(vehicle,sprites);
}).catch(e=>{console.error(e);error.hidden=false;});
