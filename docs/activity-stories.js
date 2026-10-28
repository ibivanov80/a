import {C,sprite,bubble,text,line,circle} from './drawing.js?v=variety-v1';

// These scenes belong to different tasks. Decorative touches never complete
// geometry, and each ending has its own action and spoken joke.
export function createActivityStory(task,api){
 let now=0,reacted=-100;
 const react=()=>{reacted=now};
 return {react,poke(p){if(p[0]<260&&p[1]>230){react();api.effect?.('giggle');return true}return false},
  draw(c,t,s,layer='back'){
   now=t;const party=s.phase==='reveal',u=s.reveal,bounce=party?Math.abs(Math.sin(t*6))*12:Math.max(0,1-(t-reacted))*8;
   const friend=(kind=task.friend.kind)=>sprite(c,kind,35,260-bounce,190,210,0,party?Math.sin(t*4)*.07:0,task.friend.colour);
   if(layer==='back'){
    friend(task.id==='light'?'owl':task.friend.kind);
    bubble(c,party?task.finalBubble:task.bubble,35,105,270);
    if(task.id==='assemble'){sprite(c,'sock',party?100:790,party?240:315,95,95,1,party?-.8:.2,C.pink);if(!party)sprite(c,'button',810,400,75,75)}
    if(task.id==='trace'){sprite(c,'ant',party?690+Math.sin(u*2)*25:780,party?350:320,120,130);sprite(c,'hat',party?810-u*4:800,party?375:405,105,90,0,party?Math.sin(t*6)*.2:0);if(party)text(c,'ФИНИШ!',805,285,21,C.green)}
    if(task.id==='rotate'){sprite(c,'sock',party?102:790,party?328:330,85,95,0,party?-.7:.1,C.yellow);if(party)for(let j=0;j<4;j++)text(c,'↻',780+j%2*70,280+Math.floor(j/2)*70,34,C.purple)}
    if(task.id==='stamp'){sprite(c,'button',party?104:790,party?290:320,65,65,0,0,C.yellow);for(let j=0;j<3;j++)sprite(c,'button',770+j*35,420,45,45,j,0,C.purple)}
    if(task.id==='light'){sprite(c,'flashlight',party?190:770,party?390:320,100,110,0,party?1.9:-.4);if(party){circle(c,165,445,50,'#f4d67555');text(c,'О!',810,350,55,C.yellow)}}
   }else if(party){
    for(let j=0;j<7;j++)text(c,'✦',340+j*50,425+Math.sin(t*4+j)*9,17,[C.coral,C.green,C.purple][j%3]);
   }
  },
 };
}
