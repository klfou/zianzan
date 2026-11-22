"""Rebuild the five approved three-piece game atlases from the private review ledger.

Uses no network. Requires Pillow, Node/Sharp, NumPy, SciPy and ImageMagick.
Run from any directory: python little-builders-pilot/build-assets.py.
"""
from __future__ import annotations
from collections import OrderedDict
from hashlib import sha256
from itertools import permutations
import json
from pathlib import Path
import subprocess

import numpy as np
from PIL import Image
from scipy.ndimage import distance_transform_edt

PILOT = Path(__file__).resolve().parent
REVIEW = PILOT.parent / 'little-builders-model-review'
ASSETS = PILOT / 'dist' / 'assets'
GUARD = 4
SPECS = OrderedDict([
    ('tower-crane', ('固定式塔吊', ['jib','counterjib','tower'], ['起重臂与吊钩','驾驶室与配重','塔身与底座'])),
    ('forestry-harvester', ('六轮伐木机', ['arm','cab','rear'], ['采伐头与液压臂','驾驶室与前轮','后舱与双轮组'])),
    ('excavator', ('履带挖掘机', ['arm','upper','track'], ['挖掘臂与铲斗','驾驶室与机舱','履带底盘'])),
    ('mine-haul', ('矿用自卸卡车', ['bed','cab','chassis'], ['翻斗车厢','驾驶室','底盘与车轮'])),
    ('concrete-pump', ('混凝土泵车', ['boom','front','rear'], ['泵送臂架','驾驶室与前车身','后车身与泵座'])),
])


def reviewed_asset(ledger, id):
    model = ledger['models'][id]
    assert model['state'] == 'approved' and model['approved_revision']
    rev = next(r for r in model['review_revisions'] if r['revision'] == model['approved_revision'])
    assert rev['state'] == 'approved'
    art = rev['artifact']['color']
    path = REVIEW / art['path']
    assert sha256(path.read_bytes()).hexdigest() == art['sha256'], f'approved art changed: {id}'
    if id == 'tower-crane':
        layout = model['piece_layout_review']
        assert layout['state'] == 'approved' and layout['model_revision'] == rev['revision']
        return path, layout['selection_geometry'], rev['revision'] + '/' + layout['revision']
    return path, rev['selection_geometry'], rev['revision']


def polygon(w, h, points):
    # Match the approval cards: hard integer-pixel masks from ImageMagick
    # polygon rasterization, with +antialias deliberately disabling AA.
    text = 'polygon ' + ' '.join(f'{x},{y}' for x,y in points)
    raw = subprocess.run(
        ['magick','-size',f'{w}x{h}','xc:black','+antialias','-fill','white','-stroke','none','-draw',text,'-depth','8','gray:-'],
        stdout=subprocess.PIPE, check=True,
    ).stdout
    mask = np.frombuffer(raw,dtype=np.uint8).reshape(h,w)
    assert np.all((mask == 0) | (mask == 255))
    return mask == 255


def assign(geom, id):
    w,h = geom['canvas']
    yy,xx = np.ogrid[:h,:w]
    if id == 'forestry-harvester':
        left = polygon(w,h,geom['left_polygon'])
        rear = (xx >= geom['rear_first_x']) & ~left
        masks = [left, ~(left|rear), rear]
    elif id in ('tower-crane','excavator'):
        left = polygon(w,h,geom['left_polygon'])
        upper = (yy <= geom['upper_last_y']) & ~left
        masks = [left, upper, ~(left|upper)]
    elif id == 'mine-haul':
        bed = polygon(w,h,geom['bed_polygon'])
        cab = polygon(w,h,geom['cab_polygon']) & ~bed
        masks = [bed,cab,~(bed|cab)]
    elif id == 'concrete-pump':
        boom = polygon(w,h,geom['boom_polygon'])
        front = (xx <= geom['front_last_x']) & ~boom
        masks = [boom,front,~(boom|front)]
    else:
        raise KeyError(id)
    assert np.all(np.sum(masks,axis=0)==1)
    return np.argmax(masks,axis=0).astype(np.uint8)


def inside_anchor(piece_rgba, tx, ty):
    # Pick somewhere solid, not a bounding-box or alpha centroid in a hole.
    # Weight the true interior distance and favor a central usable landmark.
    a = piece_rgba[:,:,3].astype(np.float64)
    good = a >= 190
    d = distance_transform_edt(np.pad(good, 1))[1:-1,1:-1]
    y,x = np.ogrid[:a.shape[0],:a.shape[1]]
    cx = np.sum(a*x)/np.sum(a)
    cy = np.sum(a*y)/np.sum(a)
    priority = d - np.hypot(x-cx,y-cy)*.095
    priority[~good] = -np.inf
    iy,ix = np.unravel_index(np.argmax(priority),a.shape)
    assert a[iy,ix] >= 190
    return [int(ix)+tx,int(iy)+ty]


def pack(images):
    wh = [im.size for im in images]
    best = None
    # Four rectangles: try all shelf partitions and orders for a compact atlas.
    for order in permutations(range(len(wh))):
        for breaking in range(1 << (len(wh)-1)):
            pos = {}
            x=y=GUARD
            aw=row_h=0
            for j,idx in enumerate(order):
                w,h = wh[idx]
                pos[idx]=(x,y)
                x += w+GUARD
                row_h=max(row_h,h)
                aw=max(aw,x)
                if breaking & (1<<j):
                    x=GUARD
                    y+=row_h+GUARD
                    row_h=0
            ah=y+row_h+GUARD
            s=(aw*ah,max(aw,ah),aw)
            if best is None or s<best[0]:
                best=(s,aw,ah,pos)
    _,w,h,pos=best
    atlas=Image.new('RGBA',(w,h))
    for i,im in enumerate(images):
        atlas.paste(im,pos[i])
    return atlas,pos


def pack_model(id, ledger):
    path, geom, revision = reviewed_asset(ledger,id)
    original=Image.open(path).convert('RGBA')
    assert list(original.size) == geom['canvas']
    masks=assign(geom,id)
    # Crop the same original box and scale once; pixel owners use NEAREST on
    # the already-approved hard masks. Resizing each translucent piece would
    # overlap alpha along joins. Instead partition the single shared result.
    srcbox=original.getchannel('A').getbbox()
    assert srcbox
    x0,y0,x1,y1=srcbox
    scale=min(820/(x1-x0),700/(y1-y0),1)
    size=(round((x1-x0)*scale),round((y1-y0)*scale))
    color=np.array(original.crop(srcbox).resize(size,Image.Resampling.LANCZOS))
    owners=np.array(Image.fromarray(masks,'L').crop(srcbox).resize(size, Image.Resampling.NEAREST))
    a=color[:,:,3]
    color[a==0]=0
    r,g,b=[color[:,:,i].astype(np.float32) for i in range(3)]
    luma=.2126*r+.7152*g+.0722*b
    # Fully neutral before matching, retaining diecast lighting and texture.
    luma=np.rint(.96*luma+.04*np.maximum(np.maximum(r,g),b)).astype(np.uint8)
    gray=np.stack((luma,luma,luma,a),axis=2).copy()
    gray[a==0]=0
    images=[Image.fromarray(color)]
    targets=[]
    parts=[]
    for i in range(3):
        piece=np.where((owners==i)[:,:,None],gray,0).astype(np.uint8)
        parts.append(piece)
        im=Image.fromarray(piece)
        box=im.getchannel('A').getbbox()
        assert box
        l,t,rr,bb=box
        images.append(im.crop(box))
        targets.append((l,t,inside_anchor(piece[t:bb,l:rr],l,t)))
    assert np.all(np.sum([p[:,:,3]>0 for p in parts],axis=0)<=1)
    assert np.array_equal(np.sum(parts,axis=0),gray)
    atlas,pos=pack(images)
    png = ASSETS/f'{id}.png'
    atlas.save(png,optimize=True,compress_level=9)
    # Preserve full alpha and gain 2–3× in transfer. Sharp's improved YUV
    # chroma subsampling preserves the very fine yellow lattice on tower-crane.
    webp_tmp = ASSETS/f'.{id}.tmp.webp'
    subprocess.run(['node','-e',
        'require("sharp")(process.argv[1]).webp({quality:89,alphaQuality:100,smartSubsample:true,effort:5}).toFile(process.argv[2]).catch(e=>{console.error(e);process.exitCode=1})',
        str(png),str(webp_tmp)],check=True,cwd=PILOT)
    webp_tmp.replace(ASSETS/f'{id}.webp')
    thumb=images[0].copy()
    thumb.thumbnail((236,158),Image.Resampling.LANCZOS)
    thumb.save(ASSETS/f'{id}-thumb.webp',quality=80,alpha_quality=100,method=6)
    thumb.quantize(160,method=Image.Quantize.FASTOCTREE).save(ASSETS/f'{id}-thumb.png',optimize=True,compress_level=9)
    atl=np.array(atlas)
    saved_png=np.array(Image.open(ASSETS/f'{id}.png').convert('RGBA'))
    saved_webp=np.array(Image.open(ASSETS/f'{id}.webp').convert('RGBA'))
    assert np.array_equal(saved_png,atl), f'{id} PNG atlas changed pixels'
    assert np.array_equal(saved_webp[:,:,3],atl[:,:,3]), f'{id} WebP changed alpha'
    opaque=atl[:,:,3]>=190
    delta=saved_webp[:,:,:3].astype(np.float32)-atl[:,:,:3].astype(np.float32)
    psnr=20*np.log10(255/np.sqrt(np.mean(delta[opaque]**2)))
    assert psnr>29, f'{id} unacceptable RGB change: {psnr:.2f} dB'
    all_rects=[dict(zip(('x','y','w','h'),[*pos[i],*im.size])) for i,im in enumerate(images)]
    name,ids,names=SPECS[id]
    pieces=[dict(id=k,name=n,**all_rects[i+1],tx=tx,ty=ty, anchor=anchor)
            for i, (k,n,(tx,ty,anchor)) in enumerate(zip(ids,names,targets))]
    qa={'id':id,'approved':revision,'crop':srcbox,'resized':size,
        'visibleRgbPsnr':round(float(psnr),2),
        'coveredPixels':[int(np.count_nonzero(p[:,:,3])) for p in parts],
        'bytes':{ext:(ASSETS/f'{id}.{ext}').stat().st_size for ext in ['webp','png']}}
    print(json.dumps(qa,ensure_ascii=False),flush=True)
    return {
        'id':id,'name':name,'w':size[0],'h':size[1],
        'atlas':{'webp':f'assets/{id}.webp','png':f'assets/{id}.png','w':atlas.width,'h':atlas.height},
        'thumb':{'webp':f'assets/{id}-thumb.webp','png':f'assets/{id}-thumb.png'},
        'color':all_rects[0], 'pieces':pieces
    }


def main():
    ASSETS.mkdir(parents=True,exist_ok=True)
    source=json.loads((REVIEW/'ledger.json').read_text())
    models=[pack_model(id,source) for id in SPECS]
    (ASSETS/'manifest.json').write_text(json.dumps({'version':1,'vehicles':models},ensure_ascii=False,separators=(',',':'))+'\n')

if __name__=='__main__':
    main()
