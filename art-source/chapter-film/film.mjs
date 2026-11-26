import {workFilms} from "./shared/excavator/work-films.mjs";
import {fieldGame} from "./shared/excavator/field.mjs";
const root=new URL("./",import.meta.url).pathname, art=root+"shared/excavator/art/";
const W=1280,H=720, pictureH=626, canvas=document.querySelector("#movie");
canvas.width=W;canvas.height=H;
const c=canvas.getContext("2d",{alpha:false});
const images=new Map();
const clamp=x=>Math.max(0,Math.min(1,x));
const ease=x=>(x=clamp(x),x*x*(3-2*x));
const lerp=(a,b,t)=>a+(b-a)*t;
const between=(t,a,b)=>ease((t-a)/(b-a));
const rand=i=>{const n=Math.sin(i*91.37+12.6)*43758.54;return n-Math.floor(n)};
const D=390;
let shots,layers,fields={};
const image=url=>images.get(new URL(url,location.href).href);
async function readImage(url){url=new URL(url,location.href).href;if(images.has(url))return;const i=new Image();i.src=url;await i.decode();images.set(url,i)}
async function json(url){const r=await fetch(url);if(!r.ok)throw Error(url);return r.json()}
function cover(im,x,y,w,h,zoom=1,ax=.5,ay=.5){const z=Math.max(w/im.width,h/im.height)*zoom;c.drawImage(im,x-(im.width*z-w)*ax,y-(im.height*z-h)*ay,im.width*z,im.height*z)}
const panel=(sheet,n)=>image(root+"panels/"+sheet+"-"+n+".webp");
function block(x,y,angle,draw){c.save();c.translate(x,y);c.rotate(angle);draw();c.restore()}
function wheel(im,x,y,w,h,centres,travel){c.drawImage(im,x,y,w,h);for(const [a,b] of centres){const px=x+w*a,py=y+h*b,r=h*.135;c.save();c.translate(px,py);c.beginPath();c.arc(0,0,r,0,6.29);c.clip();c.rotate(travel/(h*.24));c.drawImage(im,-w*a,-h*b,w,h);c.restore()}}
function felling(t){
  const im=image(art+"bare-tree.webp"), arm=image(art+"../../drag-only/harvester/boom.webp"),s=.28;
  const approach=between(t,0,.22),fall=between(t,.34,.79),release=between(t,.8,1);
  const baseX=575+43*(1-approach)+25*release,baseY=D-110;
  const armAng=-.15-.36*approach-.44*fall+.39*release, head=-1.48*fall+.7*release;
  const hinge=(x,ang)=>[x+s*(-540*Math.cos(ang)+180*Math.sin(ang)),baseY+s*(-540*Math.sin(ang)-180*Math.cos(ang))];
  const [jx,jy]=hinge(baseX,armAng);
  const [cutX]=hinge(575,-.51);const [layX,layY]=hinge(575,-.95);
  const x=t<.34?cutX:t>=.79?layX-48*Math.sin(-1.48):jx-48*Math.sin(head);
  const y=t<.34?D-16:t>=.79?layY+48*Math.cos(-1.48):lerp(D-16,jy+48*Math.cos(head),between(t,.34,.43));
  block(x,y,-1.48*fall,()=>c.drawImage(im,-65,-220,130,236));
  if(t>.34)c.drawImage(im,0,im.height*.94,im.width,im.height*.06,cutX-58,D-13,116,13);
  const cx=baseX-242*s,cy=D-336*s;
  wheel(image(art+"../../drag-only/harvester/chassis.webp"),cx,cy,1249*s,336*s,[[.18,.64],[.36,.64],[.75,.61],[.92,.59]],43*(1-approach)+25*release);
  c.drawImage(image(art+"../../drag-only/harvester/cab.webp"),cx+219*s,cy-502*s,844*s,516*s);
  block(baseX,baseY,armAng,()=>{c.scale(s,s);c.drawImage(arm,0,0,710,350,-680,-530,710,350);c.drawImage(arm,270,350,440,304,-410,-180,440,304)});
  block(jx,jy,head,()=>{c.scale(s,s);c.drawImage(arm,0,350,270,304,-140,0,270,304)});
  if(t>.23&&t<.36){c.fillStyle="#d99f57";for(let i=0;i<20;i++){const u=(t*15+i/20)%1;c.fillRect(cutX-7-u*(15+i),D-17-8*Math.sin(u*Math.PI)+10*u*u,3,2)}}
}
function grade(t){
  const advance=between(t,.2,.84),raised=1-between(t,.03,.18)+between(t,.84,1);
  const edge=681-414*advance,x=edge+60*between(t,.86,1),w=365,h=w*427/1000,y=D-h;
  const soil=image(art+"soil.png"), fill=between(t,.54,.84);
  c.save();c.beginPath();
  c.moveTo(202,D+4);c.bezierCurveTo(214,D-8,257,D-13,295,D-10);
  c.bezierCurveTo(330,D-17,367,D-5,382,D+2);c.bezierCurveTo(339,D+11,248,D+17,202,D+4);c.clip();
  const shade=c.createLinearGradient(0,D-15,0,D+13);
  shade.addColorStop(0,"#654832");shade.addColorStop(.42,"#a47d54");shade.addColorStop(1,"#bc976b");
  c.fillStyle=shade;c.fillRect(200,D-16,185,32);
  for(let i=0;i<125;i++){c.fillStyle=i%2?"#9c7653":"#b59469";c.fillRect(204+rand(i)*177,D-12+rand(i+12)*29,2+rand(i+5)*4,1)}
  if(fill){const bg=image(art+"work-clearing.webp");c.drawImage(bg,bg.width*.33,bg.height*.83,bg.width*.24,bg.height*.06,384-184*fill,D-16,184*fill,32)}
  c.restore();
  const amount=1-fill;
  if(amount>.001)c.drawImage(soil,edge-136*amount,D-53*amount,139*amount,53*amount);
  wheel(image(art+"wheel-base.webp"),x,y,w,h,[[.49,.72],[.83,.73]],x-681);
  const px=x+w*.365,py=y+h*.68;
  block(px,py,.12*raised,()=>c.drawImage(image(art+"wheel-blade.webp"),x-px,y-py,w,h));
}
const rollerDir=root+"shared/drag-only/roller/";
function rolling(t){
  const x=710-640*ease(t),s=.29,y=D-516*s;
  c.drawImage(image(rollerDir+"rear.webp"),x+474*s,y,834*s,516*s);
  wheel(image(rollerDir+"drum.webp"),x,y+177*s,520*s,337*s,[[.41,.55]],x);
  c.drawImage(image(rollerDir+"cab.webp"),x+485*s,y-180*s,423*s,411*s);
}
function particles(id,time,x,y,dx,dy,count,color,spread){
  c.fillStyle=color;for(let n=0;n<count;n++){const u=(time*.8+rand(n))%1;c.globalAlpha=(1-u)*.65;
    const px=x+u*dx+(rand(n+63)-.5)*spread*u,py=y+u*dy+(rand(n+44)-.5)*spread*u;
    c.beginPath();c.arc(px,py,.7+rand(n+8)*1.3,0,6.29);c.fill()}c.globalAlpha=1;
}
function panelShot(s,t,seconds){
  let im=panel(s.sheet,s.cell);
  if(s.id==="end"&&t>.54)im=panel("hearts",5);
  if(s.id==="desk"&&t>.72)im=panel("road",4);
  const cfg=layers[s.id], cut=cfg&&!(s.id==="desk"&&t>.72);
  if(cut) im=image(root+"panels/"+s.id+"-clean.webp");
  const zoom=1.015+.045*ease(t),aspect=im.width/im.height;
  const anchor=s.id==="snow"?.36:s.id==="rain"?.37:s.id==="mark"?.6:.5;
  const factor=Math.max(W/im.width,pictureH/im.height)*zoom;
  const x=-(im.width*factor-W)*(anchor+.045*ease(t)),y=-(im.height*factor-pictureH)*.5;
  c.drawImage(im,x,y,im.width*factor,im.height*factor);
  c.save();c.translate(x,y);c.scale(im.width*factor/480,im.height*factor/218);
  if(cut){
    const l=cfg, phase=between(t,.08,s.id==="desk"?.65:.88);
    const dx=lerp(l.start[0],l.end[0],phase),dy=s.id==="mark"?-10+12*between(t,0,.40)-14*between(t,.54,.84):lerp(l.start[1],l.end[1],phase);
    c.save();c.beginPath();c.rect(0,0,480,l.clip);c.clip();
    if(s.id==="cage"||s.id==="panels"){c.strokeStyle="#514c42";c.lineWidth=.8;c.beginPath();c.moveTo(l.x+l.w*.5,0);c.lineTo(l.x+l.w*.5+dx,l.y+dy+4);c.stroke()}
    c.drawImage(image(root+"panels/"+s.id+"-layer.webp"),l.x+dx,l.y+dy,l.w,l.h);c.restore();
  }
  if(s.id==="window"){
    const shine=c.createLinearGradient(179,95,287,151);shine.addColorStop(0,"#e3f7ff00");shine.addColorStop(.48,"#d3efff40");shine.addColorStop(1,"#d3efff00");
    c.save();c.beginPath();c.moveTo(188,36);c.lineTo(326,24);c.lineTo(326,168);c.lineTo(187,174);c.clip();
    c.fillStyle=shine;c.fillRect(125+80*ease(t),25,125,155);c.restore();
  }
  if(s.id==="drain"){c.strokeStyle="#d5e5d5a0";c.lineWidth=.6;for(let i=0;i<3;i++){const u=(seconds*.48+i/3)%1;c.beginPath();c.ellipse(216,177,5+u*21,1+u*3,0,0,6.29);c.stroke()}}
  if(s.id==="demo"){particles(s.id,seconds,62,124,91,-19,98,"#faf3df",45);particles(s.id,seconds,263,66,16,67,20,"#c97745",30)}
  if(s.id==="rubble"){particles(s.id,seconds,193,63,14,25,22,"#bb784a",20);particles(s.id,seconds,375,122,-40,11,60,"#c9e1e8",22)}
  if(s.id==="concrete")particles(s.id,seconds,226,43,12,12,26,"#8b8579",5);
  if(s.id==="pump")particles(s.id,seconds,232,74,0,17,24,"#918578",3);
  if(s.id==="sweep")for(let i=0;i<8;i++)particles(s.id,seconds+i*.27,270+i*8,168,-3,11,9,"#403d36",5);
  if(s.id==="stripe"){particles(s.id,seconds,281,146,-4,15,28,"#fff5dc",7)}
  if(s.id==="rain"||s.id==="snow"){
    const snow=s.id==="snow";for(let i=0;i<(snow?78:42);i++){
      const xx=(rand(i+7)*510+seconds*(snow?4:11))%506-13,yy=(rand(i+82)*250+seconds*(snow?12:77))%248-13;
      c.strokeStyle=snow?"#fffdf4b5":"#d4e2e8b3";c.lineWidth=snow?1.6:.55;
      c.beginPath();c.moveTo(xx,yy);c.lineTo(xx+(snow?.3:-1.8),yy+(snow?1:7));c.stroke()
    }
  }
  if(s.id==="lamp"){const g=c.createRadialGradient(210,72,1,210,72,54);g.addColorStop(0,"#fff4ac");g.addColorStop(1,"#ffcc4900");c.globalAlpha=between(t,.5,.86)*.62;c.fillStyle=g;c.fillRect(150,10,120,125);c.globalAlpha=1}
  c.restore();
}
function drawRig(s,t){
  if(s.id==="dig"||s.id==="haul"){const a=fields[s.id];a.paint(t*(s.id==="dig"?.71:18));c.drawImage(a.canvas,0,0,W,pictureH);return}
  const bg=image(art+"work-clearing.webp");cover(bg,0,0,W,pictureH);
  c.save();const scale=Math.min(W/960,pictureH/480);c.translate((W-960*scale)/2,(pictureH-480*scale)/2);c.scale(scale,scale);
  if(s.id==="fell")felling(t);
  else if(s.id==="grade")grade(t);
  else if(s.id==="compact")rolling(t);
  else if(s.id==="carry"){
    const phase=t*3,name=phase<1?"grapple":phase<2?"carry":"timber",f=workFilms[name],a={};
    for(const file of f.art)a[file]=image(art+file);
    f.draw(c,a,Math.min(1,phase-(name==="grapple"?0:name==="carry"?1:2)));
  }
  c.restore();
}
async function prepareField(id){
 const host=document.createElement("div"),can=document.createElement("canvas");
 can.style.width=W+"px";can.style.height=pictureH+"px";host.style.cssText="position:absolute;left:-9000px;top:0";host.append(can);document.body.append(host);
 const model=await json(art+"model.json"),truck=id==="haul"?await json(art+"tipper.json"):null;
 await new Promise((resolve,reject)=>fieldGame({stage:host,model,truck,asset:n=>art+n,onCaption:v=>{if(v.includes("没能加载"))reject(Error(v))},onFinish(){},onVoice(){},renderOffline:paint=>{fields[id]={canvas:can,paint};resolve()}}));
}
export async function start(){
 shots=await json(root+"timeline.json");layers=await json(root+"layers.json");
 const all=new Set(["work-clearing.webp","bare-tree.webp","wheel-base.webp","wheel-blade.webp","soil.png",...workFilms.carry.art,...workFilms.fell.art].map(n=>art+n));
 for(const s of shots){if(!["rig","fleet"].includes(s.sheet))all.add(root+"panels/"+s.sheet+"-"+s.cell+".webp");if(layers[s.id]){all.add(root+"panels/"+s.id+"-clean.webp");all.add(root+"panels/"+s.id+"-layer.webp")}}
 all.add(root+"panels/hearts-5.webp");all.add(root+"panels/road-4.webp");
 for(const n of ["cab","rear","drum"])all.add(rollerDir+n+".webp");
 await Promise.all(Array.from(all,readImage));await prepareField("dig");await prepareField("haul");await document.fonts.ready;
 return shots;
}
function captionParts(line) {
 const clauses=line.match(/[^，。！？：；]+[，。！？：；]?/gu)||[line];
 const result=[];let part="";
 for(const clause of clauses){if(part&&part.length+clause.length>22){result.push(part);part=""}part+=clause}
 if(part)result.push(part);return result;
}
export function frame(index,frameNum){
 const s=shots[index],t=frameNum/Math.max(1,s.frames-1),seconds=frameNum/s.fps;
 c.setTransform(1,0,0,1,0,0);c.fillStyle="#f9eed4";c.fillRect(0,0,W,H);
 c.save();c.beginPath();c.rect(0,0,W,pictureH);c.clip();
 if(["rig","fleet"].includes(s.sheet))drawRig(s,t);else panelShot(s,t,seconds);
 const shade=c.createLinearGradient(0,0,0,99);shade.addColorStop(0,"#182b2485");shade.addColorStop(1,"#182b2400");c.fillStyle=shade;c.fillRect(0,0,W,99);
 c.fillStyle="#fff8e6";c.font='bold 30px "Microsoft YaHei"';c.textAlign="left";
 c.fillText(index===0?"旧木场的第一盏灯":s.title,39,51);
 c.restore();
 const parts=captionParts(s.line),total=parts.reduce((n,l)=>n+l.length,0);
 let at=clamp((seconds-.24)/(s.voiceSamples/24000))*total,sub=parts.at(-1);
 for(const part of parts){if(at<part.length){sub=part;break}at-=part.length}
 c.fillStyle="#374738";c.font='bold 34px "Microsoft YaHei"';c.textAlign="center";c.fillText(sub,W/2,pictureH+57,W-76);
 // A brief exposure change marks cuts; never blink during a machine action.
 if(frameNum<4&&index>0){c.fillStyle="rgba(251,239,209,"+(.25*(1-frameNum/4))+")";c.fillRect(0,0,W,pictureH)}
 return canvas.toDataURL("image/jpeg",.90).split(",")[1];
}

