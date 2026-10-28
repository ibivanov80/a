// A transcript is used in memory only; neither recordings nor recognised text
// are stored. Matching is for a word, not a pronunciation assessment.
export function normalizeSpoken(value){return String(value).toLocaleLowerCase('ru').replace(/ё/g,'е').replace(/[^а-я\s-]/g,' ').replace(/-/g,' ').replace(/\s+/g,' ').trim()}
export function matchesWord(transcript,word){
 const said=normalizeSpoken(transcript),target=normalizeSpoken(word);
 if(!said||!target)return false;
 return said===target||said.split(' ').includes(target)||said.replace(/ /g,'')===target;
}

export function createRecognition({Recognition,onState=()=>{},onMatch=()=>{},setTimer=setTimeout,clearTimer=clearTimeout}){
 let active=null,serial=0,timer=null;
 function cancel(){serial++;clearTimer(timer);timer=null;const old=active;active=null;if(old){old.onresult=old.onerror=old.onend=old.onstart=null;try{old.abort()}catch{}}}
 function start(word){
  cancel();if(!Recognition){onState('unsupported');return false}
  const token=serial;let settled=false;
  let r;try{r=new Recognition()}catch{onState('unsupported');return false}
  active=r;r.lang='ru-RU';r.continuous=false;r.interimResults=false;r.maxAlternatives=5;
  function finish(state,matched=false){if(token!==serial||settled)return;settled=true;cancel();onState(state);if(matched)onMatch(word)}
  r.onstart=()=>{if(token===serial)onState('listening')};
  r.onresult=e=>{let final=false;for(let i=e.resultIndex||0;i<e.results.length;i++){const result=e.results[i];if(!result.isFinal)continue;final=true;for(let j=0;j<result.length;j++)if(matchesWord(result[j].transcript,word)){finish('matched',true);return}}if(final)finish('retry')};
  r.onerror=e=>finish(['not-allowed','service-not-allowed'].includes(e.error)?'denied':e.error==='audio-capture'?'no-microphone':'retry');
  r.onend=()=>finish('retry');
  onState('starting');timer=setTimer(()=>finish('retry'),12000);
  try{r.start();return true}catch{finish('unavailable');return false}
 }
 return {start,cancel,get active(){return !!active}};
}
