"""Fit the timber semi-trailer to the fifth wheel and seat its loaded rack."""
import json
from pathlib import Path

from PIL import Image, ImageDraw

source = Path(__file__).resolve().parent
out = source.parents[2] / "dist/puzzle/timber-truck"
out.mkdir(parents=True, exist_ok=True)
sheet = Image.open(source / "master.png").convert("RGBA")
assert sheet.size == (1536, 1024)
sheet.putalpha(sheet.getchannel("A").point(lambda a: 0 if a < 14 else min(255, round(a * 255 / 250))))

tractor = sheet.crop((0, 0, 625, 550))
trailer = sheet.crop((625, 0, 1536, 550))
rack = sheet.crop((0, 550, 1536, 1024))

# Two steel saddles support the middle and rear bunks at the height of the
# raised front of the semi-trailer. Reuse its bolted V-shaped frame bracket.
seat = sheet.crop((995, 313, 1080, 384))
profile = Image.new("L", seat.size)
ImageDraw.Draw(profile).polygon([(0,0),(84,0),(84,20),(72,20),(53,64),(48,70),
                                 (39,70),(35,65),(16,20),(0,20)], fill=255)
seat.putalpha(profile)
seat = seat.resize((76, 52), Image.Resampling.LANCZOS)
for center in (1088, 1434):
    trailer.alpha_composite(seat, (center-625-seat.width//2, 264))

# Keep all wheels at their painted diameter. The kingpin sits over the fifth
# wheel and the loaded bunk's bottom rail rests on the trailer's three seats.
modules = [
    ("timberTractor", "牵引车", tractor, (0, 0), 1),
    ("timberTrailer", "挂车底盘", trailer, (625+467-712, 7), 1),
    ("timberBunks", "载木架", rack, (373, 36), .585),
]
parts = []
images = {}
for identifier, label, image, (x, y), scale in modules:
    bounds = image.getchannel("A").getbbox()
    x += round(bounds[0]*scale)
    y += round(bounds[1]*scale)
    image = image.crop(bounds)
    if scale != 1:
        image = image.resize(tuple(round(n*scale) for n in image.size), Image.Resampling.LANCZOS)
    images[identifier] = image
    filename = identifier + ".webp"
    image.save(out / filename, lossless=True)
    parts.append(dict(id=identifier, name=label, file="puzzle/timber-truck/"+filename,
                      x=x, y=y, w=image.width, h=image.height))

left, top = min(p["x"] for p in parts), min(p["y"] for p in parts)
for p in parts:
    p["x"] -= left
    p["y"] -= top
width, height = max(p["x"]+p["w"] for p in parts), max(p["y"]+p["h"] for p in parts)
layers = ["timberTrailer", "timberTractor", "timberBunks"]
model = dict(id="timber-truck", name="运木车", width=width, height=height,
             layers=layers, parts=parts, intro="timberIntro")
(out / "model.json").write_text(json.dumps(model, ensure_ascii=False, indent=2), "utf8")
assembled = Image.new("RGBA", (width, height))
by_id = {p["id"]: p for p in parts}
for identifier in layers:
    p = by_id[identifier]
    assembled.alpha_composite(images[identifier], (p["x"], p["y"]))
preview = assembled.copy()
preview.thumbnail((420, 230), Image.Resampling.LANCZOS)
preview.save(out / "preview.webp", quality=93)

proof = Image.new("RGB", (1170, 426), "#fff3d5")
for i, part in enumerate(parts):
    thumb = images[part["id"]].copy()
    thumb.thumbnail((286, 126), Image.Resampling.LANCZOS)
    proof.paste(thumb, ((318-thumb.width)//2, i*142+(142-thumb.height)//2), thumb)
assembled.thumbnail((828, 390), Image.Resampling.LANCZOS)
proof.paste(assembled, (318+(852-assembled.width)//2, (426-assembled.height)//2), assembled)
proof.save(source / "parts-preview.jpg", quality=94)
