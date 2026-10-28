import assert from 'node:assert/strict';
import {createRecognition,matchesWord} from '../docs/recognition.js';
assert(matchesWord('ЁЛКА!','ёлка'));assert(matchesWord('это ёлка','ёлка'));assert(matchesWord('ма-ма','мама'));
assert(!matchesWord('котлета','кот'));assert(!matchesWord('слон','дом'));assert(!matchesWord('','дом'));
let latest,starts=0,matches=0,states=[],timer;
class Fake{constructor(){latest=this}start(){starts++;this.onstart?.()}abort(){this.aborted=true}result(words,final=true){const row=words.map(transcript=>({transcript}));row.isFinal=final;this.onresult?.({resultIndex:0,results:[row]})}}
const r=createRecognition({Recognition:Fake,onMatch:()=>matches++,onState:s=>states.push(s),setTimer:f=>(timer=f,1),clearTimer(){timer=null}});
assert.equal(starts,0,'Microphone started on construction');
r.start('дом');assert.equal(latest.lang,'ru-RU');assert(r.active);latest.result(['слон']);assert(!r.active);assert.equal(matches,0);assert.equal(states.at(-1),'retry');
r.start('ёлка');latest.result(['елка'],false);assert(r.active);assert.equal(matches,0);latest.result(['полка','ёлка']);assert.equal(matches,1);assert.equal(states.at(-1),'matched');assert(!r.active);
r.start('мама');const stale=latest,late=latest.onresult;r.cancel();assert(stale.aborted);const row=[{transcript:'мама'}];row.isFinal=true;late({resultIndex:0,results:[row]});assert.equal(matches,1,'Late result rewarded after navigation');
r.start('дом');latest.onerror({error:'not-allowed'});assert.equal(states.at(-1),'denied');assert.equal(matches,1);
r.start('дом');timer();assert.equal(states.at(-1),'retry');assert(!r.active);assert.equal(matches,1);
const unsupported=createRecognition({onState:s=>states.push(s)});assert.equal(unsupported.start('дом'),false);assert.equal(states.at(-1),'unsupported');
console.log('Recognition: explicit start only, exact word and alternatives, syllables/ё, unrelated speech rejected, denial/timeout/cancel/late-result safety passed.');
