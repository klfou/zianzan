// Machinery is painted in a shared 960 × 480 stage. The last pose of one
// timber operation is the first pose of the next, including the carried load.
const GROUND = 390;
const yard = "work-clearing.webp";
const harvester = "../../drag-only/harvester/";
const dozer = "../../drag-only/dozer/";
const carrier = "../../drag-only/log-hauler/carrier.webp";
const tree = "bare-tree.webp", log = "sawn-log.webp", stone = "road-gravel.webp";
const skidder = [harvester + "chassis.webp", harvester + "cab.webp"];
const forestryArt = [...skidder, harvester + "boom.webp", tree, log];
const bladeArt = ["chassis","cab","blade"].map(p => dozer + p + ".webp");
const truck = ["truckframe.webp", "truckcab.webp", "truckbed.webp"];
const surface = "gravel-surface.webp";
const timberArt = ["log-handler.webp", carrier, "stake-rack.webp", log, surface, "loader-boom.webp", "loader-stick.webp", "rotator.webp", "grapple-jaw.webp"];
export const workFilms = {
  survey: { seconds: 3.7, background: "lot.webp", art: [...skidder, harvester+"boom.webp"], draw: visitSite },
  fell: { seconds: 7.5, background: yard, art: forestryArt, draw: fellTree },
  logs: { seconds: 3.3, background: yard, art: forestryArt, draw: (c,a,t) => fellTree(c,a,1,ramp(t,.05,.94)*670) },
  returnLoad: { seconds: 3.2, background: "soil-depot.webp", art: truck, draw: leaveDepot },
  gravel: { seconds: 6, background: yard, art: [...truck, stone], draw: deliverGravel },
  grade: { seconds: 6, background: yard, art: [stone, surface, ...bladeArt], draw: gradeLane },
  lane: { seconds: 3.6, background: yard, art: [stone, surface, ...bladeArt], draw: (c,a,t) => gradeLane(c,a,1,810*ramp(t,0,.95)) },
  grapple: { seconds: 4.5, background: yard, art: timberArt, draw: (c,a,t) => loadTimber(c,a,t) },
  carry: { seconds: 4.6, background: yard, art: timberArt, draw: (c,a,t) => loadTimber(c,a,1+t) },
  timber: { seconds: 4.2, background: yard, art: timberArt, draw: (c,a,t) => loadTimber(c,a,2+t) },
};

function ramp(t, a, b) {
  const p = Math.max(0, Math.min(1, (t-a)/(b-a)));
  return p*p*(3-2*p);
}
function at(c, x, y, angle, fn) {
  c.save(); c.translate(x,y); c.rotate(angle); fn(); c.restore();
}
function shadow(c,x,y,rx,ry) {
  c.fillStyle = "#39372335"; c.beginPath(); c.ellipse(x,y,rx,ry,0,0,Math.PI*2); c.fill();
}
// Rotate the hubs inside their painted wheel arches. Cropping their centres
// keeps suspension, mudguards and the oblique tire outlines in place.
function rollingChassis(c,img,x,y,w,h,hubs,distance) {
  c.drawImage(img,x,y,w,h);
  for(const [fx,fy] of hubs) {
    const rx=h*.15, ry=h*.17;
    const ox=x+w*fx,oy=y+h*fy;
    c.save();c.translate(ox,oy);c.scale(rx,ry);
    c.beginPath();c.arc(0,0,1,0,2*Math.PI);c.clip();
    c.rotate(distance/(h*.35));
    c.drawImage(img,-w*fx/rx,-h*fy/ry,w/rx,h/ry);
    c.restore();
  }
}
const forestHubs=[[.18,.635],[.36,.635],[.75,.61],[.92,.59]];
const tipperHubs=[[.142,.62],[.607,.65],[.822,.65]];
const timberHubs=[[.20,.80],[.772,.735],[.874,.72]];
function wood(c,images,x,y,w,h) {
  c.drawImage(images[log], x-w/2,y-h/2,w,h);
}
function sawdust(c,x,y,t,active) {
  if (active <= 0) return;
  c.fillStyle = "#d9a452";
  for (let i=0; i<12; i++) {
    const p=(t*12+i/12)%1;
    c.fillRect(x-p*(12+i*2), y-11*Math.sin(p*Math.PI)+p*p*17, 2.5*active, 2*active);
  }
}
function visitSite(c,images,t) {
  const s=.24, x=1050-687*ramp(t,0,.93), y=442;
  shadow(c,x+148,y,138,5);
  rollingChassis(c,images[skidder[0]],x,y-336*s,1249*s,336*s,forestHubs,x-1050);
  c.drawImage(images[skidder[1]],x+219*s,y-838*s,844*s,516*s);
  c.drawImage(images[harvester+"boom.webp"],x-445*s,y-935*s,710*s,654*s);
}
function fellTree(c,images,t,leave=0) {
  const approach = ramp(t,0,.18);
  const lower = -.12-.39*approach+.21*ramp(t,.35,.56);
  const angle = -Math.PI/2*ramp(t,.28,.55);
  const scale=.28, baseX=575+42*(1-approach), baseY=GROUND-112;
  const jointX=baseX+scale*(-540*Math.cos(lower)+180*Math.sin(lower));
  const jointY=baseY+scale*(-540*Math.sin(lower)-180*Math.cos(lower));
  const gripX=jointX-49*Math.sin(angle), gripY=jointY+49*Math.cos(angle);
  const treeX=575+scale*(-540*Math.cos(-.51)+180*Math.sin(-.51));
  const transfer=ramp(t,.21,.28);
  const x=treeX+(gripX-treeX)*transfer;
  const y=GROUND-16+(gripY-GROUND+16)*transfer;
  const process=ramp(t,.55,.63);
  // The standing tree stays rooted until the head has reached the cut.
  if (process<1) {
    c.save(); c.globalAlpha=1-process;
    at(c,x,y,angle,()=>c.drawImage(images[tree],-71,-215,142,231)); c.restore();
  }
  if (t>.28) {
    const spr=images[tree], stumpH=13;
    c.drawImage(spr,0,spr.height*.94,spr.width,spr.height*.06,treeX-62,GROUND-stumpH,124,stumpH);
  }
  // Each third is fed through the rollers, severed at the head and released.
  const length=199, piece=length/3;
  if (process>0) {
    c.save(); c.globalAlpha=process;
    for (let i=0;i<3;i++) {
      const start=.61+i*.116;
      const feed=ramp(t,start,start+.065), landed=ramp(t,start+.071,start+.111);
      let tipX=x-(i*piece);
      for(let j=0;j<=i;j++) tipX+=piece*ramp(t,.61+j*.116,.675+j*.116);
      const cy=y+(GROUND-9-i*7-y)*landed;
      wood(c,images,tipX-piece/2+landed*(10-i*7),cy,piece+1,17);
      if (feed===1 && landed<1) sawdust(c,x,y+7,t,1-landed);
    }
    c.restore();
  }
  c.save(); c.translate(leave,0);
  shadow(c,baseX+101,GROUND,159,6);
  const cx=baseX-242*scale, cy=GROUND-336*scale;
  rollingChassis(c,images[skidder[0]],cx,cy,1249*scale,336*scale,forestHubs,leave-42*approach);
  c.drawImage(images[skidder[1]],cx+219*scale,cy-502*scale,844*scale,516*scale);
  const arm=images[harvester+"boom.webp"];
  at(c,baseX,baseY,lower,()=>{
    c.scale(scale,scale);
    c.drawImage(arm,0,0,710,350,-680,-530,710,350);
    c.drawImage(arm,270,350,440,304,-410,-180,440,304);
  });
  at(c,jointX,jointY,angle,()=>{
    c.scale(scale,scale);
    c.drawImage(arm,0,350,270,304,-140,0,270,304);
  });
  if (t>.18 && t<.29) sawdust(c,x,y+11,t,1);
  c.restore();
}
function tipper(c,images,x,y,angle,load) {
  const s=.70;
  shadow(c,x+352*s,y,294*s,6);
  c.save(); c.translate(x,y); c.scale(s,s); c.translate(0,-386);
  rollingChassis(c,images[truck[0]],59,195,620,191,tipperHubs,x/s);
  c.drawImage(images[truck[1]],2,27,222,248);
  const pivotX=663,pivotY=201;
  if(angle>.01) {
    const rodX=pivotX-240*Math.cos(angle),rodY=pivotY-240*Math.sin(angle);
    c.strokeStyle="#576361";c.lineWidth=11;c.beginPath();c.moveTo(342,234);c.lineTo(rodX,rodY);c.stroke();
  }
  at(c,pivotX,pivotY,angle,()=>{
    if(load>0) c.drawImage(images[stone],-398+65*(1-load),-174+38*(1-load),370*load,73*load);
    c.drawImage(images[truck[2]],224-pivotX,51-pivotY,457,182);
  });
  c.restore();
}
function leaveDepot(c,images,t) {
  tipper(c,images,335-910*ramp(t,0,1),GROUND,0,0);
}
function deliverGravel(c,images,t) {
  const x=1040-895*ramp(t,0,.33)-760*ramp(t,.84,1);
  const tip=.65*ramp(t,.34,.53)*(1-ramp(t,.69,.81));
  const deposit=ramp(t,.45,.69);
  if(deposit>0) c.drawImage(images[stone],610-76*deposit,GROUND-49*deposit,152*deposit,49*deposit);
  tipper(c,images,x,GROUND,tip,1-deposit);
  if(deposit>0 && deposit<1) {
    for(let i=0;i<16;i++) {
      const u=(t*7+i/16)%1;
      c.drawImage(images[stone],x+461+u*(13+i%5),GROUND-127+u*u*120,8+i%5,6+i%3);
    }
  }
}
function roadway(c,images,left) {
  c.save();
  c.beginPath();
  c.moveTo(left,GROUND+10);
  c.lineTo(left+15,GROUND-12);
  for(let x=left+16;x<1020;x+=16) c.lineTo(x,GROUND-12+Math.sin(x*.05)*2);
  c.lineTo(1020,GROUND+11);
  for(let x=1020;x>left;x-=16) c.lineTo(x,GROUND+11+Math.sin(x*.11)*1.7);
  c.closePath();
  c.fillStyle=c.createPattern(images[surface],"repeat");
  c.fill();c.restore();
}
function gradeLane(c,images,t,leave=0) {
  const advance=ramp(t,.19,.81);
  const x=679-535*advance + 110*ramp(t,.84,1) + leave;
  const scale=.26;
  const contact=679-535*advance;
  // Leave a thin textured road surface behind the blade as the windrow decreases.
  roadway(c,images,contact-6);
  const remaining=1-advance;
  if(remaining>0) c.drawImage(images[stone],contact-146*remaining,GROUND-49*remaining,152*remaining,49*remaining);
  shadow(c,x+185,GROUND,125,6);
  const chassisX=x+421*scale, chassisY=GROUND-500*scale;
  c.drawImage(images[dozer+"chassis.webp"],chassisX,chassisY,1031*scale,500*scale);
  c.drawImage(images[dozer+"cab.webp"],chassisX+525*scale,chassisY-223*scale,390*scale,383*scale);
  const angle=.11*(1-ramp(t,0,.18)+ramp(t,.8,.95));
  at(c,chassisX+442*scale,chassisY+387*scale,angle,()=>{
    c.drawImage(images[dozer+"blade.webp"],-863*scale,-113*scale-25,885*scale,335*scale);
  });
}
// Draw a painted hydraulic link between its two actual pin centres.
function link(c,image,x,y,toX,toY,artWidth,artHeight,ax,ay,bx,by) {
  const rotation=Math.atan2(toY-y,toX-x)-Math.atan2(by-ay,bx-ax);
  const scale=Math.hypot(toX-x,toY-y)/Math.hypot(bx-ax,by-ay);
  at(c,x,y,rotation,()=>c.drawImage(image,-ax*scale,-ay*scale,artWidth*scale,artHeight*scale));
}
function loadTimber(c,images,t) {
  c.save();
  // Keep the nose and the trailing stakes in shot, on the same ground plane as the loader.
  const camera = .825;
  c.translate(10, GROUND*(1-camera)); c.scale(camera,camera);
  roadway(c,images,138);
  const entry=ramp(t,0,.25), close=ramp(t,.49,.65)*(1-ramp(t,1.73,1.85));
  const rise=ramp(t,.65,1), swing=ramp(t,1.04,1.51), lower=ramp(t,1.52,1.72);
  const depart=ramp(t,2.25,3);
  const size=1.50;
  const travel=1040*depart;
  const truckX=548+travel;
  const loadedX=548+113*size, loadedY=GROUND-81*size;
  const gripX=455+(loadedX-455)*swing-65*ramp(t,1.86,2)-120*(1-entry);
  const gripY=250+72*ramp(t,.24,.49)-168*rise+(loadedY-210)*lower-53*ramp(t,1.86,2);
  const machineX=99-120*(1-entry);
  const shoulderX=machineX+244,shoulderY=GROUND-117;
  const dx=gripX-shoulderX,dy=gripY-shoulderY;
  const dist=Math.hypot(dx,dy),u=dx/dist,v=dy/dist;
  const first=216,second=204;
  const along=(first*first-second*second+dist*dist)/(2*dist);
  const height=Math.sqrt(Math.max(0,first*first-along*along));
  const elbowX=shoulderX+along*u+height*v,elbowY=shoulderY+along*v-height*u;

  shadow(c,machineX+145,GROUND,137,6);
  c.drawImage(images["log-handler.webp"],machineX,GROUND-198,292,198);
  shadow(c,truckX+190*size,GROUND,177*size,6);
  c.save();c.translate(truckX+386*size,GROUND);c.scale(-size,size);
  rollingChassis(c,images[carrier],0,-111,386,111,timberHubs,-travel/size);c.restore();
  link(c,images["loader-boom.webp"],shoulderX,shoulderY,elbowX,elbowY,187,119,19,96,168,17);
  link(c,images["loader-stick.webp"],elbowX,elbowY,gripX,gripY,170,61,19,18,153,25);
  for (const [px,py,r] of [[shoulderX,shoulderY,7],[elbowX,elbowY,5],[gripX,gripY,3]]) {
    c.fillStyle="#3f4542";c.beginPath();c.arc(px,py,r,0,2*Math.PI);c.fill();
    c.fillStyle="#c7beb1";c.beginPath();c.arc(px,py,r*.53,0,2*Math.PI);c.fill();
  }
  const lift=t>.64, released=t>=1.73;
  const lx=released ? loadedX+travel : lift ? gripX : 455;
  const ly=released ? loadedY : lift ? gripY+56 : 378;
  // Two logs beneath the load stay on the ground.
  wood(c,images,441,GROUND-4,212,18);
  wood(c,images,452,GROUND-9,209,18);
  // The truck is finishing a load. These lower logs travel with the rack.
  wood(c,images,truckX+113*size,GROUND-62*size,218,29);
  wood(c,images,truckX+113*size,GROUND-68*size,216,26);
  wood(c,images,lx,ly,210,25);
  c.drawImage(images["stake-rack.webp"],truckX+4*size,GROUND-103*size,239*size,56*size);
  if(t>2) {
    c.strokeStyle="#494743"; c.lineWidth=3;
    for (const offset of [-48,49]) {
      c.beginPath();c.moveTo(lx+offset-4,ly-11);c.lineTo(lx+offset,ly+38);c.stroke();
    }
  }
  c.drawImage(images["rotator.webp"],gripX-12,gripY-5,24,34);
  for(const side of [-1,1]) {
    c.save();c.translate(gripX+side*5,gripY+25);c.scale(-side,1);
    c.rotate(.55-.96*close);
    c.drawImage(images["grapple-jaw.webp"],-30,-5,35,42);
    c.restore();
  }
  c.restore();
}
const cache = new Map();
function load(url) {
  if (!cache.has(url)) cache.set(url,new Promise((resolve,reject)=>{
    const image=new Image(); image.onload=()=>resolve(image);
    image.onerror=()=>{cache.delete(url);reject(new Error(url));};image.src=url;
  }));
  return cache.get(url);
}
export function playWorkFilm(canvas,film,asset,{onStart,onError,explicitReplay=false}) {
  const ctx=canvas.getContext("2d"),images={};
  let frame=0,elapsed=0,last=0,disposed=false,observer;
  const reduced=!explicitReplay && matchMedia("(prefers-reduced-motion: reduce)").matches;
  function paint(){
    const w=canvas.clientWidth,h=canvas.clientHeight;
    if(!w || !h) return;
    const dpr=Math.min(devicePixelRatio || 1,2);
    if(canvas.width!==Math.round(w*dpr) || canvas.height!==Math.round(h*dpr)){
      canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
    }
    ctx.setTransform(canvas.width/w,0,0,canvas.height/h,0,0);
    const bg=images[film.background],cover=Math.max(w/bg.width,h/bg.height);
    ctx.drawImage(bg,(w-bg.width*cover)/2,(h-bg.height*cover)/2,bg.width*cover,bg.height*cover);
    const scale=Math.min(w/960,h/480);
    ctx.translate((w-960*scale)/2,(h-480*scale)/2);ctx.scale(scale,scale);
    film.draw(ctx,images,elapsed/film.seconds);
  }
  function tick(now) {
    if(disposed) return;
    if(last) elapsed=Math.min(film.seconds,elapsed+Math.min(.075,(now-last)/1000));
    last=now;paint();
    if(elapsed<film.seconds) frame=requestAnimationFrame(tick);
  }
  Promise.all([film.background,...film.art].map(async file=>{images[file]=await load(asset(file));}))
    .then(()=>{
      if(disposed) return;
      if(reduced) elapsed=film.seconds;
      paint();observer=new ResizeObserver(paint);observer.observe(canvas);
      onStart();if(!reduced) frame=requestAnimationFrame(tick);
    }).catch(()=>{if(!disposed) onError();});
  return ()=>{disposed=true;cancelAnimationFrame(frame);observer?.disconnect();};
}

