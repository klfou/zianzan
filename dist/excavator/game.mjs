import { playWorkFilm, workFilms } from "./work-films.mjs";
import { fleet, scenes, missionAfterAssembly, checkpoint, record } from "./chapter.mjs";
import { fieldGame } from "./field.mjs";
import {
  lines,
  speak,
  stopVoice,
  setMuted,
  isMuted,
} from "./audio.mjs";
const stage = document.querySelector("#stage"),
  caption = document.querySelector("#caption"),
  listen = document.querySelector("#listen");
const asset = (file) => new URL("./art/" + file, import.meta.url).href;
const route = new URLSearchParams(location.search);
const vehicleId = Object.hasOwn(fleet, route.get("vehicle")) ? route.get("vehicle") : "excavator";
const current = fleet[vehicleId];
const isTruck = vehicleId === "tipper";
const {name: vehicleName, intro, names} = current;
let inStory = route.has("story");
let page = null;
const ids = Object.keys(names);
const paths = {
  back: '<path d="M20 12H4m7-7-7 7 7 7"/>',
  sound: '<path d="M3 9h4l5-4v14l-5-4H3zM16 8q4 4 0 8m3-11q7 7 0 14"/>',
  mute: '<path d="M3 9h4l5-4v14l-5-4H3zM16 9l6 6m0-6-6 6"/>',
  home: '<path d="m3 11 9-8 9 8v9h-6v-6H9v6H3z"/>',
  garage: '<path d="m3 8 9-5 9 5v13H3zM6 11h12M7 21v-7h10v7"/>',
  replay: '<path d="M4 11a8 8 0 1 1 2 6M4 5v6h6"/>',
  arrow: '<path d="M3 12h16m-6-6 6 6-6 6"/>',
  fit: '<path d="M7 3H3v4m14-4h4v4M3 17v4h4m10 0h4v-4M8 12l3 3 5-6"/>',
};
function icon(k) {
  return (
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">' +
    paths[k] +
    "</svg>"
  );
}
const button = (act, label, cls = "pill", ico = "") =>
  `<button type="button" data-act="${act}" class="${cls}" aria-label="${label}" title="${label}">${ico ? icon(ico) : ""}${cls === "round" ? "" : label}</button>`;
let model,
  selected = null,
  drag = null,
  shapeObserver,
  disposeField,
  screen = "",
  lastVoice = "intro",
  modelPromise;
let previewDemo = false,
  demoRun = 0;
let workshopOrigin = "home",
  demoOrigin = "home",
  winOrigin = "home";
const hitMaps = new Map();
const key = "little-builders." + vehicleId + ".v1";
function restore() {
  let s;
  try {
    s = JSON.parse(localStorage.getItem(key));
  } catch {}
  return {
    parts: new Set(
      Array.isArray(s?.parts) ? s.parts.filter((id) => ids.includes(id)) : [],
    ),
    loads: Number.isInteger(s?.loads) ? Math.min(3, Math.max(0, s.loads)) : 0,
    earned: s?.earned === true,
  };
}
const save = restore();
function persist() {
  try {
    localStorage.setItem(
      key,
      JSON.stringify({ ...save, parts: [...save.parts] }),
    );
  } catch {}
}
function say(id, { play = true, text = lines[id] } = {}) {
  lastVoice = id;
  caption.textContent = text;
  if (play) playVoice(id);
}
function playVoice(id) {
  speak(id, () => {
    caption.textContent =
      screen === "field"
        ? "点「再看一遍」重试听讲解。"
        : "点「听一听」重播讲解。";
  });
}
function controls({ home = true, garage = false, count = "" } = {}) {
  return (
    (home
      ? '<div class="tools left">' +
        button("back", "返回", "pill", "back") +
        "</div>"
      : "") +
    '<div class="tools">' +
    count +
    (garage ? button("garage", "回车库", "pill", "garage") : "") +
    button(
      "sound",
      isMuted() ? "开启语音" : "关闭语音",
      "round",
      isMuted() ? "mute" : "sound",
    ) +
    "</div>"
  );
}
function dotBar(done, total) {
  return `<span class="progress-dots" aria-label="已完成 ${done} / ${total}">${Array.from({ length: total }, (_, i) => '<i class="dot ' + (i < done ? "done" : "") + '"></i>').join("")}</span>`;
}
function cleanupDrag() {
  if (!drag) return;
  const d = drag;
  drag = null;
  d.copy?.remove();
  if (d.source.hasPointerCapture?.(d.pid))
    d.source.releasePointerCapture(d.pid);
}
function change(next, keepVoice = false) {
  if (!keepVoice) stopVoice();
  cleanupDrag();
  disposeField?.();
  disposeField = null;
  shapeObserver?.disconnect();
  shapeObserver = null;
  selected = null;
  screen = next;
  listen.innerHTML =
    next === "field" ? icon("replay") + "再看一遍" : icon("sound") + "听一听";
  stage.className = "stage " + next;
  stage.focus({ preventScroll: true });
}
function home() {
  if (location.search) history.replaceState(null, "", location.pathname);
  change("home");
  const resume = checkpoint();
  stage.innerHTML = controls({ home: false, garage: true }) +
    '<h1 class="stage-title">旧木场的第一盏灯</h1><div class="actionbar">' +
    button("chapter", resume === "survey" || resume === "timber" ? "走进荒地" : "继续施工", "action", "arrow") +
    '<a class="pill" href="./story-film/">看完整故事</a>' +
    (resume !== "survey" && resume !== "timber" ? button("begin", "从头看故事", "pill", "replay") : "") + "</div>";
  say("siteVisit", { play: false });
}
function goBench(id, story = false) {
  const url = new URL(location.href);
  url.search = new URLSearchParams({vehicle:id, bench:"1", ...(story ? {story:"1"} : {})});
  location.assign(url);
}
const dispatchSteps = { harvester: "prepareForest", excavator: "dig", tipper: "haul", dozer: "prepareGrade" };
function dispatch(id) {
  if (inStory) record(dispatchSteps[id]);
  goBench(id, inStory);
}
function showPage(step, explicitReplay = false) {
  if (step === "home") { home(); return; }
  const scene = scenes[step];
  if (!scene.art) { dispatch(scene.bench); return; }
  change("story");
  page = step;
  if (inStory) {
    const url = new URL(location.href);
    url.searchParams.set("story", "1");
    url.searchParams.set("page", step);
    history.replaceState(null, "", url);
  }
  if (inStory) record(step);

  const film = workFilms[step];
  const title = `<h1 class="stage-title">${scene.title}</h1>`;
  const actions = '<div class="actionbar">' + button("advance", scene.action, "action", "arrow") + "</div>";
  const target = step === "survey" ? `<button class="scene-target" data-act="advance" style="left:16%;top:50%" aria-label="查看路边的枯树">${icon("fit")}</button>` : "";
  stage.classList.add("work-film");
  stage.innerHTML = `<canvas class="fieldcanvas" aria-label="${scene.title}工作演示"></canvas>` +
    controls() + target + title + actions;
  const canvas = stage.querySelector("canvas");
  listen.innerHTML = icon("replay") + "再看一遍";
  say(scene.voice, { play: false });
  disposeField = playWorkFilm(canvas, film, asset, {
    explicitReplay,
    onStart: () => say(scene.voice),
    onError: () => {
      stage.classList.remove("work-film");
      canvas.outerHTML = `<div class="story-frame"><img src="${asset(scene.art + ".webp")}" alt="${scene.title}"></div>`;
      caption.textContent = "演示没能打开，点「再看一遍」重试。";
    },
  });
}
function advance() {
  const scene = scenes[page];
  if (scene.bench) dispatch(scene.bench);
  else showPage(scene.next);
}
async function vehicleModel() {
  if (current.model) return current.model;
  const r = await fetch(asset(current.file));
  if (!r.ok) throw Error("车辆配置加载失败");
  return r.json();
}
async function prepare() {
  if (!modelPromise) {
    modelPromise = vehicleModel()
      .then(async (m) => {
        await Promise.all(
          m.parts.map(
            (p) =>
              new Promise((resolve, reject) => {
                const im = new Image();
                im.onload = () => {
                  const mask = document.createElement("canvas");
                  mask.width = im.naturalWidth;
                  mask.height = im.naturalHeight;
                  const ctx = mask.getContext("2d");
                  ctx.drawImage(im, 0, 0);
                  hitMaps.set(p.id, {
                    w: mask.width,
                    h: mask.height,
                    rgba: ctx.getImageData(0, 0, mask.width, mask.height).data,
                  });
                  resolve();
                };
                im.onerror = reject;
                im.src = asset(p.file);
              }),
          ),
        );
        model = m;
      })
      .catch((e) => {
        modelPromise = null;
        throw e;
      });
  }
  return modelPromise;
}
async function start({ fresh = false } = {}) {
  workshopOrigin = screen === "garage" ? "garage" : "home";
  if (fresh) {
    save.parts.clear();
    save.loads = 0;
    persist();
  }
  change("loading");
  stage.innerHTML = '<div class="garage-empty">打开车间…</div>';
  say(intro);
  try {
    await prepare();
    if (screen !== "loading") return;
    workshop(false, save.parts.size === ids.length);
  } catch {
    if (screen !== "loading") return;
    stage.innerHTML =
      '<div class="garage-empty">车间还没打开 ' +
      button("start", "再试一次") +
      "</div>";
    caption.textContent = "图片暂时没有加载好，可以重试。";
  }
}
function part(id) {
  return model.parts.find((p) => p.id === id);
}
function pos(p) {
  return `left:${(p.x / model.width) * 100}%;top:${(p.y / model.height) * 100}%;width:${(p.w / model.width) * 100}%;height:${(p.h / model.height) * 100}%`;
}
function center(p) {
  return [p.x + p.w / 2, p.y + p.h / 2];
}
function installedPart(p, hidden = false) {
  return `<img ${hidden ? "hidden" : ""} draggable="false" class="layer installed" data-mounted="${p.id}" alt="${names[p.id]}" style="${pos(p)}" src="${asset(p.file)}">`;
}
function detailStrip() {
  return (
    '<div class="detail-strip" role="group" aria-label="选择要认识的零件">' +
    ids
      .map(
        (id) =>
          `<button type="button" class="chip" data-detail="${id}" aria-pressed="false">${names[id]}</button>`,
      )
      .join("") +
    "</div>"
  );
}
function inspectPart(id) {
  stage.querySelectorAll("[data-mounted]").forEach((im) => {
    im.classList.toggle("part-focus", im.dataset.mounted === id);
    im.classList.toggle("part-muted", im.dataset.mounted !== id);
  });
  stage.querySelectorAll("[data-detail]").forEach((b) => {
    b.classList.toggle("active", b.dataset.detail === id);
    b.setAttribute("aria-pressed", String(b.dataset.detail === id));
  });
  say(id);
}
function readyActions() {
  return detailStrip() + '<div class="actionbar">' +
    button("restart", "再拼一次", "pill", "replay") +
    button("field", "看它工作", "action", "arrow") + "</div>";
}
function vehicle(complete = false) {
  const order = model.layers || ids;
  return (
    '<div class="model-space"><div class="model" role="group" aria-label="' + vehicleName + '拼装台"><span class="model-shadow"></span>' +
    order
      .map((id) => {
        const p = part(id);
        if (complete || save.parts.has(id)) return installedPart(p);
        return installedPart(p, true) + `<span class="layer ghost-wrap" data-ghost="${id}" style="${pos(p)}"><span class="layer silhouette" style="inset:0;mask-image:url('${asset(p.file)}');-webkit-mask-image:url('${asset(p.file)}')"></span></span>`;
      })
      .join("") +
    "</div></div>"
  );
}
function sizeModel() {
  const panel = stage.querySelector(".model-space"),
    elem = panel?.querySelector(".model");
  if (!elem) return;
  const resize = () => {
    const s = Math.min(
      panel.clientWidth / model.width,
      panel.clientHeight / model.height,
    );
    elem.style.width = model.width * s + "px";
    elem.style.height = model.height * s + "px";
  };
  resize();
  shapeObserver = new ResizeObserver(resize);
  shapeObserver.observe(panel);
}
function tray() {
  return (
    '<div class="tray" aria-label="零件盘">' +
    ids
      .map(
        (id) =>
          `<button type="button" class="part" data-id="${id}" aria-label="${names[id]}，${save.parts.has(id) ? "已装好" : "听介绍并选择"}" aria-pressed="false" ${save.parts.has(id) ? "disabled" : ""}><img alt="" draggable="false" src="${asset(part(id).file)}"><span>${names[id]}</span></button>`,
      )
      .join("") +
    "</div>"
  );
}
function workshop(resetCaption = true, finished = false) {
  const url = new URL(location.href);
  url.search = new URLSearchParams({vehicle:vehicleId, bench:"1", ...(inStory ? {story:"1"} : {})});
  history.replaceState(null, "", url);
  change("workshop", !resetCaption);
  const assembled = save.parts.size === ids.length;
  stage.classList.toggle("ready", assembled);
  stage.classList.toggle("finished", finished);
  stage.innerHTML =
    controls({ count: dotBar(save.parts.size, ids.length), garage: assembled }) +
    `<h1 class="stage-title">${finished ? vehicleName + "装好啦" : "拼好" + vehicleName}</h1>` +
    vehicle(assembled) +
    (finished ? readyActions() : assembled
      ? '<div class="actionbar">' + button("restart", "再拼一次", "pill", "replay") +
        button("done", "拼装完成", "action", "fit") + "</div>"
      : '<div class="bench-hint">选一件，拖到它的轮廓里</div>' + tray());
  sizeModel();
  if (assembled) say("ready", { play: resetCaption });
  else if (resetCaption) say(intro, { play: false });
}
function choose(id) {
  if (!ids.includes(id) || save.parts.has(id) || screen !== "workshop") return;
  selected = id;
  stage.querySelector(".tap-target")?.remove();
  stage
    .querySelectorAll("[data-id]")
    .forEach((b) =>
      b.setAttribute("aria-pressed", String(b.dataset.id === id)),
    );
  stage.querySelectorAll("[data-ghost]").forEach((g) => {
    const chosen = g.dataset.ghost === id;
    g.classList.toggle("chosen", chosen);
    g.firstElementChild.classList.toggle("chosen", chosen);
  });
  const [x, y] = center(part(id)),
    target = document.createElement("button");
  target.className = "tap-target";
  target.dataset.act = "install";
  target.setAttribute("aria-label", "安装" + names[id]);
  target.innerHTML = icon("fit");
  target.style.left = (x / model.width) * 100 + "%";
  target.style.top = (y / model.height) * 100 + "%";
  stage.querySelector(".model").append(target);
  stage.querySelector(".bench-hint").textContent =
    "拖到亮起的位置，也可以点一下亮圈";
  say(id);
}
function install() {
  if (!selected || screen !== "workshop") return;
  const id = selected;
  save.parts.add(id);
  persist();
  selected = null;
  stage.querySelector(".tap-target")?.remove();
  stage.querySelector(`[data-ghost="${id}"]`).remove();
  stage.querySelector(`[data-mounted="${id}"]`).hidden = false;
  const tile = stage.querySelector(`[data-id="${id}"]`);
  tile.disabled = true;
  tile.setAttribute("aria-pressed", "false");
  tile.setAttribute("aria-label", names[id] + "，已装好");
  const dots = stage.querySelector(".progress-dots");
  dots.children[save.parts.size - 1].classList.add("done");
  dots.setAttribute("aria-label", `已完成 ${save.parts.size} / ${ids.length}`);
  if (save.parts.size < ids.length) {
    stage.querySelector(".bench-hint").textContent = "选一件，拖到它的轮廓里";
    caption.textContent = names[id] + "装好啦！再选一个零件。";
    stage.querySelector(".part:not(:disabled)")?.focus({ preventScroll: true });
  } else {
    stage.classList.add("ready", "finished");
    stage.querySelector(".tools:not(.left)").insertAdjacentHTML("afterbegin", button("garage", "回车库", "pill", "garage"));
    stage.querySelector(".stage-title").textContent = vehicleName + "装好啦";
    stage.querySelector(".tray").remove();
    stage.querySelector(".bench-hint").remove();
    stage.insertAdjacentHTML("beforeend", readyActions());
    say("ready");
    stage.querySelector("[data-act=field]").focus({ preventScroll: true });
  }
}
async function excavatorModel() {
  const response = await fetch(asset("model.json"));
  if (!response.ok) throw Error("挖掘机加载失败");
  return response.json();
}
async function field(preview = false) {
  if (missionAfterAssembly[vehicleId]) {
    save.earned = true;
    persist();
    showPage(missionAfterAssembly[vehicleId]);
    return;
  }
  if (screen !== "field") demoOrigin = screen;
  const run = ++demoRun;
  previewDemo = preview;
  change("field");
  stage.innerHTML =
    '<canvas class="fieldcanvas" aria-label="挖掘机依次入土、收斗、抬臂和卸土"></canvas>' +
    controls() +
    `<h1 class="stage-title">${isTruck ? "把土石运出工地" : "清出便道的位置"}</h1>`;
  say(isTruck ? "haul" : "roadDig");
  let digger;
  try {
    await prepare();
    digger = isTruck ? await excavatorModel() : model;
  } catch {
    if (screen === "field" && run === demoRun)
      caption.textContent = "车身图片还没准备好，请点「再看一遍」重试。";
    return;
  }
  if (screen !== "field" || run !== demoRun) return;
  disposeField = fieldGame({
    stage,
    asset,
    model: digger,
    truck: isTruck ? model : null,
    onVoice: id => say(id),
    onCaption: (t) => (caption.textContent = t),
    onFinish: () => win(preview),
  });
}
function win(preview) {
  if (screen === "field" && demoOrigin !== "win") winOrigin = demoOrigin;
  if (!preview) {
    if (inStory) record(isTruck ? "returnLoad" : "haul");
    save.earned = true;
    save.loads = 3;
    persist();
  }
  const stoppedFrame = stage.querySelector("canvas");
  change("win");
  stage.innerHTML = controls({ garage: true }) +
    '<h1 class="stage-title">' + (isTruck ? "土石送到收土场" : "请翻斗车来运土") + '</h1><div class="actionbar">' +
    button("watch", "再看一遍", "pill", "replay") +
    (isTruck ? button("gravel", "送碎石回工地", "action", "arrow")
      : button("haul", "叫翻斗车来", "action", "arrow")) + "</div>";
  if (stoppedFrame) stage.prepend(stoppedFrame);
  stage.classList.toggle("truck-end", isTruck);
  say(isTruck ? "atdepot" : "calltruck", { play: !isTruck });
}
function garage() {
  change("garage");
  stage.innerHTML = controls() + '<h1 class="stage-title">木场车库</h1>' +
    '<div class="garage-fleet">' +
    ["harvester","excavator","tipper","dozer"].map(id =>
      `<button type="button" data-garage-vehicle="${id}"><img src="${asset(fleet[id].icon)}" alt="">${fleet[id].name}</button>`
    ).join("") + "</div>" +
    '<div class="actionbar"><a class="legacy" href="./free-build.html">自由拼装</a></div>';
  say(intro, { play: false, text: "选一辆车，打开它的拼装台。" });
}
const handlers = {
  home,
  done: () => workshop(true, true),
  chapter: () => { inStory = true; showPage(checkpoint() === "timber" ? "survey" : checkpoint()); },
  begin: () => { inStory = true; showPage("survey"); },
  advance,
  haul: () => dispatch("tipper"),
  gravel: () => showPage("gravel"),
  back: () => {
    stopVoice();
    if (screen === "story") {
      if (missionAfterAssembly[vehicleId] === page && model) workshop(false, true);
      else if (page === "carry") showPage("grapple");
      else if (page === "grapple") showPage("lane");
      else if (page === "timber") showPage("carry");
      else if (page === "gravel" && isTruck && model) workshop(false, save.parts.size === ids.length);
      else home();
      return;
    }
    if (stage.classList.contains("finished")) {
      workshop(false);
      return;
    }
    const target =
      screen === "field"
        ? demoOrigin
        : screen === "win"
          ? winOrigin
          : screen === "workshop"
            ? workshopOrigin
            : "home";
    if (target === "garage") garage();
    else if (target === "workshop") workshop(false, save.parts.size === ids.length);
    else if (target === "win") workshop(false, save.parts.size === ids.length);
    else home();
  },
  start: () => start(),
  restart: () => start({ fresh: true }),
  garage,
  field,
  watch: () => field(true),
  install,
  sound: () => {
    setMuted(!isMuted());
    const b = stage.querySelector("[data-act=sound]");
    b.outerHTML = button(
      "sound",
      isMuted() ? "开启语音" : "关闭语音",
      "round",
      isMuted() ? "mute" : "sound",
    );
    if (!isMuted()) {
      if (screen === "field") field(previewDemo);
      else playVoice(lastVoice);
    }
  },
};
listen.innerHTML = icon("sound") + "听一听";
listen.onclick = () => {
  if (screen === "story" && workFilms[page]) {
    showPage(page, true);
    return;
  }
  if (screen === "field") {
    field(previewDemo);
    return;
  }
  if (isMuted()) handlers.sound();
  else playVoice(lastVoice);
  caption.textContent = lines[lastVoice];
};
stage.addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (
    !b &&
    (screen === "garage" || stage.classList.contains("ready")) &&
    e.target.closest(".model-space")
  ) {
    for (const im of [...stage.querySelectorAll("[data-mounted]")].reverse()) {
      const r = im.getBoundingClientRect(),
        mask = hitMaps.get(im.dataset.mounted);
      const x = Math.floor(((e.clientX - r.left) / r.width) * mask.w),
        y = Math.floor(((e.clientY - r.top) / r.height) * mask.h);
      if (
        x >= 0 &&
        y >= 0 &&
        x < mask.w &&
        y < mask.h &&
        mask.rgba[(y * mask.w + x) * 4 + 3] > 48
      ) {
        inspectPart(im.dataset.mounted);
        break;
      }
    }
  }
  if (!b || b.disabled) return;
  if (b.dataset.garageVehicle) { goBench(b.dataset.garageVehicle); return; }
  if (b.dataset.act) {
    handlers[b.dataset.act]?.();
    return;
  }
  if (b.dataset.detail) {
    inspectPart(b.dataset.detail);
    return;
  }
  if (b.dataset.id && selected !== b.dataset.id) choose(b.dataset.id);
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
    else caption.textContent = "再靠近亮起的轮廓一点。也可以点一下圆圈安装。";
  }
});
stage.addEventListener("pointercancel", cleanupDrag);
stage.addEventListener("lostpointercapture", (e) => {
  if (drag?.pid === e.pointerId) cleanupDrag();
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    cleanupDrag();
    stopVoice();
  }
});
if (!inStory && Object.hasOwn(workFilms, route.get("preview"))) showPage(route.get("preview"));
else if (inStory && Object.hasOwn(scenes, route.get("page"))) showPage(route.get("page"));
else if (route.has("bench")) start();
else home();
