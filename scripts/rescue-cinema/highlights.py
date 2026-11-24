"""Render the four individually choreographed rescue films from their CGI poses."""
from pathlib import Path
from math import sin, cos, pi
import random
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageOps

ROOT = Path(__file__).resolve().parents[2]
ART = ROOT / 'scripts/rescue-cinema-art'
OUTPUT = ROOT / 'docs/assets/rescue-cinema'
WIDTH, HEIGHT, FPS, LENGTH = 832, 468, 24, 6
WINTER = ImageOps.fit(Image.open(ART / 'winter.jpg').convert('RGB'), (WIDTH, HEIGHT))
AUTUMN = ImageOps.fit(Image.open(ART / 'autumn.jpg').convert('RGB'), (WIDTH, HEIGHT))
SUMMER = ImageOps.fit(Image.open(ART / 'summer.jpg').convert('RGB'), (WIDTH, HEIGHT))
Y, X = np.mgrid[:HEIGHT, :WIDTH].astype('float32')
RNG = np.random.default_rng(128)
GRAIN = RNG.normal(0, 1, (HEIGHT, WIDTH))
POSES = {name: [Image.open(ART / 'poses' / name / f'{n}.webp').convert('RGBA')
                for n in range(8)] for name in ('wolf', 'cub', 'owl', 'mouse')}
MEGAPHONE = Image.open(ART / 'props/megaphone.webp').convert('RGBA')


def ease(t, start, end):
    u = max(0, min(1, (t - start) / (end - start)))
    return u * u * (3 - 2 * u)


def background(image, t, pan=0):
    zoom = .985 - .038 * ease(t, 0, 2.5) + .05 * ease(t, 2.5, 5)
    w, h = WIDTH * zoom, HEIGHT * zoom
    x = (WIDTH - w) * .5 + pan * (WIDTH - w) * .35
    y = (HEIGHT - h) * .45
    return image.resize((WIDTH, HEIGHT), Image.Resampling.BICUBIC,
                        (x, y, x + w, y + h)).convert('RGBA')


def sprite(canvas, image, x, bottom, scale, angle=0, stretch=1):
    obj = image.resize((max(1, round(image.width * scale / stretch)),
                        max(1, round(image.height * scale * stretch))), Image.Resampling.LANCZOS)
    if abs(angle) > .15:
        obj = obj.rotate(angle, Image.Resampling.BICUBIC, expand=True)
    canvas.alpha_composite(obj, (round(x - obj.width / 2), round(bottom - obj.height)))


def shadow(canvas, x, y, rx, ry, alpha=75, winter=True):
    layer = Image.new('RGBA', canvas.size)
    color = (45, 52, 93, round(alpha)) if winter else (32, 38, 16, round(alpha))
    ImageDraw.Draw(layer).ellipse((x-rx, y-ry, x+rx, y+ry), fill=color)
    canvas.alpha_composite(layer.filter(ImageFilter.GaussianBlur(max(3, ry * .7))))


def overlay(canvas, draw):
    layer = Image.new('RGBA', canvas.size)
    draw(ImageDraw.Draw(layer))
    canvas.alpha_composite(layer)


def paint(canvas, rgb, alpha):
    layer = np.empty((HEIGHT, WIDTH, 4), dtype=np.uint8)
    layer[:, :, :3] = np.clip(rgb, 0, 255)
    layer[:, :, 3] = np.clip(alpha, 0, 255)
    canvas.alpha_composite(Image.fromarray(layer))


def snowdrift(canvas, cx, cy, rx, ry, t):
    # Light comes over the left tree. The near edge turns lavender in its own shadow.
    dx = (X - cx) / rx
    curve = cy - ry * np.sqrt(np.maximum(0, 1 - dx * dx))
    curve += 5 * np.sin(X / 32) + 2 * np.sin(X / 15) + 1.5 * np.sin(X / 4)
    curve -= 10*np.exp(-((dx+.41)/.27)**2) + 6*np.exp(-((dx-.30)/.18)**2)
    depth = np.clip((Y - curve) / ry, 0, 1)
    foot = cy + .16 * ry * np.sqrt(np.maximum(0, 1 - dx * dx))
    inside = np.minimum.reduce([(1 - np.abs(dx)) * rx, Y - curve, foot - Y])
    alpha = np.clip(inside + .5, 0, 1) * np.clip((foot-Y)/8,0,1) * 255
    shade = .52 * depth + .25 * np.clip(dx + .3, 0, 1)
    shade += .035 * np.sin(X / 22 + depth * 4) + .025 * np.sin(X / 6 + Y / 9)
    glint = np.maximum(0, GRAIN - 1.7) * 8
    rgb = np.stack([248 - shade*98 + GRAIN*2 + glint,
                    245 - shade*78 + GRAIN*2 + glint,
                    252 - shade*31 + GRAIN*2 + glint], axis=-1)
    paint(canvas, rgb, alpha)


def ice(canvas, melt, t):
    if melt > .996:
        return
    cx, bottom, radius = 392, 387, 165 - melt*36
    top = 55 + melt * 319
    height = bottom - top
    bevel = min(28, height*.38)
    front = [(cx-radius+12,top+bevel),(cx+radius-29,top+bevel+2),
             (cx+radius-28,bottom-7),(cx-radius+14,bottom),
             (cx-radius,bottom-15),(cx-radius,top+bevel+11)]
    mask = Image.new('L', canvas.size)
    ImageDraw.Draw(mask).polygon(front, fill=255)
    # A small optical shift at the front makes the wolf appear inside the ice.
    original = canvas.copy()
    refract = Image.blend(original, original.filter(ImageFilter.GaussianBlur(1.3)), .65)
    band = np.clip((canvas.height-Y) / HEIGHT,0,1)
    light = np.exp(-((X-cx+radius-23) / 12)**2) + .5*np.exp(-((X-cx-radius+53)/28)**2)
    a = np.asarray(refract)[:, :, :3].astype('float32')
    blue = np.stack([111+72*band,196+37*band,223+29*band],axis=-1)
    shifted = np.roll(a, 3, axis=1)*.66 + blue*.34 + light[...,None]*20
    paint(canvas, shifted, np.asarray(mask))
    def facets(d):
        d.polygon([(cx-radius,top+bevel+9),(cx-radius+40,top),(cx+radius-14,top+1),
                   (cx+radius,top+9),(cx+radius-29,top+bevel+2),(cx-radius+12,top+bevel)],
                  fill=(204,241,255,158))
        d.polygon([(cx+radius-29,top+bevel+2),(cx+radius,top+9),(cx+radius-3,bottom-22),
                   (cx+radius-28,bottom-7)],fill=(65,161,191,111))
        d.line([front[0],front[1],front[2]],fill=(232,255,255,204),width=4)
        d.line([front[4],front[3],front[2]],fill=(212,249,255,168),width=5)
        for j in range(3):
            gx=cx-radius+32+j*11;gy=top+bevel+16+j*5
            if gy+22<bottom-7: d.line((gx,gy+29,gx+23,gy), fill=(255,255,255,105-20*j),width=3)
        for j in range(15):
            gx=cx-radius+22+(j*73)%220;gy=bottom-20-(j*37)%230
            if gy>top+bevel+7:d.ellipse((gx,gy,gx+3,gy+5),outline=(190,242,254,110),width=1)
    overlay(canvas,facets)


def spray(canvas, t, start, x, y, amount=19, powder=True, spread=150):
    rng = random.Random(round(start*245))
    def dots(d):
        for i in range(amount):
            dt = t-start-rng.uniform(0,.2)
            vx = rng.uniform(-spread,spread)
            vy = rng.uniform(-208,-43)
            rad = rng.uniform(2,7) if powder else rng.uniform(2,5)
            if dt < 0 or dt > 1.1:continue
            px=x+vx*dt;py=y+vy*dt+193*dt*dt
            alpha=round(215*max(0,1-dt/.99))
            c=(236,244,255,alpha) if powder else (143,220,240,alpha)
            d.ellipse((px-rad,py-rad,px+rad,py+rad*1.24),fill=c)
            d.ellipse((px-rad*.6,py-rad*.7,px,py-rad*.2),fill=(255,255,255,alpha))
    overlay(canvas,dots)


def footprint(canvas,x,y,s,opacity):
    def pad(d):
        color=(95,110,147,opacity)
        d.ellipse((x-8*s,y-3*s,x+7*s,y+3*s),fill=color)
        for k in range(3):
            px=x+(2+k*3)*s;py=y+(-5+k*2.3)*s
            d.ellipse((px-2*s,py-1.2*s,px+2*s,py+1.2*s),fill=color)
    overlay(canvas,pad)


def wolf(t):
    pan=ease(t,3.5,5.2)
    canvas=background(WINTER,t,pan)
    melt=ease(t,.63,2.37)
    if melt:
        def water(d):
            a=melt
            for r in range(6):
                rx=(147-r*8)*a;ry=(18-r*1.5)*a
                d.ellipse((396-rx,382-ry,396+rx,382+ry),fill=(103+8*r,171+7*r,201+6*r,90+8*r))
            d.arc((315,372,470,388),6,145,fill=(245,253,255,177),width=2)
        overlay(canvas,water)
    for i in range(10):
        age=t-(3.34+i*.151)
        if age>=0: footprint(canvas,365+i*48-pan*21,385+(i%2)*4,.84,round(95*min(1,age*10)))
    run=max(0,t-3.3)
    x=392+max(0,run*133+run*run*131)-pan*16
    pose=0
    angle=0
    lift=0
    if 2.08<=t<2.29: pose=1
    elif 2.29<=t<3.0:
        pose=2 if int(t*15)%2==0 else 1
        angle=sin(t*42)*5.5
    elif 3.0<=t<3.30:pose=3
    elif run>0:pose=4+int(run*10.5)%4;lift=11*(.5-.5*cos(run*10.5*pi/2))
    shadow(canvas,x,383,103 if not run else 112,10,73 if not run else 51)
    sprite(canvas,POSES['wolf'][pose],x,386-lift,.758,angle)
    ice(canvas,melt,t)
    for j in range(4):
        spray(canvas,t,1.82+j*.17,308+j*46,370,8,False,85)
    spray(canvas,t,2.54,405,200,28,False,224)
    for j in range(5):
        spray(canvas,t,3.36+j*.28,358+j*77,376,9,True,76)
    return canvas


def cub(t):
    canvas=background(WINTER,t,ease(t,2.4,4.7))
    x=332+189*ease(t,2.46,3.63)
    arc=sin(pi*ease(t,2.43,3.65))
    y=388+68*(1-ease(t,1.15,2.30))-151*arc
    pose=0
    if 2.06<t<2.46:pose=1
    elif 2.46<=t<2.78:pose=2
    elif 2.78<=t<3.19:pose=3
    elif 3.19<=t<3.57:pose=4
    elif 3.57<=t<3.92:pose=5
    elif 3.92<=t<4.67:pose=0
    elif 4.67<=t<5.44:pose=6
    elif t>=5.44:pose=7
    shadow(canvas,x,391,78-arc*21,9,68-arc*40)
    if t < 2.46:
        animal=Image.new('RGBA',canvas.size)
        sprite(animal,POSES['cub'][pose],x,y,.625,3*arc)
        canvas.alpha_composite(animal.crop((0,0,WIDTH,388)),(0,0))
    else:
        sprite(canvas,POSES['cub'][pose],x,y,.625,3*arc)
    drift=1-.35*ease(t,1.1,2.6)
    snowdrift(canvas,321,396,162*drift,159*drift,t)
    spray(canvas,t,2.47,345,278,28,True,177)
    spray(canvas,t,3.60,513,383,15,True,95)
    if 4.04<=t<4.67:
        u=(t-4.04)/.63
        sx,sy=549+26*u,13+167*u*u
        def ball(d):
            d.ellipse((sx-11,sy-10,sx+11,sy+10),fill=(179,193,219,255))
            d.ellipse((sx-10,sy-10,sx+9,sy+7),fill=(239,245,255,255))
            d.ellipse((sx-6,sy-8,sx-1,sy-4),fill=(255,255,255,255))
        overlay(canvas,ball)
    spray(canvas,t,5.43,574,175,14,True,86)
    return canvas


def path_between(points,count=46):
    a,b,c=points
    return [((1-u)**2*a[0]+2*(1-u)*u*b[0]+u*u*c[0],
             (1-u)**2*a[1]+2*(1-u)*u*b[1]+u*u*c[1]) for u in np.linspace(0,1,count)]


def kite(canvas,t,release):
    kx=570+299*release
    ky=105-172*release+6*sin(t*2.7)
    swing=8*sin(t*3.2)
    def draw(d):
        pt=[(kx+swing,ky-45),(kx+39,ky-2),(kx-4,ky+58),(kx-42,ky-6)]
        d.polygon(pt,fill=(240,124,60,255))
        d.polygon([pt[0],pt[1],pt[2]],fill=(244,171,69,255))
        d.polygon([pt[0],pt[3],(kx,ky)],fill=(227,82,53,255))
        d.line([pt[0],pt[2]], fill=(255,212,132,255),width=2)
        tip=(435+420*release,261-262*release)
        curve=path_between([pt[2],(548+324*release,245-192*release),tip])
        d.line(curve,fill=(155,66,37,255),width=5)
        d.line(curve,fill=(252,155,73,255),width=2)
        for n in [12,25,36]:
            x,y=curve[n];d.polygon([(x-7,y-6),(x+8,y+2),(x+4,y-7),(x-5,y+5)],fill=(255,167,57,255))
        if release <.45:
            loop=[(tip[0]-8+17*cos(z),tip[1]-2+11*sin(z)) for z in np.linspace(0,2*pi,40)]
            d.line(loop,fill=(232,134,56,round(248*(1-release))),width=3)
    overlay(canvas,draw)


def owl(t):
    canvas=background(SUMMER,t)
    release=ease(t,2.04,3.38)
    x=347+72*ease(t,2.29,3.66)
    lift=73*sin(pi*ease(t,2.52,4.08))
    y=385-lift
    pose=0 if t<.75 else 1
    if 1.45<=t<2.12:pose=2
    elif 2.12<=t<2.58:pose=3
    elif 2.58<=t<4.02:pose=4+int(t*6.6)%2
    elif 4.02<=t<4.90:pose=6
    elif t>=4.90:pose=7
    shadow(canvas,x,386,91-lift*.35,10,75-lift*.48,False)
    sprite(canvas,POSES['owl'][pose],x,y,.646,sin(t*6)*3 if 2.58<t<4.08 else 0)
    kite(canvas,t,release)
    # The open bell points towards the kite. It tumbles into the moss after the hoot.
    horn=MEGAPHONE
    u=ease(t,.80,1.54);v=ease(t,2.2,3.07)
    hx=222+218*u+91*v;hy=385-108*u+111*v
    sprite(canvas,horn,hx,hy, .32,-13+64*v)
    if 2.0<t<2.66:
        a=ease(t,2,2.66)
        def puffs(d):
            for k in range(3):
                xx=470+(k*10+57)*a;yy=229-16*a
                d.arc((xx-10,yy-12-k*7,xx+21,yy+12+k*7),276,420,
                      fill=(255,230,166,round(190*(1-a))),width=3)
        overlay(canvas,puffs)
    if 4.08<t<4.9:
        u=ease(t,4.08,4.91);lx=425+44*sin(u*pi*2);ly=67+89*u
        def leaf(d):
            d.polygon([(lx-15,ly-3),(lx-2,ly-10),(lx+18,ly-2),(lx+4,ly+5)],fill=(116,143,49,255))
            d.line((lx-15,ly-3,lx+15,ly-2),fill=(182,166,77,255),width=2)
        overlay(canvas,leaf)
    return canvas



def cheese_disc():
    size=320
    y,x=np.mgrid[:size,:size]
    dx=(x-size/2+2)/148
    dy=(y-size/2+2)/148
    radius=np.sqrt(dx*dx+dy*dy)
    rng=np.random.default_rng(330)
    freckles=rng.normal(0,2.2,(size,size))
    light=np.clip(33*(1-dy)-13*dx+freckles,0,82)
    bevel=np.clip((radius-.91)/.09,0,1)
    rgb=np.stack([226+light*.54-bevel*13,147+light*.90-bevel*12,
                  53+light*.77-bevel*10],axis=-1)
    for xx,yy,r in ((-.55,-.25,.15),(.07,-.57,.17),(.31,-.12,.09),(.57,.33,.18),
                     (-.20,.34,.23),(-.55,.59,.10),(.13,.72,.08),(-.22,-.06,.065),
                     (.68,-.37,.067),(-.51,-.64,.062)):
        dd=np.sqrt(((dx-xx)/.95)**2+((dy-yy)/.89)**2)/r
        hollow=np.clip((1-dd)*9,0,1)
        upper=np.clip((yy-dy)/r+.53,0,1)
        rgb[:,:,0]-=hollow*(22+12*upper);rgb[:,:,1]-=hollow*(20+23*upper);rgb[:,:,2]-=hollow*(8+19*upper)
        rgb+=np.clip(1-np.abs(dd-1)*8,0,1)[:,:,None]*np.clip((dy-yy)/r,0,1)[:,:,None]*23
    a=np.uint8(np.clip((1.0-radius)*148+.5,0,1)*255)
    result=Image.fromarray(np.uint8(np.clip(rgb,0,255))).convert('RGBA'); result.putalpha(Image.fromarray(a))
    return result


CHEESE=cheese_disc()


def wheel(canvas,x,y,rad,rotation):
    size=round(rad*2)
    disc=CHEESE.rotate(-rotation,Image.Resampling.BICUBIC)
    front=disc.resize((size, size),Image.Resampling.LANCZOS)
    side=front.copy()
    tint=Image.new('RGBA',front.size,(168,97,38,255));tint.putalpha(front.getchannel('A'))
    side=Image.blend(side,tint,.44)
    left=round(x-rad);top=round(y-2*rad)
    for shift in range(int(rad*.20),-1,-3):
        canvas.alpha_composite(side,(left+shift,top-round(shift*.40)))
    canvas.alpha_composite(front,(left,top))


def mouse(t):
    roll=ease(t,2.65,5.84)
    canvas=background(AUTUMN,t,roll-.4)
    depth=1-.54*ease(t,3.76,5.85)
    rad=89*depth
    wx=449+304*roll
    floor=400-104*ease(t,3.93,5.90)
    wheel_top=floor-1.93*rad
    shadow(canvas,wx+9*depth,floor-2,73*depth,10*depth,84,False)
    for i in range(15):
        u=ease(t,2.90+i*.15,3.24+i*.15)
        if u:
            px=460+18*i;py=398-89*(i/15)**1.85+(i%3)*1.5
            def crumb(draw):
                r=max(1.3,4.8-i*.20)
                draw.polygon([(px-r,py),(px,py-r*1.2),(px+r,py+r*.34),(px-r*.5,py+r*.57)],
                             fill=(246,187,82,round(237*u)))
            overlay(canvas,crumb)
    early=ease(t,1.16,2.52)
    amt=sin(pi*early)
    mx=252+(440-252)*early+(wx-449)
    my=390+(wheel_top-390)*early-130*amt
    pose=0
    if .76<t<1.15:pose=1
    elif 1.15<=t<1.48:pose=2
    elif 1.48<=t<1.93:pose=3
    elif 1.93<=t<2.28:pose=4
    elif 2.28<=t<2.65:pose=5
    elif t>=2.65:pose=6 if t<3.50 else 7
    if t<2.20:shadow(canvas,278+116*early,397,60-amt*28,7,55-amt*34,False)
    wheel(canvas,wx,floor,rad,roll*620)
    if t>2.65:my+=2*sin(t*14)*depth
    sprite(canvas,POSES['mouse'][pose],mx,my,.55*depth,(-9*amt+5*sin(t*7)*roll))
    if t>2.77:
        randomizer=random.Random(395)
        def confetti(d):
            for j in range(53):
                delay=randomizer.uniform(0,1.5)
                vx=randomizer.uniform(-114,114);vy=randomizer.uniform(-183,-78)
                dt=t-2.77-delay
                if not 0<dt<2:continue
                at=ease(2.77+delay,2.65,5.84)
                xx=445+304*at+vx*dt;yy=216-24*at+vy*dt+128*dt*dt
                angle=j+dt*8;size=(3.1+ j%3)*max(.2,1-.30*dt)
                ax=cos(angle)*size;ay=sin(angle)*size
                clr=[(233,96,65),(255,205,78),(132,187,151),(173,130,190)][j%4]
                d.polygon([(xx-ax,yy-ay),(xx+ay*.5,yy-ax*.5),(xx+ax,yy+ay),(xx-ay*.5,yy+ax*.5)],
                          fill=(*clr,int(242*min(1,(2-dt)*3))))
        overlay(canvas,confetti)
    return canvas


def render(number, scene):
    base=OUTPUT / f'r{number:03}'
    OUTPUT.mkdir(parents=True,exist_ok=True)
    command=['ffmpeg','-nostdin','-hide_banner','-loglevel','error','-y','-f','rawvideo',
             '-pix_fmt','rgb24','-s',f'{WIDTH}x{HEIGHT}','-r',str(FPS),'-i','-','-an',
             '-c:v','libx264','-threads','2','-preset','fast','-crf','21','-pix_fmt','yuv420p',
             '-movflags','+faststart',str(base.with_suffix('.mp4'))]
    with subprocess.Popen(command,stdin=subprocess.PIPE) as writer:
        for frame in range(FPS*LENGTH):
            image=scene(frame/FPS).convert('RGB')
            if frame==0:image.save(str(base)+'-start.jpg',quality=92,optimize=True)
            if frame==FPS*LENGTH-1:image.save(str(base)+'-end.jpg',quality=92,optimize=True)
            writer.stdin.write(image.tobytes())
        writer.stdin.close()
        if writer.wait():raise RuntimeError(f'Failed to encode {base.name}')
    print(base.name,flush=True)


if __name__=='__main__':
    scenes={1:owl,61:wolf,180:cub,300:mouse}
    for i in map(int,sys.argv[1:] or scenes):
        render(i,scenes[i])
