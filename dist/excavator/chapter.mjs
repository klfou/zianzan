import harvester from "../drag-only/harvester/config.mjs";
import dozer from "../drag-only/dozer/config.mjs";

function workshopModel(source, labels) {
  const left = Math.min(...source.parts.map(p => p.offset[0]));
  const top = Math.min(...source.parts.map(p => p.offset[1]));
  const scale = 0.5;
  const parts = source.parts.map(p => ({
    id: labels[p.id][0], file: "../../drag-only/" + p.file,
    x: (p.offset[0] - left) * scale, y: (p.offset[1] - top) * scale,
    w: p.width * scale, h: p.height * scale,
  }));
  return {
    names: Object.fromEntries(Object.values(labels)),
    model: {
      width: Math.max(...parts.map(p => p.x + p.w)),
      height: Math.max(...parts.map(p => p.y + p.h)),
      parts, layers: source.layers.map(id => labels[id][0]),
    },
  };
}

export const fleet = {
  excavator: {
    name: "挖掘机", intro: "intro", file: "model.json", icon: "cab.png",
    names: { tracks: "履带底盘", cab: "驾驶室和车身", boom: "大臂", stick: "斗杆", bucket: "铲斗" },
  },
  tipper: {
    name: "翻斗车", intro: "truckintro", file: "tipper.json", icon: "truckcab.webp",
    names: { truckframe: "轮式底盘", truckcab: "驾驶室", truckbed: "翻斗车厢" },
  },
  harvester: {
    name: "伐木机", intro: "fellIntro", icon: "../../drag-only/harvester/boom.webp",
    ...workshopModel(harvester, { chassis: ["forestFrame","轮式底盘"], cab: ["forestCab","驾驶室"], boom: ["forestBoom","采伐臂与采伐头"] }),
  },
  dozer: {
    name: "推土机", intro: "grade", icon: "../../drag-only/dozer/blade.webp",
    ...workshopModel(dozer, { chassis: ["dozerFrame","履带底盘"], cab: ["dozerCab","驾驶室"], blade: ["blade","推土板"] }),
  },
};

// Story pages describe the state of the plot. Multiple pages can dispatch the
// same vehicle without resetting its assembly or creating a second garage slot.
export const scenes = {
  survey: { title: "从哪里开进去？", art: "lot", voice: "siteVisit", action: "从老路边开始伐木", bench: "harvester" },
  fell: { title: "清出入口", art: "felling", voice: "forestBoom", action: "去看原木", next: "logs" },
  logs: { title: "树倒了，车还进不来", art: "cut-logs", voice: "felled", action: "请挖掘机清土石", bench: "excavator" },
  prepareForest: { bench: "harvester" },
  prepareGrade: { bench: "dozer" },
  dig: { bench: "excavator" },
  haul: { bench: "tipper" },
  returnLoad: { title: "同一辆车，再跑一趟", art: "soil-depot", voice: "gravel", action: "送碎石回工地", next: "gravel" },
  gravel: { title: "碎石送到了", art: "gravel-delivery", voice: "gravel", action: "请推土机铺路", bench: "dozer" },
  grade: { title: "铺一条施工便道", art: "grading", voice: "grade", action: "看看便道", next: "lane" },
  lane: { title: "便道通了", art: "access-lane", voice: "grapple", action: "让抓木车进场", next: "grapple" },
  grapple: { title: "把原木抓起来", art: "grapple-arrives", voice: "woodArm", action: "把原木装上车", next: "carry" },
  carry: { title: "把原木码上车", art: "grip", voice: "woodRack", action: "运木车出发", next: "timber" },
  timber: { title: "第一车木料出发了", art: "wood-truck", voice: "timber", action: "回到工地入口", next: "home" },
};
export const missionAfterAssembly = {harvester: "fell", dozer: "grade"};
export const chapterKey = "little-builders.story-yard.clearance.v2";
export function checkpoint() {
  try { const step = localStorage.getItem(chapterKey); return Object.hasOwn(scenes, step) ? step : "survey"; }
  catch { return "survey"; }
}
export function record(step) {
  if (Object.hasOwn(scenes, step)) {
    try { localStorage.setItem(chapterKey, step); } catch {}
  }
}

