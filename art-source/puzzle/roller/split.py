"""Separate the cab and the front drum assembly from the rear power unit."""
from pathlib import Path
import json
from PIL import Image, ImageChops, ImageDraw

source = Path(__file__).resolve().parent
out = source.parents[2] / "dist/puzzle/roller"
out.mkdir(parents=True, exist_ok=True)
master = Image.open(source / "master.png").convert("RGBA")
assert master.size == (1884, 835)
alpha = master.getchannel("A").point(lambda v: v if v >= 12 else 0)
master.putalpha(alpha)
# Section boundaries follow the cab sill, engine fender and articulation pin.
cab = [(760,0),(1320,0),(1341,219),(1339,365),(1317,381),(1292,405),
       (1266,434),(1247,466),(1236,484),(798,484),(773,471)]
drum = [(0,251),(784,251),(790,488),(819,506),(799,519),(783,535),
        (773,557),(770,581),(774,599),(786,614),(805,628),(823,632),
        (825,656),(804,700),(795,835),(0,835)]
components=[("rollerCab","驾驶室",cab),("rollerDrum","前钢轮和支架",drum),
            ("rollerDrive","后动力底盘",None)]
remaining=alpha.copy()
parts={}
left, top, right, bottom = alpha.getbbox()
assembled=Image.new("RGBA",master.size)
for identifier, label, points in components:
    mask=remaining
    if points:
        boundary=Image.new("L",master.size)
        ImageDraw.Draw(boundary).polygon(points,fill=255)
        mask=ImageChops.multiply(remaining,boundary)
    remaining=ImageChops.subtract(remaining,mask)
    layer=master.copy()
    layer.putalpha(mask)
    x,y,r,b=mask.getbbox()
    file=identifier+".webp"
    layer.crop((x,y,r,b)).save(out/file,lossless=True)
    assembled.alpha_composite(Image.open(out/file),(x,y))
    parts[identifier]=dict(id=identifier,name=label,file="puzzle/roller/"+file,x=x-left,y=y-top,w=r-x,h=b-y)
assert assembled.getchannel("A").tobytes()==alpha.tobytes()
difference=ImageChops.difference(master.convert("RGB"),assembled.convert("RGB"))
assert all(not ImageChops.multiply(channel,alpha).getbbox() for channel in difference.split())
preview=assembled.crop((left,top,right,bottom))
preview.thumbnail((420,230),Image.Resampling.LANCZOS)
preview.save(out/"preview.webp",quality=93)
order=["rollerDrive","rollerCab","rollerDrum"]
model=dict(id="roller",name="单钢轮压路机",width=right-left,height=bottom-top,layers=order,
           parts=[parts[k] for k in order],intro="rollerIntro")
(out/"model.json").write_text(json.dumps(model,ensure_ascii=False,indent=2),"utf8")
