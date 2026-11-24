"""Compose the task props, contacts, shadows and reaction beats into the rescue films."""
import argparse
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor
from functools import lru_cache
import json
import math
from pathlib import Path
import shutil
import subprocess
import tempfile

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
ART = ROOT / 'scripts/rescue-cinema-art'
WIDTH, HEIGHT, FPS, LENGTH = 720, 404, 24, 144
FFMPEG = shutil.which('ffmpeg')
HEROES = {1, 61, 180, 300}
PROPS = json.loads((ART / 'props.json').read_text())
VARIATIONS = {'zoom':'A', 'splash':'A', 'bounce':'B', 'spin':'B', 'burst':'C', 'float':'C'}
# The camera leaves this side of each stage free for the object of the riddle.
CONTACTS = {'owl': (301,214), 'bear': (336,295), 'fox': (337,237),
            'mouse': (289,279), 'cat': (322,301), 'hare': (327,231),
            'hedgehog': (334,249), 'frog': (302,283), 'penguin': (310,291),
            'wolf': (306,236), 'cub': (300,242)}
SKY = {'🌙','☀️','☁️','🌧️','⛈️','🌈','⚫','✨','💨'}
GLOW = {'💡','☀️','🌙','✨','📸','📷','💎','🔦','📺','⚡'}
TWIN = {42,45,48,50,51,52,60,101,106,110,116,117,118,120,137,138,149,160,165,166,167,171,194,196,200,201,208,237,253,265,271,274,285}
TRACKED = {('fox','🦊'),('cat','🐈'),('mouse','🐭'),('hedgehog','🦔')}



def smooth(t, start, end):
    u = min(1., max(0., (t-start)/(end-start)))
    return u*u*(3-2*u)


def pulse(t, start, end):
    return math.sin(math.pi*smooth(t,start,end))


def task_list():
    script = "import('./docs/rescue-data.js').then(m=>process.stdout.write(JSON.stringify(m.tasks)))"
    return json.loads(subprocess.check_output(['node','--input-type=module','-e',script],cwd=ROOT))


@lru_cache(maxsize=32)
def load_prop(identifier):
    source = Image.open(ART / 'props' / identifier).convert('RGBA')
    bbox = source.getchannel('A').getbbox()
    return source.crop(bbox)


def draw_shadow(image, x, y, width, elevation):
    shade = shadow_tile(max(6,round(width/5)*5),max(0,min(8,round(elevation/24))))
    image.paste(shade,(round(x-shade.width/2),round(y-shade.height/2)),shade)


@lru_cache(maxsize=512)
def shadow_tile(width, height_tier):
    width = max(12,round(width*(.72+.055*height_tier)))
    height = max(6,round(width*.22))
    fig = Image.new('RGBA',(width+20,height+18))
    shape = ImageDraw.Draw(fig)
    shape.ellipse((9,7,width+8,height+7), fill=(33,34,49,round(95-6.8*height_tier)))
    return fig.filter(ImageFilter.GaussianBlur(2.4+height_tier*.35))


class Staging:
    def __init__(self, task):
        self.number = task['id']
        self.animal = task['scene']
        self.action = task['trick']
        self.symbol = task['prop']
        self.sky = self.symbol in SKY and self.animal not in ('cat','frog')
        self.prop = load_prop('maple_leaf.webp' if self.number==264 else PROPS[str(self.number)])
        if self.number == 285:
            hue,saturation,value=self.prop.convert('RGB').convert('HSV').split()
            value=value.point(lambda v:round(v*.93)); alpha=self.prop.getchannel('A')
            self.prop=Image.merge('HSV',(hue.point(lambda _:24),saturation,value)).convert('RGBA');self.prop.putalpha(alpha)
        self.x0 = 130 + (self.number*13%37)
        self.y0 = 288 + (self.number*11%18)
        self.cx, self.cy = CONTACTS[self.animal]
        if self.sky:
            self.y0 = 97+self.number%24;self.cy = 125;self.cx = 204
        self.width = 83 + self.number*7%14
        self.landing = 156 + self.number*17%104
        self.hue = {'wolf':(210,242,255),'cub':(210,242,255),'bear':(255,197,85),
                    'penguin':(215,245,255),'frog':(124,206,225),'cat':(145,213,222)}.get(self.animal,(255,221,140))

    def pose(self,t):
        # The audience meets a real foreground object before it participates in the rescue.
        a = smooth(t,.73,1.77); contact = smooth(t,1.70,2.23)
        lift = pulse(t,.78,2.12)
        x = self.x0 + (self.cx-self.x0)*a
        y = self.y0 + (self.cy-self.y0)*a - 32*lift
        scale = 1-.19*a; angle = -7-12*lift; alpha = 1.
        if t < 2.01:
            return x,y,scale,angle,alpha
        c = smooth(t,2.01,2.28)
        x += 5*c; y += 4*c; scale *= 1-.06*c
        move = smooth(t,2.24,4.35); after = smooth(t,4.34,5.32)
        if self.action == 'bounce':
            x += (self.landing-self.cx)*move
            ground = 303-self.cy
            y += ground*move-115*pulse(t,2.24,3.34)-45*pulse(t,3.35,4.1)-14*pulse(t,4.12,4.5)
            angle += 23*pulse(t,2.24,3.34)-13*pulse(t,3.35,4.1)+6*after
            scale *= 1+.13*pulse(t,3.29,3.52)
        elif self.action == 'zoom':
            x += 346*move; y += 18*move-31*pulse(t,2.24,4.36)
            angle += 14*pulse(t,2.24,4.35)+5*move; scale *= 1-.22*move+.11*after
        elif self.action == 'float':
            x += -60*move+42*after; y += -(55 if self.sky else 119)*move-9*math.sin(3.4*t)*move
            angle += 14*math.sin(t*3.1)*move; scale *= 1-.12*move
        elif self.action == 'spin':
            x += (self.landing-self.cx)*move + 20*math.sin(move*2*math.pi)
            y += (298-self.cy)*move - 24*math.sin(move*math.pi)
            angle += (1 if self.number%2 else -1)*(300+60*(self.number%3))*move+10*pulse(t,4.4,5.15)
        elif self.action == 'splash':
            x += (self.landing-self.cx)*move; y += (311-self.cy)*smooth(t,2.24,3.30)-41*pulse(t,2.24,3.22)-9*pulse(t,3.44,4.20)
            angle += 19*pulse(t,2.24,3.31)-7*after; scale *= 1-.22*move
        else:
            x += (self.landing-self.cx)*move; y += -37*move+8*math.sin(3.6*t)*after
            scale *= 1+.45*pulse(t,2.24,2.91)-.20*move; angle += 12*math.sin(t*4)*move
            if self.number in (25,36,55,65,78,274,295,300): alpha = 1-smooth(t,2.66,2.99)
        return x,y,scale,angle,alpha

    def splashes(self,img,t):
        if self.action != 'splash' or not 3.07<t<4.15: return
        q = smooth(t,3.07,4.15)
        x = self.pose(3.24)[0]; y = 313
        marks=Image.new('RGBA',(190,80)); d=ImageDraw.Draw(marks)
        for i in range(7):
            dx = (i-3)*21*q; dy = math.sin(q*math.pi)*(27+13*(i%3))-9*q
            r=max(1,round((1-q)*(4+i%2)))
            d.ellipse((95+dx-r,55-dy-r*1.6,95+dx+r,55-dy+r*1.6),fill=(*self.hue,round(205*(1-q))))
        for shift in (0,.20):
            v=max(0,q-shift); rx=8+54*v; ry=2+8*v
            d.ellipse((95-rx,55-ry,95+rx,55+ry),outline=(*self.hue,round(155*(1-q))),width=2)
        img.paste(marks,(round(x-95),y-55),marks)

    def burst(self,img,t):
        if self.action!='burst' or not 2.57<t<3.76: return
        q=smooth(t,2.57,3.76); x,y,_,_,_=self.pose(2.65)
        colored=self.number in (59,65,78,252,254,274,295,300)
        for i in range(6):
            angle=math.pi*2*i/6+.25; dist=19+67*q
            if colored:
                item = self.transformed(max(7,round((20+i%3*5)*(1-q*.61))),round((45+i*31)*q))
                if q>.70: item = opacity(item,(1-q)/.30)
                xx=x+math.cos(angle)*dist; yy=y+math.sin(angle)*dist-14*math.sin(q*math.pi)+13*q*q
                img.paste(item,(round(xx-item.width/2),round(yy-item.height/2)),item)
            else:
                ray=Image.new('RGBA',(200,200)); marks=ImageDraw.Draw(ray)
                before=dist-4-8*(1-q); after=dist+3
                marks.line((100+math.cos(angle)*before,100+math.sin(angle)*before,100+math.cos(angle)*after,100+math.sin(angle)*after), fill=(*self.hue,round(210*(1-q))),width=3)
                img.paste(ray,(round(x-100),round(y-100)),ray)

    @lru_cache(maxsize=150)
    def transformed(self, width, angle):
        factor=width/max(self.prop.size)
        shape=self.prop.resize((max(1,round(self.prop.width*factor)),max(1,round(self.prop.height*factor))),Image.Resampling.LANCZOS)
        if angle%360: shape=shape.rotate(angle,resample=Image.Resampling.BICUBIC,expand=True)
        return shape

    def frame(self,image,t):
        x,y,scale,angle,alpha=self.pose(t)
        width=self.width*scale
        floor=316 if self.animal in ('wolf','cub','cat','frog','penguin') else 320
        if self.number == 242:
            factor=1+.29*smooth(t,3.18,4.64)
            if factor>1.001:
                w,h=round(WIDTH/factor),round(HEIGHT/factor)
                xx=round((WIDTH-w)*.42); yy=round((HEIGHT-h)*.49)
                image.paste(image.crop((xx,yy,xx+w,yy+h)).resize((WIDTH,HEIGHT),Image.Resampling.BICUBIC))
            return
        if self.number == 264:
            q=smooth(t,2.54,4.61);float_up=pulse(t,2.56,4.20)
            xx=185+142*q; yy=273-87*q-125*float_up
            leaf=self.transformed(round(63-22*q),round(12+163*q));image.paste(leaf,(round(xx-leaf.width/2),round(yy-leaf.height/2)),leaf)
            return
        if (self.animal,self.symbol) in TRACKED: return
        if not self.sky: draw_shadow(image,x+6,floor,width*(.35+.65*alpha),max(0,floor-y-width*.4))
        if self.symbol in GLOW:
            intensity=pulse(t,1.97,3.06)+.24*pulse(t,3.09,3.75)
            if intensity>.01:
                light=glow_tile(round(intensity*10));image.paste(light,(round(x-light.width/2),round(y-light.height/2)),light)
        if self.number in TWIN and t>2.53:
            # Pairs, flocks and scattered objects get an actual second arrival.
            q=smooth(t,2.53,3.66);extra=self.transformed(max(4,round(width*(.21+.33*q))),round(-angle-12))
            extra_x=x-54*q-7;extra_y=y-26*pulse(t,2.53,3.66)-11*q
            image.paste(extra,(round(extra_x-extra.width/2),round(extra_y-extra.height/2)),extra)

        if alpha>.005:
            prop=self.transformed(max(1,round(width)),round(angle))
            if alpha<.995: prop=opacity(prop,alpha)
            image.paste(prop,(round(x-prop.width/2),round(y-prop.height/2)),prop)
        self.burst(image,t); self.splashes(image,t)
        if self.number==292 and t>3.0:
            q=smooth(t,3.00,4.85); xx=197+269*q;yy=302-135*q-68*pulse(t,3.00,4.85)
            bow=load_prop('ribbon.webp').resize((39,31),Image.Resampling.LANCZOS)
            bow=bow.rotate(round(20+43*pulse(t,3.0,4.85)),resample=Image.Resampling.BICUBIC,expand=True)
            image.paste(bow,(round(xx-bow.width/2),round(yy-bow.height/2)),bow)
        if self.number==295 and t>2.72:
            q=smooth(t,2.72,3.49);foam=Image.new('RGBA',(145,78));brush=ImageDraw.Draw(foam)
            for i in range(19):
                r=(4+i%4)*q;off=math.sin(t*3+i)*3; x=28+(i*31%95)+off; y=35+math.sin(i*2.12)*14-6*math.cos(t*3+i)
                brush.ellipse((x-r,y-r,x+r,y+r),fill=(231,247,252,180),outline=(246,254,255,245),width=1)
                brush.ellipse((x-r*.63,y-r*.69,x-r*.14,y-r*.25),fill=(255,255,255,250))
            image.paste(foam,(336,round(209-19*pulse(t,2.75,3.77))),foam)


@lru_cache(maxsize=12)
def glow_tile(intensity):
    radius=35+intensity*5;size=radius*2;img=Image.new('RGBA',(size,size));draw=ImageDraw.Draw(img)
    for r in range(radius,0,-2):
        alpha=round(intensity*6*(1-r/radius)**1.6)
        draw.ellipse((radius-r,radius-r,radius+r,radius+r),fill=(255,221,126,alpha))
    return img.filter(ImageFilter.GaussianBlur(4))


def opacity(img,q):
    out=img.copy();out.putalpha(img.getchannel('A').point(lambda a: int(a*min(1,max(0,q)))))
    return out


def render_task(task, frames, output):
    stage=Staging(task); stem=f"r{task['id']:03}"
    # The temporary name prevents partial files reaching the web build.
    with tempfile.TemporaryDirectory(dir=output) as temp:
        temp=Path(temp); film=temp/f'{stem}.mp4'
        cmd=[FFMPEG,'-hide_banner','-loglevel','error','-y','-f','rawvideo','-pixel_format','rgb24','-video_size',f'{WIDTH}x{HEIGHT}','-framerate',str(FPS),'-i','-','-c:v','libx264','-threads','2','-preset','veryfast','-crf','27','-maxrate','600k','-bufsize','950k','-pix_fmt','yuv420p','-movflags','+faststart',str(film)]
        encoder=subprocess.Popen(cmd,stdin=subprocess.PIPE)
        try:
            for i,frame in enumerate(frames):
                image=frame.copy();stage.frame(image,i/FPS)
                if i in (0,LENGTH-1):
                    kind='start' if i==0 else 'end';image.resize((570,320),Image.Resampling.LANCZOS).save(temp/f'{stem}-{kind}.jpg',quality=82, optimize=True)
                encoder.stdin.write(image.tobytes())
        finally:
            encoder.stdin.close();status=encoder.wait();stage.transformed.cache_clear()
        if status!=0: raise RuntimeError(f'encoding {stem} failed')
        for path in temp.iterdir(): path.replace(output/path.name)
    return stem


def load_frames(film):
    cmd=[FFMPEG,'-hide_banner','-loglevel','error','-i',str(film),'-f','rawvideo','-pix_fmt','rgb24','-threads','1','-']
    decoder=subprocess.Popen(cmd,stdout=subprocess.PIPE)
    frames=[]
    with decoder.stdout:
        while True:
            frame=decoder.stdout.read(WIDTH*HEIGHT*3)
            if not frame: break
            frames.append(Image.frombytes('RGB',(WIDTH,HEIGHT),frame))
    if decoder.wait() or len(frames)!=LENGTH: raise RuntimeError(f'Incomplete {film}')
    return frames


if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('base',type=Path);p.add_argument('output',type=Path)
    p.add_argument('--ids',type=int,nargs='*');p.add_argument('--workers',type=int,default=4);p.add_argument('--skip-existing',action='store_true')
    args=p.parse_args();args.output.mkdir(parents=True, exist_ok=True)
    groups=defaultdict(list)
    for task in task_list():
        n=task['id']; stem=f'r{n:03}'
        if n in HEROES or (args.ids and n not in args.ids): continue
        if args.skip_existing and all((args.output/(stem+suffix)).is_file() for suffix in ['.mp4','-start.jpg','-end.jpg']): continue
        groups[(task['scene'],VARIATIONS[task['trick']])].append(task)
    for (species,variation),items in groups.items():
        frames=load_frames(args.base/f'{species}-{variation}.mp4')
        with ThreadPoolExecutor(max_workers=args.workers) as pool:
            for result in pool.map(lambda task:render_task(task,frames,args.output),items): print(result,flush=True)
        del frames
