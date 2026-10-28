import assert from 'node:assert/strict';
import {createLesson,practiceSettings} from '../docs/practice.js';
import {LEVELS} from '../docs/data.js';
import {STORY_JOKES} from '../docs/story-jokes.js';
import {READING_WORDS} from '../docs/reading-ui.js';
import {COMPANIONS} from '../docs/companions.js';
import {art} from '../docs/art.js';
globalThis.Image=class{complete=true;naturalWidth=200;set src(v){}};
const c=new Proxy({},{get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
assert.deepEqual(practiceSettings(),{builds:3,finds:10});
assert.deepEqual(practiceSettings({builds:999,finds:-1}),{builds:3,finds:10});
for(const f of COMPANIONS){assert(art(f.kind,f.colour).includes('<svg'));assert(art(f.kind,f.colour)!==art('unknown',f.colour))}
for(const w of READING_WORDS){assert.equal(w.word,w.syllables.replace(/-/g,''));assert(LEVELS[w.index].words.includes(w.word))}
function play(index,builds,finds){
 let won=0,time=0;const game=createLesson(index,{finish(){won++},instruction(){},step(n,t){assert(n<=t)},effect(){},speaking:()=>false},{builds,finds});
 const tick=(n=.1)=>{for(let k=0;k<n;k+=.03){time+=.03;game.draw(c,time,.03)}};
 const tap=(x,y)=>{game.down({x,y});game.up({x,y})};
 function gesture(){const g=game.guide();assert(g,LEVELS[index].letter+' missing guide');const[x,y,dx,dy]=g;game.down({x,y});for(let j=1;j<=30;j++){game.move({x:x+dx*j/30,y:y+dy*j/30});tick(.03)}tick(['pump','roll'].includes(LEVELS[index].mode)?1.3:.1);game.up({x:x+dx,y:y+dy})}
 for(let pass=1;pass<=builds;pass++){
  assert.equal(game.state().buildRound,pass);assert.equal(game.state().phase,'build');
  tick(2);assert.equal(won,0);let actions=0;
  while(game.state().phase==='build'&&actions++<150)gesture();
  assert.equal(game.state().phase,'reveal');assert.equal(won,0);
  tick(STORY_JOKES[index].duration+.5);
  if(pass<builds){assert.equal(game.state().phase,'between');tick(.5);tap(20,20);assert.equal(game.state().phase,'between');tap(500,500);assert.equal(game.state().phase,'build');assert.equal(game.state().round,0)}
 }
 assert.equal(game.state().phase,'find');
 let position=-1;
 for(let round=0;round<finds;round++){
  const s=game.state(),wrong=s.cards.find(v=>v.letter!==LEVELS[index].letter);
  tap(wrong.x+100,wrong.y+100);assert.equal(game.state().round,round);assert.equal(won,0);
  const j=s.cards.findIndex(v=>v.letter===LEVELS[index].letter);assert.notEqual(j,position);position=j;
  tap(s.cards[j].x+100,s.cards[j].y+100);assert.equal(game.state().round,round+1);
  assert.equal(won,round+1===finds?1:0);
  if(round+1<finds){const next=game.state().cards.find(v=>v.letter===LEVELS[index].letter);tap(next.x+100,next.y+100);assert.equal(game.state().round,round+1,'Rapid repeat skipped a task');tick(.6)}
 }
 assert.equal(game.state().phase,'done');tick(5);assert.equal(won,1);return true;
}
for(let i=0;i<33;i++)assert(play(i,3,10));
assert(play(0,10,20));assert(play(6,5,5));
console.log('Practice: all 33 letters × 3 independent builds × 10 recognitions; 10/20 maximum and 5/5 options; wrong answers and rapid taps never skip gates.');
