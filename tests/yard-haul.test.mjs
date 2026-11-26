import test from "node:test";
import assert from "node:assert/strict";
import { haulAt } from "../dist/excavator/field.mjs";
import { fleet, scenes } from "../dist/excavator/chapter.mjs";
import { workFilms } from "../dist/excavator/work-films.mjs";
import { existsSync } from "node:fs";

test("each illustrated chapter stop has a working film and locally available art", () => {
  const illustrated = Object.entries(scenes).filter(([, scene]) => scene.art);
  for (const [step] of illustrated) {
    const film = workFilms[step];
    assert.ok(film, step);
    assert.equal(typeof film.draw, "function");
    assert.ok(film.seconds > 0);
    for (const file of [film.background, ...film.art]) {
      assert.ok(existsSync(new URL("../dist/excavator/art/" + file, import.meta.url)), file);
    }
  }
});

test("three loads accumulate before departure; unloading begins only when parked at the depot", () => {
  for (const [seconds, load] of [[2.5, 1/3], [5.8, 2/3], [9.1, 1]]) {
    assert.equal(haulAt(seconds).load, load);
    assert.equal(haulAt(seconds).place, "cut-site");
  }
  assert.equal(haulAt(12).place, "haul-road");
  for (let i = 0; i <= 180; i++) {
    const frame = haulAt(i / 10);
    if (frame.place !== "cut-site") assert.equal(frame.load, 1);
    if (frame.tip || frame.dumped) {
      assert.equal(frame.place, "soil-depot");
      assert.equal(frame.x, haulAt(18).x);
    }
  }
  assert.equal(haulAt(18).dumped, 1);
  assert.equal(haulAt(18).tip, 0);
});

test("forestry opens the plot and the timber loader follows the graded access road", () => {
  assert.equal(scenes.survey.bench, "harvester");
  assert.equal(scenes.fell.next, "logs");
  assert.equal(scenes.logs.bench, "excavator");
  assert.equal(scenes.gravel.bench, "dozer");
  assert.equal(scenes.grade.next, "lane");
  assert.equal(scenes.lane.next, "grapple");
  for (const scene of Object.values(scenes)) {
    if (scene.next && scene.next !== "home") assert.ok(scenes[scene.next]);
    if (scene.bench) assert.ok(fleet[scene.bench]);
  }
});
