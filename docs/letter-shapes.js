// Original centre-line vector assets for Russian printed capitals.
// Coordinates use a 100 × 100 drawing box; dots/breve sit above it and
// the feet of Д and the tails of Ц/Щ extend to y=110. Each part is a
// single continuous path, suitable for assembling, tracing and highlighting.
const part = (id, label, points) => ({id, label, points});
const rounded = p => p.map(n => Math.round(n * 1000) / 1000);
const bezier = (a, b, c, d, steps = 16) => Array.from({length:steps + 1}, (_, i) => {
  const t=i/steps, u=1-t;
  return rounded([u*u*u*a[0]+3*u*u*t*b[0]+3*u*t*t*c[0]+t*t*t*d[0],
    u*u*u*a[1]+3*u*u*t*b[1]+3*u*t*t*c[1]+t*t*t*d[1]]);
});
const joined = (...paths) => paths.flatMap((path, i) => i ? path.slice(1) : path);
const ellipse = (cx, cy, rx, ry, start = -Math.PI/2, end = Math.PI*1.5, steps = 40) =>
  Array.from({length:steps+1}, (_, i) => {
    const a=start+(end-start)*i/steps;
    return rounded([cx+Math.cos(a)*rx, cy+Math.sin(a)*ry]);
  });
const dot = x => ellipse(x, -8, 2.8, 2.8, 0, Math.PI*2, 16);
const upperBowl = (x = 12, right = 92) => joined(
  bezier([x,0],[right,0],[right,50],[x,50]),
);
const lowerBowl = (x = 12, right = 96) => bezier([x,50],[right,50],[right,100],[x,100]);
const eParts = () => [
  part('stem-and-top','Палочка с верхней полочкой',[[92,0],[10,0],[10,100]]),
  part('middle-shelf','Средняя полочка',[[10,50],[78,50]]),
  part('bottom-shelf','Нижняя полочка',[[10,100],[92,100]]),
];
const iParts = () => [
  part('left-stem','Левая палочка',[[5,0],[5,100]]),
  part('diagonal','Косая дорожка снизу вверх',[[5,100],[95,0]]),
  part('right-stem','Правая палочка',[[95,0],[95,100]]),
];
const shParts = (bottom = 100) => [
  part('left-stem','Левая палочка',[[5,0],[5,bottom]]),
  part('middle-stem','Средняя палочка',[[50,0],[50,bottom]]),
  part('right-stem','Правая палочка',[[95,0],[95,bottom]]),
  part('bottom-bar','Нижняя дорожка',[[5,bottom],[95,bottom]]),
];

export const LETTER_SHAPES = [
  {letter:'А',parts:[
    part('left-leg','Левая наклонная ножка',[[5,100],[50,0]]),
    part('right-leg','Правая наклонная ножка',[[50,0],[95,100]]),
    part('crossbar','Перекладина поперёк',[[25.25,55],[74.75,55]]),
  ]},
  {letter:'Б',parts:[
    part('stem','Длинная палочка',[[12,0],[12,100]]),
    part('top-shelf','Верхняя полочка',[[12,0],[90,0]]),
    part('lower-bowl','Один нижний животик',lowerBowl()),
  ]},
  {letter:'В',parts:[
    part('stem','Длинная палочка',[[12,0],[12,100]]),
    part('upper-bowl','Верхний животик',upperBowl()),
    part('lower-bowl','Нижний животик',lowerBowl()),
  ]},
  {letter:'Г',parts:[
    part('stem','Высокая палочка',[[12,100],[12,0]]),
    part('top-shelf','Полочка наверху',[[12,0],[92,0]]),
  ]},
  {letter:'Д',parts:[
    part('roof-and-walls','Крыша со стенками',[[18,90],[34,0],[68,0],[84,90]]),
    part('bottom-bar','Дорожка под домиком',[[4,90],[96,90]]),
    part('left-foot','Левая маленькая ножка',[[4,90],[4,110]]),
    part('right-foot','Правая маленькая ножка',[[96,90],[96,110]]),
  ]},
  {letter:'Е',parts:eParts()},
  {letter:'Ё',parts:[...eParts(),
    part('left-dot','Левая точка',dot(34)),
    part('right-dot','Правая точка',dot(68)),
  ]},
  {letter:'Ж',parts:[
    part('first-diagonal','Косая палочка слева направо',[[3,0],[97,100]]),
    part('middle-stem','Прямая палочка посередине',[[50,0],[50,100]]),
    part('second-diagonal','Косая палочка справа налево',[[97,0],[3,100]]),
  ]},
  {letter:'З',parts:[
    part('upper-curve','Верхний завиток',joined(
      bezier([8,12],[28,-2],[73,-5],[88,18]),
      bezier([88,18],[100,37],[75,50],[43,50]),
    )),
    part('lower-curve','Нижний завиток',joined(
      bezier([43,50],[92,47],[109,76],[82,94]),
      bezier([82,94],[60,106],[24,101],[6,89]),
    )),
  ]},
  {letter:'И',parts:iParts()},
  {letter:'Й',parts:[...iParts(),
    part('breve','Короткая дужка-шапочка',bezier([30,-12],[38,1],[62,1],[70,-12])),
  ]},
  {letter:'К',parts:[
    part('stem','Длинная палочка',[[10,0],[10,100]]),
    part('upper-arm','Верхняя косая ручка',[[95,0],[10,50]]),
    part('lower-arm','Нижняя косая ножка',[[10,50],[95,100]]),
  ]},
  {letter:'Л',parts:[
    part('left-leg','Наклонная левая ножка',[[3,100],[30,0]]),
    part('top-bar','Короткая дорожка наверху',[[30,0],[94,0]]),
    part('right-leg','Прямая правая ножка',[[94,0],[94,100]]),
  ]},
  {letter:'М',parts:[
    part('left-stem','Левая высокая палочка',[[5,100],[5,0]]),
    part('down-diagonal','Горка к серединке',[[5,0],[50,100]]),
    part('up-diagonal','Горка от серединки',[[50,100],[95,0]]),
    part('right-stem','Правая высокая палочка',[[95,0],[95,100]]),
  ]},
  {letter:'Н',parts:[
    part('left-stem','Левая палочка',[[5,0],[5,100]]),
    part('right-stem','Правая палочка',[[95,0],[95,100]]),
    part('crossbar','Прямой мостик посередине',[[5,50],[95,50]]),
  ]},
  {letter:'О',parts:[
    part('left-arc','Левая половинка овала',ellipse(50,50,43,50,-Math.PI/2,-Math.PI*1.5,20)),
    part('right-arc','Правая половинка овала',ellipse(50,50,43,50,Math.PI/2,-Math.PI/2,20)),
  ]},
  {letter:'П',parts:[
    part('left-stem','Левая палочка',[[5,100],[5,0]]),
    part('top-bar','Мостик наверху',[[5,0],[95,0]]),
    part('right-stem','Правая палочка',[[95,0],[95,100]]),
  ]},
  {letter:'Р',parts:[
    part('stem','Длинная палочка',[[12,0],[12,100]]),
    part('upper-bowl','Один верхний животик',upperBowl(12,98)),
  ]},
  {letter:'С',parts:[
    part('upper-arc','Верхняя половинка открытого круга',bezier([90,10],[42,-15],[5,8],[5,50])),
    part('lower-arc','Нижняя половинка открытого круга',bezier([5,50],[5,92],[42,115],[90,90])),
  ]},
  {letter:'Т',parts:[
    part('top-bar','Широкая шляпка',[[3,0],[97,0]]),
    part('middle-stem','Ножка посередине',[[50,0],[50,100]]),
  ]},
  {letter:'У',parts:[
    part('left-arm','Левый усик',[[4,0],[50,52]]),
    part('right-arm-and-tail','Правый усик и хвостик вниз',[[96,0],[50,52],[15,100]]),
  ]},
  {letter:'Ф',parts:[
    part('left-bowl','Левая круглая половинка',ellipse(50,50,43,32,-Math.PI/2,-Math.PI*1.5,20)),
    part('right-bowl','Правая круглая половинка',ellipse(50,50,43,32,Math.PI/2,-Math.PI/2,20)),
    part('middle-stem','Палочка через серединку',[[50,0],[50,100]]),
  ]},
  {letter:'Х',parts:[
    part('first-diagonal','Первая косая палочка',[[5,0],[95,100]]),
    part('second-diagonal','Вторая косая палочка',[[95,0],[5,100]]),
  ]},
  {letter:'Ц',parts:[
    part('left-stem','Левая палочка',[[5,0],[5,90]]),
    part('right-stem','Правая палочка',[[88,0],[88,90]]),
    part('bottom-bar','Нижняя дорожка',[[5,90],[97,90]]),
    part('tail','Маленький хвостик справа',[[97,90],[97,110]]),
  ]},
  {letter:'Ч',parts:[
    part('short-stem','Короткая левая палочка',[[10,0],[10,42]]),
    part('cup','Чашечка до правой палочки',joined(
      bezier([10,42],[10,53],[19,55],[32,55]),
      [[32,55],[90,55]],
    )),
    part('long-stem','Длинная правая палочка',[[90,0],[90,100]]),
  ]},
  {letter:'Ш',parts:shParts()},
  {letter:'Щ',parts:[...shParts(90),
    part('tail','Маленький хвостик справа',[[95,90],[95,110]]),
  ]},
  {letter:'Ъ',parts:[
    part('top-shelf','Полочка слева наверху',[[3,0],[30,0]]),
    part('stem','Длинная палочка',[[30,0],[30,100]]),
    part('lower-bowl','Круглый нижний животик',lowerBowl(30,100)),
  ]},
  {letter:'Ы',parts:[
    part('left-stem','Левая длинная палочка',[[5,0],[5,100]]),
    part('lower-bowl','Нижний животик слева',lowerBowl(5,78)),
    part('separate-stem','Отдельная палочка справа',[[95,0],[95,100]]),
  ]},
  {letter:'Ь',parts:[
    part('stem','Длинная палочка',[[20,0],[20,100]]),
    part('lower-bowl','Круглый нижний животик',lowerBowl(20,100)),
  ]},
  {letter:'Э',parts:[
    part('upper-arc','Верхняя дуга справа',bezier([10,10],[58,-15],[95,8],[95,50])),
    part('lower-arc','Нижняя дуга справа',bezier([95,50],[95,92],[58,115],[10,90])),
    part('middle-bar','Полочка к серединке',[[95,50],[38,50]]),
  ]},
  {letter:'Ю',parts:[
    part('stem','Палочка слева',[[4,0],[4,100]]),
    part('bridge','Мостик к кружку',[[4,50],[30,50]]),
    part('oval','Овал справа',ellipse(65,50,35,50)),
  ]},
  {letter:'Я',parts:[
    part('right-stem','Длинная палочка справа',[[90,0],[90,100]]),
    part('upper-bowl','Верхний животик слева',bezier([90,0],[-12,0],[-12,50],[90,50])),
    part('diagonal-leg','Косая ножка влево',[[90,50],[8,100]]),
  ]},
];
