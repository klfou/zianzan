"""Separate the painted trencher at its cab seal, swing-arm pins and cutter hub."""
from pathlib import Path
import json
from PIL import Image, ImageChops, ImageDraw
import numpy as np

source = Path(__file__).resolve().parent
out = source.parents[2] / "dist/puzzle/wheel-trencher"
out.mkdir(parents=True, exist_ok=True)
master = Image.open(source / "master.png").convert("RGBA")
width, height = master.size
alpha = master.getchannel("A").point(lambda a: 0 if a < 12 else 255 if a > 245 else a)
master.putalpha(alpha)

def polygon(points):
    mask = Image.new("L", master.size)
    ImageDraw.Draw(mask).polygon([(round(x*width/1024), round(y*height/682)) for x,y in points],fill=255)
    return mask

# Trace the outer cab seal, then the underside of the complete arm including its ram.
cab = polygon([(169,270),(186,190),(198,73),(460,66),(486,240),(489,273),(481,287),(479,363),(313,365),(303,362),(298,354),(296,319),(289,311),(281,309),(218,309),(207,307),(199,300),(192,288),(182,278)])
arm = polygon([(479,288),(505,233),(529,202),(554,201),(570,216),(580,215),(659,239),(659,251),(718,275),(728,271),(743,272),(754,280),(760,291),(782,356),(806,365),(819,357),(836,354),(853,358),(871,370),(882,389),(883,407),(878,427),(866,440),(849,449),(827,449),(815,445),(802,434),(575,375),(561,372),(505,373),(495,370),(489,364),(478,364)])
opening = polygon([(555,258),(566,262),(646,286),(654,274),(716,297),(717,310),(723,318),(731,324),(729,342),(597,294),(584,291),(555,291)])
discArea = polygon([(754,179),(1024,177),(1024,628),(641,627),(642,425),(656,389),(670,375),(670,343),(687,302),(704,277)])
arm = ImageChops.subtract(arm,ImageChops.multiply(opening,discArea))
# Keep the piston outline with its arm and the gold clevis out of the cutter.
pixels = np.asarray(master)
y,x = np.indices((height,width))
u,v = x*1024/width,y*682/height
arm_pixels=np.asarray(arm).copy()
arm_pixels[(u>555)&(u<716)&(v>210)&(v<302)&(np.asarray(discArea)==0)] = 255
yellow=(pixels[:,:,0].astype(int)>pixels[:,:,2].astype(int)+48)&(pixels[:,:,0]>110)
arm_pixels[(np.asarray(discArea)>0)&yellow] = 255
arm = Image.fromarray(arm_pixels)
wheel = ImageChops.subtract(discArea,arm)
wheel = ImageChops.multiply(wheel,alpha)
wheelImage = master.copy()
wheelImage.putalpha(wheel)
# The arm obscures part of the disc. Complete that patch from the lower side
# of the same painted disc; the original near-side arm covers it in the assembly.
cx,cy = 840*width/1024,402*height/682
dx,dy=x-cx,y-cy
radius=np.hypot(dx,dy)
sx=np.rint(cx+abs(dx)).astype(int)
sy=y.copy()
# The centre of the source painting is covered by the hinge. Borrow a clean
# steel patch just below it, with the same paper grain around the axle hole.
hub=radius<52*width/1024
sx[hub]=np.rint(cx+dx[hub]*.18).astype(int)
sy[hub]=np.rint(cy+width*.061+dy[hub]*.15).astype(int)
patch=pixels[np.clip(sy,0,height-1),np.clip(sx,0,width-1)].copy()
patch[radius<15*width/1024,3]=0
reverse = Image.fromarray(patch)
hidden = ImageChops.multiply(arm,reverse.getchannel("A"))
hidden = ImageChops.multiply(hidden,alpha)
reverse.putalpha(hidden)
wheelImage.alpha_composite(reverse)
bodyMask = ImageChops.subtract(ImageChops.subtract(ImageChops.subtract(alpha,cab),arm),wheel)
def clipped(mask):
    layer = master.copy()
    layer.putalpha(ImageChops.multiply(mask,alpha))
    return layer
body=master.copy()
body.putalpha(bodyMask)
items=[
    ("trencherBody","轮式底盘",body),
    ("trencherCab","驾驶室",clipped(cab)),
    ("trencherWheel","切削轮",wheelImage),
    ("trencherArm","摆臂与油缸",clipped(arm)),
]
bounds = alpha.getbbox()
parts=[]
for identifier,label,layer in items:
    box=layer.getchannel("A").getbbox()
    filename=identifier+".webp"
    layer.crop(box).save(out/filename,lossless=True)
    parts.append(dict(id=identifier,name=label,file="puzzle/wheel-trencher/"+filename,x=box[0]-bounds[0],y=box[1]-bounds[1],w=box[2]-box[0],h=box[3]-box[1]))
# Keep the preview as the actual assembled sprite; it uses exactly the same layer order.
combined=Image.new("RGBA",master.size)
for _,_,layer in items: combined.alpha_composite(layer)
combined=combined.crop(bounds)
combined.thumbnail((420,230),Image.Resampling.LANCZOS)
combined.save(out/"preview.webp",quality=93)
model=dict(id="wheel-trencher",name="轮式挖沟机",width=bounds[2]-bounds[0],height=bounds[3]-bounds[1],layers=[p["id"] for p in parts],parts=parts,intro="trencherIntro")
(out/"model.json").write_text(json.dumps(model,ensure_ascii=False,indent=2),"utf8")
