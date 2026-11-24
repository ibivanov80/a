"""Register eight illustrated poses and create optical-flow inbetweens for the local 3-D renderer."""
import argparse
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

SIZE = 416
FRACTIONS = 6


def normalized(source, target_area):
    img=Image.open(source).convert('RGBA')
    area=np.asarray(img.getchannel('A')).sum()/255
    scale=min((target_area/max(area,1))**.5,(SIZE-24)/img.width,(SIZE-24)/img.height)
    img=img.resize(tuple(max(1,round(s*scale)) for s in img.size),Image.Resampling.LANCZOS)
    sheet=Image.new('RGBA',(SIZE,SIZE)); sheet.paste(img,((SIZE-img.width)//2,SIZE-12-img.height))
    return np.asarray(sheet).copy()


def luminance(rgba):
    # The constant mid-colour gives optical flow the silhouette as well as fur landmarks.
    a=rgba[:,:,3:4].astype(np.float32)/255
    rgb=(rgba[:,:,:3]*a+143*(1-a)).astype('uint8')
    return cv2.cvtColor(rgb,cv2.COLOR_RGB2GRAY)


def between(first,second,flow_fn):
    a,b=luminance(first),luminance(second)
    f=flow_fn.calc(a,b,None); r=flow_fn.calc(b,a,None)
    xx,yy=np.meshgrid(np.arange(SIZE,dtype='float32'),np.arange(SIZE,dtype='float32'))
    # Warp premultiplied RGB to avoid dark fringes where the fur meets the backdrop.
    def premult(frame):
        out=frame.astype(np.float32)/255;out[:,:,:3]*=out[:,:,3:4];return out
    src=premult(first);dst=premult(second)
    for i in range(1,FRACTIONS):
        t=i/FRACTIONS
        left=cv2.remap(src,xx-f[:,:,0]*t,yy-f[:,:,1]*t,cv2.INTER_LINEAR)
        right=cv2.remap(dst,xx-r[:,:,0]*(1-t),yy-r[:,:,1]*(1-t),cv2.INTER_LINEAR)
        w=t*t*(3-2*t);mix=left*(1-w)+right*w
        mix[:,:,:3] /= np.maximum(mix[:,:,3:4],1/255)
        yield (np.clip(mix,0,1)*255).astype('uint8')


def prepare(directory,output):
    output.mkdir(exist_ok=True,parents=True)
    poses=[normalized(directory/f'{i}.webp',SIZE*SIZE*.395) for i in range(8)]
    flow=cv2.DISOpticalFlow_create(cv2.DISOPTICAL_FLOW_PRESET_MEDIUM)
    flow.setFinestScale(0)
    for i in range(7):
        images=[poses[i],*between(poses[i],poses[i+1],flow)]
        for j,image in enumerate(images):
            Image.fromarray(image).save(output/f'{i*FRACTIONS+j:02}.png',compress_level=1)
    Image.fromarray(poses[-1]).save(output/f'{7*FRACTIONS:02}.png',compress_level=1)
    print(directory.name,flush=True)


if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('source',type=Path);p.add_argument('out',type=Path);p.add_argument('animals',nargs='*');args=p.parse_args()
    cv2.setNumThreads(2)
    for animal in (args.animals or sorted(p.name for p in args.source.iterdir() if p.is_dir())):
        prepare(args.source/animal,args.out/animal)
