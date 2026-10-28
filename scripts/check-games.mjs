import assert from 'node:assert/strict';
import {createGame,GAME_COUNT} from '../docs/games.js';
import {LEVELS} from '../docs/data.js';
import {LETTER_SHAPES} from '../docs/letter-shapes.js';
import {STORY_JOKES} from '../docs/story-jokes.js';
import {drawFinale} from '../docs/finales.js';
globalThis.Image=class{complete=true;naturalWidth=200;set src(v){}};
const c=new Proxy({},{get:(obj,key)=>obj[key]??(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
function make(i,speaking=()=>false){let finished=0,time=0,stage='',instruction='',clips=[];const g=createGame(i,{step:(n,t,label)=>{assert(n>=0&&n<=t,`${i} ${n}/${t}`);stage=label},instruction:value=>{instruction=value},finish:()=>{finished++},effect(){},note(){},clip(file){clips.push(file)},speaking});return{g,get clips(){return clips.slice()},get finished(){return finished},get stage(){return stage},get instruction(){return instruction},tick(seconds=.1){for(let t=0;t<seconds;t+=.02){time+=.02;g.draw(c,time,.02)}},tap(x,y){g.down({x,y});g.up({x,y})},drag(x,y,dx,dy,hold=.1){g.down({x,y});for(let k=1;k<=30;k++){g.move({x:x+dx*k/30,y:y+dy*k/30});time+=.02;g.draw(c,time,.02)}this.tick(hold);g.up({x:x+dx,y:y+dy})}}}
assert.equal(GAME_COUNT,33);assert.equal(LEVELS.length,33);assert.equal(LETTER_SHAPES.length,33);assert.equal(LEVELS.map(x=>x.letter).join(''),'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ');
for(let i=0;i<33;i++){
 const t=make(i);t.tick(10);assert.equal(t.g.state().phase,'build',LEVELS[i].letter+' advanced without input');
 for(let k=0;k<6;k++){t.tap(10,550);t.drag(10,550,30,0);t.tick(.2)}assert.equal(t.finished,0);assert.equal(t.g.state().phase,'build');
 let attempts=0;
 while(t.g.state().phase==='build'&&attempts++<150){const g=t.g.guide();assert(g,LEVELS[i].letter+' missing gesture');t.drag(...g,['pump','roll'].includes(LEVELS[i].mode)?1.3:.1);t.tick(.05)}
 assert.notEqual(t.g.state().phase,'build',LEVELS[i].letter+` stuck after ${attempts} gestures: `+JSON.stringify(t.g.state()));
 assert.equal(t.finished,0,'Reward before recognition '+LEVELS[i].letter);t.tick(STORY_JOKES[i].duration+.5);assert.equal(t.g.state().phase,'find');assert(t.instruction.includes('найди'));
 let cards=t.g.state().cards;const wrong=cards.find(c=>c.letter!==LEVELS[i].letter);for(let k=0;k<4;k++)t.tap(wrong.x+100,wrong.y+100);assert.equal(t.g.state().round,0);assert.equal(t.finished,0,'Wrong choices rewarded');
 const first=cards.findIndex(c=>c.letter===LEVELS[i].letter);t.tap(cards[first].x+100,cards[first].y+100);assert.equal(t.g.state().round,1);assert.equal(t.finished,0,'Reward after only one choice');t.tick(.7);
 cards=t.g.state().cards;const second=cards.findIndex(c=>c.letter===LEVELS[i].letter);assert.notEqual(first,second,'Answer stayed in same place');t.tap(cards[second].x+100,cards[second].y+100);assert.equal(t.finished,1);assert.equal(t.g.state().phase,'done');t.tap(cards[second].x+100,cards[second].y+100);assert.equal(t.finished,1);
 for(const tm of [0,.5,1,2])drawFinale(i,c,tm,{});
 console.log(`PASS ${LEVELS[i].letter}: ${LEVELS[i].mode}, ${attempts} gestures → wrong choices ignored → two shuffled recognitions → reward`);
}
// Geometric safeguards: a wrong connector cannot become A simply because it
// was dropped in the right place. End-point tapping cannot stand in for tracing.
{
 const t=make(0),state=t.g.state(),decoy=state.pieces.find(p=>p.decoy),bar=state.parts.find(p=>p.id==='crossbar'),xs=bar.points.map(p=>p[0]),ys=bar.points.map(p=>p[1]),x=(Math.min(...xs)+Math.max(...xs))/2,y=(Math.min(...ys)+Math.max(...ys))/2;
 t.drag(...decoy.home,x-decoy.home[0],y-decoy.home[1]);assert(!t.g.state().placed.includes('crossbar'));
}
{
 const t=make(4),state=t.g.state(),piece=state.pieces.find(p=>p.id==='right-foot'),target=state.parts.find(p=>p.id==='left-foot'),x=target.points[0][0],y=(target.points[0][1]+target.points.at(-1)[1])/2;
 t.drag(...piece.home,x-piece.home[0],y-piece.home[1]);assert(t.g.state().placed.includes('left-foot'),'Identical feet must be interchangeable');assert(!t.g.state().placed.includes('right-foot'));
}
{
 const t=make(6),state=t.g.state(),piece=state.pieces.find(p=>p.id==='right-dot'),target=state.parts.find(p=>p.id==='left-dot'),xs=target.points.map(p=>p[0]),ys=target.points.map(p=>p[1]),x=(Math.min(...xs)+Math.max(...xs))/2,y=(Math.min(...ys)+Math.max(...ys))/2;
 t.drag(...piece.home,x-piece.home[0],y-piece.home[1]);assert(t.g.state().placed.includes('left-dot'),'Identical dots must be interchangeable');
}
{
 const t=make(1),part=t.g.state().parts[0],end=part.points.at(-1);for(let k=0;k<10;k++)t.tap(...end);assert(!t.g.state().placed.includes(part.id));
}
{
 const t=make(2);t.tap(...t.g.guide().slice(0,2));t.tick(10);assert.equal(t.g.state().phase,'build','Pump completed without holding');
}
{
 const t=make(32);assert(!t.g.state().mirrorReady);t.drag(400,240,200,150);assert.equal(t.g.state().phase,'build');assert(!t.g.state().mirrorReady);t.tap(815,360);assert(t.g.state().mirrorReady);assert.equal(t.g.state().phase,'build','Mirror did not require diagonal leg');
}
{
 const t=make(2),[x,y]=t.g.guide();t.g.down({x,y});t.tick(.2);t.g.cancel();t.tick(5);assert.equal(t.g.state().phase,'build','Cancelled hold kept filling');
}
{
 for(const i of [0,13]){const t=make(i);for(let k=0;k<8;k++){t.tap(490,i===0?240:170);t.tick(.15)}assert.equal(t.g.state().phase,'build','Poking a comic character bypassed letter work');assert.equal(t.finished,0)}
}
{
 let busy=true;const t=make(0,()=>busy);t.drag(...t.g.guide());t.tick(STORY_JOKES[0].duration+1);assert.equal(t.g.state().phase,'reveal','Story cut off speech while it was still playing');busy=false;t.tick(.1);assert.equal(t.g.state().phase,'find');
}
{
 const t=make(0);t.drag(...t.g.guide());t.tick(STORY_JOKES[0].duration+.5);const wrong=t.g.state().cards.find(c=>c.letter!=='А');t.tap(wrong.x+100,wrong.y+100);assert.equal(t.clips.at(-1),'try-together');assert.equal(t.g.state().round,0);t.tick(3);t.tap(wrong.x+100,wrong.y+100);assert.equal(t.clips.at(-1),'0-find-hint');assert.equal(t.finished,0,'Reassurance must not bypass learning');
}
console.log('All 33 forms and recognition gates passed; unrelated actions, idle time and wrong shapes do not earn letters.');
