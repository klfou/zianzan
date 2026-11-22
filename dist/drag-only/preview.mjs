import {turn,approach} from './dock-motion.mjs?v=17';
import {yardLayout} from './yard-layout.mjs?v=18';
import {SPRITES} from './sprites.mjs?v=17';

const $=id=>document.getElementById(id);
const stage=$('yard'),c=stage.getContext('2d',{alpha:false});
const output=$('status'),progress=$('progress');
const workshop=load('assembly-workshop.webp');
const sprites=Object.fromEntries(Object.entries(SPRITES).map(([id,s])=>[id,{...s,image:load(s.file)}]));
const controls={
  body:{name:'上车体',looseAngle:0,seatAngle:0,capture:[168,135]},
  arm:{name:'机械臂',looseAngle:.31,seatAngle:SPRITES.arm.installAngle,capture:[172,143]},
};
function spriteBounds(s){return s.silhouette;}
function playable(id){
  const sprite=sprites[id];
  return {id,sprite,...controls[id],reference:sprite.pick,bounds:spriteBounds(sprite),guide:sprite.pivot};
}
const body=playable('body'),arm=playable('arm');
const parts=[body,arm],motionOrder=[body,arm];
const base={position:{x:0,y:0}};
let lastSettle=null;
let w=0,h=0,pieceScale=1,frame=0,ready=false,drag=null,keyboard=null,backdrop,workshopBox;
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const proof=new URLSearchParams(location.search).has('qa')?Object.assign(document.createElement('output'),{id:'drag-proof',hidden:true}):null;
if(proof)document.body.append(proof);
const count=()=>parts.filter(p=>p.phase==='mounted').length;
const next=()=>parts.find(p=>p.phase!=='mounted');
function load(file){const im=new Image();im.src=new URL(file+'?v=17',import.meta.url).href;return im;}
function decoded(im){if(im.decode)return im.decode();if(im.complete&&im.naturalWidth)return Promise.resolve();return new Promise((yes,no)=>{im.onload=yes;im.onerror=no;});}
function invalidate(){if(!frame)frame=requestAnimationFrame(draw);}
function rotateAround(p,xy,angle){return turn(xy,p.guide,angle);}
function localBounds(p,angle){
  if(!angle||p===body)return p.bounds;
  const pts=p.sprite.outline.map(t=>rotateAround(p,t,angle));
  const l=Math.min(...pts.map(p=>p[0])),t=Math.min(...pts.map(p=>p[1]));
  return [l,t,Math.max(...pts.map(p=>p[0]))-l,Math.max(...pts.map(p=>p[1]))-t];
}
function seat(p){return {...base.position,angle:p.seatAngle};}
function dockPoint(p){
  const m=seat(p);return [m.x+p.guide[0]*pieceScale,m.y+p.guide[1]*pieceScale];
}
function homePositions(){
  const l=yardLayout(w,h,spriteBounds(sprites.chassis),body.bounds,localBounds(arm,arm.looseAngle));
  pieceScale=l.k;base.position=l.track;
  for(const p of parts)p.home={...l[p.id],angle:p.looseAngle};
}
function resize(){
  if(drag)clearDrag();
  const rect=stage.getBoundingClientRect();[w,h]=[rect.width,rect.height];
  if(!w||!h)return;
  const dpr=Math.max(.5,Math.min(devicePixelRatio||1,2,Math.sqrt(3600000/(w*h))));
  stage.width=Math.round(w*dpr);stage.height=Math.round(h*dpr);
  c.setTransform(1,0,0,1,0,0);
  const themeX=stage.width*.49,themeY=stage.height*.36;
  backdrop=c.createRadialGradient(themeX,themeY,0,themeX,themeY,Math.hypot(stage.width,stage.height)*.57);
  backdrop.addColorStop(0,'#fdfefe');backdrop.addColorStop(.52,'#eff4f7');backdrop.addColorStop(1,'#e3ebf0');
  if(workshop.naturalWidth&&workshop.naturalHeight){
    const k=Math.max(stage.width/workshop.naturalWidth,stage.height/workshop.naturalHeight);
    const bw=workshop.naturalWidth*k,bh=workshop.naturalHeight*k;
    workshopBox=[(stage.width-bw)*.5,(stage.height-bh)*.32,bw,bh];
  }else workshopBox=null;
  homePositions();
  for(const p of parts){
    if(p.phase==='snapping')p.phase='mounted';
    else if(p.phase!=='mounted')p.phase='loose';
    p.motion=null;p.pose={...(p.phase==='mounted'?seat(p):p.home)};
  }
  update();invalidate();
}
function bounds(p,pose=p.pose){
  const [x,y,a,b]=localBounds(p,pose.angle);
  return {x:pose.x+x*pieceScale,y:pose.y+y*pieceScale,w:a*pieceScale,h:b*pieceScale};
}
function project(p,point,pose=p.pose){
  const [x,y]=rotateAround(p,point,pose.angle);
  return [pose.x+x*pieceScale,pose.y+y*pieceScale];
}
function drawPart(p){
  const {x,y,angle}=p.pose,[u,v]=p.guide;
  c.save();c.translate(x,y);c.scale(pieceScale,pieceScale);
  c.translate(u,v);c.rotate(angle);c.translate(-u,-v);
  c.drawImage(p.sprite.image,...p.sprite.offset);
  c.restore();
}
function drawBase(){
  c.save();c.translate(base.position.x,base.position.y);c.scale(pieceScale,pieceScale);
  const item=sprites.chassis;
  c.drawImage(item.image,...item.offset);c.restore();
}
function buildHitMaps(){
  const surface=document.createElement('canvas');
  const ctx=surface.getContext('2d',{willReadFrequently:true});
  for(const p of parts){
    const {image}=p.sprite,width=image.naturalWidth,height=image.naturalHeight;
    surface.width=width;surface.height=height;ctx.drawImage(image,0,0);
    const pixels=ctx.getImageData(0,0,width,height).data;
    p.alpha=new Uint8Array(width*height);
    for(let i=0;i<p.alpha.length;i++)p.alpha[i]=pixels[i*4+3];
  }
}
function shadow(x,y,rx,ry,angle,amount){
  c.save();c.translate(x,y);c.rotate(angle);c.scale(Math.max(1,rx),Math.max(1,ry));
  const g=c.createRadialGradient(0,0,0,0,0,1);
  g.addColorStop(0,'rgba(38,55,73,'+amount*.74+')');g.addColorStop(.53,'rgba(38,55,73,'+amount*.37+')');g.addColorStop(1,'rgba(38,55,73,0)');
  c.fillStyle=g;c.fillRect(-1,-1,2,2);c.restore();
}
function grounds(){
  const P=pieceScale, at=(a,b)=>[base.position.x+a*P,base.position.y+b*P];
  // Soft spill to the right from the upper-left windows, then local contact under the treads.
  shadow(...at(1264,847),454*P,37*P,-.094,.34);
  shadow(...at(850,796),220*P,23*P,.065,.68);
  shadow(...at(1255,839),422*P,23*P,-.112,.74);
  shadow(...at(1201,853),293*P,11*P,-.112,.59);
  for(const p of parts){
    const to=seat(p),from=p.home;
    const nearSeat=1-Math.min(1,Math.hypot(p.pose.x-to.x,p.pose.y-to.y)/Math.max(50,80*P));
    const awayHome=Math.min(1,Math.hypot(p.pose.x-from.x,p.pose.y-from.y)/Math.max(35,84*P));
    const alpha=1-.66*awayHome;
    if(p===arm){
      shadow(...project(p,[141,697]),113*P,19*P,.07,.72*Math.max(alpha,nearSeat));
      if(nearSeat<1)shadow(...project(p,[920,474]),84*P,15*P,-.07,.60*alpha*(1-nearSeat));
    }else if(p.phase!=='mounted'){
      const b=bounds(p);
      shadow(b.x+b.w*.53,b.y+b.h*.975,b.w*.60,b.h*.091,-.075,.62*alpha*(1-nearSeat));
      shadow(...project(p,[1158,592]),99*P,11*P,-.04,.46*alpha*(1-nearSeat));
    }
  }
}
function guide(p,near){
  const [x,y]=dockPoint(p),r=Math.max(10,Math.min(19,23*pieceScale));
  c.save();c.strokeStyle=near?'#b66b06':'#8d6019bd';c.lineWidth=near?2.8:1.6;
  c.beginPath();c.ellipse(x,y,r,Math.max(5,r*.37),0,0,Math.PI*2);c.stroke();
  if(near){c.fillStyle='#ffe17644';c.fill();}
  if(drag?.p===p && !near){
    const [a,b]=project(p,drag.grab,seat(p));
    if(Math.hypot(a-x,b-y)>r*2.5){
      c.beginPath();c.arc(a,b,Math.max(3,r*.24),0,Math.PI*2);c.fillStyle='#ad701db8';c.fill();
    }
  }
  c.restore();
}
function draw(now){
  frame=0;if(!ready||!w||!h)return;
  let active=false;
  for(const p of parts){
    const m=p.motion;if(!m)continue;
    const t=Math.min(1,Math.max(0,(now-m.start)/m.ms)),e=t*t*(3-2*t);
    p.pose={x:m.from.x+(m.to.x-m.from.x)*e,y:m.from.y+(m.to.y-m.from.y)*e,angle:m.from.angle+(m.to.angle-m.from.angle)*e};
    if(t===1){p.motion=null;p.phase=m.ok?'mounted':'loose';if(m.ok){update();output.textContent=next()?'上车体装好了，接下来装机械臂。':'两块都已装好。';}}
    else active=true;
  }
  c.setTransform(stage.width/w,0,0,stage.height/h,0,0);c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
  c.save();c.setTransform(1,0,0,1,0,0);if(workshopBox)c.drawImage(workshop,...workshopBox);else{c.fillStyle=backdrop;c.fillRect(0,0,stage.width,stage.height);}c.restore();
  grounds();drawBase();
  for(const p of motionOrder)if(p.phase==='mounted')drawPart(p);
  const selected=drag?.p||keyboard;
  if(selected===next()&&selected?.phase==='loose')guide(selected,drag?.near);
  for(const p of parts)if(p.phase!=='mounted'&&p!==drag?.p)drawPart(p);
  if(drag)drawPart(drag.p);
  if(!drag&&next()?.phase==='loose'){
    const b=bounds(next()),r=Math.max(9,Math.min(32,b.w*.145));
    c.save();c.strokeStyle='#9a6215a8';c.lineWidth=2;c.beginPath();c.ellipse(b.x+b.w*.49,b.y+b.h+1,r,r*.21,0,.23,Math.PI-.23);c.stroke();c.restore();
  }
  stage.classList.add('ready');
  if(proof)proof.textContent=JSON.stringify({mode:'two-piece',canvas:{w,h},base:base.position,settle:lastSettle,scale:pieceScale,installed:count(),next:next()?.id??null,drag:drag?.p.id??null,parts:parts.map(p=>({id:p.id,phase:p.phase,pose:p.pose,point:project(p,p.reference),target:project(p,p.reference,seat(p)),joint:dockPoint(p),source:p.sprite.image.currentSrc,offset:p.sprite.offset}))});
  if(active)invalidate();
}
function update(){
  const n=count();stage.dataset.installed=String(n);
  [...progress.children].forEach((el,i)=>el.dataset.state=i<n?'done':i===n?'next':'pending');
  progress.setAttribute('aria-label','已安装 '+n+' / 2'+(next()?'，下一块：'+next().name:''));
}
function contains(p,pt){
  if(p.phase!=='loose')return false;
  const u=(pt.x-p.pose.x)/pieceScale,v=(pt.y-p.pose.y)/pieceScale;
  const [x,y]=rotateAround(p,[u,v],-p.pose.angle);
  const [ox,oy]=p.sprite.offset;
  const col=Math.floor(x-ox),row=Math.floor(y-oy);
  const {naturalWidth:cols,naturalHeight:rows}=p.sprite.image;
  return col>=0&&row>=0&&col<cols&&row<rows&&p.alpha[row*cols+col]>=40;
}
function point(e){const r=stage.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top};}
function clamp(p,pose){
  const [x,y,pw,ph]=localBounds(p,pose.angle),cap=(v,m,M)=>Math.max(m,Math.min(M,v));
  return {...pose,x:cap(pose.x,3-x*pieceScale,w-3-(x+pw)*pieceScale),y:cap(pose.y,3-y*pieceScale,h-3-(y+ph)*pieceScale)};
}
function eligible(p,pt){
  if(p!==next())return false;
  const [x,y]=dockPoint(p),[a,b]=project(p,p.guide),rx=Math.max(31,pieceScale*p.capture[0]*.71),ry=Math.max(30,pieceScale*p.capture[1]*.71);
  const fits=(u,v)=>((u-x)/rx)**2+((v-y)/ry)**2<=1;
  return fits(pt.x,pt.y)||fits(a,b);
}
function press(e){
  if(!ready||drag||e.isPrimary===false||e.button!==0)return;
  const at=point(e),p=[...parts].reverse().find(q=>contains(q,at));
  if(!p)return;
  e.preventDefault();stage.setPointerCapture(e.pointerId);stage.classList.add('grabbing');keyboard=null;
  const grab=turn([(at.x-p.pose.x)/pieceScale,(at.y-p.pose.y)/pieceScale],p.guide,-p.pose.angle);
  drag={p,id:e.pointerId,at,grab,from:{...p.pose},moved:false,near:false};invalidate();
}
function move(e){
  if(!ready)return;
  const pt=point(e);
  if(!drag){if(e.pointerType==='mouse')stage.classList.toggle('can-grab',parts.some(p=>contains(p,pt)));return;}
  if(e.pointerId!==drag.id)return;
  e.preventDefault();
  const {p,at,from}=drag,dx=pt.x-at.x,dy=pt.y-at.y;
  drag.moved||=Math.hypot(dx,dy)>6;
  const move=approach({point:pt,grab:drag.grab,pivot:p.guide,initialAngle:from.angle,goal:seat(p),radius:p.capture,scale:pieceScale,enabled:drag.moved&&p===next()&&!reduced.matches});
  p.pose=clamp(p,move.pose);
  drag.near=drag.moved&&(reduced.matches?eligible(p,pt):move.ready);invalidate();
}
function clearDrag(){
  if(!drag)return null;const d=drag;drag=null;stage.classList.remove('grabbing','can-grab');
  if(stage.hasPointerCapture(d.id))stage.releasePointerCapture(d.id);return d;
}
function animate(p,ok){
  p.phase=ok?'snapping':'returning';
  const to=ok?seat(p):p.home, distance=Math.hypot(p.pose.x-to.x,p.pose.y-to.y);
  if(ok)lastSettle={id:p.id,distance,angle:Math.abs(p.pose.angle-to.angle)};
  p.motion={from:{...p.pose},to:{...to},ok,start:performance.now(),ms:reduced.matches?1:ok?Math.min(225,115+1.6*distance+105*Math.abs(p.pose.angle-to.angle)):220};
  if(!ok)output.textContent=p===next()?p.name+'回到原位。':'请先装'+next()?.name+'。';
  invalidate();
}
function release(e,accept=false){
  if(!drag||(e&&e.pointerId!==drag.id))return;
  const d=clearDrag();
  if(!d.moved){d.p.pose={...d.from};invalidate();return;}
  animate(d.p,accept&&d.near);
}
function reset(){
  if(!ready)return;clearDrag();keyboard=null;lastSettle=null;
  for(const p of parts){p.phase='loose';p.motion=null;p.pose={...p.home};}
  output.textContent='已恢复摆放。先装上车体，再装机械臂。';update();invalidate();
}
stage.addEventListener('pointerdown',press);stage.addEventListener('pointermove',move);
stage.addEventListener('pointerup',e=>{if(drag?.id===e.pointerId){move(e);release(e,true);}});
stage.addEventListener('lostpointercapture',release);stage.addEventListener('pointercancel',release);
stage.addEventListener('keydown',e=>{
  if(!ready)return;
  if(e.key==='1'||e.key==='2'){const p=parts[Number(e.key)-1];if(p.phase==='loose'){keyboard=p;output.textContent=p.name+'已选中。';invalidate();}return;}
  if(!keyboard)return;
  if(e.key==='Enter'||e.key==='Escape'){e.preventDefault();const p=keyboard;keyboard=null;animate(p,e.key==='Enter'&&eligible(p,{x:-1e4,y:-1e4}));return;}
  const dirs={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]},d=dirs[e.key];if(!d)return;
  e.preventDefault();keyboard.pose=clamp(keyboard,{...keyboard.pose,x:keyboard.pose.x+d[0]*13,y:keyboard.pose.y+d[1]*13});invalidate();
});
$('reset').onclick=reset;
const fs=$('fullscreen'),el=document.documentElement,enter=el.requestFullscreen||el.webkitRequestFullscreen,exit=document.exitFullscreen||document.webkitExitFullscreen;
const full=()=>Boolean(document.fullscreenElement||document.webkitFullscreenElement);
fs.hidden=!enter;
const sync=()=>{fs.setAttribute('aria-pressed',String(full()));fs.setAttribute('aria-label',full()?'退出全屏':'进入全屏');};
fs.onclick=async()=>{try{if(full())await exit.call(document);else await enter.call(el);}catch{output.textContent='此浏览器未开启全屏。';}};
document.addEventListener('fullscreenchange',sync);document.addEventListener('webkitfullscreenchange',sync);
window.addEventListener('resize',()=>{if(ready)resize();},{passive:true});
Promise.all([decoded(workshop).catch(()=>null),...Object.values(sprites).map(s=>decoded(s.image))]).then(()=>{
  buildHitMaps();
  ready=true;stage.dataset.mode='two-piece';stage.dataset.assets='transparent-png';stage.dataset.art='mechanical-assemblies';stage.dataset.layout='low-crawler';stage.dataset.scene=workshop.naturalWidth?'workshop':'studio-fallback';resize();reset();
}).catch(e=>{console.error(e);$('error').hidden=false;});
