"""Register the forklift's four separately illustrated modules at their mounting points."""
import json
from pathlib import Path

from PIL import Image

source = Path(__file__).resolve().parent
out = source.parents[2] / "dist/puzzle/forklift"
out.mkdir(parents=True, exist_ok=True)
sheet = Image.open(source / "master.png").convert("RGBA")
assert sheet.size == (1536, 1024)
sheet.putalpha(sheet.getchannel("A").point(lambda a: 0 if a < 14 else min(255, round(a * 255 / 250))))

# Each cell contains a complete, transparent part. Coordinates in the assembled
# illustration put the cab feet in the footwell and the carriage on the mast.
modules = [
    ("forkliftBody", "车身底盘", (0, 0, 768, 470), (0, 370), (665, 317)),
    ("forkliftStation", "驾驶台", (768, 0, 1536, 470), (225, 149), (426, 388)),
    ("forkliftMast", "升降门架", (0, 470, 768, 1024), (607, 83), (143, 565)),
    ("forkliftForks", "货叉", (768, 470, 1536, 1024), (712, 392), (410, 245)),
]
layers = ["forkliftStation", "forkliftMast", "forkliftBody", "forkliftForks"]
left = min(x for _, _, _, (x, y), size in modules)
top = min(y for _, _, _, (x, y), size in modules)
width = max(x+w for _, _, _, (x, y), (w, h) in modules) - left
height = max(y+h for _, _, _, (x, y), (w, h) in modules) - top
parts = []
bitmaps = {}
for identifier, name, cell, (x, y), (w, h) in modules:
    sprite = sheet.crop(cell)
    sprite = sprite.crop(sprite.getchannel("A").getbbox()).resize((w, h), Image.Resampling.LANCZOS)
    filename = identifier + ".webp"
    sprite.save(out / filename, lossless=True)
    bitmaps[identifier] = sprite
    parts.append(dict(id=identifier, name=name, file="puzzle/forklift/"+filename,
                      x=x-left, y=y-top, w=w, h=h))

model = dict(id="forklift", name="叉车", width=width, height=height, layers=layers,
             parts=parts, intro="forkliftIntro")
(out / "model.json").write_text(json.dumps(model, ensure_ascii=False, indent=2), "utf8")
assembled = Image.new("RGBA", (width, height))
by_id = {p["id"]: p for p in parts}
for identifier in layers:
    p = by_id[identifier]
    assembled.alpha_composite(bitmaps[identifier], (p["x"], p["y"]))
preview = assembled.copy()
preview.thumbnail((420, 230), Image.Resampling.LANCZOS)
preview.save(out / "preview.webp", quality=93)

proof = Image.new("RGB", (1100, 400), "#fff3d5")
for i, part in enumerate(parts):
    thumb = bitmaps[part["id"]].copy()
    thumb.thumbnail((238, 177), Image.Resampling.LANCZOS)
    proof.paste(thumb, (i%2*260+(260-thumb.width)//2, i//2*200+(200-thumb.height)//2), thumb)
assembled.thumbnail((554, 360), Image.Resampling.LANCZOS)
proof.paste(assembled, (520+(580-assembled.width)//2, (400-assembled.height)//2), assembled)
proof.save(source / "parts-preview.jpg", quality=94)
