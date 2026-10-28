import {C,sprite,line,circle,box,text} from './drawing.js?v=practice-v1';

export function blanket(c,x,y,w,h,colour=C.blue){
 box(c,x,y,w,h,Math.min(18,h/3),colour);
 line(c,[[x+7,y+8],[x+w-7,y+8]],'#fff8e2',3,[8,9]);
 for(let j=1;j<5;j++)line(c,[[x+w*j/5,y+h-5],[x+w*j/5-3,y+h+5]],colour,4);
}

// Two companions look with the child. They point to the reference, never to
// the correct answer, and stay well clear of the three choice cards.
export function drawTogetherGuide(c,t,help=false){
 sprite(c,'bum',27,382+Math.sin(t*2)*2,78,92,0,.04);
 sprite(c,'shmyak',90,377-Math.sin(t*2)*2,81,96,0,-.06,C.green);
 line(c,[[91,429],[105,424],[115,429]],'#d39478',5);
 if(help){
  line(c,[[62,391],[55,298],[74,221],[112,207]],'#b8a888',3,[5,8]);
  circle(c,112,207,7,'#fff8e4','#c4a97b');
 }
}
