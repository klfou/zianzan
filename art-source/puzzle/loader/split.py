"""Separate the wheel loader into its three functional assemblies."""
from pathlib import Path
import json
from PIL import Image, ImageChops, ImageDraw

source = Path(__file__).resolve().parent
out = source.parents[2] / "dist/puzzle/loader"
out.mkdir(parents=True, exist_ok=True)
master = Image.open(source / "master.png").convert("RGBA")
assert master.size == (1884, 835)
alpha = master.getchannel("A").point(lambda v: v if v >= 12 else 0)
master.putalpha(alpha)
# The lower seam of the cab sits on the running board above the rear axle.
cab = [(1018,0),(1514,0),(1521,233),(1523,382),(1465,383),(1444,389),
       (1427,398),(1390,433),(1374,449),(1034,451),(1026,445),(1019,414)]
# Trace the boom above the mudguard. Keep the bucket, both rams and the
# complete linkage together so the front wheels stay on the power chassis.
boom = [(0,85),(1017,85),(1017,432),(1027,459),(1032,471),(1030,488),
        (1021,496),(954,496),(941,490),(921,468),(892,438),(870,416),
        (849,402),(814,397),(774,397),(719,401),(700,408),(682,422),
        (659,424),(648,420),(610,449),(556,475),(473,498),(422,515),
        (384,535),(0,560)]
components=[("wheelLoaderCab","驾驶室",cab),("wheelLoaderLift","动臂和铲斗",boom),
            ("wheelLoaderFrame","动力底盘",None)]
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
    parts[identifier]=dict(id=identifier,name=label,file="puzzle/loader/"+file,x=x-left,y=y-top,w=r-x,h=b-y)
assert assembled.getchannel("A").tobytes()==alpha.tobytes()
difference=ImageChops.difference(master.convert("RGB"),assembled.convert("RGB"))
assert all(not ImageChops.multiply(channel,alpha).getbbox() for channel in difference.split())
preview=assembled.crop((left,top,right,bottom))
preview.thumbnail((420,230),Image.Resampling.LANCZOS)
preview.save(out/"preview.webp",quality=93)
order=["wheelLoaderFrame","wheelLoaderCab","wheelLoaderLift"]
model=dict(id="loader",name="轮式装载机（铲车）",width=right-left,height=bottom-top,layers=order,
           parts=[parts[k] for k in order],intro="wheelLoaderIntro")
(out/"model.json").write_text(json.dumps(model,ensure_ascii=False,indent=2),"utf8")
