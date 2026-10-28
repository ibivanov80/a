import assert from 'node:assert/strict';
import {createSpeech} from '../docs/speech.js';

const requests=[];
const audio={paused:true,ended:false,currentTime:0,pause(){this.paused=true},
  play(){this.paused=false;return new Promise((resolve,reject)=>requests.push({resolve,reject,src:this.src}))}};
const settings={muted:false,voice:.9};let blocked=0;
const speech=createSpeech(audio,{ready:true,version:'fish-v1'},()=>settings,()=>blocked++);
speech.play('0-intro');
assert.match(audio.src,/0-intro\.m4a\?v=fish-v1$/);
speech.play('sneeze',{ambient:true});
assert.equal(requests.length,1,'A sneeze must not interrupt the instruction');
speech.play('0-word-1');
assert.match(audio.src,/0-word-1\.m4a/);
requests[0].reject(Object.assign(new Error('cancelled'),{name:'AbortError'}));
await Promise.resolve();assert.equal(blocked,0,'Replacing speech must not show a false playback error');
settings.muted=true;speech.play('0-hint');assert(audio.paused);assert.equal(requests.length,2);
settings.muted=false;speech.play('0-hint');requests[2].reject(new Error('NotAllowed'));
await Promise.resolve();assert.equal(blocked,1,'A real playback failure must offer replay');
speech.stop();assert(audio.paused);assert.equal(audio.currentTime,0);
createSpeech(audio,{ready:false},()=>settings).play('welcome');
assert.equal(requests.length,3,'Unready speech must stay silent');
console.log('Speech: touch playback, replacement, mute, ambient priority and failure recovery passed.');
