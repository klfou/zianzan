// The wrist path is choreographed in the original illustration's coordinates.
// Bucket rotation is independent of the stick, as it is on the vehicle.
const poses = [
  // time, wrist x, wrist y, bucket angle (degrees)
  [0, 571, 81, -8],
  [0.065, 582, 113, -32],
  [0.145, 579, 178, -27],
  [0.205, 573, 198, -17],
  [0.285, 558, 198, -1],
  [0.36, 548, 193, 17],
  [0.425, 536, 190, 36],
  [0.505, 526, 181, 61],
  [0.565, 523, 156, 73],
  [0.64, 533, 94, 78],
  [0.7, 564, 83, 74],
  [0.74, 584, 96, 64],
  [0.825, 591, 116, 0],
  [0.92, 591, 117, -51],
  [1, 576, 96, -18],
];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const radians = (d) => (d * Math.PI) / 180;
function ramp(t, a, b) {
  const u = clamp((t - a) / (b - a), 0, 1);
  return u * u * (3 - 2 * u);
}
function slope(i, k) {
  if (!i || i === poses.length - 1) return 0;
  const [p, m, n] = poses.slice(i - 1, i + 2);
  const a = (m[k] - p[k]) / (m[0] - p[0]),
    b = (n[k] - m[k]) / (n[0] - m[0]);
  return a * b > 0 ? (2 * a * b) / (a + b) : 0;
}
function poseAt(t) {
  let i = 1;
  while (i < poses.length - 1 && t > poses[i][0]) i++;
  const a = poses[i - 1],
    b = poses[i],
    span = b[0] - a[0],
    u = clamp((t - a[0]) / span, 0, 1),
    u2 = u * u,
    u3 = u2 * u;
  return [1, 2, 3].map(
    (k) =>
      (2 * u3 - 3 * u2 + 1) * a[k] +
      (u3 - 2 * u2 + u) * span * slope(i - 1, k) +
      (-2 * u3 + 3 * u2) * b[k] +
      (u3 - u2) * span * slope(i, k),
  );
}
const pin = (p) => ({ x: p.x + p.pivot[0], y: p.y + p.pivot[1] });
function transformPoint(x, y, deg, dx, dy) {
  const a = radians(deg);
  return {
    x: x + Math.cos(a) * dx - Math.sin(a) * dy,
    y: y + Math.sin(a) * dx + Math.cos(a) * dy,
  };
}

const ground = 292;
const bank = { left: 471, width: 158, height: 56 };
const tooth = { x: -16, y: 84 }; // Front cutting tooth relative to the bucket pin.
function cuttingPoint(t) {
  const [x, y, angle] = poseAt(t);
  return transformPoint(x, y, angle, tooth.x, tooth.y);
}

// Survey the painted mound once. Each column keeps its texture and loses only
// material above the path swept by the cutting edge.
function soilCut(image) {
  const sample = document.createElement("canvas");
  sample.width = bank.width;
  sample.height = bank.height;
  const read = sample.getContext("2d");
  read.drawImage(image, 0, 0, sample.width, sample.height);
  const rgba = read.getImageData(0, 0, sample.width, sample.height).data;
  const surface = Array.from({ length: bank.width }, (_, i) => {
    let j = 0;
    while (j < bank.height && rgba[(j * bank.width + i) * 4 + 3] < 80) j++;
    return ground - bank.height + j;
  });
  const path = Array.from({ length: 97 }, (_, i) => {
    const time = 0.11 + (i * 0.4) / 96;
    return { time, ...cuttingPoint(time) };
  });
  // Lookup the instant the teeth reach each column and the resulting cut depth.
  const columns = surface.map((top, i) => {
    const x = bank.left + i + 0.5;
    const j = path.findIndex((p, k) => k && path[k - 1].x >= x && p.x <= x);
    if (j < 1) return { top, cut: top, arrival: 1 };
    const a = path[j - 1],
      b = path[j],
      f = (x - a.x) / (b.x - a.x);
    return {
      top,
      cut: clamp(a.y + (b.y - a.y) * f, top, ground - 1),
      arrival: a.time + (b.time - a.time) * f,
    };
  });
  const capacity = columns.reduce((sum, c) => sum + c.cut - c.top, 0);
  return function profile(t) {
    const mask = new Path2D(),
      face = new Path2D();
    mask.moveTo(bank.left, ground + 1);
    let removed = 0,
      previousCut = false;
    columns.forEach((c, i) => {
      // A short bevel lets loosened grains roll into the cut at its leading edge.
      const depth =
        (c.cut - c.top) * ramp(t, c.arrival - 0.005, c.arrival + 0.01);
      removed += depth;
      mask.lineTo(bank.left + i, c.top + depth - 1);
      if (depth > 2) {
        if (previousCut) face.lineTo(bank.left + i, c.top + depth);
        else face.moveTo(bank.left + i, c.top + depth);
      }
      previousCut = depth > 2;
    });
    mask.lineTo(bank.left + bank.width, ground + 1);
    mask.closePath();
    return { mask, face, removed, fill: capacity > 0 ? removed / capacity : 0 };
  };
}

// Draw an irregular, textured cross-section, revealed from the bowl towards
// its open rim. The near yellow cheek and teeth are painted in front.
function bucketLoad(ctx, image, weight) {
  if (weight <= 0) return;
  ctx.save();
  // Fill outwards from the deep part of the bowl, leaving the texture at its original scale.
  ctx.save();
  const size = Math.sqrt(weight);
  ctx.translate(11, 72);
  ctx.scale(size, size);
  ctx.translate(-11, -72);
  ctx.beginPath();
  ctx.moveTo(-18, 79);
  ctx.bezierCurveTo(-24, 72, -30, 62, -30, 53);
  ctx.lineTo(-33, 48);
  ctx.lineTo(-31, 42);
  ctx.lineTo(-32, 37);
  ctx.quadraticCurveTo(-31, 27, -25, 24);
  ctx.lineTo(-22, 20);
  ctx.lineTo(-18, 21);
  ctx.lineTo(-14, 17);
  ctx.quadraticCurveTo(-6, 15, 1, 21);
  ctx.bezierCurveTo(17, 26, 32, 47, 28, 68);
  ctx.quadraticCurveTo(16, 85, -18, 79);
  ctx.closePath();
  ctx.restore();
  ctx.clip();
  ctx.drawImage(
    image,
    image.width * 0.36,
    image.height * 0.49,
    image.width * 0.28,
    image.height * 0.38,
    -35,
    14,
    70,
    73,
  );
  ctx.restore();
}
// Seconds on the haul clock. The first bucket is held from the preceding task.
export function haulAt(seconds) {
  const cycle = seconds < 2.5 ? 0 : seconds < 5.8 ? 1 : 2;
  const phase = cycle === 0
    ? 0.68 + 0.32 * ramp(seconds, .9, 2.5)
    : clamp((seconds - (cycle === 1 ? 2.5 : 5.8)) / 3.3, 0, 1);
  const place = seconds < 10.8 ? "cut-site" : seconds < 13.3 ? "haul-road" : "soil-depot";
  const dumped = ramp(seconds, 15.65, 16.85);
  const tip = ramp(seconds, 15.1, 16.0) * (1 - ramp(seconds, 16.85, 17.7));
  let x;
  if (place === "cut-site") x = 565 + 610 * (1 - ramp(seconds, 0, .95)) + 800 * ramp(seconds, 9.12, 10.8);
  else if (place === "haul-road") x = -540 + 1810 * (seconds - 10.8) / 2.5;
  else x = -540 + 997 * ramp(seconds, 13.3, 15);
  return { cycle, phase, place, x, dumped, tip, load: (cycle + ramp(phase, .84, .97)) / 3 };
}
const truckCues = [
  [0, "翻斗车倒到铲斗下方。"],
  [1.6, "第一斗土装进车厢。"],
  [2.5, "再挖一斗，装在旁边。"],
  [5.8, "最后一斗，装好了。"],
  [9.12, "满载出场，开往收土场。", "onroad"],
  [13.3, "到了收土场，先停稳。", "atdepot"],
  [15.65, "举起车厢，把土卸进堆存区。"],
  [17.0, "收回车厢，准备返程。"],
];
const cues = [
  [0, "斗齿插进土里。"],
  [0.183, "斗杆往回收，铲斗卷起，把泥土兜住。"],
  [0.575, "大臂抬高，把泥土稳稳兜住。"],
  [0.721, "铲斗打开，泥土落下来。"],
];
function loadImage(url) {
  return new Promise((resolve, reject) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = reject;
    im.src = url;
  });
}
export function fieldGame({
  stage,
  model,
  asset,
  onCaption,
  onFinish,
  onVoice,
  truck,
  renderOffline,
}) {
  const canvas = stage.querySelector("canvas"),
    ctx = canvas.getContext("2d");
  const parts = Object.fromEntries(model.parts.map((p) => [p.id, p])),
    images = {};
  const truckScale = 0.72;
  const truckTop = ground - (truck?.height || 0) * truckScale;
  const bedLip = truckTop + 65 * truckScale;
  // The tipper reverses under the raised bucket, then drives to the unloading spot.
  function wristAt(t) {
    const [x, y, angle] = poseAt(t);
    if (!truck) return [x, y, angle];
    const lift = ramp(t, .59, .81);
    const tx = x - 22 * lift, ty = y - 139 * lift;
    const dx = tx - shoulder.x, dy = ty - shoulder.y;
    const reach = Math.min(1, (l1 + l2 - 1) / Math.hypot(dx, dy));
    return [shoulder.x + dx * reach, shoulder.y + dy * reach, angle];
  }
  const shoulder = pin(parts.boom),
    elbow = pin(parts.stick),
    wrist = pin(parts.bucket);
  const l1 = Math.hypot(elbow.x - shoulder.x, elbow.y - shoulder.y),
    l2 = Math.hypot(wrist.x - elbow.x, wrist.y - elbow.y);
  const a0 = Math.atan2(elbow.y - shoulder.y, elbow.x - shoulder.x),
    b0 = Math.atan2(wrist.y - elbow.y, wrist.x - elbow.x);
  let raf,
    observer,
    stopped = false,
    ready = false,
    t = 0,
    lastFrame = 0,
    lastCue = -1,
    bankAt;
  const crumbs = Array.from({ length: 84 }, (_, i) => {
    const grain = Math.sin(i * 78.233) * 43758.5453,
      noise = grain - Math.floor(grain);
    const birth = 0.835 + (i / 84) * 0.094;
    const [x, y, angle] = wristAt(birth),
      mouth = transformPoint(x, y, angle, tooth.x + noise * 8, tooth.y - 3);
    return {
      birth,
      mouth,
      dx: 5 + noise * 23,
      dy: (truck ? bedLip + 12 : ground) - mouth.y - (i / 84) * 23 - (i % 4) * 1.5,
      r: 2 + noise * 4,
      color: ["#986033", "#ad7135", "#754a2e", "#c99350"][i % 4],
    };
  });
  // Accumulate discharged clods where they touch down. Early grains land
  // closer to the machine; the last ones build up the outer end of the heap.
  const deposits = [[], [], []];
  for (const g of crumbs) {
    const landingX = g.mouth.x + g.dx;
    deposits[clamp(Math.floor((landingX - 584) / 28), 0, 2)].push(g);
  }
  const allMass = crumbs.reduce((s, g) => s + g.r * g.r, 0);
  const spills = deposits
    .filter((group) => group.length)
    .map((group) => {
      const mass = group.reduce((s, g) => s + g.r * g.r, 0);
      const center =
        group.reduce((s, g) => s + (g.mouth.x + g.dx) * g.r * g.r, 0) / mass;
      return { group, center };
    });
  const disturbed = Array.from({ length: 12 }, (_, i) => {
    const birth = 0.19 + i * 0.013;
    return {
      birth,
      point: cuttingPoint(birth),
      dx: -(5 + ((i * 7) % 12)),
      height: 2 + ((i * 5) % 6),
      r: 1 + (i % 3) * 0.45,
    };
  });
  function paint(elapsed) {
    const haul = truck && haulAt(elapsed);
    const t = haul ? haul.phase : Math.min(.68, elapsed);
    if (!ready) return;
    const w = canvas.clientWidth,
      h = canvas.clientHeight,
      sceneWidth = truck ? 1110 : 714,
      scale = Math.min((w * 0.94) / sceneWidth, (h * 0.62) / 292);
    const ox = (w - sceneWidth * scale) * 0.5,
      oy = h * 0.81 - 292 * scale;
    ctx.setTransform(canvas.width / w, 0, 0, canvas.height / h, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const scene = haul?.place || "cut-site";
    const backdrop = images[scene];
    const zoom = Math.max(w / backdrop.width, h / backdrop.height);
    ctx.drawImage(backdrop, (w - backdrop.width * zoom) / 2, (h - backdrop.height * zoom) / 2, backdrop.width * zoom, backdrop.height * zoom);
    ctx.translate(ox, oy);
    ctx.scale(scale, scale);
    function pile(x, bottom, width, height) {
      if (width > 0 && height > 0)
        ctx.drawImage(
          images.soil,
          x - width / 2,
          bottom - height,
          width,
          height,
        );
    }
    if (scene === "cut-site") {
      const cut = bankAt(t);
      const inFlightOrLanded = crumbs.reduce(
        (s, g) => s + g.r * g.r * ramp(t, g.birth - 0.004, g.birth + 0.004),
        0,
      );
      const weight = cut.fill * (1 - inFlightOrLanded / allMass);
      if (!truck) for (const { group, center } of spills) {
        const landed = group.reduce(
          (s, g) => s + g.r * g.r * ramp(t, g.birth + 0.053, g.birth + 0.065),
          0,
        );
        const width = Math.sqrt((2 * cut.removed * 2.7 * landed) / allMass);
        pile(center, ground, width, width / 2.7);
      }
      ctx.fillStyle = "#35473528";
      ctx.beginPath();
      ctx.ellipse(177, 290, 181, 9, 0, 0, 2 * Math.PI);
      ctx.fill();
      const [x, y, angle] = wristAt(t),
        dx = x - shoulder.x,
        dy = y - shoulder.y;
      const bend = Math.acos(
        clamp((dx * dx + dy * dy - l1 * l1 - l2 * l2) / (2 * l1 * l2), -1, 1),
      );
      const a =
          Math.atan2(dy, dx) -
          Math.atan2(l2 * Math.sin(bend), l1 + l2 * Math.cos(bend)),
        b = a + bend;
      function draw(id, atX, atY, rotation = 0) {
        const p = parts[id];
        ctx.save();
        ctx.translate(atX, atY);
        ctx.rotate(rotation);
        ctx.drawImage(images[id], -p.pivot[0], -p.pivot[1], p.w, p.h);
        ctx.restore();
      }
      for (const id of ["tracks", "cab"]) {
        const p = pin(parts[id]);
        draw(id, p.x, p.y);
      }
      draw("boom", shoulder.x, shoulder.y, a - a0);
      draw(
        "stick",
        shoulder.x + l1 * Math.cos(a),
        shoulder.y + l1 * Math.sin(a),
        b - b0,
      );
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(radians(angle));
      bucketLoad(ctx, images.soil, weight);
      ctx.restore();
      draw("bucket", x, y, radians(angle));
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(radians(angle));
      ctx.beginPath();
      ctx.moveTo(-29, 29);
      ctx.lineTo(-6, 29);
      ctx.lineTo(8, 64);
      ctx.lineTo(-10, 72);
      ctx.closePath();
      ctx.clip();
      bucketLoad(ctx, images.soil, weight);
      ctx.restore();
      ctx.save();
      // Successive scoops lower the loose bank; it stays cut after the truck leaves.
      const previousDepth = haul ? 8 * haul.cycle : 0;
      ctx.translate(0, previousDepth);
      ctx.beginPath();
      ctx.rect(bank.left, ground - bank.height, bank.width, bank.height - previousDepth);
      ctx.clip();
      ctx.clip(cut.mask);
      ctx.drawImage(
        images.soil,
        bank.left,
        ground - bank.height,
        bank.width,
        bank.height,
      );
      ctx.strokeStyle = "rgba(99,55,25,.46)";
      ctx.lineWidth = 2;
      ctx.stroke(cut.face);
      ctx.restore();
      for (const g of disturbed) {
        const u = (t - g.birth) / 0.047;
        if (u < 0 || u > 1) continue;
        const y =
          g.point.y + (ground - g.point.y) * u * u - g.height * 4 * u * (1 - u);
        ctx.fillStyle = "#946036";
        ctx.beginPath();
        ctx.ellipse(
          g.point.x + g.dx * u,
          y,
          g.r,
          g.r * 0.72,
          u * 2,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
      for (const g of crumbs) {
        const u = (t - g.birth) / 0.062;
        if (u < 0 || u > 1) continue;
        ctx.save();
        ctx.translate(g.mouth.x + g.dx * u, g.mouth.y + g.dy * u * u);
        ctx.rotate(u * 3);
        ctx.fillStyle = g.color;
        ctx.beginPath();
        ctx.moveTo(-g.r, -g.r * 0.24);
        ctx.lineTo(-g.r * 0.26, -g.r * 0.72);
        ctx.lineTo(g.r * 0.62, -g.r * 0.53);
        ctx.lineTo(g.r, g.r * 0.26);
        ctx.lineTo(g.r * 0.13, g.r * 0.7);
        ctx.lineTo(-g.r * 0.72, g.r * 0.43);
        ctx.closePath();
        ctx.fill();
        ctx.clip();
        ctx.drawImage(
          images.soil,
          images.soil.width * 0.34 + g.r * 4,
          images.soil.height * 0.57,
          18,
          13,
          -g.r,
          -g.r,
          2 * g.r,
          2 * g.r,
        );
        ctx.restore();
      }
    }
    if (truck) {
      const {load, dumped, tip, x: truckX} = haul;
      const bed = truck.parts.find(p => p.id === "truckbed");

      // The left-facing art is mirrored so the tailgate meets the excavator.
      ctx.save();
      ctx.translate(truckX + truck.width * truckScale, truckTop);
      ctx.scale(-truckScale, truckScale);
      for (const p of truck.parts) {
        if (p === bed) continue;
        ctx.drawImage(images[p.id], p.x, p.y, p.w, p.h);
      }
      if (tip > 0) {
        const base = {x: bed.x + bed.w * .20, y: bed.y + bed.h + 8};
        const rod = transformPoint(bed.x + bed.w - 18, bed.y + bed.h - 32,
          38 * tip, -bed.w * .53, 8);
        ctx.lineCap = "round";
        ctx.strokeStyle = "#667479";
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.moveTo(base.x, base.y);
        ctx.lineTo(rod.x, rod.y);
        ctx.stroke();
        ctx.strokeStyle = "#3e4846";
        ctx.lineWidth = 17;
        ctx.beginPath();
        ctx.moveTo(base.x, base.y);
        ctx.lineTo((base.x + rod.x) / 2, (base.y + rod.y) / 2);
        ctx.stroke();
      }
      ctx.translate(bed.x + bed.w - 18, bed.y + bed.h - 32);
      ctx.rotate(radians(38 * tip));
      ctx.translate(-bed.x - bed.w + 18, -bed.y - bed.h + 32);
      // The growing pile is behind the near wall of the bed.
      const remaining = load * (1 - dumped);
      pile(bed.x + bed.w * (0.78 - 0.24 * remaining), bed.y + 69,
        bed.w * 0.94 * Math.sqrt(remaining), 105 * Math.sqrt(remaining));
      ctx.drawImage(images.truckbed, bed.x, bed.y, bed.w, bed.h);
      ctx.restore();
      const outlet = transformPoint(bed.x + bed.w - 18, bed.y + bed.h - 32,
        38 * tip, 18, -14);
      const outletX = truckX + (truck.width - outlet.x) * truckScale;
      const outletY = truckTop + outlet.y * truckScale;
      const pileX = truckX - 16;
      if (haul.place === "soil-depot") pile(pileX, ground, 210 * dumped, 66 * dumped);
      if (dumped > 0 && dumped < 1) {
        for (let i = 0; i < 14; i++) {
          const u = (dumped * 2.5 + i / 14) % 1;
          pile(outletX + (pileX-outletX)*u, outletY + (ground-outletY-35*dumped)*u*u, 8+i%5, 6);
        }
      }
    }
    const activeCues = truck ? truckCues : cues;
    const cue = activeCues.findLastIndex((c) => elapsed >= c[0]);
    if (cue !== lastCue) {
      lastCue = cue;
      onCaption(activeCues[cue][1]);
      if (activeCues[cue][2]) onVoice(activeCues[cue][2]);
    }
  }
  function resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(canvas.clientWidth * dpr);
    canvas.height = Math.round(canvas.clientHeight * dpr);
    paint(t);
  }
  function tick(now) {
    if (stopped) return;
    const delta = lastFrame ? Math.min(80, now - lastFrame) : 0;
    lastFrame = now;
    const end = truck ? 18 : 0.71;
    t = Math.min(end, t + delta / (truck ? 1000 : 7600));
    paint(t);
    if (t >= end) {
      onFinish();
      return;
    }
    raf = requestAnimationFrame(tick);
  }
  Promise.all([
    ...[...model.parts, ...(truck?.parts || [])].map(async (p) => {
      images[p.id] = await loadImage(asset(p.file));
    }),
    ...(truck ? ["cut-site", "haul-road", "soil-depot"] : ["cut-site"]).map(async key => {
      images[key] = await loadImage(asset(key + ".webp"));
    }),
    loadImage(asset("soil.png")).then((im) => (images.soil = im)),
  ])
    .then(() => {
      if (stopped) return;
      bankAt = soilCut(images.soil);
      ready = true;
      resize();
      observer = new ResizeObserver(resize);
      observer.observe(canvas);
      if (renderOffline) renderOffline(paint);
      else raf = requestAnimationFrame(tick);
    })
    .catch(() => {
      if (!stopped) {
        onCaption("画面没能加载，请点「再看一遍」重试。");
      }
    });
  return () => {
    stopped = true;
    cancelAnimationFrame(raf);
    observer?.disconnect();
  };
}
