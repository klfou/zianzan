"""Fit four matching side-view modules, with the push arm hinged on the track frame."""
import json
from pathlib import Path

from PIL import Image

source = Path(__file__).resolve().parent
out = source.parents[2] / "dist/puzzle/crawler-dozer"
out.mkdir(parents=True, exist_ok=True)
canvas_size = (1100, 620)


def artwork(name):
    image = Image.open(source / name).convert("RGBA")
    image.putalpha(image.getchannel("A").point(lambda a: 0 if a < 14 else min(255, round(a * 255 / 250))))
    return image


def mount(module, anchor, target, scale_x=1, scale_y=None):
    """Register a local landmark to the chassis deck or push-arm pin."""
    scale_y = scale_x if scale_y is None else scale_y
    inverse = (1/scale_x, 0, anchor[0]-target[0]/scale_x,
               0, 1/scale_y, anchor[1]-target[1]/scale_y)
    return module.transform(canvas_size, Image.Transform.AFFINE, inverse, Image.Resampling.BICUBIC)


pivot = (598, 383)
sheet = artwork("side-view-modules.png")
base = mount(sheet.crop((0, 0, 768, 480)), (392, 279), pivot)
engine = mount(sheet.crop((768, 0, 1536, 480)), (71, 387), (371, 310), .49)
cab = mount(sheet.crop((0, 480, 758, 1024)), (600, 459), (924, 296), .65)
blade = mount(artwork("wider-blade.png"), (1754, 420), pivot, .343, .39)

# The deck and rear fender cover the lower mounting lips on both upper modules.
parts = [
    ("crawlerDozerBase", "履带底盘", base),
    ("crawlerDozerEngine", "发动机舱", engine),
    ("crawlerDozerCab", "驾驶室", cab),
    ("crawlerDozerBlade", "推土铲和推架", blade),
]
layers = ["crawlerDozerCab", "crawlerDozerEngine", "crawlerDozerBase", "crawlerDozerBlade"]
by_id = {identifier: layer for identifier, _, layer in parts}
assembled = Image.new("RGBA", canvas_size)
for identifier in layers:
    assembled.alpha_composite(by_id[identifier])
left, top, right, bottom = assembled.getchannel("A").getbbox()
assert 0 < left < right < assembled.width and 0 < top < bottom < assembled.height
items = []
for identifier, label, layer in parts:
    x, y, r, b = layer.getchannel("A").getbbox()
    filename = identifier + ".webp"
    layer.crop((x, y, r, b)).save(out / filename, lossless=True)
    items.append(dict(id=identifier, name=label, file="puzzle/crawler-dozer/"+filename,
                      x=x-left, y=y-top, w=r-x, h=b-y))

model = dict(id="crawler-dozer", name="履带式推土机", width=right-left, height=bottom-top,
             layers=layers, parts=items, intro="crawlerDozerIntro")
(out / "model.json").write_text(json.dumps(model, ensure_ascii=False, indent=2), "utf8")
assembled = assembled.crop((left, top, right, bottom))
preview = assembled.copy()
preview.thumbnail((420, 230), Image.Resampling.LANCZOS)
preview.save(out / "preview.webp", quality=93)

proof = Image.new("RGB", (1250, 430), "#fff3d5")
for i, (_, _, layer) in enumerate(parts):
    tile = layer.crop(layer.getchannel("A").getbbox())
    tile.thumbnail((229, 179), Image.Resampling.LANCZOS)
    x = i % 2 * 250 + (250-tile.width)//2
    y = i // 2 * 215 + (215-tile.height)//2
    proof.paste(tile, (x, y), tile)
assembled.thumbnail((720, 410), Image.Resampling.LANCZOS)
proof.paste(assembled, (500+(750-assembled.width)//2, (430-assembled.height)//2), assembled)
proof.save(source / "parts-preview.jpg", quality=94)
