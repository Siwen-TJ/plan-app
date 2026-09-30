// 农历万年历 1900-2100 —— 数据源：solarlunar v3.1.0（jjonline），已全量逐日校验
// 本文件由 gen-lunar.js 自动生成，请勿手改。
const LUNAR_INFO = [19416,19168,42352,21717,53856,55632,91476,22176,39632,21970,19168,42422,42192,53840,119381,46400,54944,44450,38320,84343,18800,42160,46261,27216,27968,109396,11104,38256,21234,18800,25958,54432,59984,28309,23248,11104,100067,37600,116951,51536,54432,120998,46416,22176,107956,9680,37584,53938,43344,46423,27808,46416,86869,19872,42416,83315,21168,43432,59728,27296,44710,43856,19296,43748,42352,21088,62051,55632,23383,22176,38608,19925,19152,42192,54484,53840,54616,46400,46752,103846,38320,18864,43380,42160,45690,27216,27968,44870,43872,38256,19189,18800,25776,29859,59984,27480,23232,43872,38613,37600,51552,55636,54432,55888,30034,22176,43959,9680,37584,51893,43344,46240,47780,44368,21977,19360,42416,86390,21168,43312,31060,27296,44368,23378,19296,42726,42208,53856,60005,54576,23200,30371,38608,19195,19152,42192,118966,53840,54560,56645,46496,22224,21938,18864,42359,42160,43600,111189,27936,44448,84835,37744,18936,18800,25776,92326,59984,27424,108228,43744,37600,53987,51552,54615,54432,55888,23893,22176,42704,21972,21200,43448,43344,46240,46758,44368,21920,43940,42416,21168,45683,26928,29495,27296,44368,84821,19296,42352,21732,53600,59752,54560,55968,92838,22224,19168,43476,42192,53584,62034,54560];
const TERM_DAYS = ["5j3i5k4j5k5l6m7m7m8n7m6l","5k3i5k4k5l5l7m7n7n8n7m7l","5k4i5k5k5l6l7n7n7n8n7m7m","5k4j6l5k6l6l7n8n8n8n7m7m","6k4j5k4j5k5l6m7m7m8n7m6l","5k3i5k4k5l5l7m7n7n8n7m7l","5k4i5k5k5l5l7n7n7n8n7m7m","5k4j6l5k6l6l7n8n8n8n7m7m","6k4j5k4j5k5l6m7m7m8n7m6l","5k3i5k4k5l5l7m7n7n8n7m7l","5k4i5k5k5l5l7n7n7n8n7m7m","5k4j6l5k6l6l7n8n8n8n7m7m","6k4j5k4j5k5l6m7m7m8n7m6l","5j3i5k4k5l5l7m7n7n8n7m7l","5k3i5k4k5l5l7n7n7n8n7m7m","5k4j5l5k5l6l7n7n8n8n7m7m","5k4j5k4j5k5l6m7m7m7n7l6l","5j3i5k4k5k5l7m7n7m8n7m6l","5k3i5k4k5l5l7n7n7n8n7m7l","5k4j5l5k5l6l7n7n8n8n7m7m","5k4j5k4j5k5l6m7m7m7n7l6l","5j3i5k4j5k5l7m7n7m8n7m6l","5k3i5k4k5l5l7n7n7n8n7m7l","5k4i5k5k5l6l7n7n8n8n7m7m","5k4j5k4j5k5l6m7m7m7n7l6l","5j3i5k4j5k5l7m7n7m8n7m6l","5k3i5k4k5l5l7m7n7n8n7m7l","5k4i5k5k5l6l7n7n7n8n7m7m","5k4j5k4j5k5k6m7m7m7m6l6l","5j3i5k4j5k5l6m7m7m8n7m6l","5k3i5k4k5l5l7m7n7n8n7m7l","5k4i5k5k5l6l7n7n7n8n7m7m","5k4j5k4j5k5k6m7m7m7m6l6l","5j3i5k4j5k5l6m7m7m8n7m6l","5k3i5k4k5l5l7m7n7n8n7m7l","5k4i5k5k5l5l7n7n7n8n7m7m","5k4j5k4j5k5k6m7m7m7m6l6l","5j3i5k4j5k5l6m7m7m8n7m6l","5k3i5k4k5l5l7m7n7n8n7m7l","5k4i5k5k5l5l7n7n7n8n7m7m","5k4j5k4j5k5k6m7m7m7m6l6l","5j3i5k4j5k5l6m7m7m8n7m6l","5k3i5k4k5l5l7m7n7n8n7m7l","5k4i5k5k5l5l7n7n7n8n7m7m","5k4j5k4j4k5k6m7m7m7m6l6l","5j3i5k4j5k5l6m7m7m7n7l6l","5j3i5k4k5l5l7m7n7m8n7m7l","5k3i5k4k5l5l7n7n7n8n7m7m","5k4j4k4j4k5k6m6m7m7m6l6l","4j3i5k4j5k5l6m7m7m7n7l6l","5j3i5k4j5k5l7m7n7m8n7m7l","5k3i5k4k5l5l7n7n7n8n7m7m","5k4j4k4j4k5k6m6m7m7m6l6l","4j3i5k4j5k5l6m7m7m7n7l6l","5j3i5k4j5k5l7m7n7m8n7m6l","5k3i5k4k5l5l7m7n7n8n7m7l","5k4j4j4j4k5k6m6m7m7m6l6l","4j3i5k4j5k5l6m7m7m7n7l6l","5j3i5k4j5k5l6m7m7m8n7m6l","5k3i5k4k5l5l7m7n7n8n7m7l","5k4i4j4j4k5k6m6m6m7m6l6l","4j3i5k4j5k5k6m7m7m7m6l6l","5j3i5k4j5k5l6m7m7m8n7m6l","5k3i5k4k5l5l7m7n7n8n7m7l","5k4i4j4j4k5k6m6m6m7m6l6l","4j3i5k4j5k5k6m7m7m7m6l6l","5j3i5k4j5k5l6m7m7m8n7m6l","5k3i5k4k5l5l7m7n7n8n7m7l","5k4i4j4j4k4k6m6m6m7m6l6l","4j3i5k4j5k5k6m7m7m7m6l6l","5j3i5k4j5k5l6m7m7m8n7m6l","5k3i5k4k5l5l7m7n7n8n7m7l","5k4i4j4j4k4k6m6m6m7m6l6l","4j3i5k4j4k5k6m7m7m7m6l6l","5j3i5k4j5k5l6m7m7m8n7m6l","5k3i5k4k5l5l7m7n7m8n7m7l","5k4i4j3j4k4k6m6m6m7m6l6l","4j3i5k4j4k5k6m6m7m7m6l6l","5j3i5k4j5k5l6m7m7m7n7m6l","5k3i5k4k5k5l7m7n7m8n7m7l","5k4i4j3j4k4k6m6m6m7m6l6l","4j3i5k4j4k5k6m6m7m7m6l6l","5j3i5k4j5k5l6m7m7m7n7l6l","5j3i5k4j5k5l7m7n7m8n7m7l","5k3i4j3j4k4k6l6m6m7m6l6l","4j3i4k4j4k5k6m6m7m7m6l6l","4j3i5k4j5k5l6m7m7m7n7l6l","5j3i5k4j5k5l6m7n7m8n7m6l","5k3i4j3j4k4k6l6m6m7m6l6k","4j3i4j4j4k5k6m6m6m7m6l6l","4j3i5k4j5k5k6m7m7m7n7l6l","5j3i5k4j5k5l6m7m7m8n7m6l","5k3i4j3j4k4k6l6m6m7m6l6k","4j3h4j4j4k5k6m6m6m7m6l6l","4j3i5k4j5k5k6m7m7m7m6l6l","5j3i5k4j5k5l6m7m7m8n7m6l","5k3i4j3j4k4k6l6m6m7m6l6k","4j3h4j4j4k4k6m6m6m7m6l6l","4j3i5k4j5k5k6m7m7m7m6l6l","5j3i5k4j5k5l6m7m7m8n7m6l","5k3i4j3j4k4k6l6m6m7m6l6k","4j3h4j4j4k4k6m6m6m7m6l6l","4j3i5k4j5k5k6m7m7m7m6l6l","5j3i5k4j5k5l6m7m7m8n7m6l","5k3i4j3j4k4k6l6m6m7m6l6k","4j3h4j4j4k4k6m6m6m7m6l6l","4j3i5k4j4k5k6m6m7m7m6l6l","5j3i5k4j5k5l6m7m7m8n7m6l","5k3i4j3j4k4k6l6m6l7m6l6k","4j3h4j3j4k4k6m6m6m7m6l6l","4j3i5k4j4k5k6m6m7m7m6l6l","5j3i5k4j5k5l6m7m7m7n7m6l","5k3i4j3j4j4k6l6m6l7m6l6k","4j3h4j3j4k4k6l6m6m7m6l6l","4j3i5k4j4k5k6m6m7m7m6l6l","5j3i5k4j5k5l6m7m7m7n7l6l","5j3i4j3i4j4k6l6m6l7m6l6k","4j2h4j3j4k4k6l6m6m7m6l6l","4j3i4k4j4k5k6m6m7m7m6l6l","4j3i5k4j5k5k6m7m7m7n7l6l","5j3i4j3i4j4k5l6l6l7m6l6k","4j2h4j3j4k4k6l6m6m7m6l6k","4j3i4j4j4k5k6m6m6m7m6l6l","4j3i5k4j5k5k6m7m7m7n7l6l","5j3i4j3i4j4k5l6l6l7m6l5k","4j2h4j3j4k4k6l6m6m7m6l6k","4j3h4j4j4k4k6m6m6m7m6l6l","4j3i5k4j5k5k6m7m7m7m6l6l","5j3i4j3i4j4k5l6l6l7m6l5k","4j2h4j3j4k4k6l6m6m7m6l6k","4j3h4j4j4k4k6m6m6m7m6l6l","4j3i5k4j5k5k6m7m7m7m6l6l","5j3i4j3i4j4k5l6l6l7m6l5k","4j2h4j3j4k4k6l6m6m7m6l6k","4j3h4j4j4k4k6m6m6m7m6l6l","4j3i5k4j4k5k6m6m7m7m6l6l","5j3i4j3i4j4k5l6l6l7m6l5k","4j2h4j3j4k4k6l6m6m7m6l6k","4j3h4j4j4k4k6m6m6m7m6l6l","4j3i5k4j4k5k6m6m7m7m6l6l","5j3i4j3i4j4k5l6l6l7m6l5k","4j2h4j3j4j4k6l6m6l7m6l6k","4j3h4j3j4k4k6m6m6m7m6l6l","4j3i5k4j4k5k6m6m7m7m6l6l","5j3i4j3i4j4k5l6l6l6m6l5k","4j2h4j3i4j4k6l6m6l7m6l6k","4j3h4j3j4k4k6l6m6m7m6l6l","4j3i5k4j4k5k6m6m7m7m6l6l","5j3i4j3i4j4j5l6l6l6m6k5k","4i2h4j3i4j4k5l6l6l7m6l6k","4j2h4j3j4k4k6l6m6m7m6l6l","4j3i4j4j4k5k6m6m6m7m6l6l","4j3i4j3i4j4j5l6l6l6m6k5k","4i2h4j3i4j4k5l6l6l7m6l6k","4j2h4j3j4k4k6l6m6m7m6l6l","4j3i4j4j4k4k6m6m6m7m6l6l","4j3i4j3i4j4j5l6l6l6m6k5k","4i2h4j3i4j4k5l6l6l7m6l5k","4j2h4j3j4k4k6l6m6m7m6l6k","4j3i4j4j4k4k6m6m6m7m6l6l","4j3i4j3i4j4j5l6l6l6l5k5k","4i2h4j3i4j4k5l6l6l7m6l5k","4j2h4j3j4k4k6l6m6m7m6l6k","4j3h4j4j4k4k6m6m6m7m6l6l","4j3i4j3i4j4j5l6l6l6l5k5k","4i2h4j3i4j4k5l6l6l7m6l5k","4j2h4j3j4k4k6l6m6m7m6l6k","4j3h4j4j4k4k6m6m6m7m6l6l","4j3i4j3i3j4j5l5l6l6l5k5k","4i2h4j3i4j4k5l6l6l7m6l5k","4j2h4j3j4j4k6l6m6l7m6l6k","4j3h4j4j4k4k6m6m6m7m6l6l","4j3i4j3i3j4j5l5l6l6l5k5k","4i2h4j3i4j4k5l6l6l6m6l5k","4j2h4j3j4j4k6l6m6l7m6l6k","4j3h4j3j4k4k6l6m6m7m6l6l","4j3i4j3i3j4j5l5l6l6l5k5k","4i2h4j3i4j4k5l6l6l6m6l5k","4j2h4j3i4j4k5l6m6l7m6l6k","4j3h4j3j4k4k6l6m6m7m6l6l","4j3i4j3i3j4j5l5l6l6l5k5k","4i2h4j3i4j4j5l6l6l6m6k5k","4j2h4j3i4j4k5l6l6l7m6l6k","4j2h4j3j4k4k6l6m6m7m6l6l","4j3i3i3i3j4j5l5l5l6l5k5k","3i2h4j3i4j4j5l6l6l6m6k5k","4i2h4j3i4j4k5l6l6l7m6l6k","4j2h4j3j4k4k6l6m6m7m6l6l","4j3i3i3i3j3j5l5l5l6l5k5k","3i2h4j3i4j4j5l6l6l6m6k5k","4i2h4j3i4j4k5l6l6l7m6l5k","4j2h4j3j4k4k6l6m6m7m6l6k","4j3i3i3i3j3j5l5l5l6l5k5k","3i2h4j3i4j4j5l6l6l6l5k5k","4i2h4j3i4j4k5l6l6l7m6l5k","4j2h4j3j4k4k6l6m6m7m6l6k","4j3h3i3i3j3j5l5l5l6l5k5k","3i2h4j3i4j4j5l5l6l6l5k5k","4i2h4j3i4j4k5l6l6l7m6l5k","4j2h4j3j4k4k6l6m6m7m6l6k","4j3h4j4j4k4k6m6m6m7m6l6l"];
const LUNAR_MS = ["正","二","三","四","五","六","七","八","九","十","冬","腊"];
const LUNAR_DS = ["初一","初二","初三","初四","初五","初六","初七","初八","初九","初十","十一","十二","十三","十四","十五","十六","十七","十八","十九","二十","廿一","廿二","廿三","廿四","廿五","廿六","廿七","廿八","廿九","三十"];
const GAN = ["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"];
const ZHI = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];
const ANIMALS = ["鼠","牛","虎","兔","龙","蛇","马","羊","猴","鸡","狗","猪"];
const TERMS = ["小寒","大寒","立春","雨水","惊蛰","春分","清明","谷雨","立夏","小满","芒种","夏至","小暑","大暑","立秋","处暑","白露","秋分","寒露","霜降","立冬","小雪","大雪","冬至"];

function lYearDays(y){let s=348;for(let i=0x8000;i>0x8;i>>=1)s+=(LUNAR_INFO[y-1900]&i)?1:0;return s+leapDays(y);}
function leapMonth(y){return LUNAR_INFO[y-1900]&0xf;}
function leapDays(y){return leapMonth(y)?((LUNAR_INFO[y-1900]&0x10000)?30:29):0;}
function monthDays(y,m){return (LUNAR_INFO[y-1900]&(0x10000>>m))?30:29;}
function solar2lunar(y,m,d){
  if(y<1901||y>2100)return null;
  let off=Math.floor((Date.UTC(y,m-1,d)-Date.UTC(1900,0,31))/86400000);
  if(off<0)return null;
  let gy=1900,days=0;
  for(gy=1900;gy<2101&&off>0;gy++){days=lYearDays(gy);off-=days;}
  if(off<0){off+=days;gy--;}
  const leap=leapMonth(gy);
  let isLeap=false,lm=1;
  for(lm=1;lm<13&&off>0;lm++){
    if(leap>0&&lm===leap+1&&!isLeap){--lm;isLeap=true;days=leapDays(gy);}
    else days=monthDays(gy,lm);
    if(isLeap&&lm===leap+1)isLeap=false;
    off-=days;
  }
  if(off===0&&leap>0&&lm===leap+1){if(isLeap)isLeap=false;else{isLeap=true;--lm;}}
  if(off<0){off+=days;--lm;}
  const gz=gy-4, leaped=(isLeap&&lm===leap);
  return {
    m:lm,d:off+1,leap:leaped,
    monthCn:(leaped?'闰':'')+LUNAR_MS[lm-1]+'月',
    dayCn:LUNAR_DS[off],
    gzYear:GAN[gz%10]+ZHI[gz%12],
    animal:ANIMALS[gz%12],
  };
}
// 返回 y年m月d日 的节气名（无则 ''）。n: 0-23 全年序号（小寒起）
function termName(y,m,d){
  if(y<1900||y>2100)return '';
  const row=TERM_DAYS[y-1900];
  const i1=(m-1)*2;
  if(parseInt(row[i1],36)+1===d)return TERMS[i1];
  if(parseInt(row[i1+1],36)+1===d)return TERMS[i1+1];
  return '';
}
