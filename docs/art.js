// Original paper-collage sprites for Буквобум. No network or DOM dependencies.
const INK = '#38343e';
const COLORS = ['#ad9ce4','#ed805f','#a9c76c','#edc55d','#79aeb2','#d592ab'];
const E = (x,y,s=1,look=0) => `<g transform="translate(${x} ${y}) scale(${s})"><ellipse cx="-10" cy="0" rx="10" ry="13" fill="#fffdf3"/><ellipse cx="11" cy="-1" rx="10" ry="13" fill="#fffdf3"/><ellipse cx="${-7+look}" cy="3" rx="3.5" ry="5" fill="${INK}" stroke="none"/><ellipse cx="${14+look}" cy="2" rx="3.5" ry="5" fill="${INK}" stroke="none"/></g>`;
const smile = (x,y,w=20) => `<path d="M${x-w/2} ${y}q${w/2} ${w*.75} ${w} -1" fill="none" stroke-width="2.2"/>`;
const circles = (color,n=6) => Array.from({length:n},(_,i)=>`<circle cx="${58+(i%3)*30}" cy="${89+Math.floor(i/3)*25}" r="4" fill="${color}" stroke="none"/>`).join('');
const leafShape = (color) => `<path d="M35 151Q21 46 163 34Q169 148 35 151Z" fill="${color}"/><path d="M38 150L151 48M70 117L64 82M100 89L99 60M96 94L131 105M65 125L105 133" fill="none" stroke="#ffffff70" stroke-width="3"/>`;
const sockShape = (color, v) => `<path d="M73 32L129 34L124 111L156 124Q179 138 165 158Q151 176 124 163L64 136Q52 130 57 109Z" fill="${color}"/><path d="M71 39L126 41M69 50L126 52" stroke="#fff8e9" stroke-width="6"/>${v%3===0?'<path d="M67 75L125 78M63 95L124 99M67 122L132 148" stroke="#fff8e9" stroke-width="9"/>':v%3===1?'<g fill="#fff8e9" stroke="none"><circle cx="88" cy="74" r="5"/><circle cx="113" cy="94" r="5"/><circle cx="80" cy="112" r="5"/><circle cx="132" cy="139" r="5"/></g>':'<path d="M68 78L84 91L101 79L123 94M64 101L82 115L101 103L119 118M98 136L115 127L132 147L148 137" stroke="#fff8e9" stroke-width="5" fill="none"/>'}`;

export const ART_KINDS = Object.freeze(['fox','rabbit','octopus','robot','penguin','dragon','bum','shmyak','butterfly','flower','hat','boat','tap','caterpillar','leaf','dinosaur','house','food','spoon','hedgehog','comb','ball','patch','ant','clown','monster','sock','dandelion','button','bucket','elephant','footprint','cake','snail','owl','flashlight','cat','tail','chicken','chick','clock','pillow','cheese','mouse','mountain','top','apple','tree','chair','cloud','star']);

export function art(kind, color='#a99be8', variant=0) {
  const c = /^#[0-9a-f]{3,8}$/i.test(color) ? color : '#a99be8';
  const v = Math.abs(Math.floor(Number(variant)||0));
  const alt = COLORS[v%COLORS.length];
  let a='';
  switch(kind) {
    case 'fox':
      a=`<path d="M66 135Q6 157 24 88Q40 130 72 108" fill="#ed805f"/><path d="M73 98L61 156Q104 172 145 151L133 92Z" fill="#ed805f"/><path d="M76 145L70 179L49 180M126 146L135 177L154 178" fill="none" stroke-width="8"/><path d="M58 57L49 18L91 45L126 42L159 18L151 80L109 119L61 86Z" fill="#ed805f"/><path d="M61 73L109 94L148 72L110 111Z" fill="#fff0d2"/><ellipse cx="110" cy="90" rx="9" ry="7" fill="${INK}"/>${E(108,62,.65)}${smile(110,104,18)}<path d="M72 105Q111 123 143 104L147 123Q109 137 69 120Z" fill="${c}"/><path d="M126 121L151 157L164 147L140 118" fill="${c}"/><path d="M52 22L62 47L79 43M145 28L130 45L148 49" fill="#f2b499"/>`;
      break;
    case 'rabbit':
      a=`<path d="M72 77Q37 11 65 12Q88 9 92 69M110 66Q111 5 140 16Q162 32 130 81" fill="#b5cbd2"/><path d="M69 24L81 61M133 28L123 63" fill="none" stroke="#d99eae" stroke-width="10"/><path d="M69 101Q44 153 78 165L138 162Q164 143 134 104" fill="#b5cbd2"/><ellipse cx="103" cy="86" rx="47" ry="39" fill="#b5cbd2"/>${E(103,77,.7)}<path d="M96 92L110 91L104 99Z" fill="#d99eae"/>${smile(105,103,19)}<path d="M63 153L48 174L79 181L89 165M128 159L131 181L166 174L146 151" fill="${c}"/><path d="M61 119L37 108M142 120L164 102" fill="none" stroke-width="7"/><path d="M53 40Q25 35 30 61L58 65L66 53Z" fill="#edc55d"/><path d="M34 49L55 54" stroke="#fff0d2" stroke-width="5"/>`;
      break;
    case 'octopus':
      a=`${[0,1,2,3,4,5,6,7].map((j)=>`<path d="M${69+j*9} 115Q${18+j*23} ${156+j%2*15} ${21+j*23} ${139+j%3*15}" fill="none" stroke="${c}" stroke-width="15"/>`).join('')}<path d="M51 112Q41 33 101 28Q159 28 151 115Q100 140 51 112Z" fill="${c}"/>${E(102,76,.83)}${smile(104,105,27)}<circle cx="66" cy="92" r="8" fill="#ed9c91" stroke="none"/><circle cx="139" cy="92" r="8" fill="#ed9c91" stroke="none"/><path d="M102 30L99 16L127 20L130 35Z" fill="#edc55d"/><path d="M145 147L167 142L169 167L155 178L142 168Z" fill="#fff0d2"/>`;
      break;
    case 'robot':
      a=`<path d="M72 146L68 178L45 178M129 147L135 177L158 178M57 110L30 101L24 122M144 108L170 91L176 111" fill="none" stroke="#859b92" stroke-width="10"/><rect x="55" y="89" width="91" height="69" rx="19" fill="${c}"/><rect x="48" y="31" width="106" height="69" rx="20" fill="#c1d1c0"/><path d="M100 30L100 14" stroke-width="5"/><circle cx="100" cy="12" r="7" fill="#edc55d"/>${E(101,57,.9)}<path d="M82 81L120 81" stroke="#ed805f" stroke-width="5"/><circle cx="99" cy="124" r="18" fill="#fff5dd"/><path d="M89 124Q84 112 95 115L100 119Q114 107 113 121L100 134Z" fill="#ed805f" stroke="none"/><path d="M154 43L169 46L168 76L154 79M47 44L33 47L34 76L47 79" fill="#859b92"/>`;
      break;
    case 'penguin':
      a=`<path d="M55 101Q24 106 27 141L63 126M144 101Q180 100 176 141L139 126" fill="#706887"/><path d="M53 110Q40 25 99 23Q163 22 149 124Q151 176 99 174Q46 170 53 110Z" fill="#706887"/><ellipse cx="101" cy="120" rx="35" ry="46" fill="#fff3d8"/>${E(101,67,.9)}<path d="M88 83L115 83L104 99Z" fill="#edc55d"/><path d="M67 165L43 179L84 185L94 170M119 168L116 183L158 177L137 162" fill="${c}"/><path d="M58 99Q101 119 149 98L148 114Q101 136 57 116Z" fill="${c}"/><path d="M122 115L153 153L166 143L139 109" fill="${c}"/><path d="M57 38Q94 5 147 39Z" fill="#edc55d"/><circle cx="96" cy="13" r="10" fill="#edc55d"/>`;
      break;
    case 'dragon':
      a=`<path d="M66 121Q7 151 27 88L73 103M65 104L24 46L63 56L78 34L92 96M134 99L165 39L178 87L149 116" fill="#b8cd80"/><path d="M67 93Q40 154 87 167L142 159Q161 135 140 93" fill="${c}"/><path d="M73 145L64 179L86 180L99 154M125 150L128 179L152 174L145 145" fill="${c}"/><path d="M66 88Q57 38 103 34Q148 32 151 69L170 84L155 106L105 114Z" fill="${c}"/>${E(111,64,.7)}<path d="M149 89L163 86" stroke-width="4"/>${smile(123,99,26)}<path d="M76 42L75 22L97 36M119 35L133 18L136 45" fill="#fff0d2"/><path d="M96 117L117 126L106 154L87 144Z" fill="#fff0d2"/>${[0,1,2,3].map(j=>`<circle cx="${171+j%2*10}" cy="${80-j*16}" r="4" fill="${COLORS[j]}" stroke="none"/>`).join('')}`;
      break;
    case 'bum':
      a=`<path d="M61 112Q28 101 35 133M137 106Q176 84 170 62" fill="none" stroke="#d78c76" stroke-width="8"/><path d="M64 150L58 178L41 178M121 151L129 176L148 172" fill="none" stroke="#d78c76" stroke-width="7"/><path d="M48 174Q32 177 36 184L65 183L64 174M127 172L128 182L154 178Q160 168 147 168" fill="#ed805f"/><path d="M53 82Q45 119 58 153Q92 166 138 144L135 85Z" fill="#f1b299"/><path d="M55 119Q93 137 139 116L137 149Q101 169 59 151Z" fill="#79aeb2"/><path d="M62 123L67 149M80 129L84 156M103 129L106 155M126 124L126 151" stroke="#e8ecce" stroke-width="4"/><path d="M54 81Q48 46 83 42Q131 40 141 76L139 107Q124 128 84 115Q55 110 54 81Z" fill="#f1b299"/><path d="M112 79Q153 68 154 85Q156 99 128 98" fill="#ed997b"/>${E(101,70,.7,v%3-1)}${smile(106,103,24)}<path d="M46 51Q69 34 123 43L118 28L65 24Z" fill="#ed805f"/><path d="M47 53Q87 40 132 53" stroke="#ed805f" stroke-width="11"/><path d="M75 27L91 32L87 42L70 39Z" fill="#edc55d"/><circle cx="64" cy="87" r="7" fill="#e98d87" stroke="none"/><path d="M168 61L172 53M168 62L162 52M171 64L180 61" stroke="#d78c76" stroke-width="4"/>`;
      break;
    case 'shmyak':
      a=`<path d="M76 145L72 176L53 179M120 146L124 177L143 180" fill="none" stroke="#d79a7f" stroke-width="7"/><path d="M52 172Q35 172 39 184L77 183L77 173M120 172L120 183L157 185Q165 173 143 172" fill="#8981bb"/><path d="M64 98Q37 102 28 82M136 103Q159 110 166 128" fill="none" stroke="#d79a7f" stroke-width="7"/><path d="M61 91L52 147Q94 159 144 144L136 90Z" fill="#a9c76c"/><path d="M90 98L100 148" fill="none" stroke="#dce8af" stroke-width="5"/><g fill="#edc55d"><circle cx="102" cy="114" r="3"/><circle cx="106" cy="131" r="3"/></g><path d="M66 82Q53 65 67 44Q99 28 129 49L137 77Q127 107 95 104Q76 101 66 82Z" fill="#edbaa0"/><path d="M80 73Q47 68 48 83Q49 97 82 88" fill="#e49c87"/>${E(103,65,.7,-v%2)}${smile(98,88,21)}<path d="M60 45L137 45L127 32L71 28Z" fill="#edc55d"/><ellipse cx="98" cy="46" rx="48" ry="7" fill="#edc55d"/><path d="M77 29L80 43L125 45L123 33Z" fill="#8981bb"/><path d="M28 82L20 76M29 84L19 88M166 128L170 136" stroke="#d79a7f" stroke-width="4"/><path d="M65 122L79 119L82 137L66 139Z" fill="#fff3d8"/>`;
      break;
    case 'butterfly':
      a=`<path d="M96 96Q47 18 23 55Q5 93 81 109Q13 98 27 142Q44 182 95 116M105 96Q153 18 177 55Q195 93 119 109Q187 98 173 142Q156 182 105 116" fill="${c}"/><path d="M87 88Q43 44 34 67M113 88Q157 44 166 67M80 122Q50 151 40 139M120 122Q150 151 160 139" fill="none" stroke="#fff7d8" stroke-width="10"/><path d="M98 78Q90 56 77 53M103 78Q111 53 124 50" fill="none"/><ellipse cx="100" cy="106" rx="11" ry="36" fill="#edc55d"/>${E(100,85,.49)}${smile(100,100,10)}<g fill="#ed805f" stroke="none"><circle cx="43" cy="94" r="7"/><circle cx="157" cy="94" r="7"/><circle cx="57" cy="136" r="6"/><circle cx="143" cy="136" r="6"/></g>`;
      break;
    case 'flower':
      a=`<path d="M101 92Q94 134 104 178" fill="none" stroke="#799953" stroke-width="8"/><path d="M98 145Q57 150 54 122Q85 113 98 145M101 159Q141 167 151 135Q120 126 101 159" fill="#a9c76c"/><g fill="${c}"><ellipse cx="100" cy="48" rx="19" ry="29"/><ellipse cx="100" cy="110" rx="19" ry="29"/><ellipse cx="68" cy="79" rx="29" ry="19"/><ellipse cx="132" cy="79" rx="29" ry="19"/><ellipse cx="78" cy="57" rx="18" ry="23" transform="rotate(-40 78 57)"/><ellipse cx="123" cy="101" rx="18" ry="23" transform="rotate(-40 123 101)"/></g><circle cx="100" cy="80" r="25" fill="#edc55d"/>${E(100,77,.42)}${smile(101,90,13)}`;
      break;
    case 'hat':
      a=`<g transform="rotate(${v%2?8:-7} 100 100)"><path d="M59 129L69 ${v%3===1?50:36}Q103 ${v%3===1?37:25} 134 ${v%3===1?54:43}L143 128Z" fill="${c}"/><path d="M65 101Q100 115 139 103L142 124Q99 137 61 121Z" fill="#edc55d"/><ellipse cx="100" cy="132" rx="75" ry="18" fill="${c}"/><path d="M83 64L109 60L115 82L88 86Z" fill="#fff5dc"/><path d="M88 65L109 81M107 63L91 83" stroke="#d1bd91"/><path d="M35 133Q101 146 161 133" stroke="#ffffff60" fill="none" stroke-width="4"/></g>`;
      break;
    case 'boat':
      a=`<path d="M25 124L178 126L147 159L55 161Z" fill="${c}"/><path d="M101 34L100 124" stroke="#8b7657" stroke-width="5"/><path d="M94 41L94 112L35 111Z" fill="#f4d579"/><path d="M107 57L107 115L158 115Z" fill="#fff8e7"/><path d="M100 37L127 43L101 51Z" fill="#ed805f"/><path d="M49 144L150 144" stroke="#ffffff70" stroke-width="6"/><path d="M24 171Q42 159 60 172T96 172T132 172T169 172" stroke="#79aeb2" stroke-width="5" fill="none"/>`;
      break;
    case 'tap':
      a=`<path d="M43 144L44 93Q45 72 73 71L112 71L112 54L139 54L139 75Q164 76 164 98L164 119L135 119L135 104L77 104L77 144Z" fill="#a1bfc2"/><path d="M34 143L84 143L84 157L34 157Z" fill="#79aeb2"/><path d="M124 53L124 32M99 33L149 33" stroke="${INK}" stroke-width="11"/><path d="M99 32L149 32" stroke="${c}" stroke-width="8"/><path d="M149 134Q128 159 149 173Q170 160 149 134Z" fill="#79b8ce" stroke="#658fa0"/><path d="M54 89L111 89" stroke="#ffffff80" stroke-width="5"/>`;
      break;
    case 'caterpillar':
      a=`<path d="M37 132L31 150M65 132L63 153M98 129L101 151M129 112L143 131" stroke="#768c49" stroke-width="6"/>${[0,1,2,3,4].map((n)=>`<circle cx="${39+n*26}" cy="${121-n*n*2}" r="23" fill="${n%2?c:'#b8cd80'}"/>`).join('')}<path d="M145 70L144 44M166 69L178 47" stroke="#768c49" stroke-width="4"/><circle cx="143" cy="43" r="6" fill="#edc55d"/><circle cx="179" cy="46" r="6" fill="#ed805f"/>${E(153,82,.63)}${smile(154,101,20)}<circle cx="28" cy="116" r="5" fill="#fff7d9" stroke="none"/>`;
      break;
    case 'leaf': a=leafShape(c);break;
    case 'dinosaur':
      a=`<path d="M45 124Q20 131 17 91Q45 116 61 94L89 74Q107 57 125 78L137 120Q125 141 99 140L72 139Z" fill="${c}"/><path d="M115 101Q110 62 128 42Q148 22 177 46L179 71Q172 86 147 80L141 118" fill="${c}"/><path d="M57 129L52 166L73 168L80 136M107 134L110 166L132 166L132 128" fill="${c}"/><path d="M36 111L44 95L55 105L61 87L73 94L82 73L94 78L104 61L117 75L125 55" fill="#edc55d"/>${E(154,53,.6)}${smile(160,72,18)}<g fill="#ffffff48" stroke="none"><circle cx="84" cy="108" r="9"/><circle cx="106" cy="118" r="7"/><circle cx="68" cy="122" r="5"/></g><path d="M50 168L75 169M108 168L134 168" stroke-width="5"/>`;
      break;
    case 'house':
      a=`<path d="M44 91L154 90L158 168L41 168Z" fill="${c}"/><path d="M27 94L100 29L174 94Z" fill="#ed805f"/><path d="M42 88L101 39L158 88" stroke="#fff0cb" stroke-width="5" fill="none"/><path d="M127 54L126 28L146 28L148 73" fill="#b49c7b"/><path d="M84 167L84 114Q102 102 119 115L120 167" fill="#edc55d"/><circle cx="110" cy="141" r="3" fill="${INK}"/><path d="M52 109L72 109L71 132L52 132Z" fill="#dce7d8"/><path d="M61 109L61 132M52 120L72 120"/><path d="M131 112L148 112L148 130L132 130Z" fill="#dce7d8"/><path d="M49 170L41 181M148 170L157 181" stroke-width="5"/>`;
      break;
    case 'food':
      if(v%4===0)a=`<ellipse cx="100" cy="142" rx="76" ry="24" fill="#f5f0df"/><ellipse cx="100" cy="135" rx="61" ry="18" fill="#dfd8c5"/><path d="M48 127Q38 67 100 54Q162 63 152 128Z" fill="#d69a4c"/><path d="M44 123Q95 102 156 121L153 139Q98 156 47 140Z" fill="#83a45c"/><path d="M55 99Q101 81 146 103" fill="none" stroke="#f3c76e" stroke-width="16"/><g stroke="#fff0bb" stroke-width="3"><path d="M71 77L77 82M94 66L99 73M117 73L119 80M136 86L141 92"/></g>`;
      else if(v%4===1)a=`<ellipse cx="100" cy="145" rx="72" ry="23" fill="#f5f0df"/><path d="M42 82Q100 110 159 81L150 137Q100 169 50 137Z" fill="${c}"/><ellipse cx="100" cy="82" rx="59" ry="22" fill="#efb46e"/><path d="M54 77Q100 60 146 80" stroke="#f4d98c" stroke-width="6" fill="none"/><g fill="#7fa565" stroke="none"><circle cx="76" cy="79" r="5"/><circle cx="111" cy="85" r="4"/><circle cx="133" cy="77" r="4"/></g><path d="M75 56Q63 42 77 29M103 55Q116 41 105 26M129 59Q142 44 132 34" fill="none" stroke="#b9aea0" stroke-width="3"/>`;
      else if(v%4===2)a=`<ellipse cx="100" cy="150" rx="72" ry="22" fill="#f5f0df"/><path d="M45 132L81 63L160 132Z" fill="#e8bd64"/><path d="M48 132L159 132L157 148L46 148Z" fill="#cd9861"/><path d="M58 115L146 115" stroke="#ed805f" stroke-width="8"/><g fill="#b95547" stroke="none"><circle cx="87" cy="93" r="9"/><circle cx="115" cy="112" r="9"/></g><g fill="#829b58" stroke="none"><path d="M71 117L82 105L90 116Z"/><path d="M105 89L115 95L105 104Z"/></g>`;
      else a=`<ellipse cx="100" cy="150" rx="72" ry="22" fill="#f5f0df"/><g fill="#edc55d"><path d="M64 135L57 58L72 55L82 132Z"/><path d="M84 135L82 39L98 40L102 135Z"/><path d="M107 134L114 51L130 55L125 137Z"/><path d="M128 137L145 70L159 75L145 141Z"/></g><path d="M56 103L150 105L139 155Q100 169 68 154Z" fill="${c}"/><path d="M71 117L139 119" stroke="#fff5dd" stroke-width="5"/>`;
      break;
    case 'spoon': a=`<g transform="rotate(25 100 100)"><ellipse cx="100" cy="57" rx="29" ry="39" fill="#a6b5ba"/><ellipse cx="98" cy="53" rx="18" ry="27" fill="#d5dedc" stroke="none"/><path d="M92 90L87 166Q99 181 111 166L106 90" fill="#a6b5ba"/><path d="M97 106L96 157" stroke="#e9eeee" stroke-width="4"/></g>`;break;
    case 'hedgehog':
      a=`<path d="M32 127L19 105L39 102L24 80L50 82L48 57L70 67L80 41L94 62L113 41L121 69L146 61L146 92L169 93L154 119Z" fill="#9a7e62"/><path d="M42 117Q60 74 111 88Q131 95 147 116L176 128L166 148L128 147Q76 171 42 145Z" fill="#edc5a2"/><ellipse cx="177" cy="127" rx="8" ry="7" fill="${INK}"/><path d="M58 150L54 167L74 165M112 152L118 167L137 164" fill="none" stroke="#8c705c" stroke-width="7"/>${E(138,115,.52)}${smile(146,135,16)}<g fill="${c}" stroke="none"><path d="M56 83L63 70L73 87Z"/><path d="M100 77L108 60L115 83Z"/></g>`;
      break;
    case 'comb':
      a=`<g transform="rotate(-20 100 100)"><path d="M30 65Q23 42 47 40L153 42Q177 43 171 68L159 128L148 127L150 75L141 75L137 126L125 125L128 74L119 74L115 124L103 124L106 74L97 73L92 123L80 122L84 72L75 72L69 121L57 120L62 72L51 71L43 119L31 117L39 69Z" fill="${c}"/><path d="M47 51L156 53" stroke="#fff4e3" stroke-width="5"/></g>`;
      break;
    case 'ball':
      a=`<circle cx="100" cy="100" r="69" fill="${c}"/><path d="M51 51Q132 71 145 153M49 150Q72 74 150 51" fill="none" stroke="#fff2d0" stroke-width="13"/><path d="M34 92Q104 115 166 94" fill="none" stroke="#edc55d" stroke-width="12"/><ellipse cx="77" cy="57" rx="16" ry="7" transform="rotate(-31 77 57)" fill="#ffffff75" stroke="none"/>`;
      break;
    case 'patch':
      a=`<g transform="rotate(${v%3*15-15} 100 100)">${v%3===0?`<path d="M43 45L156 40L161 152L46 161Z" fill="${c}"/>`:v%3===1?`<path d="M99 27L178 157L23 158Z" fill="${c}"/>`:`<path d="M99 28Q177 29 173 103Q173 169 100 173Q25 175 27 103Q21 30 99 28Z" fill="${c}"/>`}<path d="M57 60L142 57L145 140L59 146Z" fill="none" stroke="#fff6df" stroke-width="3" stroke-dasharray="7 6"/><path d="M70 70L134 131M129 72L74 132" stroke="#ffffff28" stroke-width="10"/></g>`;
      break;
    case 'ant':
      a=`<g fill="none" stroke="#82705a" stroke-width="4"><path d="M92 107L48 97L31 112M90 115L48 126L42 148M102 119L90 153L73 165M115 107L151 88L168 99M118 116L155 119L173 138M117 126L139 150L158 150"/></g><ellipse cx="109" cy="129" rx="20" ry="28" fill="${c}"/><ellipse cx="101" cy="96" rx="20" ry="23" fill="#bc8e68"/><circle cx="100" cy="63" r="28" fill="#bc8e68"/><path d="M86 40L72 24M113 40L126 20" fill="none" stroke="#82705a" stroke-width="4"/>${E(99,60,.6)}${smile(100,77,18)}<path d="M78 145L134 147" stroke="#fff1d4" stroke-width="4"/>`;
      break;
    case 'clown':
      a=`<path d="M63 114L35 86L22 97M136 109L162 78L176 86M73 150L52 178L31 174M119 149L145 177L166 171" fill="none" stroke="#e4b298" stroke-width="8"/><path d="M65 102Q100 89 136 101L142 151Q95 174 57 149Z" fill="${c}"/><g fill="#edc55d" stroke="none"><circle cx="81" cy="119" r="8"/><circle cx="118" cy="139" r="8"/><circle cx="77" cy="146" r="5"/></g><circle cx="100" cy="73" r="36" fill="#fff3df"/><g fill="#ed805f"><circle cx="63" cy="72" r="15"/><circle cx="137" cy="71" r="15"/></g>${E(100,65,.62)}<circle cx="100" cy="80" r="11" fill="#ed805f"/><path d="M77 91Q101 118 125 89Q99 104 77 91Z" fill="#b65258"/><path d="M73 43L104 17L128 45Z" fill="#a9c76c"/><circle cx="105" cy="18" r="7" fill="#edc55d"/><path d="M30 174L23 184L55 184L58 174M141 174L143 184L174 181L169 171" fill="#ed805f"/>`;
      break;
    case 'monster':
      a=`<path d="M48 148L45 173L66 174M138 148L150 170L169 168M46 107L22 98L17 114M151 101L176 90L182 101" fill="none" stroke="#8472ac" stroke-width="7"/><path d="M39 151L44 56L74 81L99 39L126 80L157 48L160 151Q100 180 39 151Z" fill="${c}"/><path d="M55 72L65 82L56 93M139 67L133 82L146 91" fill="#edc55d"/>${v%3===0?E(99,105,.9):v%3===1?'<ellipse cx="100" cy="100" rx="28" ry="31" fill="#fffaf0"/><ellipse cx="104" cy="106" rx="9" ry="13" fill="#38343e"/>':E(99,106,.75,2)}<path d="M72 136Q102 ${v%2?115:164} 133 134" fill="${v%2?'none':'#674b78'}" stroke-width="3"/>${v%2?'':'<path d="M81 141L86 151L92 143M113 143L120 151L124 140" fill="#fff8e3" stroke="none"/>'}<g fill="#ffffff3f" stroke="none"><circle cx="55" cy="122" r="7"/><circle cx="143" cy="123" r="7"/><circle cx="117" cy="71" r="4"/></g>`;
      break;
    case 'sock': a=sockShape(c,v);break;
    case 'dandelion':
      a=`<path d="M99 104Q97 146 101 178" fill="none" stroke="#869a55" stroke-width="6"/><path d="M98 158L70 137L52 145L73 162L55 169L97 171M101 146L133 128L146 140L128 148L145 159L105 159" fill="#a9c76c"/><g stroke="#c4bba4" fill="#fffdf2">${Array.from({length:12},(_,i)=>{const t=i*Math.PI/6;const x=100+Math.cos(t)*47,y=75+Math.sin(t)*47;return `<path d="M100 75L${x} ${y}"/><circle cx="${x}" cy="${y}" r="11"/>`;}).join('')}</g><circle cx="100" cy="75" r="11" fill="#d6bd83"/>`;
      break;
    case 'button':
      a=`<path d="M98 28Q173 28 172 100Q172 175 98 172Q23 174 27 100Q25 27 98 28Z" fill="${c}"/><circle cx="100" cy="100" r="54" fill="none" stroke="#fff5df" stroke-width="4"/><g fill="#f6f0e0"><circle cx="84" cy="84" r="9"/><circle cx="117" cy="84" r="9"/><circle cx="84" cy="116" r="9"/><circle cx="117" cy="116" r="9"/></g><path d="M84 84L117 116M117 84L84 116" stroke="#d3b67d" stroke-width="4"/>`;
      break;
    case 'bucket':
      a=`<path d="M44 73Q40 21 99 22Q160 23 156 73" fill="none" stroke="#8c806c" stroke-width="8"/><path d="M37 76L163 76L150 159Q100 181 52 158Z" fill="${c}"/><ellipse cx="100" cy="76" rx="63" ry="18" fill="#fff3d7"/><ellipse cx="100" cy="77" rx="53" ry="11" fill="${c}"/><path d="M58 99L66 149" stroke="#ffffff60" stroke-width="9"/><path d="M81 130Q99 114 119 131Q100 150 81 130Z" fill="#ffffff40" stroke="none"/>`;
      break;
    case 'elephant':
      a=`<path d="M40 123Q21 96 39 69Q62 41 104 55Q143 57 151 91L155 144L135 166L114 165L111 139L91 142L88 166L65 165L62 138Z" fill="${c}"/><path d="M128 75Q170 61 170 100L169 131Q171 155 183 142Q190 161 174 169Q147 179 145 141L143 112" fill="${c}"/><ellipse cx="119" cy="96" rx="30" ry="39" fill="#c4b5d6"/><path d="M112 68Q92 86 110 125" fill="none" stroke="#ffffff50" stroke-width="4"/><path d="M36 92Q15 86 21 65" fill="none" stroke-width="5"/>${E(151,84,.45)}<path d="M153 117L171 107L169 127Z" fill="#fff1c9"/><path d="M75 166L86 166M118 166L133 166" stroke="#fff1c9" stroke-width="4"/>`;
      break;
    case 'footprint':
      // Distinct silhouettes make the spoor comparison readable even at 42 px.
      if(v%4===1) a=`<path d="M100 36Q162 34 166 100Q170 169 105 174Q37 177 34 112Q30 44 100 36Z" fill="${c}"/><g fill="#fff8e9" stroke-width="2.4"><path d="M49 83Q45 57 66 54Q84 54 81 78Z"/><path d="M86 71Q83 44 103 44Q124 45 120 72Z"/><path d="M127 79Q123 54 141 58Q160 63 154 88Z"/></g>`;
      else if(v%4===2) a=`<path d="M100 173L78 141L27 92L38 55L77 94L99 29L121 94L162 55L174 92L123 141Z" fill="${c}"/><path d="M100 145L100 66M99 127L52 79M101 127L149 79" fill="none" stroke="#fff8e980" stroke-width="5"/>`;
      else if(v%4===3) a=`<g fill="${c}"><path d="M100 99Q81 99 70 118Q44 132 53 153Q59 170 79 164Q101 154 122 164Q145 171 151 151Q155 132 133 118Q121 97 100 99Z"/><ellipse cx="45" cy="91" rx="16" ry="22" transform="rotate(-28 45 91)"/><ellipse cx="80" cy="61" rx="17" ry="24" transform="rotate(-10 80 61)"/><ellipse cx="120" cy="61" rx="17" ry="24" transform="rotate(10 120 61)"/><ellipse cx="155" cy="91" rx="16" ry="22" transform="rotate(28 155 91)"/></g>`;
      else a=`<path d="M100 158L100 35M100 137L38 69M100 137L163 69" fill="none" stroke="${c}" stroke-width="12"/><path d="M100 158L100 35M100 137L38 69M100 137L163 69" fill="none" stroke="${INK}" stroke-width="1.7"/>`;
      break;
    case 'cake':
      a=`<ellipse cx="100" cy="166" rx="81" ry="19" fill="#e4dcd0"/><path d="M35 88L166 86L166 151Q101 182 35 153Z" fill="${c}"/><path d="M36 123Q101 145 165 122" fill="none" stroke="#fff2d5" stroke-width="14"/><ellipse cx="100" cy="88" rx="65" ry="27" fill="#fff2d5"/><path d="M38 89Q49 113 61 92Q74 119 85 95Q98 116 109 94Q125 117 136 91Q151 112 163 88" fill="#fff2d5" stroke="#e8dbc1"/><path d="M66 74L66 42M102 69L102 34M137 74L137 42" stroke="#a9c76c" stroke-width="10"/><g fill="#edc55d"><path d="M66 37Q49 23 67 13Q82 28 66 37Z"/><path d="M102 28Q87 15 103 6Q118 20 102 28Z"/><path d="M137 36Q121 22 139 13Q153 26 137 36Z"/></g>`;
      break;
    case 'snail':
      a=`<path d="M26 148Q25 132 47 133L127 130L139 89Q146 71 159 81L171 126Q188 148 159 163L50 164Q30 164 26 148Z" fill="#b7ce84"/><circle cx="83" cy="112" r="48" fill="${c}"/><path d="M83 148Q37 139 50 104Q58 76 89 83Q116 87 113 112Q112 134 88 131Q67 129 74 111Q79 103 90 110" fill="none" stroke="#f8e8bd" stroke-width="7"/><path d="M146 88L137 60M161 87L174 60" stroke="#839a54" stroke-width="5"/><circle cx="137" cy="57" r="9" fill="#fff8e5"/><circle cx="175" cy="56" r="9" fill="#fff8e5"/><circle cx="139" cy="58" r="3" fill="${INK}"/><circle cx="176" cy="57" r="3" fill="${INK}"/>${smile(157,113,18)}`;
      break;
    case 'owl':
      a=`<path d="M52 65L48 29L82 48Q103 36 127 48L154 27L151 67Q172 121 144 154Q102 179 58 152Q30 117 52 65Z" fill="${c}"/><path d="M54 94Q27 110 49 146L65 126M148 92Q178 110 153 146L137 128" fill="#a9c76c"/><ellipse cx="80" cy="79" rx="27" ry="32" fill="#fff4d4"/><ellipse cx="123" cy="77" rx="27" ry="32" fill="#fff4d4"/><ellipse cx="85" cy="82" rx="10" ry="16" fill="${INK}"/><ellipse cx="118" cy="80" rx="10" ry="16" fill="${INK}"/><path d="M91 104L112 103L102 119Z" fill="#edc55d"/><g stroke="#f6e9c6" stroke-width="4"><path d="M80 127L85 135L91 126M104 134L111 143L117 132M119 119L126 127L132 118"/></g><path d="M79 160L75 175M82 169L68 174M83 168L90 174M124 160L129 175M126 169L139 174M126 169L118 175" fill="none" stroke="#c19855" stroke-width="4"/>`;
      break;
    case 'flashlight':
      a=`<g transform="rotate(-33 100 100)"><path d="M73 75L126 75L120 171Q101 183 81 171Z" fill="${c}"/><path d="M58 36L141 36L126 81L73 81Z" fill="#edc55d"/><ellipse cx="100" cy="37" rx="41" ry="13" fill="#fff1a7"/><path d="M87 93L85 158" stroke="#ffffff65" stroke-width="7"/><path d="M101 105L114 105L114 128L100 128Z" fill="#a1ac9f"/></g>`;
      break;
    case 'cat':
      a=`<path d="M56 139Q12 137 22 103Q30 80 43 97Q28 110 48 119" fill="none" stroke="${c}" stroke-width="15"/><path d="M59 119Q64 88 105 94Q140 96 146 142L144 163L58 163Z" fill="${c}"/><path d="M69 84L58 37L92 55L123 54L150 35L145 87Q133 111 101 111Q77 108 69 84Z" fill="${c}"/><path d="M68 52L82 63L71 70M131 62L141 51L140 72" fill="#e8b0a8" stroke="none"/>${E(106,77,.68)}<path d="M99 92L111 92L105 99Z" fill="#d88485"/><path d="M105 99Q95 110 87 102M105 99Q115 109 124 101M82 92L51 85M81 98L49 100M129 91L163 83M129 98L166 99" fill="none" stroke-width="1.6"/><path d="M73 147L74 167M126 146L128 167" stroke="#fff4d8" stroke-width="6"/>`;
      break;
    case 'tail':
      a=`<path d="M65 171Q152 137 124 105Q84 66 129 36Q146 24 163 38" fill="none" stroke="${INK}" stroke-width="27"/><path d="M65 171Q152 137 124 105Q84 66 129 36Q146 24 163 38" fill="none" stroke="${c}" stroke-width="23"/><path d="M81 163L96 151M118 136L132 126M116 102L130 92M108 70L127 70M125 43L137 54" stroke="#fff1ca" stroke-width="10"/>`;
      break;
    case 'chicken':
      a=`<path d="M52 111L28 83L34 122L20 112L33 146L59 150Q73 178 113 163Q152 160 154 124L151 83Q144 56 122 68Q101 75 109 100Z" fill="#fff7e4"/><path d="M126 70Q111 54 121 47Q127 43 132 53Q136 38 144 44Q154 49 145 60Q163 57 162 67L150 78" fill="#ed805f"/><path d="M151 89L178 101L152 111Z" fill="#edc55d"/><circle cx="138" cy="86" r="5" fill="${INK}"/><path d="M139 110Q133 130 145 134Q157 132 152 111" fill="#ed805f"/><path d="M101 115Q70 100 69 126Q77 147 105 130" fill="none" stroke="#c6b998" stroke-width="3"/><path d="M79 163L76 182M76 180L64 184M76 181L88 183M117 163L121 181M121 181L109 184M121 181L133 183" stroke="#c69a55" stroke-width="4" fill="none"/>`;
      break;
    case 'chick':
      a=`<path d="M45 134L26 111L30 142L50 152" fill="#e7bd57"/><path d="M49 118Q40 85 72 79Q63 40 103 36Q143 34 146 77Q163 117 145 146Q116 174 76 158Q51 151 49 118Z" fill="#edcf68"/><path d="M140 66L168 78L143 89Z" fill="#ed805f"/><circle cx="127" cy="61" r="5" fill="${INK}"/><circle cx="129" cy="59" r="1.7" fill="white" stroke="none"/><path d="M96 107Q72 95 70 118Q73 137 100 122" fill="${c}" stroke="#be9e50"/><path d="M84 159L82 178M82 178L69 180M82 178L91 182M123 156L127 176M127 176L116 182M127 176L139 180" stroke="#bb8b47" stroke-width="4" fill="none"/><path d="M85 41L82 29M96 36L98 24" stroke="#d0b452" stroke-width="4"/>`;
      break;
    case 'clock':
      a=`<path d="M60 161L49 180M140 161L151 180" stroke="${INK}" stroke-width="8"/><circle cx="100" cy="103" r="69" fill="${c}"/><circle cx="100" cy="103" r="56" fill="#fff8e8"/><path d="M61 38Q34 22 24 48L45 63M139 38Q168 20 178 48L156 63" fill="#edc55d"/><path d="M100 34L100 23" stroke-width="6"/><g stroke="#a28e73" stroke-width="3">${Array.from({length:12},(_,i)=>{const t=i*Math.PI/6;return `<path d="M${100+Math.sin(t)*45} ${103-Math.cos(t)*45}L${100+Math.sin(t)*50} ${103-Math.cos(t)*50}"/>`;}).join('')}</g><path d="M100 103L100 67M100 103L126 117" stroke="#5e6269" stroke-width="6"/><circle cx="100" cy="103" r="6" fill="#ed805f"/>`;
      break;
    case 'pillow':
      a=`<path d="M35 59Q71 43 100 52Q136 42 165 57Q155 100 166 145Q130 159 98 149Q62 161 34 145Q47 101 35 59Z" fill="${c}"/><path d="M48 70Q74 58 100 65Q130 57 152 69Q144 100 153 134Q124 146 98 137Q70 148 48 135Q58 102 48 70Z" fill="none" stroke="#fff1d8" stroke-width="3" stroke-dasharray="5 5"/><path d="M62 83Q67 70 82 73M132 120Q147 123 139 136" fill="none" stroke="#ffffff60" stroke-width="5"/>${E(102,96,.7)}${smile(105,116,23)}`;
      break;
    case 'cheese':
      a=`<path d="M31 111L126 38L171 69L170 143L31 164Z" fill="#edc55d"/><path d="M31 111L171 69L170 143L31 164Z" fill="#edcf72"/><path d="M126 38L171 69L31 111Z" fill="#f2db91"/><g fill="#d7a447" stroke="#c9953f"><ellipse cx="68" cy="131" rx="12" ry="15"/><ellipse cx="119" cy="112" rx="10" ry="13"/><path d="M170 112Q146 105 149 122Q151 135 170 132Z"/><ellipse cx="117" cy="69" rx="14" ry="6" transform="rotate(-17 117 69)"/><ellipse cx="62" cy="100" rx="9" ry="5" transform="rotate(-17 62 100)"/></g>`;
      break;
    case 'mouse':
      a=`<path d="M134 134Q187 103 179 151Q173 170 153 160" fill="none" stroke="#cf9da6" stroke-width="7"/><path d="M46 134Q51 91 96 99Q137 95 153 145Q125 172 78 158L52 150Z" fill="${c}"/><circle cx="70" cy="91" r="31" fill="${c}"/><circle cx="70" cy="91" r="20" fill="#e8b9ba"/><path d="M56 105Q92 90 110 113L100 142L29 145Q21 131 56 105Z" fill="${c}"/><circle cx="30" cy="137" r="8" fill="#d794a0"/><circle cx="66" cy="119" r="5" fill="${INK}"/><path d="M48 135L13 126M47 141L10 143M86 155L83 170L100 169M129 155L136 168L149 164" fill="none" stroke-width="2.3"/>`;
      break;
    case 'mountain':
      a=`<path d="M16 166L76 35Q87 20 98 41L119 86L138 56Q149 43 158 66L187 166Z" fill="${c}"/><path d="M62 66L76 35Q87 20 98 41L111 70L98 64L88 78L77 62Z" fill="#fff6df"/><path d="M129 78L139 57Q149 43 158 66L166 89L151 80L142 90Z" fill="#e7ecd1"/><path d="M83 141Q81 113 103 113Q129 117 127 143Z" fill="#696276"/><path d="M30 165L175 165" stroke="#7b886a" stroke-width="5"/>${E(78,91,.47)}${smile(78,107,14)}`;
      break;
    case 'top':
      a=`<path d="M89 50L89 28Q100 19 111 28L111 50" fill="#edc55d"/><path d="M32 107Q44 57 99 49Q157 59 171 107Q146 143 101 166Q55 143 32 107Z" fill="${c}"/><path d="M39 88Q102 119 165 88L171 107Q101 145 32 107Z" fill="#edc55d"/><path d="M57 65Q100 84 144 66" fill="none" stroke="#fff3d1" stroke-width="8"/><path d="M95 164L101 182L108 162" fill="#8c7665"/><ellipse cx="101" cy="52" rx="22" ry="5" fill="#ffffff50" stroke="none"/><path d="M19 126Q10 106 23 87M179 85Q194 106 180 126" fill="none" stroke="#ac9cc9" stroke-width="3"/>`;
      break;
    case 'apple':
      a=`<path d="M99 56Q58 28 36 65Q13 106 52 157Q71 180 99 164Q129 182 151 152Q187 102 160 65Q141 35 99 56Z" fill="${c}"/><path d="M100 56Q89 31 106 19" fill="none" stroke="#947254" stroke-width="8"/><path d="M107 40Q119 10 151 25Q145 53 107 40Z" fill="#a9c76c"/><path d="M57 74Q42 94 50 114" stroke="#ffffff65" stroke-width="10" fill="none"/>${E(102,105,.75)}${smile(105,131,25)}`;
      break;
    case 'tree':
      a=`<path d="M89 90L83 177L113 177L109 86Z" fill="#a2815e"/><path d="M92 129L68 109M106 113L130 92" stroke="#a2815e" stroke-width="10"/><path d="M56 111Q21 105 29 75Q22 45 55 40Q62 10 91 27Q111 4 134 28Q169 23 169 57Q196 76 173 101Q153 126 127 111Q88 130 56 111Z" fill="${c}"/><path d="M47 63Q61 51 72 57M122 39Q137 32 146 45M140 95Q154 98 163 87" stroke="#ffffff45" stroke-width="5" fill="none"/>`;
      break;
    case 'chair':
      a=`<path d="M54 97L52 29Q100 12 146 31L144 97" fill="${c}"/><path d="M65 46L133 47M65 69L133 71" stroke="#fff4d8" stroke-width="5"/><path d="M42 102L155 100L164 125L38 127Z" fill="#edc55d"/><path d="M49 125L40 176M149 124L159 177M71 125L73 159M126 125L123 159" stroke="#a28869" stroke-width="10"/><path d="M45 157L154 157" stroke="#a28869" stroke-width="6"/>`;
      break;
    case 'cloud':
      a=`<path d="M40 136Q12 126 25 102Q14 72 47 66Q53 35 83 47Q111 24 134 51Q172 39 174 75Q199 92 180 117Q176 142 147 139Z" fill="${c}"/>${E(102,91,.73,v%3-1)}${smile(106,115,27)}<path d="M42 88Q38 75 54 76M138 64Q150 57 159 70" stroke="#ffffff7f" stroke-width="6" fill="none"/>`;
      break;
    case 'star':
    default:
      a=`<path d="M99 22L120 70L173 76L135 113L144 168L99 143L52 168L62 114L24 76L78 69Z" fill="${c}"/>${E(100,94,.65)}${smile(102,115,22)}<path d="M88 56L97 38L106 60" stroke="#ffffff70" stroke-width="5" fill="none"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200"><g stroke="${INK}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${a}</g></svg>`;
}
