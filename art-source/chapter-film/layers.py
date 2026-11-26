"""Make movable cut-outs from the approved plates. Points use a 480 x 218 artboard."""
from pathlib import Path
import json
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

root=Path(__file__).resolve().parent
# Pose offsets in artboard pixels: from (dx,dy) to (dx,dy), with optional floor occlusion.
parts={
 "mark": ("hearts-2",[(262,62),(291,63),(300,93),(302,117),(294,128),(258,127),(247,117),(249,92),(264,87)],(0,-7),(0,-12),217),
 "sign": ("house-4",[(251,88),(272,78),(292,78),(307,88),(312,102),(299,113),(272,117),(252,109)],(-12,8),(0,0),218),
 "drill": ("earth-3",[(261,51),(274,51),(275,134),(289,141),(289,172),(267,181),(258,168),(258,140),(264,132)],(0,-21),(0,4),181),
 "cage": ("earth-4",[(251,8),(260,8),(264,29),(272,47),(271,192),(239,192),(241,49),(251,28)],(0,-13),(0,39),190),
 "panels": ("house-0",[(282,28),(294,46),(305,46),(306,96),(270,96),(270,47),(276,45)],(-34,-17),(0,9),117),
 "desk": ("house-3",[(183,68),(269,54),(274,57),(274,142),(183,147)],(0,43),(0,0),209),
 "books": ("house-5",[(181,151),(192,151),(198,143),(225,145),(226,138),(245,138),(246,154),(259,151),(270,171),(270,194),(257,201),(238,199),(230,194),(218,198),(203,194),(180,191)],(26,0),(-7,0),218),
 "sweep": ("road-0",[(52,193),(65,185),(72,165),(79,141),(85,131),(130,116),(151,124),(183,126),(188,139),(190,193),(178,207),(155,209),(146,214),(111,215),(99,206),(91,216),(55,211)],(24,-3),(-10,2),218),
 "pave": ("road-1",[(368,152),(382,144),(390,121),(388,114),(422,112),(430,116),(425,135),(437,145),(443,156),(443,171),(436,179),(370,180)],(12,-2),(-20,2),218),
 "snow": ("hearts-3",[(35,163),(42,100),(52,70),(66,42),(87,31),(106,31),(111,43),(125,41),(135,84),(145,114),(163,121),(172,171),(160,191),(137,180),(103,185),(75,169),(51,175)],(8,0),(-26,4),218),
 "drain": ("earth-0",[(322,126),(325,95),(333,86),(372,82),(381,76),(394,76),(407,97),(425,102),(429,132),(417,142),(402,143),(390,139),(370,140),(362,143),(343,141)],(0,0),(20,0),217),
}
out={}
for key,(plate,poly,start,end,clip) in parts.items():
 im=Image.open(root/"panels"/(plate+".webp")).convert("RGB")
 sx,sy=im.width/480,im.height/218
 mask=Image.new("L",im.size,0)
 ImageDraw.Draw(mask).polygon([(int(x*sx),int(y*sy)) for x,y in poly],fill=255)
 dilated=mask.filter(ImageFilter.MaxFilter(5))
 clean=cv2.inpaint(np.array(im),np.array(dilated),5,cv2.INPAINT_TELEA)
 Image.fromarray(clean).save(root/"panels"/(key+"-clean.webp"),quality=94)
 sprite=im.convert("RGBA");sprite.putalpha(mask.filter(ImageFilter.GaussianBlur(.65)))
 box=mask.getbbox();sprite.crop(box).save(root/"panels"/(key+"-layer.webp"),quality=95)
 out[key]=dict(x=box[0]/sx,y=box[1]/sy,w=(box[2]-box[0])/sx,h=(box[3]-box[1])/sy,start=start,end=end,clip=clip)
(root/"layers.json").write_text(json.dumps(out,indent=2),"utf8")

