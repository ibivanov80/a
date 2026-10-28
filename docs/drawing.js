import {art} from './art.js?v=variety-v1';
export const W=1000,H=560;
export const C={ink:'#34313c',paper:'#faf6eb',purple:'#a99be8',coral:'#ee845e',green:'#a9c678',yellow:'#eac666',blue:'#8abac2',pink:'#d99eae'};
export const PALETTES=[['#f6dfcd','#c9764f'],['#e6def3','#8c73bd'],['#e4eccf','#7d9856'],['#f3e6b7','#b19846'],['#dcebed','#648f97'],['#f1dee4','#b87a90']];
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export const hit=(p,x,y,w,h)=>p.x>=x&&p.x<=x+w&&p.y>=y&&p.y<=y+h;
export const near=(p,x,y,r)=>Math.hypot(p.x-x,p.y-y)<r;
export const shuffle=a=>a.slice().sort(()=>Math.random()-.5);
export function box(c,x,y,w,h,r=20,fill='#fffaf0',stroke=null){c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=3;c.stroke()}}
export function text(c,s,x,y,size=24,color=C.ink,align='center',weight=800){c.save();c.fillStyle=color;c.font=`${weight} ${size}px Nunito, 'Trebuchet MS', sans-serif`;c.textAlign=align;c.textBaseline='middle';c.fillText(s,x,y);c.restore()}
export function line(c,pts,color=C.ink,width=5,dash=[]){c.save();c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.setLineDash(dash);c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.stroke();c.restore()}
export function circle(c,x,y,r,color,stroke=null){c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fillStyle=color;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=3;c.stroke()}}
export function glyph(c,s,x,y,size=210,color=C.purple,eyes=false,rotation=0){c.save();c.translate(x,y);c.rotate(rotation);text(c,s,0,0,size,color,'center',1000);if(eyes){for(let i=0;i<2;i++){c.fillStyle='white';c.beginPath();c.ellipse(-size*.075+i*size*.12,-size*.15,size*.055,size*.073,0,0,7);c.fill();circle(c,-size*.06+i*size*.12,-size*.13,size*.022,C.ink)}line(c,[[-size*.04,-size*.02],[0,size*.005],[size*.04,-size*.02]],C.ink,3)}c.restore()}
const cache=new Map();
export function sprite(c,kind,x,y,w=130,h=w,variant=0,rotation=0,color=C.purple){const key=kind+color+variant;let im=cache.get(key);if(!im){im=new Image();im.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(art(kind,color,variant));cache.set(key,im)}if(im.complete&&im.naturalWidth){c.save();c.translate(x+w/2,y+h/2);c.rotate(rotation);c.drawImage(im,-w/2,-h/2,w,h);c.restore()}}
export function bubble(c,s,x,y,w=210){box(c,x,y,w,54,20,'#fffdf5');text(c,s,x+w/2,y+28,19);c.fillStyle='#fffdf5';c.beginPath();c.moveTo(x+20,y+48);c.lineTo(x+12,y+65);c.lineTo(x+46,y+49);c.fill()}
export function hand(c,x,y,dx,dy,t){const k=(Math.sin(t*2)+1)/2;c.save();c.globalAlpha=.7;line(c,[[x,y],[x+dx,y+dy]],'#a29072',3,[7,7]);circle(c,x+dx*k,y+dy*k,19,'#fff9ec','#c1ad8b');line(c,[[x+dx*k,y+dy*k+8],[x+dx*k,y+dy*k-12]],'#b9a082',5);c.restore()}
export function button(c,label,x,y,w=120,color=C.purple){box(c,x,y,w,55,17,color);text(c,label,x+w/2,y+29,23,'#39313f')}
export function base(c,index,t){c.fillStyle=['#f3ecdf','#eee8f5','#edf0df','#f6edd9','#e8f0ee'][index%5];c.fillRect(0,0,W,H);c.save();c.globalAlpha=.13;for(let i=0;i<70;i++){const x=(i*163+41)%W,y=(i*97+23)%H;circle(c,x,y,(i%3+1)*.5,'#a48c65')}c.restore();c.fillStyle='#d9d4bc66';c.beginPath();c.ellipse(500,534,470,26,0,0,7);c.fill();text(c,'✳',900,66,38,'#d4bb78');text(c,'✦',80,135,20,'#c4b3da')}
export function shadow(c,x,y,w=100){c.save();c.fillStyle='#8f826722';c.beginPath();c.ellipse(x,y,w,13,0,0,7);c.fill();c.restore()}
export function check(c,x,y){circle(c,x,y,20,'#b8d18a');line(c,[[x-8,y],[x-1,y+7],[x+10,y-8]],'#fffdf3',5)}
export function pathPoint(pts,t){const a=clamp(t,0,.99999)*(pts.length-1),i=Math.floor(a),f=a-i;return{x:pts[i][0]+(pts[i+1][0]-pts[i][0])*f,y:pts[i][1]+(pts[i+1][1]-pts[i][1])*f}}
