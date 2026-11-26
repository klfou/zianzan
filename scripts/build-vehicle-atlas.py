"""Export a registered vehicle atlas, its puzzle manifest and an assembly proof."""
import argparse
import json
import math
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw

root = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument("vehicle", help="directory name under art-source/puzzle")
vehicle = parser.parse_args().vehicle
source = root / "art-source/puzzle" / vehicle
out = root / "dist/puzzle" / vehicle
config = json.loads((source / "assembly.json").read_text("utf-8-sig"))
sheet = Image.open(source / config.get("sheet", "master.png")).convert("RGBA")
sheet.putalpha(sheet.getchannel("A").point(lambda v: 0 if v < 14 else min(255, round(v*255/250))))
out.mkdir(parents=True, exist_ok=True)

parts = []
images = {}
painted_sprays = []
for entry in config["parts"]:
    # Positions specify the visible upper-left corner after transparent padding
    # is removed. Each part keeps its original aspect ratio.
    if "hardwareOutline" in entry:
        # Split the painted working attachment at the nozzle lips. Keep the
        # resulting water registered to the very same artwork as the dry tile.
        original = Image.open(source / entry["file"]).convert("RGBA")
        alpha = original.getchannel("A").point(lambda v: 0 if v < 14 else v)
        mask = Image.new("L", original.size)
        ImageDraw.Draw(mask).polygon([tuple(p) for p in entry["hardwareOutline"]], fill=255)
        sprite = original.copy()
        sprite.putalpha(ImageChops.multiply(alpha, mask))
        original.putalpha(ImageChops.subtract(alpha, sprite.getchannel("A")))
        water_box = original.getchannel("A").getbbox()
        hardware_box = sprite.getchannel("A").getbbox()
        scale = entry["scale"]
        water = original.crop(water_box)
        water = water.resize(tuple(round(n*scale) for n in water.size), Image.Resampling.LANCZOS)
        wx, wy = (p + round((w-h)*scale) for p,w,h in zip(entry["position"], water_box, hardware_box))
        painted_sprays.append((water, wx, wy))
    else:
        sprite = sheet.crop(entry["cell"])
    if "pin" in entry:
        # Paint the captive pin on its own module; it remains visible through
        # the matching eye when both modules are mounted.
        pin = entry["pin"]
        cap = sheet.crop(pin["source"]).resize(tuple(pin["size"]), Image.Resampling.LANCZOS)
        mask = Image.new("L", cap.size)
        ImageDraw.Draw(mask).ellipse((0, 0, cap.width-1, cap.height-1), fill=255)
        cap.putalpha(mask)
        sprite.alpha_composite(cap, tuple(pin["position"]))
    sprite = sprite.crop(sprite.getchannel("A").getbbox())
    if "extendRail" in entry:
        start, end, extra = entry["extendRail"]
        stretched = Image.new("RGBA", (sprite.width + extra, sprite.height))
        rail = sprite.crop((start, 0, end, sprite.height))
        stretched.paste(sprite.crop((0, 0, start, sprite.height)), (0, 0))
        stretched.paste(rail.resize((rail.width + extra, rail.height), Image.Resampling.LANCZOS), (start, 0))
        stretched.paste(sprite.crop((end, 0, sprite.width, sprite.height)), (end + extra, 0))
        sprite = stretched
    if entry.get("mirror"):
        sprite = sprite.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    if entry.get("angle"):
        sprite = sprite.rotate(entry["angle"], Image.Resampling.BICUBIC, expand=True)
        sprite = sprite.crop(sprite.getchannel("A").getbbox())
    scale = entry["scale"]
    size = tuple(round(n * scale) for n in sprite.size)
    sprite = sprite.resize(size, Image.Resampling.LANCZOS)
    key = entry["id"]
    images[key] = sprite
    filename = key + ".webp"
    sprite.save(out / filename, lossless=True)
    x, y = entry["position"]
    parts.append(dict(id=key, name=entry["name"], file=f"puzzle/{vehicle}/{filename}",
                      x=x, y=y, w=sprite.width, h=sprite.height))

left = min(part["x"] for part in parts)
top = min(part["y"] for part in parts)
for part in parts:
    part["x"] -= left
    part["y"] -= top
width = max(p["x"]+p["w"] for p in parts)
height = max(p["y"]+p["h"] for p in parts)
layers = config["layers"]
by_id = {p["id"]: p for p in parts}
assert len(parts) == len(layers) == len(by_id) and set(layers) == set(by_id)
model = dict(id=vehicle, name=config["name"], width=width, height=height,
             parts=parts, layers=layers, intro=config["intro"])
assembled = Image.new("RGBA", (width, height))
for key in layers:
    p = by_id[key]
    assembled.alpha_composite(images[key], (p["x"], p["y"]))
if "spray" in config:
    spray = config["spray"]
    fan = Image.open(source / spray["file"]).convert("RGBA")
    wet_layers = []
    for jet in spray["jets"]:
        x, y = jet["nozzle"]
        dx, dy = jet["end"][0] - x, jet["end"][1] - y
        angle = math.atan2(dy, -dx)
        scaled = fan.resize((round(math.hypot(dx, dy)), jet["breadth"]), Image.Resampling.LANCZOS)
        rotated = scaled.rotate(math.degrees(angle), Image.Resampling.BICUBIC, expand=True)
        # The painted fan converges close to the middle of its right edge.
        tip = scaled.width * (spray["tip"][0] - .5)
        offset = scaled.height * (spray["tip"][1] - .5)
        anchor_x = rotated.width/2 + math.cos(angle)*tip + math.sin(angle)*offset
        anchor_y = rotated.height/2 - math.sin(angle)*tip + math.cos(angle)*offset
        wet_layers.append((rotated, round(x-anchor_x), round(y-anchor_y)))
    wet_layers = painted_sprays + [(assembled, left, top)] + wet_layers
    x0 = min(x for _, x, y in wet_layers)
    y0 = min(y for _, x, y in wet_layers)
    x1 = max(x + img.width for img, x, y in wet_layers)
    y1 = max(y + img.height for img, x, y in wet_layers)
    assembled = Image.new("RGBA", (x1-x0, y1-y0))
    for img, x, y in wet_layers:
        assembled.alpha_composite(img, (x-x0, y-y0))
    assembled = assembled.crop(assembled.getchannel("A").getbbox())
    assembled.save(out / "washing.webp", quality=95)
    model["completedView"] = f"puzzle/{vehicle}/washing.webp"
(out / "model.json").write_text(json.dumps(model, ensure_ascii=False, indent=2), "utf8")
preview = assembled.copy()
preview.thumbnail((420, 230), Image.Resampling.LANCZOS)
preview.save(out / "preview.webp", quality=93)

proof = Image.new("RGB", (1170, 420), "#fff3d5")
columns = 1 if len(parts) <= 3 else 2
rows = (len(parts)+columns-1)//columns
tray_width = 300 if columns == 1 else 460
cell_w, cell_h = tray_width//columns, proof.height//rows
for i, part in enumerate(parts):
    tile = images[part["id"]].copy()
    tile.thumbnail((cell_w-20, cell_h-14), Image.Resampling.LANCZOS)
    proof.paste(tile, (i%columns*cell_w+(cell_w-tile.width)//2,
                       i//columns*cell_h+(cell_h-tile.height)//2), tile)
assembled.thumbnail((proof.width-tray_width-30, proof.height-30), Image.Resampling.LANCZOS)
proof.paste(assembled, (tray_width+(proof.width-tray_width-assembled.width)//2,
                         (proof.height-assembled.height)//2), assembled)
proof.save(source / "parts-preview.jpg", quality=94)
