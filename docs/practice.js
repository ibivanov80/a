import {createGame,GAME_COUNT} from './games.js?v=practice-v2';
import {LEVELS} from './data.js?v=practice-v2';
import {drawPracticeBreak} from './companions.js?v=practice-v2';
export {GAME_COUNT};

export function practiceSettings(settings={}){
 return {builds:[1,3,5,10].includes(settings.builds)?settings.builds:3,
  finds:[2,5,10,20].includes(settings.finds)?settings.finds:10};
}

// Every repetition creates fresh geometry and tools. Finished pieces and pointer
// state never leak into the next build, and only the last build opens recognition.
export function createLesson(index,api,settings={}){
 const goal=practiceSettings(settings);let pass=0,inner,between=false,breakTime=0;
 function start(){
  between=false;breakTime=0;
  inner=createGame(index,{...api,
   step(n,total,label){api.step?.(n,total,label==='Собираем'?`Сборка ${pass+1}/${goal.builds}`:label)},
   beforeFind(){
    if(pass+1>=goal.builds)return false;
    between=true;breakTime=0;
    api.instruction?.('Ещё одна буква для нашего друга! Давай соберём её снова.','practice-again','practice-again');
    api.step?.(pass+1,goal.builds,'Сборки');return true;
   },
  },{finds:goal.finds,variant:pass,companion:true});
 }
 function next(){if(!between||breakTime<.35)return;inner.cancel();pass++;start();api.instruction?.(LEVELS[index].instruction,index+'-intro',index+'-hint')}
 start();
 return {
  down(p){if(between){if(p.x>=325&&p.x<=675&&p.y>=463&&p.y<=533)next();return}inner.down(p)},
  move(p){if(!between)inner.move(p)},up(p){if(!between)inner.up(p)},cancel(){inner.cancel()},
  draw(c,t,dt){if(between){breakTime+=dt;drawPracticeBreak(c,index,t,pass+1,goal.builds)}else inner.draw(c,t,dt)},
  guide(){return between?[500,500,0,0]:inner.guide()},
  replay(){inner.replay()},
  state(){return {...inner.state(),phase:between?'between':inner.state().phase,buildRound:pass+1,buildGoal:goal.builds,findGoal:goal.finds}},
 };
}
