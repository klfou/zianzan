"""Build the selection pictures and fitted puzzle pieces from the registered vehicle art."""
import json
import math
from pathlib import Path
import subprocess
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"
OUT = DIST / "puzzle"
OUT.mkdir(exist_ok=True)
# Only the approved reference and individually repainted vehicles belong on the shelf.
query = """
import {fleet} from './dist/excavator/chapter.mjs';
import {lines} from './dist/excavator/audio.mjs';
console.log(JSON.stringify([fleet.excavator, lines]));
"""
reference, lines = json.loads(subprocess.check_output(["node", "--input-type=module", "-e", query], cwd=ROOT))
art = DIST / "excavator/art"
model = json.loads((art / reference["file"]).read_text("utf8"))
canvas = Image.new("RGBA", (model["width"], model["height"]))
by_id = {part["id"]: part for part in model["parts"]}
for identifier in model["layers"]:
    part = by_id[identifier]
    bitmap = Image.open(art/part["file"]).convert("RGBA")
    bitmap = bitmap.resize((round(part["w"]),round(part["h"])),Image.Resampling.LANCZOS)
    canvas.alpha_composite(bitmap,(round(part["x"]),round(part["y"])))
    part["file"] = "excavator/art/"+part["file"]
    part["name"] = reference["names"][identifier]
    part.pop("pivot",None)
canvas.thumbnail((420,230),Image.Resampling.LANCZOS)
canvas.save(OUT/"excavator.webp",quality=88)
model.update(id="excavator",name=reference["name"],intro="intro",number=1)
cards=[model]
# Append newly released puzzles here to preserve children's familiar numbers.
for number, identifier in enumerate(["wheel-trencher", "tipper", "mixer", "roller", "loader", "bucket-truck", "crawler-dozer", "forklift", "truck-crane", "vacuum-sweeper", "pump-truck", "timber-truck", "sprinkler-truck", "log-grapple", "paving-machine", "sewer-vacuum-truck", "plow-truck", "scissor-lift", "motor-grader", "skid-steer", "backhoe-loader", "rotary-piling-rig", "twin-drill-jumbo", "port-reach-stacker", "articulated-hauler", "mining-truck", "grain-combine", "reversible-plough", "rice-transplanter", "round-baler", "rear-load-refuse-truck", "hooklift-refuse-truck", "sealed-refuse-tipper", "integral-side-loader", "kitchen-waste-collector", "swing-arm-skip-truck", "front-fork-refuse-truck", "fire-water-tender", "turntable-ladder-engine"], start=2):
    manifest = OUT / identifier / "model.json"
    card=json.loads(manifest.read_text("utf8"))
    assert card["id"] == manifest.parent.name
    card["number"] = number
    cards.append(card)
    (OUT/(card["id"]+".webp")).write_bytes((manifest.parent/"preview.webp").read_bytes())
for card in cards:
    clips = [card["intro"], *(part["id"] for part in card["parts"])]
    for clip in clips:
        if not (DIST / "excavator/audio" / (clip + ".wav")).is_file():
            raise FileNotFoundError(f"{card['id']}: {clip}.wav")
    card["voiceLines"] = {clip: lines[clip] for clip in clips}
(OUT/"vehicles.json").write_text(json.dumps(cards,ensure_ascii=False,separators=(",",":")),"utf8")
print(len(cards),"puzzles")
