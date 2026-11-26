"""Trace four components on the native 1774 x 887 side-view painting."""
from pathlib import Path
import json
from PIL import Image, ImageChops, ImageDraw

source = Path(__file__).resolve().parent
out = source.parents[2] / "dist/puzzle/tipper"
out.mkdir(parents=True, exist_ok=True)
master = Image.open(source / "master.png").convert("RGBA")
assert master.size == (1774, 887)
alpha = master.getchannel("A").point(lambda v: v if v >= 12 else 0)
master.putalpha(alpha)

def region(points):
    result = Image.new("L", master.size)
    ImageDraw.Draw(result).polygon(points, fill=255)
    return result

cab = region([(0,0),(530,0),(530,64),(605,76),(624,115),(636,230),
              (634,507),(626,535),(625,555),(620,571),(555,572),(535,545),
              (523,527),(502,511),(486,502),(459,498),(356,498),(320,503),
              (290,515),(264,538),(245,566),(230,602),(215,645),
              (168,645),(160,640),(42,640),(0,638)])
box = region([(532,0),(1774,0),(1774,543),(1627,532),(1583,532),
              (1556,517),(1531,512),(1128,510),(1099,512),(1070,520),
              (1020,520),(1017,473),(851,461),(839,452),(804,385),
              (729,255),(716,260),(694,263),(684,282),(644,270),
              (630,158),(614,86),(532,65)])
ram = region([(680,260),(702,264),(717,259),(729,248),(790,380),
              (808,381),(815,395),(857,493),(873,499),(887,514),
              (902,556),(913,564),(917,586),(752,588),(753,569),
              (762,559),(780,534),(735,426),(731,412),(740,404)])
# Assign each original pixel to exactly one piece, including the anti-aliased edges.
remaining = alpha.copy()
items = []
for identifier, label, mask in [
    ("truckcab","驾驶室",cab),("truckbed","翻斗车厢",box),
    ("trucklift","液压油缸",ram),("truckframe","轮式底盘",None)
]:
    part_alpha = remaining if mask is None else ImageChops.multiply(remaining,mask)
    remaining = ImageChops.subtract(remaining,part_alpha)
    layer = master.copy()
    layer.putalpha(part_alpha)
    bounds = part_alpha.getbbox()
    layer.crop(bounds).save(out/(identifier+".webp"),lossless=True)
    items.append(dict(id=identifier,name=label,file=f"puzzle/tipper/{identifier}.webp",
                      x=bounds[0],y=bounds[1],w=bounds[2]-bounds[0],h=bounds[3]-bounds[1]))
left,top,right,bottom = alpha.getbbox()
order = ["truckframe","truckcab","trucklift","truckbed"]
by_id = {p["id"]:p for p in items}
assembled = Image.new("RGBA",master.size)
for identifier in order:
    p=by_id[identifier]
    assembled.alpha_composite(Image.open(out/(identifier+".webp")),(p["x"],p["y"]))
    p["x"]-=left
    p["y"]-=top
assert assembled.getchannel("A").tobytes() == alpha.tobytes()
preview=assembled.crop((left,top,right,bottom))
preview.thumbnail((420,230),Image.Resampling.LANCZOS)
preview.save(out/"preview.webp",quality=93)
model=dict(id="tipper",name="翻斗车",width=right-left,height=bottom-top,layers=order,parts=[by_id[k] for k in order],intro="truckintro")
(out/"model.json").write_text(json.dumps(model,ensure_ascii=False,indent=2),"utf8")
