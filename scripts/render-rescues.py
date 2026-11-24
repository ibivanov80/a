"""Render the illustrated rescue sequences. Requires Pillow and FFmpeg with libx264."""
import math
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor
from functools import lru_cache
from pathlib import Path
from random import Random
from PIL import Image, ImageDraw, ImageFilter, ImageOps

ROOT = Path(__file__).resolve().parent
ART = ROOT / 'rescue-art'
OUT = ROOT.parent / 'docs/assets/rescue'
W, H = 768, 432
FPS, SECONDS = 24, 4.25
R = Image.Resampling
SCENES = {
    'wolf': ('winter', 194), 'cub': ('winter', 154), 'fox': ('summer', 178),
    'hare': ('summer', 146), 'hedgehog': ('autumn', 134), 'bear': ('autumn', 188),
    'owl': ('summer', 132), 'cat': ('pond', 132), 'frog': ('pond', 116),
    'penguin': ('winter', 148), 'mouse': ('autumn', 107),
}

def ease(t):
    t = min(1, max(0, t))
    return t * t * (3 - 2 * t)

def step(t, start, stop):
    return ease((t - start) / (stop - start))

def oval(draw, x, y, rx, ry, fill, outline=None, width=1):
    if rx > 0 and ry > 0:
        draw.ellipse((x-rx, y-ry, x+rx, y+ry), fill, outline, width)

def poly(draw, pts, fill, stroke=None, width=2):
    draw.polygon(pts, fill)
    if stroke:
        draw.line([*pts, pts[0]], fill=stroke, width=width, joint='curve')

def layer():
    return Image.new('RGBA', (W, H))

@lru_cache(maxsize=None)
def background(key):
    return ImageOps.fit(Image.open(ART / f'{SCENES[key][0]}.jpg'), (W,H), centering=(.5,.64)).convert('RGBA')

@lru_cache(maxsize=None)
def animal(key):
    return Image.open(ART / f'{key}.webp').convert('RGBA')

def sparkle(draw, x, y, size, color):
    points = [(x,y-size), (x+size*.23,y-size*.23), (x+size,y), (x+size*.23,y+size*.23),
              (x,y+size), (x-size*.23,y+size*.23), (x-size,y), (x-size*.23,y-size*.23)]
    poly(draw, points, color)

def trajectory(key,t):
    release = step(t, 1.28, 3.90)
    rock = math.sin(t*4) * .8
    x, y, angle, squish = 367, 359, rock, 0
    if key in ('wolf','fox','hedgehog','bear'):
        distance = {'wolf':574,'fox':273,'hedgehog':194,'bear':158}[key]
        x += distance*release
        stride = math.sin(release * math.pi * (9 if key=='wolf' else 6))
        y -= abs(stride) * (17 if key=='wolf' else 10)
        angle += stride*4
        squish = stride*.035
    elif key == 'hare':
        descent = step(t, .85, 2.6)
        x += descent*112 + 40*release
        y -= 86*(1-descent) + 22*math.sin(math.pi*step(t,2.75,3.70))
        angle += (1-descent)*(-6+2*math.cos(5*t))
    elif key == 'owl':
        x += release*189
        y -= 68 + 68*release + 7*math.sin(8*t)*step(t,.95,1.55)
        angle += 8*math.sin(release*math.pi)
        squish = .055*math.sin(11*t)*step(t,1.4,2.30)
    elif key == 'cat':
        x += release*230
        y -= 32 + 5*math.sin(4*t)
        angle += 4*math.sin(4*t)
    elif key == 'frog':
        leap = step(t,1.15,3.34)
        x += 225*leap
        y -= 13 + 101*math.sin(math.pi*leap)
        angle += -22*math.sin(2*math.pi*leap)
        squish = -.06*math.sin(math.pi*leap)
    elif key == 'penguin':
        x += release*271
        y += -65 + 52*release
        angle += -8*release
    elif key == 'mouse':
        x += 185*release
        y -= 58 + 3*math.sin(12*release)
        angle += math.sin(release*math.pi*4)*6
    else:
        x += 95*release
        y -= 47*abs(math.sin(release*math.pi*2))
        squish = .055*math.sin(release*math.pi*4)
    return x,y,angle,squish

def draw_actor(im,key,t,x,y,angle,squish):
    sprite = animal(key)
    height = SCENES[key][1]
    width = height * sprite.width / sprite.height
    spr = sprite.resize((round(width*(1-squish)), round(height*(1+squish))), R.LANCZOS)
    if key in ('wolf', 'fox', 'bear') and t > 1.28:
        # Keep the torso still while the near and far pairs of legs swing in opposition.
        stride = math.sin(step(t,1.28,3.90) * math.pi * 12)
        sw, sh = spr.size
        mesh = []
        def source_point(dx, dy):
            reach = max(0, (dy/sh-.66)/.34)
            offset = 10 * reach * stride * math.cos(dx/sw*math.pi*3)
            return dx+offset, dy
        for row in range(4):
            for col in range(8):
                l, r = round(sw*col/8), round(sw*(col+1)/8)
                a, b = round(sh*row/4), round(sh*(row+1)/4)
                quad = sum((source_point(px,py) for px,py in ((l,a),(l,b),(r,b),(r,a))), ())
                mesh.append(((l,a,r,b),quad))
        spr = spr.transform(spr.size, Image.Transform.MESH, mesh, R.BICUBIC)
    spr = spr.rotate(angle, R.BICUBIC, expand=True)
    im.alpha_composite(spr, (round(x-spr.width/2), round(y-height/2-spr.height/2)))
    return height, width

def water_ring(d,x,y,k,color=(221,245,215,160)):
    if 0 < k < 1:
        rx=14+58*k
        d.ellipse((x-rx,y-rx*.19,x+rx,y+rx*.19), outline=(*color[:3],int(color[3]*(1-k))),width=2)

def leaf(d,x,y,sz,ang,color):
    c,s=math.cos(ang),math.sin(ang)
    def pt(a,b):return (x+(a*c-b*s)*sz, y+(a*s+b*c)*sz)
    points=[pt(-1,0),pt(-.4,-.4),pt(0,-.23),pt(.55,-.4),pt(1,0),pt(.42,.35),pt(0,.25),pt(-.5,.35)]
    poly(d,points,color)
    d.line([pt(-1,0),pt(1,0)],fill='#835637',width=1)

def behind(key,d,t,x,y):
    release = step(t,.55,1.68)
    if key in ('wolf','cub'):
        oval(d,365,361,20+89*release,3+9*release,(123,194,215,130))
        oval(d,350,359,10+45*release,2,(234,250,248,194))
    if key in ('frog','cat'):
        for i in range(3):
            water_ring(d, x,359+i*2, (t*.4+i/3)%1)
    if key=='frog':
        for px,py,rx in [(367,351,71),(592,351,66)]:
            d.pieslice((px-rx,py-13,px+rx,py+13),20,357,fill='#668f48',outline='#536937',width=2)
            d.line((px,py,px+rx-6,py+1),fill='#a6bd66',width=2)
    if key=='penguin':
        poly(d,[(0,225),(115,235),(378,292),(633,343),(768,354),(768,432),(0,432)],'#f1edf5')
        d.line([(0,226),(116,237),(378,294),(634,345),(768,356)], fill='#bfd4e0',width=6)
        for gx in range(5,760,27):
            gy=245+gx*.155+10*math.sin(gx*.07)
            d.line([(gx,gy),(gx+4,gy-1),(gx+11,gy+1)],fill='#d9d9e9',width=1)
    if key=='mouse':
        cx,cy=x,y+31
        rad=37
        oval(d,cx,cy,rad,rad,'#efbc43','#a86328',3)
        for i in range(8):
            theta=(i*2.4)+(t if t>1.4 else 1.4)*(-1.8)
            r=9+2*i
            oval(d,cx+r*math.cos(theta),cy+r*math.sin(theta),3+i%3,3+i%2,'#d29134')
    if key=='owl':
        tail=1-release
        if tail>.01:
            kite_x=269-88*release;kite_y=110-110*release
            poly(d,[(kite_x,kite_y-35),(kite_x+34,kite_y),(kite_x,kite_y+49),(kite_x-32,kite_y)],'#dc815b','#945f53')
            poly(d,[(kite_x,kite_y-33),(kite_x+32,kite_y),(kite_x,kite_y+48)],'#f1c26c')
            d.line([(kite_x,kite_y+49),(kite_x+13,kite_y+65),(x-63,y-65)],fill='#765245',width=3)
    if key=='bear':
        oval(d,365,360,93,11,'#d99a31','#b97f28')
        oval(d,346,359,38,4,'#f5c762')
        # The tipped pot and the amber trail make the sticky puddle readable at tablet scale.
        poly(d,[(235,330),(241,317),(271,312),(281,323),(289,332),(284,346),(251,361),(241,354)], '#b66546','#834833',3)
        d.line([(240,328),(265,320),(275,316)],fill='#df9163',width=4)
        oval(d,280,331,13,8,'#99502d','#e3a166',3)
        d.line([(279,330),(283,339),(293,344),(300,351),(314,355),(335,358)],fill='#e3a638',width=7)
        d.line([(279,329),(285,338),(295,343)],fill='#f7c963',width=2)
    if key=='cat':
        d.line([(x-24,y+14),(x-25,y-110)],fill='#745941',width=3)
        poly(d,[(x-27,y-111),(x-68,y-39),(x-27,y-34)],'#fff0be','#a68e60')

def foreground(key,d,t,x,y,h,w):
    release=step(t,.45,1.7)
    if key=='wolf':
        if release < .997:
            base=359; iceh=208*(1-release)+2; width=242+33*release
            left=367-width/2;right=367+width/2;top=base-iceh
            def ip(a,b):return (left+a*width,top+b*iceh)
            face=[ip(0,.17),ip(.13,.03),ip(.84,0),ip(1,.12),ip(.99,.90),ip(.91,1),ip(.07,.99),ip(0,.89)]
            poly(d,face,(143,224,248,118),(209,250,250,230),3)
            poly(d,[ip(.85,0),ip(1,.12),ip(.99,.9),ip(.88,.98),ip(.88,.15)],(89,175,215,123))
            poly(d,[ip(.13,.03),ip(.85,0),ip(.88,.15),ip(.08,.20)],(216,252,250,168))
            for a,b,k in [(.11,.31,.11),(.11,.45,.18),(.59,.21,.1),(.68,.25,.09)]:
                d.line([ip(a,b+k),ip(a+k,b)],fill=(244,255,255,204),width=4)
            if release>.15:
                d.line([ip(.4,0),ip(.49,.37),ip(.41,.44),ip(.62,.78)],fill=(250,255,255,225),width=2)
    elif key=='cub':
        if release<.997:
            tx=365-87*release;ty=359+35*release
            snow = [(tx-109,ty+7),(tx-96,ty-2),(tx-88,ty-10),(tx-69,ty-13),(tx-61,ty-24),
                    (tx-42,ty-31),(tx-20,ty-28),(tx-5,ty-42),(tx+12,ty-47),(tx+36,ty-42),
                    (tx+47,ty-31),(tx+65,ty-30),(tx+82,ty-22),(tx+89,ty-9),(tx+109,ty+4)]
            poly(d,snow,'#e5eff8')
            d.line(snow[1:-2],fill='#fcf7f3',width=3,joint='curve')
            capx=388+110*release;capy=y-h+14+124*release
            cap=[(capx-37,capy+4),(capx-34,capy-5),(capx-23,capy-9),(capx-16,capy-18),
                 (capx-4,capy-22),(capx+13,capy-17),(capx+20,capy-8),(capx+31,capy-5),
                 (capx+35,capy+3),(capx+29,capy+7),(capx+12,capy+5),(capx+6,capy+9),(capx-8,capy+5)]
            poly(d,cap,'#e5eff8','#c4d9e6')
    elif key=='fox':
        for i in range(3):
            start=0 if i!=1 else math.pi
            ribbon=[]
            for j in range(80):
                u=j/79; theta=u*math.pi*1.35+start
                ribbon.append((x-101+u*182-195*release, y-h*.45 +23*math.sin(theta)-i*12 + 110*release))
            if release<.97:
                d.line(ribbon,fill='#a44b5b',width=8)
                d.line([(px,py-2) for px,py in ribbon],fill='#ed91a1',width=3)
    elif key=='hare':
        tx=315-102*release;ty=69-123*release
        if release<.99:
            d.line([(tx,ty+25),(tx-4,ty+63),(x-19,y-30)],fill='#815f56',width=2)
            oval(d,tx,ty,25,31,'#dc738a','#9d5d69')
            oval(d,tx-8,ty-9,5,9,'#f9b5c5')
            poly(d,[(tx,ty+26),(tx-4,ty+35),(tx+5,ty+35)],'#a34d67')
    elif key=='hedgehog':
        rand=Random(7)
        for i in range(24):
            dx=rand.uniform(-98,108);dy=rand.uniform(-42,5)
            hop=math.sin(math.pi*release)*(20+i*2)
            lx=362+dx*(1+release*.94);ly=353+dy*(1-release)-hop
            leaf(d,lx,ly,rand.uniform(13,24),rand.uniform(-1,1)+release*2,
                 rand.choice(['#ce7137','#ecb154','#d78f38','#bd6934']))
    elif key=='bear' and release<.99:
        for dx in [-40,42]:
            px=x+dx;top=y-27*(1-release)
            poly(d,[(px-18,357),(px-17,top+1),(px-9,top+8),(px+1,top-7),(px+9,top+4),(px+16,top+1),(px+20,357)],'#dea13c')
            d.line([(px-8,top+8),(px-6,top+13)],fill='#ffe09b',width=3)
    elif key=='owl' and release<.97:
        for i in range(2):
            d.arc((x-67-26*release,y-74+i*6,x-32-26*release,y-47+i*6),-50,265,fill='#cd8863',width=3)
    elif key=='cat':
        bx,by=x,y+16
        poly(d,[(bx-71,by-30),(bx-36,by-28),(bx-31,by-9),(bx+30,by-8),(bx+43,by-18),(bx+71,by-16),(bx+76,by-4),(bx+65,by+8),(bx+42,by+14),(bx-56,by+15),(bx-68,by+9)],'#aa6946','#70483c',3)
        d.line([(bx-67,by+10),(bx-45,by+17),(bx+45,by+16),(bx+69,by+7)],fill='#72503a',width=5)
        for i in range(4):
            d.line([(bx-29+i*14,by-8),(bx-24+i*14,by-2)],fill='#f4c384',width=2)
    elif key=='penguin':
        d.line([(x-59,y-1),(x+49,y+1),(x+69,y-6),(x+74,y-18)],fill='#9f6348',width=7,joint='curve')
        d.line([(x-45,y+1),(x-47,y+12),(x+48,y+13),(x+66,y+5)],fill='#805646',width=4)
    elif key=='frog':
        k=step(t,3.1,4.15)
        water_ring(d,590,350,k)
        for i in range(7):
            a=math.pi*i/6
            if 0<k<1:
                oval(d,590+math.cos(a)*k*66,353-math.sin(a)*math.sin(math.pi*k)*37,3,5,(186,224,215,185))

@lru_cache(maxsize=1)
def snow_texture():
    source = Image.open(ART / 'winter.jpg')
    return source.crop((110,397,664,496)).resize((W,H),R.BICUBIC).convert('RGBA')

def texture_snow(fx):
    # Fill solid bluish-white flakes with the grain and shadows of the painted snow plate.
    colors = fx.convert('RGB')
    r, g, b = colors.split()
    from PIL import ImageChops
    mask=ImageChops.multiply(r.point(lambda c: 255 if c>=224 else 0), b.point(lambda c: 255 if c>=243 else 0))
    mask=ImageChops.multiply(mask, g.point(lambda c: 255 if c>=230 else 0))
    mask=ImageChops.multiply(mask,fx.getchannel('A'))
    fx.paste(Image.blend(fx,snow_texture(),.63),mask=mask)

def scene(key,t):
    bg=background(key)
    # A slow camera push draws the reader towards the action.
    zoom=1+step(t,0,3.5)*.025
    cropw=W/zoom;croph=H/zoom;left=(W-cropw)*.55;top=(H-croph)*.62
    img=bg.transform((W,H),Image.Transform.EXTENT,(left,top,left+cropw,top+croph),R.BICUBIC)
    x,y,angle,squish=trajectory(key,t)
    fx=layer();draw=ImageDraw.Draw(fx)
    behind(key,draw,t,x,y)
    if key=='penguin':texture_snow(fx)
    img.alpha_composite(fx)
    if key not in ('cat','frog','owl','mouse','penguin'):
        shadow=layer();oval(ImageDraw.Draw(shadow),x,360,SCENES[key][1]*.46,7,(53,52,67,89))
        img.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(3)))
    h,w=draw_actor(img,key,t,x,y,angle,squish)
    fx=layer();draw=ImageDraw.Draw(fx)
    foreground(key,draw,t,x,y,h,w)
    if key=='cub':texture_snow(fx)
    if .48<t<2.3:
        k=(t-.48)/1.82
        for i in range(11):
            a=i*2.4;rad=(35+i%3*15)+k*103
            sparkle(draw,365+rad*math.cos(a),271+rad*.6*math.sin(a)-k*26,
                    (.5+math.sin(math.pi*k))*(2+i%4), (255,248,188,int(220*math.sin(math.pi*k))))
    if key in ('wolf','cub','penguin'):
        rand=Random(31)
        for i in range(24):
            px=(rand.random()*W+t*(3+i%3))%W;py=(rand.random()*H+t*(6+i%5))%H
            oval(draw,px,py,1+i%2,1+i%2,(255,250,242,145))
    img.alpha_composite(fx)
    return img.convert('RGB')

def render(key):
    target=OUT / f'{key}.mp4'
    scene(key,0).save(OUT / f'{key}.jpg', quality=90,optimize=True)
    # Keep the rescued animal visible in the static ending, including when it subsequently runs off-camera.
    ending_t = 2.39 if key=='wolf' else 4.0
    scene(key,ending_t).save(OUT / f'{key}-end.jpg', quality=90,optimize=True)
    cmd=['ffmpeg','-hide_banner','-loglevel','error','-y','-f','rawvideo','-pix_fmt','rgb24',
         '-s',f'{W}x{H}','-r',str(FPS),'-i','-','-an','-c:v','libx264','-threads','2',
         '-crf','23','-preset','medium','-pix_fmt','yuv420p','-movflags','+faststart',str(target)]
    with subprocess.Popen(cmd, stdin=subprocess.PIPE) as process:
        for i in range(round(FPS*SECONDS)):
            process.stdin.write(scene(key,i/FPS).tobytes())
        process.stdin.close()
        if process.wait():raise RuntimeError(f'Encoding failed for {key}')
    print(f'{key}: {target.stat().st_size//1024} KiB',flush=True)

if __name__ == '__main__':
    OUT.mkdir(exist_ok=True,parents=True)
    with ThreadPoolExecutor(max_workers=3) as workers:
        list(workers.map(render,sys.argv[1:] or SCENES))
