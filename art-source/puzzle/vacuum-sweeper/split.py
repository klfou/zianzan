"""Fit the hopper on the carrier and the two working heads between its axles."""
import json
from pathlib import Path

from PIL import Image

source = Path(__file__).resolve().parent
out = source.parents[2] / "dist/puzzle/vacuum-sweeper"
out.mkdir(parents=True, exist_ok=True)
sheet = Image.open(source / "master.png").convert("RGBA")
assert sheet.size == (1536, 1024)
sheet.putalpha(sheet.getchannel("A").point(lambda a: 0 if a < 14 else min(255, round(a * 255 / 250))))


def cut(cell, scale=1):
    part = sheet.crop(cell)
    part = part.crop(part.getchannel("A").getbbox())
    if scale != 1:
        part = part.resize(tuple(round(n*scale) for n in part.size), Image.Resampling.LANCZOS)
    return part


chassis = cut((0, 0, 780, 530))
# Extend only the straight frame rail between the axles for the pickup equipment.
rail_start, rail_end, extension = 350, 470, 120
carrier = Image.new("RGBA", (chassis.width+extension, chassis.height))
carrier.paste(chassis.crop((0, 0, rail_start, chassis.height)), (0, 0))
rail = chassis.crop((rail_start, 0, rail_end, chassis.height))
carrier.paste(rail.resize((rail.width+extension, rail.height), Image.Resampling.LANCZOS), (rail_start, 0))
carrier.paste(chassis.crop((rail_end, 0, chassis.width, chassis.height)), (rail_end+extension, 0))

modules = [
    ("sweeperChassis", "行驶底盘", carrier, (37, 26)),
    ("sweeperHopper", "集尘箱", cut((780, 0, 1536, 530), .81), (308, 81)),
    ("sweeperBrush", "圆盘刷", cut((0, 530, 780, 1024), .37), (296, 356)),
    ("sweeperNozzle", "吸嘴", cut((780, 530, 1536, 1024), .42), (500, 327)),
]
layers = ["sweeperNozzle", "sweeperChassis", "sweeperHopper", "sweeperBrush"]
left, top = min(x for _, _, _, (x, y) in modules), min(y for _, _, _, (x, y) in modules)
width = max(x+im.width for _, _, im, (x, y) in modules) - left
height = max(y+im.height for _, _, im, (x, y) in modules) - top
items = []
by_id = {}
for identifier, label, image, (x, y) in modules:
    filename = identifier+".webp"
    image.save(out / filename, lossless=True)
    by_id[identifier] = (image, (x-left, y-top))
    items.append(dict(id=identifier, name=label, file="puzzle/vacuum-sweeper/"+filename,
                      x=x-left, y=y-top, w=image.width, h=image.height))
model = dict(id="vacuum-sweeper", name="道路清扫车", width=width, height=height,
             layers=layers, parts=items, intro="sweeperIntro")
(out / "model.json").write_text(json.dumps(model, ensure_ascii=False, indent=2), "utf8")
assembled = Image.new("RGBA", (width, height))
for identifier in layers:
    image, position = by_id[identifier]
    assembled.alpha_composite(image, position)
preview = assembled.copy()
preview.thumbnail((420, 230), Image.Resampling.LANCZOS)
preview.save(out / "preview.webp", quality=93)

proof = Image.new("RGB", (1200, 440), "#fff3d5")
for i, (_, _, image, _) in enumerate(modules):
    thumb = image.copy()
    thumb.thumbnail((222, 178), Image.Resampling.LANCZOS)
    x = i%2*245 + (245-thumb.width)//2
    y = i//2*220 + (220-thumb.height)//2
    proof.paste(thumb, (x, y), thumb)
assembled.thumbnail((678, 408), Image.Resampling.LANCZOS)
proof.paste(assembled, (490+(710-assembled.width)//2, (440-assembled.height)//2), assembled)
proof.save(source / "parts-preview.jpg", quality=94)
