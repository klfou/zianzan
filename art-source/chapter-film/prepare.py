"""Prepare the reusable painted layers, narration track and frame-accurate shot list."""
from pathlib import Path
import json, math, wave, re
from PIL import Image

ROOT = Path(__file__).resolve().parent
OUT = ROOT.parents[1] / "dist" / "story-film"
ART = ROOT / "shared" / "excavator" / "art"
FPS, RATE = 20, 24000
OUT.mkdir(parents=True,exist_ok=True)
for name in ["hearts", "earth", "house", "road"]:
    master = Image.open(ROOT / "masters" / (name + ".png")).convert("RGB")
    w, h = master.size
    for i in range(6):
        x, y = i % 2, i // 2
        panel = master.crop((round(w*x/2)+3, round(h*y/3)+3, round(w*(x+1)/2)-3, round(h*(y+1)/3)-3))
        panel.save(ROOT/"panels"/f"{name}-{i}.webp", quality=94)
machine = Image.open(ROOT/"masters"/"machines.png").convert("RGBA")
w,h = machine.size
for i, name in enumerate(["wheel-dozer","log-handler"]):
    im = machine.crop((0,h*i//2,w,h*(i+1)//2))
    im = im.crop(im.getchannel("A").point(lambda a: 255 if a>95 else 0).getbbox())
    im.thumbnail((1000,670)); im.save(ART/(name+".webp"),quality=93)
shots=json.loads((ROOT/"shots.json").read_text("utf8"))
sample_frame=RATE//FPS
position=0
with wave.open(str(ROOT/"narration.wav"),"wb") as mix:
    mix.setparams((1,2,RATE,0,"NONE","not compressed"))
    for shot in shots:
        with wave.open(str(ROOT/"voices"/(shot["id"]+".wav")),"rb") as voice:
            assert (voice.getframerate(),voice.getsampwidth(),voice.getnchannels())==(RATE,2,1)
            data=voice.readframes(voice.getnframes())
        lead=round(RATE*.24)
        hold=round(RATE*(1.0 if shot["id"]=="end" else .50))
        frames=math.ceil((lead+len(data)//2+hold)/sample_frame)
        shot.update(startFrame=position, frames=frames, fps=FPS, voiceSamples=len(data)//2)
        mix.writeframes(bytes(lead*2)+data+bytes(2*(frames*sample_frame-lead-len(data)//2)))
        position+=frames
(ROOT/"timeline.json").write_text(json.dumps(shots,ensure_ascii=False,indent=2),"utf8")
Image.open(ROOT/"panels"/"road-5.webp").save(OUT/"cover.webp",quality=91)
print(len(shots),"shots,",position,"frames,",position/FPS,"seconds")

