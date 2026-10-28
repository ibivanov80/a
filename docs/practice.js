import {createGame,GAME_COUNT} from './games.js?v=variety-v1';
import {LEVELS} from './data.js?v=variety-v1';
import {drawPracticeBreak} from './companions.js?v=variety-v1';
import {lessonActivities} from './activities.js?v=variety-v1';
import {createActivityStory} from './activity-stories.js?v=variety-v1';
export {GAME_COUNT};

export function practiceSettings(settings={}){
 return {builds:settings.builds===10?5:[1,3,5].includes(settings.builds)?settings.builds:3,
  finds:[2,5,10,20].includes(settings.finds)?settings.finds:10};
}

// Each stage changes the mechanic, instruction and comic ending. Only the last
// different activity opens the final recognition game.
export function createLesson(index,api,settings={}){
 const goal=practiceSettings(settings),route=lessonActivities(index,goal.builds);let pass=0,inner,between=false,breakTime=0;
 const activity=()=>route[pass];
 function start(){
  between=false;breakTime=0;const task=activity();api.activity?.(task);
  inner=createGame(index,{...api,
   step(n,total,label){api.step?.(n,total,label==='Собираем'?`Задание ${pass+1}/${route.length}`:label)},
   beforeFind(){
    if(pass+1>=goal.builds)return false;
    between=true;breakTime=0;
    const next=route[pass+1];
    api.instruction?.(`Получилось! Теперь другая игра: «${next.title}».`,'route-next','route-next');
    api.step?.(pass+1,route.length,'Приключения');return true;
   },
  },{finds:goal.finds,variant:pass,companion:true,...(task.id==='original'?{}:{
   lesson:{mode:task.mode,fixed:task.fixed,prop:task.prop},story:createActivityStory(task,api),
   joke:{text:task.joke,clip:task.jokeClip,duration:task.duration||7},
  })});
 }
 function next(){if(!between||breakTime<.35)return;inner.cancel();pass++;start();const task=activity();api.instruction?.(task.instruction,task.introClip,task.hintClip)}
 start();
 return {
  down(p){if(between){if(p.x>=325&&p.x<=675&&p.y>=463&&p.y<=533)next();return}inner.down(p)},
  move(p){if(!between)inner.move(p)},up(p){if(!between)inner.up(p)},cancel(){inner.cancel()},
  draw(c,t,dt){if(between){breakTime+=dt;drawPracticeBreak(c,index,t,pass+1,route.length,route[pass+1])}else inner.draw(c,t,dt)},
  guide(){return between?[500,500,0,0]:inner.guide()},
  replay(){inner.replay()},
  state(){return {...inner.state(),phase:between?'between':inner.state().phase,buildRound:pass+1,buildGoal:route.length,findGoal:goal.finds,activity:activity(),route:route.map(t=>({id:t.id,family:t.family,mode:t.mode}))}},
 };
}
