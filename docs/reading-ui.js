import {LEVELS} from './data.js?v=practice-v1';
import {art} from './art.js?v=practice-v1';
import {companionFor} from './companions.js?v=practice-v1';
import {createRecognition} from './recognition.js?v=practice-v1';

const choices=[1,2,0,1,0,0,1,1,1,0,1,1,2,1,2,2,2,1,1,0,0,0,2,2,2,2,2,0,0,0,0,0,1];
const syllables=['ар-буз','буб-лик','во-да','гриб','дом','е-да','ёл-ка','жук','зонт','и-ко-та','чай','ка-нат','лес','ма-ма','нос','об-руч','паль-чик','ры-ба','слон','торт','у-сы','фи-лин','хлеб','цве-ток','чай','шу-ба','ще-нок','съел','сыр','конь','э-хо','ю-ла','я-ма'];
export const READING_WORDS=LEVELS.map((l,index)=>({word:l.words[choices[index]],index,clip:index+'-word-'+choices[index],syllables:syllables[index]}));
const shuffled=a=>a.map(v=>[Math.random(),v]).sort((a,b)=>a[0]-b[0]).map(x=>x[1]);
const escapeHTML=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function createReading({container,modal,getSettings,save,play,stop,unlock,celebrate,home}){
 let opened=false,deck=[],at=0,earned=false,hint=false,status='',finishing=false;
 const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
 const recognizer=createRecognition({Recognition,onState:state=>{
  if(!opened)return;
  const messages={starting:'Сейчас послушаем…',listening:'Слушаю. Говори спокойно ☺',matched:'Слово ожило!',retry:'Я пока не расслышал. Попробуем ещё раз?',denied:'Микрофон закрыт. Можно позвать взрослого и поиграть вместе.',unsupported:'В этом браузере нет распознавания. Позови взрослого — он послушает.',unavailable:'Сейчас не получается включить распознавание. Поиграем со взрослым?', 'no-microphone':'Не нашёл микрофон. Взрослый тоже умеет слушать ☺'};
  status=messages[state]||'';updateStatus();
  if(['retry','denied','unavailable','no-microphone'].includes(state))play('reading-retry');
 },onMatch:()=>award()});
 function current(){return deck[at]}
 function updateStatus(){const el=container.querySelector('#reading-status');if(el)el.textContent=status;const b=container.querySelector('[data-read="mic"]');if(b){b.disabled=recognizer.active;b.classList.toggle('listening',recognizer.active);b.textContent=recognizer.active?'● Слушаю…':'🎙 Скажи слово'}}
 function cancel(){recognizer.cancel();if(opened){status='';updateStatus()}}
 function destroy(){cancel();opened=false;deck=[];finishing=false}
 function open(index=0){
  destroy();opened=true;at=0;earned=false;hint=false;status='';
  const first=READING_WORDS[index]||READING_WORDS[0];
  const others=shuffled(READING_WORDS.filter((v,i,a)=>v.word!==first.word&&a.findIndex(w=>w.word===v.word)===i));
  deck=[first,...others].slice(0,getSettings().readingGoal===10?10:5);
  document.title='Слова оживают · Буквобум';render();play('reading-intro');window.scrollTo(0,0);
 }
 function render(){
  if(!opened)return;const item=current(),f=companionFor(item.index,at),settings=getSettings();
  container.innerHTML=`<main class="reading-page"><header class="reading-header"><button class="icon" data-action="home" aria-label="Ко всем буквам">⌂</button><strong>Слова оживают</strong><button class="secondary" data-action="parents">Взрослым</button></header><p class="kicker">${at+1} / ${deck.length} · МАЛЕНЬКИЙ ГОЛОСОВОЙ ТЕАТР</p><section class="reading-card ${earned?'word-awarded':''}"><div class="reading-friend">${art(f.kind,f.colour)}<span>${f.name}</span></div><div class="reading-task"><h1>${earned?'Слово ожило!':'Прочитай слово вслух'}</h1><p class="reading-word" aria-label="Слово ${escapeHTML(item.word)}">${escapeHTML(item.word.toUpperCase())}</p>${hint?`<p class="reading-syllables">${escapeHTML(item.syllables.toUpperCase().replace(/-/g,' · '))}</p>`:''}<p>${earned?escapeHTML(f.line):'Если пока трудно — послушай и повтори. Можно вместе.'}</p><div class="reading-tools"><button class="secondary" data-read="listen">◖)) Послушать</button><button class="secondary" data-read="syllables">По слогам</button></div>${earned?`<div class="word-prize" aria-label="Получена звёздочка">✦ ${'✦ '.repeat(at)}</div><button class="primary" data-read="next">${at+1===deck.length?'Наш праздник':'Ещё слово'} ↗</button>`:settings.recognition==='browser'&&Recognition?'<button class="primary mic-button" data-read="mic">🎙 Скажи слово</button>':`<p class="reading-adult-note">${settings.recognition==='browser'?'Этот браузер не умеет распознавать речь.':'Сейчас слушает взрослый. Микрофон выключен.'}</p>`}<p id="reading-status" class="reading-status" role="status" aria-live="polite">${escapeHTML(status)}</p>${earned?'':'<button class="reading-adult" data-read="adult">Взрослый послушает ↗</button>'}</div></section><div class="reading-stars" aria-label="${at+(earned?1:0)} из ${deck.length} слов">${deck.map((v,i)=>`<span class="${i<at||i===at&&earned?'lit':''}">✦</span>`).join('')}</div><p class="reading-privacy">Голос распознаёт сервис браузера (в Safari — Apple). Микрофон включается только кнопкой. Можно закончить в любой момент.</p></main>`;
 }
 function award(){
  if(!opened||earned||finishing)return;recognizer.cancel();stop();earned=true;status='';
  const s=getSettings();s.readingStars=Math.min(9999,(Number(s.readingStars)||0)+1);save();render();celebrate();
  play(at%2?'reading-hooray':'reading-magic');
 }
 function adult(){cancel();stop();const item=current();
  modal.innerHTML=`<div class="modal-head"><h2 id="modal-title">Послушаем вместе</h2><button class="icon" data-read="adult-close" aria-label="Закрыть">×</button></div><p class="modal-text">Попросите ребёнка прочитать или повторить слово <strong>${escapeHTML(item.word.toUpperCase())}</strong>. Когда услышите слово, подарите ему смешинку. Эта кнопка — подтверждение взрослого, автоматическая проверка здесь не выполняется.</p><div class="modal-actions"><button class="primary" data-read="adult-award">Я услышал слово ✦</button><button class="secondary" data-read="adult-close">Ещё попробуем</button></div>`;modal.showModal();
 }
 function finish(){finishing=true;recognizer.cancel();const f=companionFor(0,at);container.innerHTML=`<main class="reading-finish"><div class="reading-finish-art">${art(f.kind,f.colour)}</div><p class="kicker">НАШ МАЛЕНЬКИЙ ПРАЗДНИК</p><h1>${deck.length} слов ожили!</h1><p>Ты подарил героям свой голос.<br>Спасибо, что играл с нами.</p><div class="word-prize">${'✦ '.repeat(deck.length)}</div><div class="modal-actions"><button class="primary" data-read="restart">Ещё слова ↗</button><button class="secondary" data-action="home">К нашим буквам</button></div></main>`;celebrate();play('reading-finish')}
 function handle(action){if(!opened)return;unlock();switch(action){
  case'mic':if(getSettings().recognition==='browser'&&!earned&&!finishing){stop();recognizer.start(current().word)}break;
  case'listen':cancel();play(current().clip);break;
  case'syllables':cancel();hint=!hint;render();play(current().clip);break;
  case'adult':if(!earned&&!finishing)adult();break;
  case'adult-close':modal.close();break;
  case'adult-award':modal.close();award();break;
  case'next':if(!earned||finishing)break;stop();if(at+1===deck.length)finish();else{at++;earned=false;hint=false;status='';render();play('reading-ready')}break;
  case'restart':open(getSettings().last);break;
 }}
 return {open,handle,cancel,destroy,get opened(){return opened}};
}
