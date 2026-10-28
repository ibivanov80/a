import {LEVELS} from './data.js?v=variety-v1';
import {LETTER_SHAPES} from './letter-shapes.js?v=variety-v1';
import {COMPANIONS,companionFor} from './companions.js?v=variety-v1';

// A longer route adds different thinking and gestures, never another copy of
// the first game. The original letter-specific comic scene always comes first.
const families={build:'assemble',dots:'assemble',cap:'assemble',bridge:'assemble',monster:'assemble',spin:'assemble',lift:'assemble',slide:'assemble',trace:'trace',feed:'trace',fork:'trace',maze:'trace',loop:'trace',strings:'trace',chain:'trace',rays:'trace',paint:'trace',slice:'trace',rotate:'rotate',cross:'rotate',stamp:'stamp',light:'light'};
export const ACTIVITY_SCRIPTS=Object.freeze([
 {id:'assemble',duration:7.066009,title:'Носочные новости',mode:'build',friend:COMPANIONS[3],prop:'robot',
  intro:'Робот разобрал букву на детали. Перетащи все детали на свои места. Собери букву целиком!',
  hint:'На маленьком образце видна вся буква. Перетащи каждую деталь на такую же дорожку большого контура.',
  joke:'Буква собралась! А робот прикрутил себе носок вместо антенны. Теперь ловит носочные новости!',bubble:'Где моя инструкция?',finalBubble:'Ловлю носочные новости!'},
 {id:'trace',duration:6.77,title:'Муравьиная прогулка',mode:'trace',friend:COMPANIONS[0],prop:'ant',
  intro:'Муравей отправился гулять по букве. Веди его пальчиком по всем дорожкам, от кружочка до конца!',
  hint:'Начни с кружочка и веди пальчик по дорожке. Потом пройди следующую дорожку этой буквы.',
  joke:'Муравей прошёл по всей букве! А его шляпа дошла отдельно. Шляпа, ты тоже молодец!',bubble:'Шляпа, не отставай!',finalBubble:'Шляпа тоже дошла!'},
 {id:'rotate',duration:6.062993,title:'Палочки кувырком',mode:'rotate',friend:COMPANIONS[2],prop:'octopus',
  intro:'Осьминог перепутал палочки! Возьмись за круглые ручки и поверни детали. Пусть получится наша буква.',
  hint:'Сравни деталь с её серой дорожкой. Возьмись за круглую ручку и поверни деталь, чтобы они совпали.',
  joke:'Буква снова стоит как надо! А осьминог так закрутился, что надел носок на нос!',bubble:'У меня всё кувырком!',finalBubble:'Носок! Это же нос!'},
 {id:'stamp',duration:6.598005,title:'Важная кнопка',mode:'stamp',friend:COMPANIONS[4],prop:'button',
  intro:'Пингвин печатает букву пуговицами. Нажми на все кружочки, чтобы проявилась целая буква!',
  hint:'Нажимай на пустые кружочки вдоль дорожек буквы. Заполни все дорожки, как на маленьком образце.',
  joke:'Все пуговицы на месте! Только пингвин ещё и на лоб одну поставил. Теперь он важная кнопка!',bubble:'Печатаю! Шлёп-шлёп!',finalBubble:'Я очень важная кнопка!'},
 {id:'light',duration:6.317007,title:'Фонарик для пяток',mode:'light',friend:{kind:'owl',name:'Филин Федя',colour:'#a99be8',line:'Пятки тоже хотят посмотреть!'},prop:'flashlight',
  intro:'Филин спрятал букву в тумане. Води фонариком и зажги каждую её дорожку!',
  hint:'Проведи фонариком по всем дорожкам буквы, включая короткие палочки, точки и хвостик, если они есть.',
  joke:'Буква засветилась! А филин осветил себе пятки. Говорит, вдруг они тоже хотят посмотреть!',bubble:'Буква, ты где?',finalBubble:'Пятки тоже смотрят!'},
]);
export function lessonActivities(index,count=3){
 const l=LEVELS[index],family=families[l.mode]||l.mode;
 const first={id:'original',family,title:l.title,mode:l.mode,friend:companionFor(index),instruction:l.instruction,hint:l.hint,introClip:index+'-intro',hintClip:index+'-hint'};
 const additions=ACTIVITY_SCRIPTS.filter(a=>a.id!==family).map(a=>({...a,family:a.id,
  instruction:`Буква ${l.letter}. ${a.intro}`,introClip:'task-'+a.id,hintClip:'task-'+a.id,
  fixed:a.id==='rotate'?LETTER_SHAPES[index].parts.filter(p=>p.id.endsWith('dot')).map(p=>p.id):[],
  jokeClip:'task-'+a.id+'-joke',
 }));
 return [first,...additions].slice(0,count);
}
