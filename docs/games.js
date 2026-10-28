import {drawTogetherGuide} from './care.js?v=practice-v2';
import {drawCompanion} from './companions.js?v=practice-v2';
import {LEVELS} from './data.js?v=practice-v2';
import {createStory} from './stories.js?v=practice-v2';
import {STORY_JOKES} from './story-jokes.js?v=practice-v2';
import {LETTER_SHAPES} from './letter-shapes.js?v=practice-v2';
import {C,line,circle,text,box,sprite,glyph,check,clamp} from './drawing.js?v=practice-v2';

// Every reward requires both changing the letter's actual geometry and finding
// that letter twice. The story changes the tool; the printed form is the goal.
export const GAME_COUNT=33;
const colours=[C.coral,C.purple,C.green,C.blue,C.pink,C.yellow];
const XY=([x,y])=>[350+x*2.8,100+y*2.8];
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
const pt=p=>[p.x,p.y];
const centre=pts=>{const xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]);return[(Math.min(...xs)+Math.max(...xs))/2,(Math.min(...ys)+Math.max(...ys))/2]};
const mix=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
const sample=(pts,gap=10)=>{const out=[pts[0]];let remain=gap;for(let k=1;k<pts.length;k++){let a=pts[k-1],b=pts[k],d=distance(a,b);while(d>=remain&&d>0){a=mix(a,b,remain/d);out.push(a);d=distance(a,b);remain=gap}remain-=d}if(distance(out.at(-1),pts.at(-1))>1)out.push(pts.at(-1));return out};
const shuffle=items=>{const a=items.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
const rotate=(p,o,a)=>[o[0]+(p[0]-o[0])*Math.cos(a)-(p[1]-o[1])*Math.sin(a),o[1]+(p[0]-o[0])*Math.sin(a)+(p[1]-o[1])*Math.cos(a)];
function sameShape(a,b){const ca=centre(a),cb=centre(b),aa=sample(a,10).map(p=>[p[0]-ca[0],p[1]-ca[1]]),bb=sample(b,10).map(p=>[p[0]-cb[0],p[1]-cb[1]]);if(Math.abs(aa.length-bb.length)>2)return false;const error=rev=>aa.reduce((s,p,i)=>s+distance(p,bb[Math.round(i/(aa.length-1)*(bb.length-1))*(rev?-1:1)+(rev?bb.length-1:0)]),0)/aa.length;return Math.min(error(false),error(true))<9}
function drawPart(c,p,colour=C.purple,width=23){line(c,p.points,colour,width)}

export function createGame(index,api,options={}){
 const l=LEVELS[index],shape=LETTER_SHAPES[index];
 const findGoal=[2,5,10,20].includes(options.finds)?options.finds:2;
 const parts=shape.parts.map((p,i)=>({...p,points:p.points.map(XY),colour:colours[(i+index+(options.variant||0))%colours.length]}));
 const fixed=new Set(l.fixed),done=new Set(l.fixed);
 let misses=0;
 let phase='build',active=false,pointer=[0,0],previous=null,drag=null,selected=null,reveal=0,round=0,cards=[],wrong=-1,wrongTime=0,findLock=0,mirrored=false;
 let strokeParts=parts.filter(p=>!fixed.has(p.id));
 let trace=new Map(),covered=new Map(),rotations=[],pieces=[],stamp=[],erased=0,extension=0,rollX=490,rollTouch=false,rollFill=[0,0,0],pump=new Map(),mirrorReady=false;
 const mode=l.mode,story=createStory(index,api),joke=STORY_JOKES[index];
 if(mode==='rays'){
   strokeParts=parts.flatMap(p=>{const points=p.points;const mid=[490,240];return [points[0],points.at(-1)].map((end,j)=>({id:p.id+'-'+j,label:'Лучик',points:[mid,end],colour:p.colour}))});
 }
 for(const p of strokeParts){trace.set(p.id,0);covered.set(p.id,new Set())}
 const tracePoints=new Map(strokeParts.map(p=>[p.id,sample(p.points,9)]));
 if(['rotate','cross'].includes(mode))rotations=strokeParts.map((p,i)=>{const o=centre(p.points),end=p.points.reduce((a,b)=>distance(a,o)>distance(b,o)?a:b);return{part:p,o,end,angle:i%2?-.8:.8}});
 const builder=['build','dots','cap','bridge','monster','spin'].includes(mode);
 if(builder){
   const decoys=[];
   if(strokeParts.length<=2){const p=strokeParts[0],o=centre(p.points);decoys.push({id:'decoy-slant',label:'Другая деталь',points:[[o[0]-65,o[1]+65],[o[0]+65,o[1]-65]]});decoys.push({id:'decoy-curve',label:'Другая деталь',points:Array.from({length:17},(_,i)=>[o[0]-65+i*8,o[1]-Math.sin(i/16*Math.PI)*55])})}
   if(index===9)decoys.splice(0,decoys.length,{id:'decoy-horizontal',label:'Прямой мостик',points:[[415,240],[565,240]]},{id:'decoy-other-slant',label:'Другая косая дорожка',points:[[420,170],[560,310]]});
   if(mode==='dots')decoys.splice(0,decoys.length,{id:'decoy-breve',label:'Дужка',points:[[410,80],[435,94],[460,80]]});
   if(mode==='cap')decoys.splice(0,decoys.length,{id:'decoy-dot',label:'Точка',points:Array.from({length:17},(_,i)=>[430+Math.cos(i*Math.PI/8)*8,75+Math.sin(i*Math.PI/8)*8])});
   const all=shuffle([...strokeParts,...decoys]);
   pieces=all.map((p,i)=>({...p,decoy:p.id.startsWith('decoy'),origin:centre(p.points),home:[500+(i-(all.length-1)/2)*140,476],used:false}));
 }
 if(mode==='stamp')stamp=parts.flatMap(p=>sample(p.points,46).map(point=>({point,done:false}))).filter((s,i,a)=>a.findIndex(b=>distance(b.point,s.point)<20)===i);
 const closure=sample([[602,128],[664,205],[664,275],[602,352]],8);
 if(mode==='lift'){
   pieces=[{id:'left-body',points:parts.filter(p=>p.id!=='separate-stem').flatMap(p=>p.points),ids:parts.filter(p=>p.id!=='separate-stem').map(p=>p.id),dy:100},
     {id:'right-body',points:parts.find(p=>p.id==='separate-stem').points,ids:['separate-stem'],dy:105}].map(p=>({...p,origin:centre(p.points),used:false}));
 }
 if(mode==='slide'){const p=strokeParts[0];pieces=[{...p,origin:centre(p.points),dy:-140,ids:[p.id],used:false}]}
 if(mode==='mirror'){
   strokeParts=parts.filter(p=>p.id===(index===30?'middle-bar':'diagonal-leg'));
   tracePoints.clear();trace.clear();for(const p of strokeParts){tracePoints.set(p.id,sample(p.points,9));trace.set(p.id,0)}
 }
 const total=()=>mode==='stamp'?stamp.length:mode==='rays'?6:mode==='erase'||mode==='extend'?1:parts.length;
 const progress=()=>{let n=done.size;if(mode==='stamp')n=stamp.filter(p=>p.done).length;if(mode==='rays')n=strokeParts.filter(p=>done.has(p.id)).length;if(mode==='erase')n=erased>=1?1:0;if(mode==='extend')n=extension>=1?1:0;api.step?.(n,total(),'Собираем')};
 progress();
 function complete(){if(phase!=='build')return;phase='reveal';active=false;drag=null;selected=null;reveal=0;story.react();api.effect?.('pop');api.instruction?.(joke.text,index+'-joke',index+'-joke');api.step?.(1,1,'Буква ожила')}
 function checkComplete(){if(parts.every(p=>done.has(p.id)))complete()}
 function mark(p){if(done.has(p.id))return;done.add(p.id);story.react();api.effect?.(mode==='strings'?'wing':'pop');if(mode==='strings')api.note?.(260+done.size*110,.25);progress();if(mode==='rays'){if(strokeParts.every(p=>done.has(p.id)))complete()}else checkComplete()}
 function nextTrace(){return strokeParts.find(p=>!done.has(p.id))}
 function traceAt(p){
   const ordered=mode==='slice';let candidates=strokeParts.filter(s=>!done.has(s.id));if(ordered)candidates=candidates.slice(0,1);
   if(!selected||done.has(selected.id)){selected=candidates.find(s=>distance(tracePoints.get(s.id)[trace.get(s.id)||0],p)<39)||null}
   if(!selected)return;
   const s=tracePoints.get(selected.id);let n=trace.get(selected.id)||0;
   // Only the next section can be coloured. Jumping to the end cannot trace a letter.
   while(n<s.length&&distance(s[n],p)<31)n++;
   trace.set(selected.id,n);
   if(n>=s.length){const part=selected;selected=null;mark(part)}
 }
 function traceMove(p){if(previous&&distance(previous,p)<110){const n=Math.ceil(distance(previous,p)/9);for(let k=1;k<=n;k++)traceAt(mix(previous,p,k/n))}else traceAt(p);previous=p}
 function deck(){const pool=round<2?l.distractors:shuffle([...new Set([...l.distractors,...LEVELS.map(v=>v.letter).filter(v=>v!==l.letter)])]).slice(0,2);let a=shuffle([l.letter,...pool]);if(cards.length&&a.indexOf(l.letter)===cards.findIndex(c=>c.letter===l.letter)){const j=a.indexOf(l.letter),k=(j+1)%a.length;[a[j],a[k]]=[a[k],a[j]]}cards=a.map((letter,i)=>({letter,x:170+i*230,y:185,w:200,h:225}));wrong=-1}
 function startFind(){phase='find';deck();api.instruction?.(l.findDisplay||l.find,index+'-find',index+'-find-hint');api.step?.(0,findGoal,'Узнаём')}
 function found(p){if(findLock>0)return;const j=cards.findIndex(c=>p[0]>=c.x&&p[0]<=c.x+c.w&&p[1]>=c.y&&p[1]<=c.y+c.h);if(j<0)return;if(cards[j].letter!==l.letter){if(wrongTime===0){misses++;api.clip?.(misses===1?'try-together':index+'-find-hint')}wrong=j;wrongTime=2.8;api.effect?.('gentle');return}wrongTime=0;round++;api.effect?.('pop');api.step?.(round,findGoal,'Узнаём');if(round===findGoal){phase='done';api.finish?.()}else{deck();findLock=.55;api.instruction?.('Точно! А теперь найди эту букву ещё раз. Она поменялась местами!',round%5===0?'practice-cheer':'practice-find-again',index+'-find-hint')}}
 function buildDown(p){
   if(builder){const piece=pieces.find(s=>!s.used&&Math.abs(p[0]-s.home[0])<61&&Math.abs(p[1]-s.home[1])<47);if(piece){drag=piece;piece.position=p}return}
   if(mode==='lift'||mode==='slide'){const piece=pieces.find(s=>!s.used&&distance(p,[s.origin[0],s.origin[1]+s.dy])<100);if(piece){drag=piece;drag.offset=p[1]-piece.dy}return}
   if(mode==='pump')return;
   if(mode==='rotate'||mode==='cross'){drag=rotations.filter(s=>!done.has(s.part.id)).find(s=>distance(rotate(s.end,s.o,s.angle),p)<52);if(drag)drag.offset=Math.atan2(p[1]-drag.o[1],p[0]-drag.o[0])-drag.angle;return}
   if(mode==='stamp'){const s=stamp.find(s=>!s.done&&distance(s.point,p)<30);if(s){s.done=true;story.react();api.effect?.('click');progress();if(stamp.every(s=>s.done))complete()}return}
   if(mode==='mirror'&&!mirrorReady){if(p[0]>735&&p[0]<895&&p[1]>320&&p[1]<405){mirrorReady=true;mirrored=true;for(const s of parts.filter(s=>!strokeParts.includes(s)))done.add(s.id);progress();api.effect?.('click')}return}
   if(mode==='extend'){if(distance(p,XY([95,90]))<48)drag={id:'tail'};return}
   if(mode==='roll'&&rollFill.some(n=>n<1)){if(p[1]>415&&p[1]<530){drag={id:'tilt'};rollTouch=true;rollX=clamp(p[0],364,616)}return}
   if(mode==='erase'||mode==='light')return;
   traceMove(p);
 }
 function move(p){const a=pt(p);pointer=a;if(!active||phase!=='build')return;
   if(builder&&drag){drag.position=a;return}
   if((mode==='lift'||mode==='slide')&&drag){drag.dy=a[1]-drag.offset;return}
   if((mode==='rotate'||mode==='cross')&&drag){drag.angle=wrap(Math.atan2(a[1]-drag.o[1],a[0]-drag.o[0])-drag.offset);return}
   if(mode==='extend'&&drag){extension=clamp((a[1]-XY([95,90])[1])/56,0,1);if(extension>.9){extension=1;complete()}return}
   if(mode==='roll'&&drag){rollX=clamp(a[0],364,616);return}
   if(mode==='erase'){if(previous){const d=distance(previous,a);if(d<100&&closure.some(q=>distance(q,a)<39)){erased=clamp(erased+Math.min(d,35)/230,0,1);if(erased===1)complete()}}previous=a;return}
   if(mode==='light'){illuminate(a);return}
   if(mode==='pump'||mode==='stamp'||(mode==='mirror'&&!mirrorReady))return;
   traceMove(a);
 }
 function illuminate(p){for(const part of strokeParts){if(done.has(part.id))continue;const samples=tracePoints.get(part.id),seen=covered.get(part.id);samples.forEach((q,j)=>{if(distance(q,p)<43)seen.add(j)});if(seen.size===samples.length)mark(part)}}
 function up(p){const a=pt(p);pointer=a;if(!active)return;active=false;previous=null;selected=null;
   if(phase!=='build'){drag=null;return}
   if(builder&&drag){const piece=drag,target=strokeParts.filter(s=>!done.has(s.id)).find(s=>sameShape(piece.points,s.points)&&distance(a,centre(s.points))<69);piece.position=null;if(target&&!piece.decoy){piece.used=true;mark(target)}else api.effect?.('gentle')}
   if((mode==='lift'||mode==='slide')&&drag){if(Math.abs(drag.dy)<40){drag.dy=0;drag.used=true;drag.ids.forEach(id=>done.add(id));api.effect?.('pop');progress();checkComplete()}}
   if((mode==='rotate'||mode==='cross')&&drag){if(Math.abs(drag.angle)<.34){drag.angle=0;mark(drag.part)}else api.effect?.('gentle')}
   drag=null;
 }
 function down(p){if(phase==='reveal'){story.poke(pt(p));return}if(phase==='find'){found(pt(p));return}if(phase!=='build')return;active=true;pointer=pt(p);story.poke(pointer);previous=pointer;selected=null;buildDown(pointer);if(mode==='light')illuminate(pointer)}
 function guide(){
   if(phase==='find'){const c=cards.find(c=>c.letter===l.letter);return[c.x+c.w/2,c.y+c.h/2,0,0]}
   if(phase!=='build')return null;
   if(builder){const s=pieces.find(s=>!s.used&&!s.decoy&&strokeParts.some(t=>!done.has(t.id)&&sameShape(s.points,t.points))),target=s&&strokeParts.find(t=>!done.has(t.id)&&sameShape(s.points,t.points));if(s&&target){const q=centre(target.points);return[...s.home,q[0]-s.home[0],q[1]-s.home[1]]}}
   if(mode==='rotate'||mode==='cross'){const s=rotations.find(s=>!done.has(s.part.id));if(s){const a=rotate(s.end,s.o,s.angle);return[...a,s.end[0]-a[0],s.end[1]-a[1]]}}
   if(mode==='pump'){const s=strokeParts.find(p=>!done.has(p.id));if(s)return[...centre(s.points),0,0]}
   if(mode==='stamp'){const s=stamp.find(s=>!s.done);if(s)return[...s.point,0,0]}
   if(mode==='erase'){const q=closure[0],b=closure[Math.floor(closure.length/2)];return[...q,b[0]-q[0],b[1]-q[1]]}
   if(mode==='extend')return[...XY([95,90]),0,56];
   if(mode==='lift'||mode==='slide'){const s=pieces.find(s=>!s.used);if(s)return[s.origin[0],s.origin[1]+s.dy,0,-s.dy]}
   if(mode==='mirror'&&!mirrorReady)return[815,360,0,0];
   if(mode==='roll'&&rollFill.some(n=>n<1)){const j=rollFill.findIndex(n=>n<1),x=XY([5+j*45,0])[0];return[x,475,0,0]}
   if(mode==='light'){const s=strokeParts.find(s=>!done.has(s.id));if(s){const samples=tracePoints.get(s.id),seen=covered.get(s.id),j=samples.findIndex((_,j)=>!seen.has(j)),a=samples[j],b=samples[Math.min(j+7,samples.length-1)];return[...a,b[0]-a[0],b[1]-a[1]]}}
   const s=nextTrace();if(s){const samples=tracePoints.get(s.id),n=Math.min(trace.get(s.id)||0,samples.length-1),a=samples[n],b=samples[Math.min(n+9,samples.length-1)];return[...a,b[0]-a[0],b[1]-a[1]]}
   return null;
 }
 function update(dt){wrongTime=Math.max(0,wrongTime-dt);findLock=Math.max(0,findLock-dt);
   if(phase==='reveal'){reveal+=dt;if(reveal>joke.duration+.3&&(!api.speaking?.()||reveal>joke.duration+10)){if(api.beforeFind?.())phase='between';else startFind()}return}
   if(phase!=='build')return;
   if(mode==='pump'&&active){for(const s of strokeParts){if(done.has(s.id))continue;if(distance(pointer,centre(s.points))<69){const v=Math.min(1,(pump.get(s.id)||0)+dt/1.05);pump.set(s.id,v);if(v===1)mark(s)}}}
   if(mode==='roll'&&active&&rollTouch&&rollFill.some(n=>n<1)){for(let j=0;j<3;j++){const x=XY([5+j*45,0])[0];if(Math.abs(rollX-x)<32){rollFill[j]=Math.min(1,rollFill[j]+dt/.65);if(rollFill[j]===1&&!done.has(parts[j].id))mark(parts[j])}}}
 }
 function drawModel(c){box(c,790,70,140,177,24,'#fffaf2bb');text(c,'ОБРАЗЕЦ',860,93,13,'#948571');glyph(c,l.letter,860,170,105,C.ink);}
 function drawTrace(c){for(const s of strokeParts){if(done.has(s.id)){drawPart(c,s,s.colour);continue}const samples=tracePoints.get(s.id),n=trace.get(s.id)||0;if(n>1)line(c,samples.slice(0,n),s.colour,23);if(mode==='light'){const seen=covered.get(s.id);for(const j of seen)circle(c,...samples[j],11.5,s.colour)}else if(mode!=='roll'||rollFill.every(n=>n>=1)){const q=samples[Math.min(n,samples.length-1)];circle(c,...q,13,'#fffaf3',s.colour);circle(c,...q,4,s.colour)}}}
 function drawBuilder(c){for(const s of pieces){if(s.used)continue;const dragging=drag===s;const at=dragging?s.position:s.home;if(!dragging)box(c,at[0]-61,at[1]-43,122,86,19,'#fffaf3','#ded3bd');const o=s.origin,ranges=[Math.max(...s.points.map(p=>p[0]))-Math.min(...s.points.map(p=>p[0])),Math.max(...s.points.map(p=>p[1]))-Math.min(...s.points.map(p=>p[1]))],scale=dragging?1:Math.min(1.5,65/Math.max(...ranges));line(c,s.points.map(p=>[at[0]+(p[0]-o[0])*scale,at[1]+(p[1]-o[1])*scale]),s.colour||C.blue,dragging?23:Math.max(9,23*scale));}}
 function drawBuild(c,t){
   story.draw(c,t,storyState(),'back');drawModel(c);
   text(c,l.letter==='Ъ'||l.letter==='Ь'?l.name:'БУКВА '+l.letter,490,47,23,C.ink);
   for(const p of parts)drawPart(c,p,'#d8d0bf',25);
   for(const p of parts)if(done.has(p.id))drawPart(c,p,p.colour);
   if(builder)drawBuilder(c);
   else if(mode==='rotate'||mode==='cross'){for(const s of rotations){if(done.has(s.part.id))continue;line(c,s.part.points.map(p=>rotate(p,s.o,s.angle)),s.part.colour,23);circle(c,...rotate(s.end,s.o,s.angle),17,'#fffaf3',s.part.colour)}}
   else if(mode==='pump'){for(const s of strokeParts){if(done.has(s.id))continue;const v=pump.get(s.id)||0,ss=sample(s.points,8);line(c,ss.slice(0,Math.max(1,Math.floor(ss.length*v))),s.colour,23);const o=centre(s.points);circle(c,...o,35,'#fffaf0cc',s.colour);text(c,'↓',...o,30,s.colour)}text(c,'Прижми каждый животик',490,465,21,'#887964')}
   else if(mode==='stamp'){for(const s of stamp){circle(c,...s.point,15,s.done?C.purple:'#fffaf1',s.done?null:'#b9aa95');if(s.done){circle(c,s.point[0]-4,s.point[1],2,'#fffaf1');circle(c,s.point[0]+4,s.point[1],2,'#fffaf1')}}}
   else if(mode==='erase'){line(c,closure,erased>=1?'#f3ecdf':C.purple,25*(1-erased));for(const p of parts)drawPart(c,p,C.purple);if(active){box(c,pointer[0]-24,pointer[1]-16,48,32,8,'#f4d9c0',C.coral)}}
   else if(mode==='extend'){const start=XY([95,90]);const end=[start[0],start[1]+56*extension];line(c,[start,end],C.coral,23);circle(c,...end,18,'#fffaf2',C.coral)}
   else if(mode==='lift'||mode==='slide'){for(const s of pieces){if(s.used)continue;const ids=s.ids;for(const p of parts.filter(p=>ids.includes(p.id)))line(c,p.points.map(p=>[p[0],p[1]+s.dy]),mode==='lift'?C.yellow:C.pink,23);const o=[s.origin[0],s.origin[1]+s.dy];circle(c,...o,20,'#fffaf0aa',mode==='lift'?C.yellow:C.pink);text(c,mode==='lift'?'↑':'↓',...o,25,C.ink)}}
   else if(mode==='mirror'){const base=parts.filter(p=>!strokeParts.includes(p));for(const p of base)line(c,p.points.map(p=>mirrorReady?p:[980-p[0],p[1]]),p.colour,23);box(c,735,320,160,85,24,mirrorReady?'#dce8bd':'#fffaf2','#d6c9b2');text(c,mirrorReady?'✓':'↔',815,361,48,C.ink);if(mirrorReady)drawTrace(c)}
   else if(mode==='roll'){for(let j=0;j<3;j++){const s=parts[j],ss=sample(s.points,8);line(c,ss.slice(0,Math.max(1,Math.floor(ss.length*rollFill[j]))),s.colour,23);circle(c,XY([5+j*45,0])[0],100+rollFill[j]*280,14,s.colour)}if(rollFill.every(n=>n>=1)){strokeParts=[parts.at(-1)];drawTrace(c)}else{line(c,[[344,486+(rollX-490)/9],[636,486-(rollX-490)/9]],'#b59c77',10);circle(c,rollX,475,25,C.yellow,C.ink);text(c,'Наклони горку',490,532,19,'#887964')}}
   else drawTrace(c);
   story.draw(c,t,storyState(),'front');
   const g=guide();if(active&&g&&['trace','feed','maze','fork','loop','strings','chain','rays'].includes(mode)){sprite(c,l.prop,pointer[0]-23,pointer[1]-23,46,46);if(mode==='maze')sprite(c,'shmyak',pointer[0]-20,pointer[1]-49,40,50);if(mode==='strings')text(c,'♪',pointer[0]+28,pointer[1]-18,28,C.purple)}
   if(active&&mode==='paint'){line(c,[[pointer[0]+4,pointer[1]-4],[pointer[0]+34,pointer[1]-42]],'#9b7455',12);line(c,[[pointer[0]-5,pointer[1]+5],[pointer[0]+7,pointer[1]-9]],C.coral,23)}
   if(active&&mode==='slice'){line(c,[[pointer[0],pointer[1]],[pointer[0]+28,pointer[1]-35]],'#fcf8ed',12);line(c,[[pointer[0]+28,pointer[1]-35],[pointer[0]+41,pointer[1]-53]],C.coral,15)}
   if(mode==='light'&&active){circle(c,...pointer,47,'#fff6c22b','#e5c26c');sprite(c,'flashlight',pointer[0]+15,pointer[1]+15,60,65,0,-.7)}
 }
 function storyState(){
   let completed=[...done].filter(id=>!fixed.has(id)).length,progress=0;
   const wanted=strokeParts.filter(p=>!fixed.has(p.id));
   if(mode==='stamp'){completed=stamp.filter(s=>s.done).length;progress=completed/stamp.length}
   else if(mode==='extend')progress=extension;
   else if(mode==='erase')progress=erased;
   else progress=wanted.reduce((n,p)=>n+(done.has(p.id)?1:Math.min(1,(trace.get(p.id)||0)/(tracePoints.get(p.id)?.length||1)))+(pump.get(p.id)||0)*.5,0)/Math.max(1,wanted.length);
   if(phase==='reveal')progress=1;
   const visibleParts=parts.map(p=>{const r=rotations.find(r=>r.part.id===p.id&&!done.has(p.id));return {...p,points:r?p.points.map(q=>rotate(q,r.o,r.angle)):p.points}});
   return {phase,reveal,active,pointer,completed,progress,visibleParts};
 }
 function draw(c,t,dt){update(dt);
   if(phase==='build'){drawBuild(c,t);return}
   if(phase==='reveal'){
     const ss=storyState();story.draw(c,t,ss,'back');c.save();c.translate(490,240);if([0,13,15,25,26,31].includes(index))c.rotate(Math.sin(t*8)*.045);if(index===13)c.scale(1,1+Math.sin(t*9)*.05);c.translate(-490,-240);for(const p of parts)drawPart(c,p,p.colour,26);c.restore();story.draw(c,t,ss,'front');return;
   }
   if(phase==='find'||phase==='done'){text(c,round===0?'Где наша буква?':'А теперь — ещё раз!',500,65,30,C.ink);box(c,73,105,100,92,22,'#fffaf2');glyph(c,l.letter,123,158,72,C.ink);for(let j=0;j<cards.length;j++){const card=cards[j],shake=0;box(c,card.x+shake,card.y,card.w,card.h,28,'#fffaf2',wrong===j&&wrongTime>0?'#e0b78e':'#d6cbb6');glyph(c,card.letter,card.x+card.w/2+shake,card.y+card.h*.56,160,round>1?['#b66343','#8064aa','#657f42','#517f89','#9d5f7b','#8c732d'][(round+j)%6]:C.ink)}if(options.companion)drawCompanion(c,index,t,{round:Math.floor(round/5),happy:findLock>0});else drawTogetherGuide(c,t,wrongTime>0);const spacing=Math.min(42,620/findGoal);for(let j=0;j<findGoal;j++){const x=500+(j-(findGoal-1)/2)*spacing;circle(c,x,475,findGoal>10?10:14,j<round?C.green:'#d8cfbd');if(j<round)text(c,'✓',x,475,findGoal>10?14:18,'#fffaf0')}if(wrongTime>0)text(c,'Давай посмотрим вместе',500,527,20,'#8c7862');}
 }
 function cancel(){active=false;previous=null;selected=null;if(drag?.position)drag.position=null;drag=null}
 return{down,move,up,cancel,draw,guide,replay(){if(phase==='reveal')reveal=0},state:()=>({phase,round,placed:[...done],progress:tracePoints.size?[...trace].map(([id,n])=>({id,n,total:tracePoints.get(id)?.length||0})):[],cards:cards.map(c=>({...c})),parts:parts.map(p=>({id:p.id,points:p.points.map(q=>q.slice())})),pieces:pieces.map(p=>({id:p.id,decoy:p.decoy,used:p.used,home:p.home,origin:p.origin,dy:p.dy})),mirrorReady,extension,erased})};
}
