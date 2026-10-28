import {C,sprite,glyph,text,line,circle,box,bubble} from './drawing.js?v=practice-v1';
export function drawFinale(i,c,t,data={}){
 c.fillStyle='#f9f3e5';c.fillRect(0,0,600,230);const b=Math.sin(t*3)*8,r=Math.sin(t*2)*.12;
 const s=(k,x,y,w=120,h=w,v=0,a=0,col=C.purple)=>sprite(c,k,x,y,w,h,v,a,col);
 switch(i){
 case 0:s('bum',300+t%2*30,45-b*2,160,165,0,-.3);s('hat',350,8-b,100,90,0,r);s('hat',60,60+b,110,100,1,-.5);s('hat',150,110-b,100,90,2,.5);text(c,'АПЧХИ!',170,40,30,C.coral);break;
 case 1:s('butterfly',275,10+b,150);s('bum',285,105+b,115,130);line(c,[[355,110+b],[350,140+b]],'#b5a182',3);s('flower',80,120,130);s('flower',445,110,130);break;
 case 2:s('bum',225,20,180,210);for(let j=0;j<12;j++)circle(c,270+j*10,97+Math.sin(j)*7,13,'#fefdf3');s('boat',410,120+b,140);text(c,'Усы из пены!',130,150,20,'#8d9f87');break;
 case 3:s('caterpillar',210,50,220,140);s('leaf',255,155,110,65,0,.2);s('leaf',370,145,110,65,1,-.2);break;
 case 4:s('dinosaur',170,50,290,200);s('house',305,8+b,92,100,0,r);break;
 case 5:s('bum',60,30,175,200);s('spoon',270,45,150,170);s('food',400,95,125,125,1);bubble(c,'И ложке обед!',310,5,220);break;
 case 6:s('hedgehog',170,65,270,170);text(c,'✦',255,55+b,62,C.coral);text(c,'✦',355,60-b,62,C.purple);break;
 case 7:s('clown',220,60,165,180);[0,1,2].forEach(j=>s('hat',120+j*140,10+Math.sin(t*4+j*2)*20,90,85,j,r));break;
 case 8:glyph(c,'З',165,125,190,C.green,true);s('bum',315,35,170,195);s('patch',390,95,45,45,1,r);break;
 case 9:s('bum',95,65+b,140,165);s('chair',255,80-b,130,145);glyph(c,'И',460,120+b,175,C.coral,true);text(c,'ИК! ИК! ИК!',300,30,24,C.purple);break;
 case 10:glyph(c,'Й',310,140,230,C.blue,true);s('ant',265,14,95,80,0,r);text(c,'Z-z-z',425,45,25,C.purple);break;
 case 11:s('clown',70,45,170,190);for(let j=0;j<6;j++)s('flower',225+j*37,70+Math.sin(j+t)*14,100,125,j);break;
 case 12:s('leaf',170,135,260,80,0,r);s('shmyak',240,20+b,145,175,0,r);line(c,[[100,210],[470,210]],'#c6ba9f',3,[9,12]);break;
 case 13:{const v=data.variants||[0,0,0];c.save();c.translate(300,120+b);c.rotate(r);glyph(c,'М',0,15,190,[C.purple,C.coral,C.green][v[0]%3]);for(let j=0;j<(v[1]===1?3:2);j++){circle(c,-32+j*35,-20,14,'white');circle(c,-28+j*35,-17,5,C.ink)}line(c,[[-25,33],[0,45+v[2]*5],[28,33]],C.ink,4);s('hat',-68,-118,140,90,v[2]);c.restore();text(c,'М-м-м!',490,85,24,C.purple);break}
 case 14:glyph(c,'Н',155,130,180,C.purple,true);s('shmyak',320,30,165,200);s('sock',300,32+b,75,90,1,-.9);s('sock',435,30-b,75,90,1,.9);break;
 case 15:glyph(c,'О',180+t%2*40,125,190,C.purple,true,r);s('cloud',365,5+b,170,120);for(let j=0;j<15;j++)text(c,'✳',320+(j*41)%210,100+(j*29)%110,13,'#b3bda0');break;
 case 16:s('bum',240,40,140,180);box(c,170,20,250,200,35,'#a2b7af');s('button',220,45,50);s('button',220,105,50);box(c,305,100,80,75,5,'#829f96');s('bum',320,90+b,65,100);break;
 case 17:s('bum',230,40,180,195);circle(c,338,115,15,C.coral);s('bucket',70,115,115,110,1,0,C.green);s('bucket',410,120,100,100,0,0,C.purple);for(let j=0;j<5;j++)line(c,[[100+j*20,50],[200+j*20,25]],['#ee7a5b','#edbd54','#95bc7b','#7eb8ce','#a593ce'][j],10);break;
 case 18:s('elephant',170,5,300,220);s('flower',275,130+b,85,105);bubble(c,'Меня не видно!',25,25,195);break;
 case 19:s('cake',100,60+b,170,165,0,.15);s('cake',300,70-b,170,155,1,-.15);line(c,[[250,130],[300,125]],'#9b786b',4,[4,9]);text(c,'АМ!',300,40,29,C.coral);break;
 case 20:s('snail',210,65-b*2,210,145,0,r);for(let j=0;j<4;j++)text(c,'♪',130+j*105,50+Math.sin(t*3+j)*23,30,[C.purple,C.coral,C.green][j%3]);break;
 case 21:s('owl',210,65,200,165);s('hat',255,10+b,130,95,2,r);s('flashlight',430,110,90,120,0,-.7);break;
 case 22:s('cat',110,55,170,175,0);s('cat',330,55,170,175,1);s('hat',140,10,95,80);s('hat',350,10,95,80);line(c,[[205,42],[315,72+b],[395,42]],C.coral,5);break;
 case 23:s('chick',125,110+b,100,100);s('chicken',260,60-b,165,165);text(c,'Я главный!',175,45,25,C.coral);s('chick',460,125,75);break;
 case 24:s('cloud',40,10,165,100);text(c,'☀',120,70,50,C.yellow);box(c,60,90,110,105,15,'#b4a5d9');s('bum',290,45+b,160,180,0,r);s('food',465,120,100,100,1);text(c,'Z-z-z',440,35,24,C.purple);break;
 case 25:glyph(c,'Ш',300,125+b,210,C.green,true);for(let j=0;j<3;j++)s('ball',200+j*66,115+b,70,70,j);break;
 case 26:s('bum',215,30+b,180,200,0,r);s('hat',260,1-b*2,120,90,1,-r);text(c,'ХИ-ХИ!',100,90,28,C.purple);text(c,'ХА-ХА!',495,125,26,C.coral);break;
 case 27:s('bum',280,35,180,195);s('chair',70,90,150,150);s('food',200,135+b,105,95,0);text(c,'СЕЛ → СЪЕЛ',300,24,28,C.purple);break;
 case 28:s('mouse',205,60,210,170);glyph(c,'Ы',320,105,95,C.yellow);break;
 case 29:s('cloud',135,90,330,120);s('pillow',225,115,150,90);s('bum',255,15+b,120,155,0,.25);text(c,'Z-z-z',435,65,29,C.purple);break;
 case 30:s('mountain',80,65,230,180);glyph(c,'Э',400,120+b,160,C.purple,true);text(c,'ЭГЕ-ГЕЙ!',300,30,28,C.coral);break;
 case 31:s('bum',70,40,155,180,0,Math.sin(t*3)*.22);s('top',270,65,150,150,0,t*3);s('chair',440,95,120,135,0,r*3);break;
 case 32:{const order=data.order||[0,1,2];order.forEach((v,j)=>{box(c,55+j*175,45,145,150,20,['#dce6c4','#f4ddbe','#e4d8ef'][v]);s(['tree','apple','bum'][v],72+j*175,70,110,110,0,Math.sin(t*2+j)*.08,v===1?C.coral:C.purple)});text(c,'МОТОР!',300,20,22,C.coral);break}
 }
}
