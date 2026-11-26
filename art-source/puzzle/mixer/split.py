"""Cut the painted mixer along the cab seal, drum mounts and discharge flange."""
from pathlib import Path
import json
from PIL import Image, ImageChops, ImageDraw

source = Path(__file__).resolve().parent
out = source.parents[2] / "dist/puzzle/mixer"
out.mkdir(parents=True, exist_ok=True)
master = Image.open(source / "master.png").convert("RGBA")
assert master.size == (1774, 887)
alpha = master.getchannel("A").point(lambda v: v if v >= 12 else 0)
master.putalpha(alpha)
# Coordinates are in the master illustration. The steel fenders remain on the chassis.
cab = [(0,0),(585,0),(585,279),(582,320),(583,361),(583,511),(581,546),(577,557),
       (529,558),(516,536),(502,518),(482,503),(458,493),(432,490),(333,490),
       (307,491),(280,499),(257,514),(238,536),(224,564),(204,618),(160,618),
       (148,614),(46,613),(0,612)]
chute = [(1318,65),(1333,98),(1347,129),(1358,169),(1365,208),(1367,246),
         (1363,272),(1355,291),(1364,293),(1347,337),(1332,369),(1384,365),
         (1394,372),(1403,386),(1408,407),(1407,424),(1400,440),(1440,486),
         (1487,527),(1517,548),(1517,740),(1774,740),(1774,0),(1320,0)]
drum = [(578,0),(1774,0),(1774,450),(1411,450),(1389,447),(1386,510),
        (1360,503),(961,503),(925,519),(585,519),(583,493),(578,470)]
components=[("mixerCab","驾驶室",cab),("mixerChute","卸料槽",chute),
            ("mixerDrum","搅拌筒",drum),("mixerFrame","轮式底盘",None)]
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
    parts[identifier]=dict(id=identifier,name=label,file="puzzle/mixer/"+file,x=x-left,y=y-top,w=r-x,h=b-y)
assert assembled.getchannel("A").tobytes()==alpha.tobytes()
difference=ImageChops.difference(master.convert("RGB"),assembled.convert("RGB"))
assert all(not ImageChops.multiply(channel,alpha).getbbox() for channel in difference.split())
preview=assembled.crop((left,top,right,bottom))
preview.thumbnail((420,230),Image.Resampling.LANCZOS)
preview.save(out/"preview.webp",quality=93)
order=["mixerFrame","mixerCab","mixerDrum","mixerChute"]
model=dict(id="mixer",name="混凝土搅拌车",width=right-left,height=bottom-top,layers=order,
           parts=[parts[k] for k in order],intro="mixerIntro")
(out/"model.json").write_text(json.dumps(model,ensure_ascii=False,indent=2),"utf8")
