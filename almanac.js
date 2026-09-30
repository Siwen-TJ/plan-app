/* 万年历黄历算法 1901-2100
 * 依赖 lunar.js 的 GAN/ZHI/TERM_DAYS（经典脚本共享全局）
 * 提供 window.getAlmanac(y,m,d)：干支、纳音、冲煞、建除值星、宜忌、吉凶神
 */
(function () {
  const NAYIN = [
    '海中金', '海中金', '炉中火', '炉中火', '大林木', '大林木', '路旁土', '路旁土', '剑锋金', '剑锋金',
    '山头火', '山头火', '涧下水', '涧下水', '城头土', '城头土', '白蜡金', '白蜡金', '杨柳木', '杨柳木',
    '泉中水', '泉中水', '屋上土', '屋上土', '霹雳火', '霹雳火', '松柏木', '松柏木', '长流水', '长流水',
    '沙中金', '沙中金', '山下火', '山下火', '平地木', '平地木', '壁上土', '壁上土', '金箔金', '金箔金',
    '覆灯火', '覆灯火', '天河水', '天河水', '大驿土', '大驿土', '钗钏金', '钗钏金', '桑柘木', '桑柘木',
    '大溪水', '大溪水', '沙中土', '沙中土', '天上火', '天上火', '石榴木', '石榴木', '大海水', '大海水'
  ];
  // 六冲：子↔午 丑↔未 寅↔申 卯↔酉 辰↔戌 巳↔亥
  const CHONG = [6, 7, 8, 9, 10, 11, 0, 1, 2, 3, 4, 5];
  // 三合局煞方：申子辰煞南 寅午戌煞北 巳酉丑煞东 亥卯未煞西
  const SHA = { 0: '南', 4: '南', 8: '南', 2: '北', 6: '北', 10: '北', 1: '东', 5: '东', 9: '东', 3: '西', 7: '西', 11: '西' };
  // 建除十二神（以月建起建，日支顺数）
  const STARS = [
    { name: '建', yellow: false, yi: ['祈福', '上任', '出行', '赴任', '会亲友'], ji: ['动土', '开仓', '破土'], js: '月恩、王日', xs: '土府、小时' },
    { name: '除', yellow: true, yi: ['祭祀', '解除', '沐浴', '扫舍', '求医', '治病'], ji: ['嫁娶', '出行', '安葬'], js: '吉期、守日', xs: '月害' },
    { name: '满', yellow: false, yi: ['祭祀', '祈福', '进人口', '捕捉'], ji: ['服药', '针灸', '动土', '安葬'], js: '天富、禄仓', xs: '大耗、五虚' },
    { name: '平', yellow: false, yi: ['修造', '动土', '平整道路'], ji: ['祭祀', '祈福', '求医疗病', '开市'], js: '月德合', xs: '月刑、五墓' },
    { name: '定', yellow: true, yi: ['祭祀', '祈福', '冠笄', '嫁娶', '纳采'], ji: ['出行', '词讼', '争斗'], js: '三合、临日', xs: '死气' },
    { name: '执', yellow: true, yi: ['捕捉', '畋猎', '祭祀', '祈福', '订盟'], ji: ['开市', '移徙', '出行'], js: '天德、玉堂', xs: '小耗' },
    { name: '破', yellow: false, yi: ['求医', '破屋', '坏垣'], ji: ['嫁娶', '开市', '出行', '签约', '祈福'], js: '解神', xs: '月破、大耗' },
    { name: '危', yellow: true, yi: ['祭祀', '祈福', '安床', '入殓'], ji: ['登山', '乘船', '出行', '登高'], js: '阴德、明堂', xs: '四击' },
    { name: '成', yellow: true, yi: ['祭祀', '祈福', '开市', '入学', '结婚', '移徙'], ji: ['词讼', '争斗'], js: '天医、天喜', xs: '天火' },
    { name: '收', yellow: false, yi: ['祭祀', '纳财', '捕捉', '收敛'], ji: ['出行', '安葬', '启攒'], js: '母仓、金堂', xs: '劫煞' },
    { name: '开', yellow: true, yi: ['祭祀', '祈福', '开市', '动土', '结婚', '搬家', '赴任'], ji: ['安葬', '伐木'], js: '天马、生气', xs: '时阳' },
    { name: '闭', yellow: false, yi: ['筑堤', '补垣', '安葬', '塞穴'], ji: ['开市', '出行', '嫁娶', '针灸'], js: '圣心', xs: '血支' }
  ];
  // 十二节令与月支：[节气在 TERMS 中的序号, 对应月支索引]（子=0）
  const JIE = [[0, 1], [2, 2], [4, 3], [6, 4], [8, 5], [10, 6], [12, 7], [14, 8], [16, 9], [18, 10], [20, 11], [22, 0]];

  function termDay(y, idx) {
    if (y < 1900 || y > 2100) return null;
    return parseInt(TERM_DAYS[y - 1900].charAt(idx), 36) + 1;
  }

  // 年柱以立春为界
  function yearPillar(y, m, d) {
    const lichun = termDay(y, 2); // 立春，2月
    let yy = (m > 2 || (m === 2 && d >= lichun)) ? y : y - 1;
    return (yy - 4) % 60;
  }

  // 月柱：取最近一个已过的节令
  function monthPillar(y, m, d, yearIdx) {
    let best = null; // {date, branch}
    for (let yy = y - 1; yy <= y; yy++) {
      for (const [ti, br] of JIE) {
        const mm = Math.floor(ti / 2) + 1;
        const dd = termDay(yy, ti);
        if (dd === null) continue;
        const t = Date.UTC(yy, mm - 1, dd);
        const cur = Date.UTC(y, m - 1, d);
        if (t <= cur && (best === null || t > best.t)) best = { t, br, yy };
      }
    }
    const br = best.br;
    // 五虎遁：甲己丙寅起，乙庚戊寅，丙辛庚寅，丁壬壬寅，戊癸甲寅
    const yearGan = yearIdx % 10;
    const baseGan = [2, 4, 6, 8, 0, 2, 4, 6, 8, 0][yearGan];
    const gan = (baseGan + (br - 2 + 12) % 12) % 10;
    return { gan, zhi: br };
  }

  window.getAlmanac = function (y, m, d) {
    // 日柱：1900-01-01 为甲戌日（index 10）
    const diff = Math.floor((Date.UTC(y, m - 1, d) - Date.UTC(1900, 0, 1)) / 86400000);
    const dayIdx = ((10 + diff) % 60 + 60) % 60;
    const dGan = dayIdx % 10, dZhi = dayIdx % 12;

    const yIdx = yearPillar(y, m, d);
    const mp = monthPillar(y, m, d, yIdx);

    const chongZhi = CHONG[dZhi];
    const starIdx = (dZhi - mp.zhi + 12) % 12;
    const star = STARS[starIdx];

    return {
      gzYear: GAN[yIdx % 10] + ZHI[yIdx % 12],
      gzMonth: GAN[mp.gan] + ZHI[mp.zhi],
      gzDay: GAN[dGan] + ZHI[dZhi],
      animal: ANIMALS[yIdx % 12],
      nayin: NAYIN[dayIdx],
      chong: '冲' + ZHI[chongZhi] + '(' + ANIMALS[chongZhi] + ')',
      sha: '煞' + SHA[dZhi],
      star: star.name + '日',
      yellow: star.yellow,
      yi: star.yi,
      ji: star.ji,
      jishen: star.js,
      xiongshen: star.xs
    };
  };
})();
