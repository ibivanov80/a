import {blanket} from './care.js?v=variety-v1';
import {C,sprite,glyph,text,line,circle,box,bubble,clamp} from './drawing.js?v=variety-v1';

// The letter is a prop in a small comic scene. Reactions follow touches and
// successful construction; the story never awards learning progress itself.
const at=(pts,f)=>{const lengths=pts.slice(1).map((p,i)=>Math.hypot(p[0]-pts[i][0],p[1]-pts[i][1])),total=lengths.reduce((a,b)=>a+b,0);let d=total*f;for(let i=0;i<lengths.length;i++){if(d<=lengths[i]){const k=lengths[i]?d/lengths[i]:0;return[pts[i][0]+(pts[i+1][0]-pts[i][0])*k,pts[i][1]+(pts[i+1][1]-pts[i][1])*k]}d-=lengths[i]}return pts.at(-1)};
export function createStory(index,api){
 let now=0,reacted=-100,poked=-100;
 function react(){reacted=now}
 function poke(p){if((index===0&&Math.hypot(p[0]-490,p[1]-240)<60)||(index===13&&Math.hypot(p[0]-490,p[1]-170)<75)||(p[0]<275&&p[1]>160&&p[1]<445)||(p[0]>700&&p[1]>270&&p[1]<440)){if(now-poked>.4){poked=now;react();api.effect?.('giggle')}return true}return false}
 function draw(c,t,s,layer='back'){
  now=t;const party=s.phase==='reveal',u=party?s.reveal:0,p=clamp(s.progress,0,1),reaction=Math.max(Math.exp(-(t-reacted)*3),party?1:0,s.active?.6:0),bounce=Math.sin(t*2)*2+Math.sin(t*5)*reaction*12,wobble=Math.sin(t*2)*.025+Math.sin(t*4)*reaction*.12;
  const a=(kind,x,y,w=150,h=w,v=0,r=0,col=C.purple)=>sprite(c,kind,x,y,w,h,v,r,col);
  const say=(words,x=55,y=90,w=230)=>bubble(c,words,x,y,w);
  const bum=(x=95,y=245,w=165,r=wobble)=>a('bum',x,y-bounce,w,w*1.15,0,r);
  const face=(x,y,n=2)=>{for(let j=0;j<n;j++){circle(c,x+(j-(n-1)/2)*29,y,16,'#fffdf3');circle(c,x+(j-(n-1)/2)*29+Math.sin(t*2)*3,y+3,6,C.ink)}line(c,[[x-13,y+26],[x,y+33],[x+15,y+24]],C.ink,3)};
  if(layer==='front'){
   switch(index){
    case 0:face(490,192);circle(c,490,242,party?18+Math.sin(u*15)*4:17+reaction*4,C.coral,C.ink);if(party){text(c,'АПЧХИ!',490,430,32,C.coral);for(let j=0;j<7;j++)line(c,[[530+j*9,245+(j-3)*12],[560+j*21,245+(j-3)*22]],'#a1b794',3)}break;
    case 6:break;
    case 7:for(const part of s.visibleParts){for(const q of [part.points[0],part.points.at(-1)]){circle(c,q[0],q[1],14,'#fffaf0',C.purple);line(c,[[q[0]-7,q[1]-5],[q[0]-8,q[1]-18]],C.purple,5)}}break;
    case 13:face(490,168,party||t-reacted<1?3:2);if(party)text(c,'М-м-м!',490,425,28,C.purple);break;
    case 17:for(let j=0;j<4;j++)circle(c,490+j*15,110+j*12,party?6:3,colours(j));break;
    case 25:if(party){face(490,230);for(let j=0;j<3;j++)a('ball',365+j*125,335+Math.sin(t*3+j)*12,55,55,j)}break;
    case 26:face(490,210);if(s.active||party){text(c,'Хи-хи!',700,435,25,C.purple);a('leaf',610,365+Math.sin(t*12)*10,80,45,1,-.6)}break;
    case 28:for(const part of s.visibleParts)if(part.id!=='separate-stem')for(const q of [at(part.points,.25),at(part.points,.7)])circle(c,...q,4,'#fff0bd');break;
    case 29:if(party){a('pillow',430,310,130,75);a('bum',450,255+Math.sin(t*2)*2,80,92,0,.6);a('shmyak',595,282,110,135,0,-.14,C.green);line(c,[[620,335],[545,327],[525,321]],'#d39478',5);blanket(c,465,310,80,44);text(c,'Z-z-z',555,280,23,C.purple)}break;
   }
   return;
  }
  switch(index){
   case 0:{
    if(!party)bum(115,295,155,wobble);say(party?'Держите шляпу!':'А-а-а…',65,100,205);
    for(let j=0;j<3;j++){const x=party?610+Math.sin(u*1.5+j)*135+j*35:720+j*45,y=party?190-u*25+Math.cos(u*2+j)*80:315+j*45;a('hat',x,y,100,90,j,party?u*(j%2?-.7:.7):-.12+j*.15)}
    if(party){
     const caught=clamp((u-2.6)/2.6,0,1),x=(720+Math.sin(u)*55)*(1-caught)+748*caught,y=(115+Math.cos(u*1.7)*40)*(1-caught)+338*caught;
     a('shmyak',830,325,130,155,0,-.08,C.green);line(c,[[855,397],[808,423],[775,415]],'#d39478',6);a('bum',x,y,80,100,0,u*.6*(1-caught));blanket(c,710,418,145,28);
     if(caught>.7)say('Поймал! Всё хорошо.',670,460,275);
    }else a('shmyak',825,350,105,125,0,-.08,C.green);
    break;
   }
   case 1:{
    a('flower',65,340,130);a('flower',725,335,130,145,1);a('flower',820,385,105,120,2);
    const q=s.active?s.pointer:party?[610+Math.sin(u*2)*90,180+Math.cos(u*3)*45]:[155,220+Math.sin(t*2)*20];
    a('butterfly',q[0]-55,q[1]-45,110,100,0,Math.sin(t*8)*.15);a('hat',q[0]-20,q[1]+37,85,70,0,.1);
    if(party){const caught=clamp((u-2.5)/2.8,0,1),x=(q[0]-50)*(1-caught)+740*caught,y=(q[1]+85)*(1-caught)+330*caught;line(c,[[q[0]+15,q[1]+80],[x+45,y+25]],'#ab9675',3);a('shmyak',835,320,115,140,0,-.1,C.green);a('bum',x,y,95,115,0,.25*(1-caught));blanket(c,707,430,150,30)}else bum(105,290,155);
    say(party?'Ой, я тоже лечу!':'Шляпу не забудь!',55,95,235);break;
   }
   case 2:{
    for(const part of s.visibleParts.filter(p=>p.id.includes('bowl'))){c.save();c.beginPath();part.points.forEach((q,j)=>j?c.lineTo(...q):c.moveTo(...q));c.closePath();c.fillStyle='#8abac24d';c.fill();c.restore();const q=at(part.points,.5);for(let j=0;j<5;j++)circle(c,q[0]-32+j*15,q[1]+10-Math.sin(t*3+j)*3,9,'#fffdf1')}
    a('bum',40,210,235,270,0,wobble);for(let j=0;j<9;j++)circle(c,118+j*12,330+Math.sin(j)*4,8+p*6,'#fffdf5');
    a('boat',690,330+Math.sin(t*2)*10,170,130,0,.07);say(party?'Усы — отдельно!':'Ванна для усов?',40,100,240);break;
   }
   case 3:{
    for(const part of s.visibleParts){for(let j=0;j<9;j++){const q=at(part.points,j/8);circle(c,...q,17,j%2?'#b8cb88':'#c8d79e');line(c,[[q[0]-8,q[1]+12],[q[0]-15,q[1]+23]],'#9a9b62',3)}}
    a('caterpillar',55,270,235,150,0,wobble);a('leaf',85,400-bounce,115,65,0,.2);a('leaf',200,390+bounce,105,65,1,-.2);say(party?'Салатные тапочки!':'Где мои тапки?',45,105,245);break;
   }
   case 4:{
    a('dinosaur',45,215,260,235,0,wobble);a('house',party?125:730,party?165-bounce:315,party?120:155,party?125:165,0,party?.18:-.1);say(party?'Дом как раз по голове!':'Мне бы дом побольше…',35,105,270);
    if(party){a('house',705,240,230,230,0,-.03);a('shmyak',777,320,95,115,0,.03,C.green);say('И тебе крыша найдётся!',650,460,295)}break;
   }
   case 5:{
    a('bum',40,205,230,270,0,wobble);a('spoon',705,280,150,170,0,party?Math.sin(t*6)*.2:.15);
    const food=s.completed;for(let j=0;j<3;j++){if(j<food||party)a('food',550+Math.sin(t*2+j)*8,82+j*140,55,55,j,Math.sin(t*3+j)*.1)}
    if(s.active)a('food',s.pointer[0]-25,s.pointer[1]-25,50,50,1);if(party)a('food',745,320,75,65,1,.1);say(party?'Ложка, открывай рот!':'Ещё! Ещё! Ещё!',40,100,255);break;
   }
   case 6:{
    a('hedgehog',55,250,250,195,0,wobble);a('comb',710,305,150,150,0,-.2);
    for(let j=0;j<s.completed;j++){const x=party?110+j*92:455+j*85,y=party?250-bounce:50;line(c,[[x,y],[x-22,y-13],[x-22,y+12],[x,y],[x+22,y-13],[x+22,y+12],[x,y]],j?C.pink:C.blue,8);circle(c,x,y,7,C.yellow)}
    say(party?'Колючий, зато нарядный!':'Две точки — два банта!',40,100,280);break;
   }
   case 7:{
    a('clown',60,235,190,220,0,wobble);const n=party?5:Math.max(1,s.completed);for(let j=0;j<n;j++){const angle=t*1.7+j*Math.PI*2/n,x=party?745+Math.cos(angle)*90:130+Math.cos(angle)*80,y=party?335+Math.sin(angle)*70:210+Math.sin(angle)*65;a(j===n-1&&party?'hat':'ball',x,y,60,60,j,angle*.3)}
    say(party?'Обед тоже поймаю!':'Руки запасные есть!',35,100,265);break;
   }
   case 8:{
    bum(75,245,195);for(let j=0;j<2;j++)a('patch',j?570:410,j?295:140,60,60,j,wobble);if(party){const x=715-490*clamp(u/2,0,1);a('shmyak',x,292,115,140,0,-.12,C.green);line(c,[[x+30,345],[Math.max(195,x-30),337]],'#d39478',6);a('patch',173,328,45,45,1,.15)}else a('patch',730,320,115,110,0,wobble);say(party?'Самую мягкую заплатку!':'Почините мои завитки!',35,100,295);break;
   }
   case 9:{
    bum(60,260-bounce*2,165);a('chair',725,320+bounce*2,135,150,0,-wobble);if(s.active||party){text(c,'ИК!',240,250-bounce,30,C.coral);text(c,'ИК!',750,290+bounce,27,C.purple)}say(party?'Даже табуретка икает!':'Икота наискосок!',45,100,260);break;
   }
   case 10:{
    a('ant',95,285,160,150,0,wobble);if(party){a('ant',455,40,80,70,0,.7);text(c,'Z-z-z',565,70,22,C.purple)}else{line(c,[[118,272],[150,290],[182,272]],C.purple,11);a('hat',725,305,140,120,1,wobble)}say(party?'Тихо, шапочка спит!':'Шапку? Или гамак?',40,105,265);break;
   }
   case 11:{
    a('clown',80,240-bounce,165,195,0,wobble);line(c,[[35,430],[300,430]],'#b6a083',5);for(let j=0;j<(party?6:2+s.completed);j++)a('flower',680+j%3*65,290+Math.floor(j/3)*80+Math.sin(t*2+j)*12,85,100,j);say(party?'Помахал — вырос букет!':'Не маши так сильно!',35,105,265);break;
   }
   case 12:{
    a('leaf',55,365,240,95,0,wobble);a('shmyak',100,235-bounce,155,170,0,party?.35:wobble);
    if(s.active){a('leaf',s.pointer[0]-35,s.pointer[1]+20,70,25);a('shmyak',s.pointer[0]-24,s.pointer[1]-36,48,60)}
    if(party){a('bum',230+Math.sin(t*2)*4,305,110,133,0,-.15);line(c,[[250,365],[215,387]],'#d39478',6);a('pillow',730,365,130,90,0,wobble)}else a('leaf',735,380+Math.sin(t*2)*8,150,65,1,-.1);say(party?'Устал отдыхать…':'Подвези меня, листик!',35,100,275);break;
   }
   case 13:{
    a('monster',60,270-bounce,205,190,party?2:s.completed%3,wobble);for(let j=0;j<3;j++){const x=730+j*42,y=315+Math.sin(t*3+j)*40;circle(c,x,y,22,'#fffdf5',C.purple);circle(c,x+Math.sin(t*2)*6,y,8,C.ink)}say(party?'Кому ещё подмигнуть?':'Глаз много не бывает!',35,100,275);break;
   }
   case 14:{
    a('shmyak',75,240,180,215,0,wobble);if(party){a('sock',75,240-bounce,70,105,1,-.9);a('sock',210,230+bounce,70,105,1,.9)}else for(let j=0;j<2;j++)a('sock',440+j*63,220,65,95,j,.1);if(party){a('bum',230,320,105,128,0,-.1);line(c,[[270,380],[222,352],[185,332],[154,336]],C.blue,13);line(c,[[164,336],[164,364],[159,374]],C.blue,8)}else a('sock',735,340+bounce,110,140,2,wobble);say(party?'И нос пусть будет в тепле!':'Где парный носок?',35,100,265);break;
   }
   case 15:{
    a('dandelion',65,300,170,180,0,wobble);a('cloud',705,255-bounce,195,140,0,-wobble);for(let j=0;j<(party?22:8);j++){const x=party?620+(j*71+u*65)%280:90+(j*73+t*15)%230,y=party?290+(j*43)%180:180+(j*47)%100;text(c,'✳',x,y,party?19:13,'#a1b88a')}say(party?'Одуванчиковое апчхи!':'Кто дунул на букву?',35,100,280);break;
   }
   case 16:{
    box(c,70,225,195,235,35,'#9cb8ac');a('bum',94,210-bounce,145,180,0,wobble);for(let j=0;j<Math.min(5,s.completed);j++)a('button',90,270+j*32,32,32,j);box(c,170,355,75,80,10,'#7f9e91');if(party)a('bum',179,357-bounce/3,58,76,0,.1);a('button',720,320,135,135,2,wobble);say(party?'Квартира в кармане!':'Пуговицы на прогулку!',35,100,280);break;
   }
   case 17:{
    bum(55,245,205);a('bucket',735,335,135,135,1,wobble,C.green);for(let j=0;j<5;j++)line(c,[[80+j*25,200],[190+j*20,165]],colours(j),8);if(party){circle(c,157,335,17,C.coral);for(let j=0;j<5;j++)line(c,[[155+j*5,328],[160+j*5,344]],colours(j),4)}say(party?'Носу тоже радугу!':'Нос не красить!',35,100,260);break;
   }
   case 18:{
    a('elephant',35,210,275,250,0,wobble);a('flower',140,320,55,90,0,0);a('flower',735,350,125,150,1,wobble);say(party?'Меня совсем не видно!':'Слон? Какой слон?',35,100,275);if(s.active||party)text(c,'?',730,280-bounce,52,C.coral);break;
   }
   case 19:{
    for(const part of s.visibleParts){line(c,part.points,'#d99eae',52);line(c,part.points,'#fff1cf',39)}for(let j=0;j<5;j++)circle(c,380+j*55,90,5,colours(j));
    a('cake',55,290-bounce,190,175,0,.08+wobble);a('cake',party?710-420*Math.min(u/2,1):710,290+bounce,180,170,1,-.08-wobble);face(145,373);if(party){circle(c,218,387,15,C.ink);text(c,'АМ!',200,260,31,C.coral);line(c,[[245,385],[280+Math.sin(t*8)*12,365]],'#b48869',4,[3,8])}say(party?'Кто кого угощает?':'Торт проголодался!',35,100,265);break;
   }
   case 20:{
    a('snail',65,285-(party?bounce*3:0),210,165,0,wobble);line(c,[[145,315],[105,265-bounce],[65,290]],C.purple,5);line(c,[[205,315],[245,265+bounce],[285,285]],C.purple,5);for(let j=0;j<(party?6:3);j++)text(c,'♪',690+j%3*65,280+Math.floor(j/3)*100+Math.sin(t*3+j)*20,34,colours(j));say(party?'Дирижируем пониже!':'Усы настроены?',35,100,270);break;
   }
   case 21:{
    circle(c,170,300,125,'#665883');for(let j=0;j<8;j++)text(c,'✦',60+j*29,210+(j*37)%160,12,'#eee1a4');a('owl',80,265-bounce,180,165,0,wobble);if(party)a('hat',140,232-bounce,105,85,1,-.05);a('flashlight',735,330,125,145,0,-.7);say(party?'Проверка фонариков!':'Филин, уже утро?',35,100,265);break;
   }
   case 22:{
    for(const part of s.visibleParts){line(c,part.points,part.colour,34);const q=part.points.reduce((a,b)=>a[1]>b[1]?a:b);a('cat',q[0]-47,q[1]-8,94,115,part.id==='first-diagonal'?0:1,wobble)}
    a('hat',85,290,120,100,0,party?.4+wobble:.05);a('hat',740,330,120,100,1,party?-.4-wobble:-.1);if(party)line(c,[[185,330],[680,300],[800,355]],C.coral,5);say(party?'Хвосты свободны. Шляпы?!':'Кто за чей хвост?',35,100,285);break;
   }
   case 23:{
    a('chicken',60,275-bounce,190,180,0,wobble);for(let j=0;j<3;j++)a('chick',685+j*52,345+Math.sin(t*3+j)*9,70,80,j,0);if(party){a('chick',260,260-bounce,85,95,0,-.1);say('Я теперь главный!',35,100,260)}else say('Куда пошла мама?',35,100,260);break;
   }
   case 24:{
    a('clock',365,110,255,265,0,0);a('cloud',55,240,210,125,0,wobble);text(c,'☀',160,315,60,C.yellow);if(party){a('hat',115,260-bounce,105,100,1,.2);text(c,'Z-z-z',220,350,25,C.purple)}a('food',745,340,120,120,1,wobble);say(party?'Уже снова вчера!':'Часы идут обратно!',35,100,270);break;
   }
   case 25:{
    a('ball',65,290-bounce,160,160,1,wobble);for(let j=0;j<3;j++){box(c,345+j*126,350,58,70,13,'#dce7bf');a('ball',350+j*126,365+Math.sin(t*2+j)*5,48,48,j)}a('shmyak',725,270-bounce,165,195,0,wobble);say(party?'Карманы тоже гуляют!':'Три кармана — три мяча!',35,100,285);break;
   }
   case 26:{
    bum(75,240,185,wobble*2);a('hat',130,205-bounce*2,135,105,1,-wobble);a('comb',730,330,125,135,0,wobble);say(party?'Даже шляпа щекочется!':'Только не пятки!',35,100,280);break;
   }
   case 27:{
    bum(65,225,170);a('chair',165,350,135,130,0,wobble);a('food',730,335,130,120,0,wobble);text(c,party?'СЪЕЛ':'СЕЛ',770,280,29,C.purple);if(party){a('chair',party?200+Math.sin(u*2)*25:200,365,80,85,0,.5);say('Стул оставь, пожалуйста!',35,100,285)}else say('Сел? Или съел?',35,100,260);break;
   }
   case 28:{
    a('mouse',65,255-bounce,220,200,0,wobble);a('cheese',725,335,150,125,0,wobble);if(party){glyph(c,'Ы',174,340,72,C.yellow);line(c,[[127,329],[105,325]],C.ink,3)}say(party?'Вкусно смотреть!':'Сырные очки нужны?',35,100,275);break;
   }
   case 29:{
    a('cloud',35,345,250,120,0,wobble);a('pillow',95,370,140,90,0,-.1);if(!party)a('bum',105,205-bounce*2,135,165,0,wobble);a('pillow',725,345,150,110,1,wobble);say(party?'Попрыгаю. После сна…':'Мягкую посадку!',35,100,285);break;
   }
   case 30:{
    a('mountain',40,245,250,235,0,wobble);text(c,party?'ЭГЕ-ГЕЙ!':'Э-э-э?',750,310-bounce,30,C.purple);a('cloud',700,345,185,120,0,-wobble);if(party)for(let j=0;j<5;j++)text(c,'э',680+j*40,220+j*30-bounce,23+j*3,colours(j));say(party?'Гора тоже чихнула!':'Эхо, ты где?',35,100,265);break;
   }
   case 31:{
    bum(60,240,170,party?Math.sin(t*3)*.3:wobble);a('top',720,310,145,155,0,t*(party?5:.8));a('chair',party?720+Math.cos(u*2)*100:750,party?260+Math.sin(u*2)*100:210,105,120,0,party?u*2:0);line(c,[[295,190],[295+Math.sin(t*2)*15,400]],C.pink,18);say(party?'Держи штору и обед!':'Комната, не кружись!',35,100,280);break;
   }
   case 32:{
    box(c,45,235,245,205,15,'#d6c7e6');line(c,[[60,250],[270,250],[270,425],[60,425],[60,250]],'#fff7e8',6,[15,15]);a('bum',90,255-bounce,150,180,0,wobble);a('apple',party?720:725,(party?300:420)-bounce,party?150:110,party?160:125,0,wobble,C.coral);box(c,party?720:710,(party?270:405)-bounce,155,37,6,C.ink);line(c,[[party?725:715,(party?277:412)-bounce],[party?855:845,(party?277:412)-bounce]],'#fff6e5',10,[14,12]);if(party){a('apple',187,345-bounce/4,48,55,0,.06,C.coral);line(c,[[182,361],[211,371]],'#d39478',5)}say(party?'Снимаемся все!':'Яблоко, мотор!',35,100,295);break;
   }
  }
 }
 return {draw,react,poke};
}
function colours(j){return [C.coral,C.yellow,C.green,C.blue,C.purple][j%5]}
