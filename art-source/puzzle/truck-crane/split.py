"""Register four intact crane modules using the slew ring, boom hinge and head sheave."""
import json
from pathlib import Path

from PIL import Image

source = Path(__file__).resolve().parent
out = source.parents[2] / "dist/puzzle/truck-crane"
out.mkdir(parents=True, exist_ok=True)
sheet = Image.open(source / "master.png").convert("RGBA")
assert sheet.size == (1536, 1024)
sheet.putalpha(sheet.getchannel("A").point(lambda a: 0 if a < 14 else min(255, round(a * 255 / 250))))

# Anchors on this sheet are in original image coordinates. Moving a parent also
# moves the joint to which its child fits. Uniform scales preserve the artwork.
def mounted_point(point, anchor, target, scale):
    return tuple(round(t + (p-a)*scale) for p, a, t in zip(point, anchor, target))


ring = (920, 560)
upper_foot = (1170, 420)
upper_scale = .68
hinge = mounted_point((1265, 237), upper_foot, ring, upper_scale)
heel = (790, 890)
boom_scale = 1.10
sheave = mounted_point((81, 630), heel, hinge, boom_scale)
modules = [
    ("truckCraneCarrier", "行驶底盘", (0, 0, 890, 500), (666, 259), ring, 1),
    ("truckCraneTurret", "回转平台", (890, 0, 1536, 500), upper_foot, ring, upper_scale),
    ("truckCraneBoom", "伸缩吊臂", (0, 500, 900, 1024), heel, hinge, boom_scale),
    ("truckCraneHook", "钢丝绳和吊钩", (900, 500, 1536, 1024), (1215, 523), sheave, .48),
]
layers = ["truckCraneCarrier", "truckCraneHook", "truckCraneBoom", "truckCraneTurret"]
parts = []
images = {}
for identifier, label, cell, anchor, target, scale in modules:
    layer = sheet.crop(cell)
    bounds = layer.getchannel("A").getbbox()
    corner = (cell[0]+bounds[0], cell[1]+bounds[1])
    x, y = mounted_point(corner, anchor, target, scale)
    layer = layer.crop(bounds)
    width, height = (round(length*scale) for length in layer.size)
    images[identifier] = layer.resize((width, height), Image.Resampling.LANCZOS)
    filename = identifier + ".webp"
    images[identifier].save(out / filename, lossless=True)
    parts.append(dict(id=identifier, name=label, file="puzzle/truck-crane/"+filename,
                      x=x, y=y, w=width, h=height))

left, top = min(p["x"] for p in parts), min(p["y"] for p in parts)
for p in parts:
    p["x"] -= left
    p["y"] -= top
width, height = max(p["x"]+p["w"] for p in parts), max(p["y"]+p["h"] for p in parts)
model = dict(id="truck-crane", name="汽车起重机", width=width, height=height,
             layers=layers, parts=parts, intro="truckCraneIntro")
(out / "model.json").write_text(json.dumps(model, ensure_ascii=False, indent=2), "utf8")
assembled = Image.new("RGBA", (width, height))
by_id = {p["id"]: p for p in parts}
for identifier in layers:
    p = by_id[identifier]
    assembled.alpha_composite(images[identifier], (p["x"], p["y"]))
preview = assembled.copy()
preview.thumbnail((420, 230), Image.Resampling.LANCZOS)
preview.save(out / "preview.webp", quality=93)

proof = Image.new("RGB", (1200, 450), "#fff3d5")
for i, part in enumerate(parts):
    thumb = images[part["id"]].copy()
    thumb.thumbnail((227, 185), Image.Resampling.LANCZOS)
    x = i%2*248+(248-thumb.width)//2
    y = i//2*225+(225-thumb.height)//2
    proof.paste(thumb, (x, y), thumb)
assembled.thumbnail((674, 425), Image.Resampling.LANCZOS)
proof.paste(assembled, (496+(704-assembled.width)//2, (450-assembled.height)//2), assembled)
proof.save(source / "parts-preview.jpg", quality=94)
