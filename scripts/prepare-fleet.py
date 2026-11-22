#!/usr/bin/env python3
"""Check an original sprite pack; compile individually reviewed packs for the game."""
import argparse
import json
import math
import re
from pathlib import Path

from PIL import Image

IDENT = re.compile(r"^[a-z][a-z0-9-]*$")
VERSION = 51

def key(value):
    assert isinstance(value, str) and IDENT.fullmatch(value), value
    return value

def point(value):
    assert len(value) == 2 and all(isinstance(x, (int,float)) and math.isfinite(x) for x in value), value
    return list(value)

def name(value):
    assert isinstance(value, str) and 0 < len(value) < 50, value
    return value

def lookup(alpha, offset, xy, radius=0):
    x,y = (math.floor(v-u) for v,u in zip(xy,offset))
    w,h=alpha.size
    x0,y0,x1,y1=max(0,x-radius),max(0,y-radius),min(w,x+radius+1),min(h,y+radius+1)
    return alpha.crop((x0,y0,x1,y1)).getextrema()[1] if x1>x0 and y1>y0 else 0

def prepare(d, dest, version):
    m=json.loads((d/'vehicle.json').read_text())
    ident=key(m['id'])
    assert ident==d.name, (ident,d.name)
    parts=m['parts']
    keys=[key(p['id']) for p in parts]
    n=len(parts)
    assert 2<=n<=4 and len(set(keys))==n
    assert set(keys)==set(m['layers']) and len(m['layers'])==n
    assert sorted(p.get('slot',i) for i,p in enumerate(parts))==list(range(n))
    assert len(m['joints'])==n and m['joints'][0] is None
    joints=[None]+[point(x) for x in m['joints'][1:]]
    vname=name(m['name'])
    out=dest/ident if dest else None
    model=dict(id=ident,name=vname,assetVersion=version,guide=f'{ident}/guide.webp?v={version}',
        guideAlt=vname+'拆装图：'+'、'.join(name(p['name']) for p in parts)+'。',fitWholeAssembly=True,layers=m['layers'],parts=[],joints=joints)
    alpha={}
    images={}
    for i,p in enumerate(parts):
        k=p['id']
        f=p['file']
        assert f==f'{k}.png', (ident,k,f)
        with Image.open(d/f) as source:
            assert source.mode=='RGBA', (ident,k,source.mode)
            image=source.copy()
        a=image.getchannel('A')
        w,h=image.size
        assert min(w,h)>=32 and max(w,h)<=3000
        assert a.getextrema()[0]==0 and a.getextrema()[1]>=200
        x,y=point(p['offset'])
        b=a.point(lambda v:255 if v>=44 else 0).getbbox()
        assert b is not None
        pick=point(p['pick'])
        assert lookup(a,[x,y],pick,0)>=110, (ident,k,'pick point is not opaque',pick)
        pivot=point(p.get('pivot') or joints[max(1,i)])
        assert abs(x)<=2e4 and abs(y)<=2e4
        q=dict(id=k,name=name(p['name']),slot=p.get('slot',i),file=f'{ident}/{k}.webp',offset=[x,y],width=w,height=h,
               silhouette=[x+b[0],y+b[1],b[2]-b[0],b[3]-b[1]],pivot=pivot,pick=pick,ownTrayScale=True)
        if p.get('looseGrabPadding'):
            q['looseGrabPadding']=min(14,max(0,float(p['looseGrabPadding'])))
        model['parts'].append(q)
        alpha[k]=(a,[x,y])
        images[k]=image
    observed=[]
    for i,j in enumerate(joints[1:],1):
        pair=keys[i-1:i+1]
        observed.append([*pair,*[lookup(*alpha[k],j) for k in pair],*[lookup(*alpha[k],j,28) for k in pair]])
    with Image.open(d/'guide.png') as source:
        assert source.width>=1100 and source.height>=800, (ident, source.size)
        board=source.convert('RGB')
    if dest:
        out.mkdir(parents=True,exist_ok=True)
        for k,image in images.items():
            image.save(out/f'{k}.webp',quality=93,method=4,exact=True)
            with Image.open(out/f'{k}.webp') as delivered:
                assert delivered.size==image.size and delivered.getchannel('A').tobytes()==image.getchannel('A').tobytes()
        board.save(out/'guide.webp',quality=89,method=4)
        (out/'config.mjs').write_text('export default '+json.dumps(model,ensure_ascii=False,separators=(',',':'))+';\n')
    return ident,observed

p=argparse.ArgumentParser()
p.add_argument('root',type=Path)
p.add_argument('ids',nargs='+')
p.add_argument('--version',type=int,default=VERSION,help='cache version and batch ID for this release')
p.add_argument('--check',action='store_true',help='validate only, without changing any game files')
a=p.parse_args()
if a.version < 1: p.error('--version must be positive')
for ident in a.ids:
    k,pins=prepare(a.root/key(ident),None if a.check else Path('dist/drag-only'),a.version)
    print(json.dumps({'id':k,'joint_alpha_exact_and_near':pins},ensure_ascii=False))
