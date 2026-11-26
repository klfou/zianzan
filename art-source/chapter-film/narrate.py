from pathlib import Path
import os, hashlib, json, argparse
import numpy as np
import torch
import soundfile as sf
from qwen_tts import Qwen3TTSModel

root=Path(os.environ["LOCALAPPDATA"])/"LittleBuilders"
reference=Path(__file__).resolve().parent/"voices/voice-reference.wav"
assert hashlib.sha256(reference.read_bytes()).hexdigest()=="9e14374bb1685642918516908e266befa688c57ce92722ea69fabde78e4c8b84"
parser=argparse.ArgumentParser()
parser.add_argument("--out",type=Path,default=Path(__file__).resolve().parent/"voices")
parser.add_argument("--lines",type=Path)
args=parser.parse_args()
out=args.out
out.mkdir(exist_ok=True)
lines=json.loads((args.lines or out/"lines.json").read_text(encoding="utf-8-sig"))
torch.set_num_threads(8)
torch.manual_seed(171)
model=Qwen3TTSModel.from_pretrained(str(root/"models/Qwen3-TTS-12Hz-1.7B-Base"),device_map="cpu",dtype=torch.float32,attn_implementation="sdpa")
prompt=model.create_voice_clone_prompt(ref_audio=str(reference),ref_text="看，斗齿扎进土里了。铲斗一收，泥土就兜起来啦。",x_vector_only_mode=False)
keys=[k for k in lines if not (out/(k+".wav")).exists()]
for start in range(0,len(keys),3):
    batch=keys[start:start+3]
    print("Generating",batch,flush=True)
    waves,sr=model.generate_voice_clone(text=[lines[k] for k in batch],language="Chinese",voice_clone_prompt=prompt,max_new_tokens=360)
    for k,y in zip(batch,waves):
        y=np.asarray(y); assert sr==24000 and np.isfinite(y).all() and .9<len(y)/sr<27
        energy=np.sqrt(np.mean(y[:len(y)//240*240].reshape(-1,240)**2,axis=1))
        active=np.flatnonzero(energy>.007)
        assert len(active)>45
        y=y[max(0,int(active[0])*240-1920):min(len(y),int(active[-1])*240+4560)]
        y*=.84/np.max(abs(y))
        sf.write(out/(k+".wav"),y,sr,subtype="PCM_16")


