"""Separate the bucket truck into its three functional assemblies."""
from pathlib import Path
import json
from PIL import Image, ImageChops, ImageDraw

source = Path(__file__).resolve().parent
out = source.parents[2] / "dist/puzzle/bucket-truck"
out.mkdir(parents=True, exist_ok=True)
master = Image.open(source / "master.png").convert("RGBA")
assert master.size == (1536, 1024)
alpha = master.getchannel("A").point(lambda v: v if v >= 12 else 0)
master.putalpha(alpha)
# Keep the basket's yellow mounting ear with the basket. The short red wrist
# stays on the arm and meets that ear when the puzzle is assembled.
basket=[(1114,0),(1536,0),(1536,365),(1174,365),(1170,287),
        (1147,280),(1135,270),(1131,260),(1143,263),(1142,245),
        (1141,222),(1144,204),(1130,193),(1126,181)]
# The dark bolted plate is part of the boom. The teal bed and both striped
# stabilizers form one piece with the cab, chassis and wheels.
arm=[(345,0),(1536,0),(1536,604),(1115,637),(1111,644),(1107,648),
     (735,648),(728,644),(727,632),(600,520),(493,408),(470,383),
     (412,369),(368,332),(344,320)]
components=[("bucketTruckBasket","工作斗",basket),("bucketTruckArm","折叠臂",arm),
            ("bucketTruckBase","带支腿的底盘",None)]
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
    parts[identifier]=dict(id=identifier,name=label,file="puzzle/bucket-truck/"+file,x=x-left,y=y-top,w=r-x,h=b-y)
assert assembled.getchannel("A").tobytes()==alpha.tobytes()
difference=ImageChops.difference(master.convert("RGB"),assembled.convert("RGB"))
assert all(not ImageChops.multiply(channel,alpha).getbbox() for channel in difference.split())
preview=assembled.crop((left,top,right,bottom))
preview.thumbnail((420,230),Image.Resampling.LANCZOS)
preview.save(out/"preview.webp",quality=93)
order=["bucketTruckBase","bucketTruckArm","bucketTruckBasket"]
model=dict(id="bucket-truck",name="高空作业车",width=right-left,height=bottom-top,layers=order,
           parts=[parts[k] for k in order],intro="bucketTruckIntro")
(out/"model.json").write_text(json.dumps(model,ensure_ascii=False,indent=2),"utf8")
