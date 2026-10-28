import {C,sprite,text,circle,box} from './drawing.js?v=practice-v2';

export const COMPANIONS=Object.freeze([
 {kind:'fox',name:'Лис Ложкин',line:'Шляпу съел? Нет, надел!',colour:C.coral},
 {kind:'rabbit',name:'Заяц Тапок',line:'Опять тапок на ухе!',colour:C.blue},
 {kind:'octopus',name:'Осьминог Плюх',line:'Восемь рук. А носок один!',colour:C.purple},
 {kind:'robot',name:'Робот Бип',line:'Бип! Обниматься разрешаю!',colour:C.green},
 {kind:'penguin',name:'Пингвин Пончик',line:'Варежки? На пятки!',colour:C.pink},
 {kind:'dragon',name:'Дракон Искорка',line:'Ой, опять чихнул конфетти!',colour:C.yellow},
]);
export const companionFor=(index,round=0)=>COMPANIONS[(index+round)%COMPANIONS.length];
export function drawCompanion(c,index,t,{round=0,happy=false,x=12,y=300,size=150}={}){
 const f=companionFor(index,round),bounce=happy?Math.abs(Math.sin(t*9))*15:Math.sin(t*2)*3;
 sprite(c,f.kind,x,y-bounce,size,size,0,happy?Math.sin(t*6)*.08:0,f.colour);
 if(happy)for(let i=0;i<5;i++)text(c,'✦',x+size/2+Math.cos(t*2+i*1.3)*size*.55,y+size*.3+Math.sin(t*2+i*1.3)*size*.45,15,f.colour);
}
export function drawPracticeBreak(c,index,t,completed,total){
 const f=companionFor(index,completed);
 text(c,'Получилось! Ещё одна буква нужна другу.',500,60,28,C.ink);
 drawCompanion(c,index,t,{round:completed,happy:true,x:330,y:100,size:330});
 text(c,f.name,500,425,25,C.ink);
 box(c,325,463,350,70,22,C.green);text(c,'Ещё одну букву ↗',500,500,27,C.ink);
 text(c,`${completed} из ${total} сборок готово`,800,100,18,'#8b7864');
}
