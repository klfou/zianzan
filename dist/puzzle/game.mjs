import { speak, stopVoice, setMuted, isMuted } from "../excavator/audio.mjs?v=ladder-basket";

const stage = document.querySelector("#stage");
const bar = document.querySelector(".speechbar");
const caption = document.querySelector("#caption");
const pageSize = 6;
const groups = [
  {id:"construction", name:"工程车辆"},
  {id:"farm", name:"农用车辆"},
  {id:"sanitation", name:"环卫车辆"},
  {id:"transport", name:"运输车辆"},
  {id:"special", name:"特种车辆"},
  {id:"rescue", name:"消防救援"},
];
const groupMembers = {
  rescue:["fire-water-tender","turntable-ladder-engine"],
  farm:["grain-combine","reversible-plough","rice-transplanter","round-baler","high-clearance-sprayer"],
  sanitation:["vacuum-sweeper","sprinkler-truck","sewer-vacuum-truck","plow-truck","rear-load-refuse-truck","hooklift-refuse-truck","sealed-refuse-tipper","integral-side-loader","kitchen-waste-collector","swing-arm-skip-truck","front-fork-refuse-truck"],
  transport:["tipper","timber-truck","articulated-hauler","mining-truck"],
  special:["forklift","truck-crane","bucket-truck","scissor-lift","log-grapple","port-reach-stacker"],
};
function groupId(vehicle) {
  return Object.keys(groupMembers).find(key => groupMembers[key].includes(vehicle.id)) || "construction";
}
let currentGroup, shelfVehicles;
let shelfPage = 1, swipe = null, suppressShelfClick = false;
let vehicles, model, ids, names, selected, drag, observer, voice, placed;
const asset = file => new URL("../" + file, import.meta.url).href;
const iconPaths = {
  home:'<path d="m2.5 10.5 9.5-8 9.5 8M5 9v12h5v-7h4v7h5V9"/>',
  grid:'<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
  right:'<path d="m9 5 7 7-7 7"/>', left:'<path d="m15 5-7 7 7 7"/>',
  reset:'<path d="M4 11a8 8 0 1 1 2 7M4 5v6h6"/>',
  lock:'<rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  play:'<path d="m8 4 12 8-12 8z" fill="currentColor" stroke="none"/>',
  pause:'<path d="M8 5v14m8-14v14" stroke-width="4"/>',
  sound:'<path d="m3 9 4 0 5-4v14l-5-4H3zM16 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
  silent:'<path d="m3 9 4 0 5-4v14l-5-4H3zM16 9l5 6m0-6-5 6"/>',
  check:'<path d="m4 12 5 5L20 6"/>',
  parts:'<path d="M3 8h6V5a2 2 0 1 1 4 0v3h6v5h-2a2 2 0 1 0 0 4h2v4H3z"/>',
};
function icon(name) {
  return `<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconPaths[name]}</svg>`;
}
const homeLink = `<a class="control home-link" href="${location.pathname}" aria-label="主页" title="主页">${icon("home")}</a>`;
function thumb(vehicle) { return asset("puzzle/"+vehicle.id+".webp"); }
const previewSize = 3;
const previewTimers = new Map();
let previewRun = 0;
let previewsPaused = matchMedia("(prefers-reduced-motion: reduce)").matches;
try {
  const choice = localStorage.getItem("little-builders.pause-previews");
  if (choice !== null) previewsPaused = choice === "1";
} catch {}
function previewSlots(members) {
  return members.slice(0,previewSize).map(v =>
    `<span class="preview-slot"><img src="${thumb(v)}" alt="" draggable="false"></span>`
  ).join("");
}
function stopPreviews() {
  previewRun++;
  previewTimers.forEach(timer => clearTimeout(timer));
  previewTimers.clear();
  stage.querySelectorAll(".preview-leaving").forEach(img => img.remove());
  stage.querySelectorAll(".preview-entering").forEach(img => img.classList.remove("preview-entering"));
}
function schedulePreviews() {
  stopPreviews();
  const toggle = stage.querySelector("[data-act=previews]");
  if (!toggle) return;
  const label = previewsPaused ? "播放轮播" : "暂停轮播";
  toggle.innerHTML = icon(previewsPaused ? "play" : "pause") + `<span>${label}</span>`;
  toggle.setAttribute("aria-label",label);
  if (previewsPaused || document.hidden) return;
  const run = previewRun;
  stage.querySelectorAll("a.group-card").forEach(card => {
    const members = vehicles.filter(v => groupId(v) === card.dataset.group);
    if (members.length <= previewSize) return;
    const frame = card.querySelector(".category-preview");
    function queueNextPage() {
      previewTimers.set(frame,setTimeout(advance,3000 + Math.random()*3000));
    }
    async function advance() {
      const swaps = Number(frame.dataset.swaps);
      const slot = frame.querySelectorAll(".preview-slot")[swaps % previewSize];
      const next = new Image();
      next.alt = "";
      next.draggable = false;
      next.src = thumb(members[(previewSize+swaps) % members.length]);
      try { await next.decode(); } catch {
        if (run === previewRun) queueNextPage();
        return;
      }
      if (run !== previewRun || !frame.isConnected) return;
      const previous = slot.lastElementChild;
      slot.append(next);
      frame.dataset.swaps = swaps+1;
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) previous.remove();
      else {
        previous.className = "preview-leaving";
        next.className = "preview-entering";
        previous.addEventListener("animationend", () => previous.remove(), {once:true});
      }
      queueNextPage();
    }
    queueNextPage();
  });
}

function savedParts(vehicle) {
  try {
    const state = JSON.parse(localStorage.getItem("little-builders." + vehicle.id + ".v1"));
    const saved = new Set(Array.isArray(state?.parts) ? state.parts : []);
    if (vehicle.id === "turntable-ladder-engine" && saved.has("turnLadderLift")) {
      saved.add("turnLadderBoom");
      saved.add("turnLadderBasket");
    }
    if (vehicle.id === "fire-water-tender" && saved.has("fireTenderChassis")) {
      saved.add("fireTenderFrame");
      saved.add("fireTenderCab");
    }
    if (vehicle.id === "swing-arm-skip-truck" && saved.has("swingSkipCarrier")) {
      saved.add("swingSkipChassis");
      saved.add("swingSkipArms");
    }
    if (vehicle.id === "reversible-plough" && saved.has("revPloughBase") && saved.has("revPloughCab")) {
      saved.add("revPloughTractor");
    }
    if (vehicle.id === "sprinkler-truck" && (state?.partCount ?? 3) === 3 &&
        ["sprinklerCab", "sprinklerTank", "sprinklerDeck"].every(id => saved.has(id))) {
      saved.add("sprinklerJets");
    }
    if (vehicle.id === "crawler-dozer" && !state.partCount && saved.has("crawlerDozerBase")) {
      // The original power base contained both the undercarriage and engine.
      saved.add("crawlerDozerEngine");
    }
    if (vehicle.id === "roller" && saved.has("rollerFrame") && saved.has("rollerTire")) {
      saved.add("rollerDrive");
    }
    return new Set(vehicle.parts.filter(p => saved.has(p.id)).map(p => p.id));
  } catch { return new Set(); }
}
function persist() {
  try {
    const key = "little-builders." + model.id + ".v1";
    const previous = JSON.parse(localStorage.getItem(key)) || {};
    localStorage.setItem(key, JSON.stringify({...previous, partCount:model.parts.length, parts:[...placed]}));
    if (placed.size && placed.size < model.parts.length) localStorage.setItem("little-builders.last-puzzle", model.id);
  } catch {}
}
function pageOf(vehicle) { return Math.floor(shelfVehicles.indexOf(vehicle)/pageSize)+1; }
function pageLink(page) {
  if (!currentGroup) return "?shelf="+page;
  return "?group="+currentGroup.id+(page > 1 ? "&shelf="+page : "");
}
function vehicleLink(vehicle) {
  return "?vehicle="+vehicle.id+(currentGroup ? "&group="+groupId(vehicle) : "");
}
function navigate(url) {
  history.pushState(null, "", url);
  openRoute();
  stage.focus({preventScroll:true});
}

function groupHome() {
  observer?.disconnect();
  bar.hidden = true;
  stage.className = "shelf group-home";
  document.title = "车辆拼装乐园 · 小小工程队";
  const progressById = new Map(vehicles.map(v => [v.id, savedParts(v).size]));
  const unfinished = vehicles.filter(v => progressById.get(v.id) > 0 && progressById.get(v.id) < v.parts.length);
  let recent;
  try { recent = localStorage.getItem("little-builders.last-puzzle"); } catch {}
  const resume = unfinished.find(v => v.id === recent) || unfinished[0];
  const cards = groups.map(group => {
    const members = vehicles.filter(v => groupId(v) === group.id);
    const finished = members.filter(v => progressById.get(v.id) === v.parts.length).length;
    const status = members.length ? `${members.length} 辆 · 已拼 ${finished} 辆` : "待开放";
    const content = `<div class="category-caption"><div><strong>${group.name}</strong><small>${status}</small></div>${icon(members.length ? "right" : "lock")}</div>
      <div class="category-preview" data-swaps="0" aria-hidden="true">${members.length ? `<div class="preview-batch">${previewSlots(members)}</div>` : `<img class="upcoming-vehicle" src="${asset("puzzle/categories/rescue.webp")}" alt="">`}</div>`;
    return members.length
      ? `<a class="group-card" data-group="${group.id}" href="?group=${group.id}">${content}</a>`
      : `<div class="group-card upcoming" data-group="${group.id}" aria-disabled="true">${content}</div>`;
  });
  stage.innerHTML = `<header class="home-nav"><div class="brand"><img src="${asset("excavator/art/icon.png")}" alt="">小小工程队</div><div class="home-actions"><button class="control preview-toggle" data-act="previews" type="button"></button><a class="control all-vehicles" href="?shelf=1">${icon("grid")}全部车辆</a></div></header>
    <section class="home-hero"><div><h1>我的车库</h1>${resume ? `<a class="resume" href="?vehicle=${resume.id}&group=${groupId(resume)}">${icon("play")}继续拼 · ${resume.name}</a>` : "<p>点一个分类，挑辆车来拼吧。</p>"}</div><img class="hero-truck" src="${thumb(resume || vehicles[0])}" alt=""></section>
    <div class="group-cards">${cards.join("")}</div>`;
  schedulePreviews();
}

function shelfCards(page) {
  return shelfVehicles.slice((page-1)*pageSize, page*pageSize).map(v => {
    const count = savedParts(v).size;
    const note = count === v.parts.length ? "已拼好" : count ? "已拼 "+count+"/"+v.parts.length : v.parts.length+" 块";
    return `<a class="vehicle-card${v.id==="rotary-piling-rig"?" tall-rig":""}" data-group="${groupId(v)}" href="${vehicleLink(v)}"><div class="parking-bay"><span class="vehicle-number" aria-label="${v.number}号">${v.number}</span><img alt="" draggable="false" src="${thumb(v)}"></div><div class="vehicle-label"><strong>${v.name}</strong><small>${icon(count === v.parts.length ? "check" : "parts")}${note}</small></div></a>`;
  }).join("");
}
function shelf(page) {
  observer?.disconnect();
  const pages = Math.ceil(shelfVehicles.length/pageSize);
  page = Math.max(1, Math.min(Number.isSafeInteger(page) ? page : 1, pages));
  shelfPage = page;
  stage.className = "shelf garage";
  bar.hidden = true;
  stage.innerHTML = `<header class="garage-nav"><div class="tools">${homeLink}<a class="control" href="${location.pathname}">${icon("left")}分类</a></div><div class="header-title"><h1>${currentGroup?.name || "全部车辆"}</h1></div><small class="garage-count">${shelfVehicles.length} 辆车</small></header><div class="shelf-window"><div class="shelf-track"><div class="cards">${shelfCards(page)}</div></div></div>`;
}
function prepareNeighbor(track, direction) {
  const page = shelfPage + direction;
  const neighbor = track.querySelector(".shelf-neighbor");
  if (neighbor?.dataset.shelf === String(page)) return true;
  neighbor?.remove();
  if (page < 1 || page > Math.ceil(shelfVehicles.length / pageSize)) return false;
  const panel = document.createElement("div");
  panel.className = "cards shelf-neighbor";
  panel.dataset.shelf = page;
  panel.inert = true;
  panel.setAttribute("aria-hidden", "true");
  panel.style.left = direction * 100 + "%";
  panel.innerHTML = shelfCards(page);
  track.append(panel);
  return true;
}

function settleShelf(track, page) {
  if (track.dataset.settling) return;
  track.dataset.settling = "true";
  const direction = page - shelfPage;
  const end = `translateX(${-direction * 100}%)`;
  function done() {
    if (!track.isConnected) return;
    if (direction) {
      navigate(pageLink(page));
    } else {
      track.style.transform = "";
      track.querySelector(".shelf-neighbor")?.remove();
      delete track.dataset.settling;
    }
  }
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) { done(); return; }
  const start = track.style.transform || "translateX(0px)";
  track.style.transform = end;
  track.animate([{transform:start},{transform:end}], {
    duration: direction ? 250 : 170, easing:"cubic-bezier(.22,.72,.25,1)"
  }).onfinish = done;
}

function turnShelfPage(page) {
  const track = stage.querySelector(".shelf-track");
  if (!track || track.dataset.settling || Math.abs(page - shelfPage) !== 1) return;
  if (prepareNeighbor(track, page - shelfPage)) settleShelf(track, page);
}
document.addEventListener("keydown", e => {
  if (!stage.classList.contains("garage") || e.altKey || e.ctrlKey || e.metaKey) return;
  if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
    e.preventDefault();
    turnShelfPage(shelfPage + (e.key === "ArrowRight" ? 1 : -1));
  }
});

stage.addEventListener("pointerdown", e => {
  suppressShelfClick = false;
  const track = stage.querySelector(".shelf-track");
  if (!track || !track.contains(e.target) || track.dataset.settling || !e.isPrimary || e.button !== 0) return;
  swipe = { id: e.pointerId, x: e.clientX, y: e.clientY, track, offset: 0 };
});
stage.addEventListener("dragstart", e => {
  if (stage.classList.contains("shelf")) e.preventDefault();
});
stage.addEventListener("pointermove", e => {
  if (swipe?.id !== e.pointerId) return;
  const dx = e.clientX - swipe.x;
  if (!suppressShelfClick) {
    if (Math.abs(dx) < 8 || Math.abs(dx) <= Math.abs(e.clientY - swipe.y) * 1.25) return;
    suppressShelfClick = true;
    stage.setPointerCapture(e.pointerId);
  }
  const track = swipe.track;
  const direction = dx < 0 ? 1 : -1;
  const available = prepareNeighbor(track, direction);
  swipe.offset = available ? Math.min(Math.abs(dx), track.clientWidth) * Math.sign(dx)
                           : Math.min(Math.abs(dx) * .18, 28) * Math.sign(dx);
  track.style.transform = `translateX(${swipe.offset}px)`;
});
function releaseShelf(e) {
  if (swipe?.id !== e.pointerId) return;
  const {track, offset, x, y} = swipe;
  swipe = null;
  if (!suppressShelfClick) {
    const card = e.target.closest(".vehicle-card");
    if (card && e.pointerType === "touch" && e.type === "pointerup" &&
        Math.hypot(e.clientX-x, e.clientY-y) < 8) {
      navigate(card.href);
    }
    return;
  }
  const change = e.type === "pointerup" && Math.abs(offset) >= Math.min(65, track.clientWidth * .14);
  settleShelf(track, change ? shelfPage - Math.sign(offset) : shelfPage);
}
stage.addEventListener("pointerup", releaseShelf);
stage.addEventListener("pointercancel", releaseShelf);
stage.addEventListener("lostpointercapture", e => {
  if (e.target === stage) releaseShelf(e);
});

function vehicleVoice() {
  return {clip:model.intro, text:model.voiceLines[model.intro]};
}
function partVoice(p) {
  return {clip:p.id, text:model.voiceLines[p.id]};
}
function silence() {
  stopVoice();
  window.speechSynthesis?.cancel();
}
function playDescription() {
  if(!voice || isMuted())return;
  silence();
  const current=voice;
  const unavailable=()=>{if(current===voice)caption.textContent=current.text+"　点「听介绍」重听。";};
  speak(current.clip,unavailable);
}
function setMessage(text, description=vehicleVoice()) {
  voice=description;
  caption.textContent=text;
}
function displayMute() {
  const mute = stage.querySelector("#puzzle-mute");
  mute.innerHTML=icon(isMuted()?"silent":"sound");
  mute.setAttribute("aria-label",isMuted()?"开启声音":"静音");
  mute.title=isMuted()?"开启声音":"静音";
  mute.setAttribute("aria-pressed",String(isMuted()));
}
const part = id => model.parts.find(p => p.id===id);
function pos(p) {
  return `left:${100*p.x/model.width}%;top:${100*p.y/model.height}%;width:${100*p.w/model.width}%;height:${100*p.h/model.height}%`;
}
function layoutModel() {
  observer?.disconnect();
  const panel=stage.querySelector(".model-space"), elem=panel.querySelector(".model");
  function resize() {
    const scale=Math.min(panel.clientWidth/model.width,panel.clientHeight/model.height);
    elem.style.width=model.width*scale+"px";
    elem.style.height=model.height*scale+"px";
  }
  resize();
  observer=new ResizeObserver(resize);
  observer.observe(panel);
}
function drawVehicle() {
  const layers=model.layers.map(id=>{
    const p=part(id), src=asset(p.file);
    return `<img draggable="false" class="layer installed" data-mounted="${id}" alt="${names[id]}" style="${pos(p)}" src="${src}" ${placed.has(id)?"":"hidden"}>`+
      (placed.has(id)?"":`<span class="layer ghost-wrap" data-ghost="${id}" style="${pos(p)}"><span class="layer silhouette" style="inset:0;mask-image:url('${src}');-webkit-mask-image:url('${src}')"></span></span>`);
  });
  if(model.foreground){
    const f=model.foreground,p=part(f.part);
    const inset = f.insetPercent ? f.insetPercent.map(n => n + "%").join(" ")
      : f.heightFraction == null ? `0 ${100*(1-f.fraction)}% 0 0` : `0 0 ${100*(1-f.heightFraction)}% 0`;
    layers.push(`<img class="layer installed" data-front alt="" hidden draggable="false" src="${asset(p.file)}" style="${pos(p)};clip-path:inset(${inset})">`);
  }
  return '<div class="model-space"><div class="model"><span class="model-shadow"></span>'+layers.join("")+'</div></div>';
}
function syncFront() {
  if(model.foreground)stage.querySelector("[data-front]").hidden=!(placed.has(model.foreground.part)&&placed.has(model.foreground.withPart));
}
function renderBench(announce = true) {
  selected=null;
  const complete=placed.size===ids.length;
  stage.className="stage workshop"+(model.id==="rotary-piling-rig"?" tall-rig":"")+(complete?" ready finished":"");
  bar.hidden=false;
  stage.innerHTML=`<header class="bench-nav"><div class="tools">${homeLink}<a class="control" href="${pageLink(pageOf(model))}">${icon("left")}选车</a><button type="button" class="control reset-puzzle" data-act="reset">${icon("reset")}重置</button></div>
    <div class="header-title"><h1 class="stage-title"></h1><span class="progress-dots" role="status"></span></div>
    <div class="audio-tools"><button id="listen" class="control listen" type="button">${icon("play")}听介绍</button><button id="puzzle-mute" class="control" type="button" aria-label="静音"></button></div></header>`+drawVehicle();
  if(complete)finish();
  else{
    stage.querySelector("h1").textContent=model.name;
    stage.insertAdjacentHTML("beforeend",`<section class="parts-dock"><header><strong>${icon("parts")}零件盘</strong><small>拖动零件，或点零件再点亮处</small></header><div class="tray" aria-label="零件盘" style="--count:${ids.length}">`+model.parts.map(p=>`<button type="button" class="part" data-id="${p.id}" aria-pressed="false" ${placed.has(p.id)?"disabled":""}><img alt="" draggable="false" src="${asset(p.file)}"><span>${p.name}</span></button>`).join("")+"</div></section>");
    setMessage(vehicleVoice().text);
  }
  progress();syncFront();layoutModel();displayMute();
  if (announce) playDescription();
}
function progress() {
  stage.querySelector("[data-act=reset]").disabled = !placed.size && !selected;
  const dots=stage.querySelector(".progress-dots");
  dots.setAttribute("aria-label",`已拼 ${placed.size} / ${ids.length}`);
  dots.innerHTML=ids.map((_,i)=>`<i class="dot ${i<placed.size?"done":""}"></i>`).join("");
}
function finish() {
  stage.classList.add("ready","finished");
  stage.querySelector("h1").textContent=model.name+"拼好啦";
  stage.querySelector(".parts-dock")?.remove();
  if (model.completedView) {
    const dry = stage.querySelector(".model");
    const image = new Image();
    image.className = "completed-vehicle";
    image.alt = model.name;
    image.draggable = false;
    image.onload = () => {
      dry.hidden = true;
      dry.after(image);
    };
    image.src = asset(model.completedView);
  }
  const index = vehicles.indexOf(model);
  const choices = [-1,1].map(step => {
    const target = vehicles[(index+step+vehicles.length) % vehicles.length];
    const forward = step === 1;
    const label = forward ? "下一辆车" : "上一辆车";
    return `<a class="vehicle-choice ${forward ? "next-vehicle" : "previous-vehicle"}" href="${vehicleLink(target)}" aria-label="${label}，${target.name}">
      <img src="${thumb(target)}" alt="" draggable="false">
      ${icon(forward ? "right" : "left")}
    </a>`;
  });
  stage.insertAdjacentHTML("beforeend", `<nav class="actionbar" aria-label="选择相邻车辆">${choices.join("")}</nav>`);
  setMessage("拼好啦！");
}
function choose(id) {
  if(placed.has(id))return;
  selected=id;
  stage.querySelector("[data-act=reset]").disabled=false;
  const p=part(id);
  stage.querySelectorAll("[data-id]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.id===id)));
  stage.querySelectorAll("[data-ghost]").forEach(g=>{
    const active=g.dataset.ghost===id;
    g.classList.toggle("chosen",active);
    g.firstElementChild.classList.toggle("chosen",active);
  });
  stage.querySelector(".tap-target")?.remove();
  const button=document.createElement("button");
  button.className="tap-target";button.dataset.act="install";
  button.setAttribute("aria-label","安装"+p.name);button.textContent="＋";
  button.style.left=100*(p.x+p.w/2)/model.width+"%";
  button.style.top=100*(p.y+p.h/2)/model.height+"%";
  stage.querySelector(".model").append(button);
  const description=partVoice(p);
  setMessage(description.text,description);
  playDescription();
}
function install() {
  if(!selected||placed.has(selected))return;
  const id=selected;
  selected=null;placed.add(id);persist();
  stage.querySelector(".tap-target")?.remove();
  stage.querySelector(`[data-ghost="${id}"]`).remove();
  const mounted=stage.querySelector(`[data-mounted="${id}"]`);
  mounted.hidden=false;
  mounted.classList.add("just-mounted");
  const tile=stage.querySelector(`[data-id="${id}"]`);
  tile.disabled=true;tile.setAttribute("aria-pressed","false");
  syncFront();progress();
  if(placed.size===ids.length){
    finish();
    stage.querySelector(".next-vehicle").focus({preventScroll:true});
  }else{
    setMessage(names[id]+"装好啦。");
    stage.querySelector(".part:not(:disabled)")?.focus({preventScroll:true});
  }
}
function cleanupDrag() {
  if(!drag)return;
  const d=drag;drag=null;d.copy?.remove();
  if(d.source.hasPointerCapture(d.pid))d.source.releasePointerCapture(d.pid);
}
// Test the painted silhouette, allowing a small halo for fingers on thin links and arms.
const hitMasks = new WeakMap();
function touchesSelectedPart(x,y) {
  const image = stage.querySelector(`[data-mounted="${selected}"]`);
  if (!image?.naturalWidth) return false;
  const rect = stage.querySelector(`[data-ghost="${selected}"]`).getBoundingClientRect();
  const halo = 8;
  if (x < rect.left-halo || x > rect.right+halo || y < rect.top-halo || y > rect.bottom+halo) return false;
  let mask = hitMasks.get(image);
  if (!mask) {
    const canvas = document.createElement("canvas");
    const scale = Math.min(1,384/Math.max(image.naturalWidth,image.naturalHeight));
    canvas.width = Math.max(1, Math.round(image.naturalWidth*scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight*scale));
    const context = canvas.getContext("2d");
    context.drawImage(image,0,0,canvas.width,canvas.height);
    mask = context.getImageData(0,0,canvas.width,canvas.height);
    hitMasks.set(image,mask);
  }
  const sx = mask.width/rect.width, sy = mask.height/rect.height;
  const localX = x-rect.left, localY = y-rect.top;
  for (let row=Math.max(0,Math.floor((localY-halo)*sy));row<Math.min(mask.height,(localY+halo)*sy);row++) {
    for (let col=Math.max(0,Math.floor((localX-halo)*sx));col<Math.min(mask.width,(localX+halo)*sx);col++) {
      if (mask.data[(row*mask.width+col)*4+3]>64) return true;
    }
  }
  return false;
}
stage.addEventListener("click",e=>{
  if ((suppressShelfClick && e.detail !== 0) || stage.querySelector(".shelf-track[data-settling]")) {
    suppressShelfClick = false;
    e.preventDefault();
    return;
  }
  const link=e.target.closest("a[href]");
  if(link && e.button===0 && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey){
    e.preventDefault();
    navigate(link.href);
    return;
  }
  const b=e.target.closest("button");
  if (!b && selected && e.target.closest(".model-space") && touchesSelectedPart(e.clientX,e.clientY)) {
    install();
    return;
  }
  if(!b||b.disabled)return;
  if (b.id === "listen") {
    setMuted(false); displayMute(); caption.textContent=voice.text; playDescription();
    return;
  }
  if (b.id === "puzzle-mute") {
    setMuted(!isMuted()); displayMute();
    if (isMuted()) silence(); else playDescription();
    return;
  }
  if (b.dataset.act === "previews") {
    previewsPaused = !previewsPaused;
    try { localStorage.setItem("little-builders.pause-previews",previewsPaused?"1":"0"); } catch {}
    schedulePreviews();
    return;
  }
  if(b.dataset.id&&selected!==b.dataset.id)choose(b.dataset.id);
  if(b.dataset.act==="install")install();
  if (b.dataset.act === "reset") {
    cleanupDrag();
    silence();
    placed.clear();
    persist();
    renderBench(false);
    setMessage("零件都回到零件盘啦。");
    stage.querySelector(".part").focus({preventScroll:true});
  }
});
stage.addEventListener("pointerdown", (e) => {
  const b = e.target.closest(".part:not(:disabled)");
  if (!b || drag || !e.isPrimary || e.button !== 0) return;
  choose(b.dataset.id);
  b.setPointerCapture(e.pointerId);
  const im = b.querySelector("img"),
    r = im.getBoundingClientRect(),
    p = part(b.dataset.id),
    s = Math.min(r.width / p.w, r.height / p.h);
  const grip = (point, start, size) =>
    Math.max(0.1, Math.min(0.9, (point - start) / size));
  drag = {
    source: b,
    pid: e.pointerId,
    id: p.id,
    startX: e.clientX,
    startY: e.clientY,
    gx: grip(e.clientX, r.left + (r.width - p.w * s) / 2, p.w * s),
    gy: grip(e.clientY, r.top + (r.height - p.h * s) / 2, p.h * s),
  };
});
stage.addEventListener("pointermove", (e) => {
  if (!drag || e.pointerId !== drag.pid) return;
  if (
    !drag.copy &&
    Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) < 5
  )
    return;
  const p = part(drag.id),
    r = stage
      .querySelector('[data-ghost="' + drag.id + '"]')
      .getBoundingClientRect();
  if (!drag.copy) {
    drag.copy = new Image();
    drag.copy.src = asset(p.file);
    drag.copy.className = "drag-copy";
    document.body.append(drag.copy);
  }
  Object.assign(drag.copy.style, {
    width: r.width + "px",
    height: r.height + "px",
    left: e.clientX - drag.gx * r.width + "px",
    top: e.clientY - drag.gy * r.height + "px",
  });
});
stage.addEventListener("pointerup", (e) => {
  if (!drag || e.pointerId !== drag.pid) return;
  const d = drag,
    r = stage
      .querySelector('[data-ghost="' + d.id + '"]')
      .getBoundingClientRect();
  const close =
    Math.hypot(
      e.clientX - (r.left + d.gx * r.width),
      e.clientY - (r.top + d.gy * r.height),
    ) <= Math.max(34, Math.min(75, r.width * 0.31));
  cleanupDrag();
  if (d.copy) {
    if (close) install();
    else caption.textContent = "再靠近亮起的轮廓一点。也可以点一下加号安装。";
  }
});
stage.addEventListener("pointercancel", cleanupDrag);
stage.addEventListener("lostpointercapture", (e) => {
  if (drag?.pid === e.pointerId) cleanupDrag();
});
document.addEventListener("visibilitychange", () => {
  schedulePreviews();
  if (document.hidden) {
    cleanupDrag();
    silence();
  }
});

function openRoute(){
  stopPreviews();
  swipe = null;
  silence();
  cleanupDrag();
  const query=new URLSearchParams(location.search);
  if (query.get("vehicle") === "side-load-refuse-truck") {
    query.set("vehicle", "sealed-refuse-tipper");
    history.replaceState(null, "", "?" + query.toString());
  }
  model=vehicles.find(v=>v.id===query.get("vehicle"));
  currentGroup = groups.find(g => g.id === query.get("group") && (!model || groupId(model) === g.id));
  shelfVehicles = currentGroup ? vehicles.filter(v => groupId(v) === currentGroup.id) : vehicles;
  if(model){
    document.title=model.name+"拼图 · 小小工程队";
    placed=savedParts(model);
    ids=model.parts.map(p=>p.id);
    names=Object.fromEntries(model.parts.map(p=>[p.id,p.name]));
    renderBench();
  }else if (!query.has("vehicle") && shelfVehicles.length && (currentGroup || query.has("shelf"))) {
    const requested=Number(query.get("shelf"));
    shelf(requested);
    document.title=(currentGroup?.name || "全部车辆")+" · 小小工程队";
  }else {
    groupHome();
  }
}
window.addEventListener("popstate",()=>{if(vehicles)openRoute();});
window.addEventListener("pagehide",silence);
try {
  const response=await fetch(asset("puzzle/vehicles.json?catalog=numbered"), {cache:"no-store"});
  if(!response.ok)throw Error("catalog");
  vehicles=await response.json();
  if (!vehicles.length || !vehicles.every((vehicle,i)=>vehicle.number===i+1)) {
    throw Error("Invalid numbered catalog");
  }
  openRoute();
} catch {
  stage.innerHTML='<p class="garage-empty">拼图暂时没打开。<a href="">重新打开</a></p>';
}
