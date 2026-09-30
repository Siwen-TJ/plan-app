/* 重塑计划表 v1.0.0 —— 紫色多巴胺 · 万年历计划 */
'use strict';

/* ---------- 类别（多巴胺撞色） ---------- */
const CATS = {
  base:   { name: '起居', c: '#8B5CF6' },
  train:  { name: '训练', c: '#FF4D6D' },
  eat:    { name: '饮食', c: '#2FD7A5' },
  skin:   { name: '护肤', c: '#FF7AB6' },
  work:   { name: '工作', c: '#38B6FF' },
  read:   { name: '阅读', c: '#A78BFA' },
  rest:   { name: '休息', c: '#22C1DC' },
  stock:  { name: '囤货', c: '#FFC53D' },
  prep:   { name: '备餐', c: '#FF8A3D' },
  commute:{ name: '通勤', c: '#4DD4FA' },
  supp:   { name: '补剂', c: '#FF6B6B' },
};

/* ---------- 默认模板（源自一个月完整计划表作息骨架，可自由编辑） ---------- */
const DEF_TPL = [
  { t: '05:00', title: '起床 · 洗漱', cat: 'base' },
  { t: '05:15', title: '晨间护肤', cat: 'skin' },
  { t: '05:25', title: '晨间补剂 + 温水', cat: 'supp' },
  { t: '05:30', title: '出门通勤', cat: 'commute' },
  { t: '12:00', title: '午餐', cat: 'eat' },
  { t: '13:00', title: '午休 20 分钟', cat: 'rest' },
  { t: '18:30', title: '晚餐', cat: 'eat' },
  { t: '19:30', title: '训练', cat: 'train' },
  { t: '21:00', title: '阅读 30 分钟', cat: 'read' },
  { t: '21:40', title: '夜间护肤', cat: 'skin' },
  { t: '22:00', title: '睡觉', cat: 'base' },
];

/* ---------- 状态 ---------- */
const LS = 'plan-pwa.v1';
let store = { tpl: [], extra: {}, done: {}, wt: {} };
try {
  const raw = localStorage.getItem(LS);
  if (raw) { const o = JSON.parse(raw); if (o && typeof o === 'object') store = Object.assign(store, o); }
} catch (e) {}
if (!Array.isArray(store.tpl) || !store.tpl.length) {
  store.tpl = DEF_TPL.map((d, i) => Object.assign({ id: 't' + i }, d));
}
function save() { try { localStorage.setItem(LS, JSON.stringify(store)); } catch (e) { toast('保存失败'); } }

const pad2 = (x) => (x < 10 ? '0' : '') + x;
const iso = (y, m, d) => y + '-' + pad2(m) + '-' + pad2(d);
const todayISO = () => { const n = new Date(); return iso(n.getFullYear(), n.getMonth() + 1, n.getDate()); };

let selDate = todayISO();          // 日历选中的日期
let calY, calM;                    // 日历当前年月
{ const n = new Date(); calY = n.getFullYear(); calM = n.getMonth() + 1; }
let sheetCtx = null;               // 当前弹层上下文

/* ---------- 节日 ---------- */
const FEST_S = { '1-1': '元旦', '2-14': '情人节', '3-8': '妇女节', '3-12': '植树节', '4-1': '愚人节', '5-1': '劳动节', '5-4': '青年节', '6-1': '儿童节', '7-1': '建党节', '8-1': '建军节', '9-10': '教师节', '10-1': '国庆节', '12-24': '平安夜', '12-25': '圣诞节' };
const FEST_L = { '1-1': '春节', '1-15': '元宵', '2-2': '龙抬头', '5-5': '端午', '7-7': '七夕', '8-15': '中秋', '9-9': '重阳', '12-8': '腊八' };

/* 日期信息：农历 + 节日 + 节气 */
function dayInfo(y, m, d) {
  const lu = solar2lunar(y, m, d);
  let fest = FEST_S[m + '-' + d] || '';
  let lunarText = '';
  if (lu) {
    fest = fest || FEST_L[lu.m + '-' + lu.d] || '';
    // 除夕 = 次日为正月初一
    if (!fest) {
      const nd = new Date(Date.UTC(y, m - 1, d) + 86400000);
      const nx = solar2lunar(nd.getUTCFullYear(), nd.getUTCMonth() + 1, nd.getUTCDate());
      if (nx && nx.m === 1 && nx.d === 1) fest = '除夕';
    }
    lunarText = fest ? fest : (lu.d === 1 ? lu.monthCn : lu.dayCn);
    const term = termName(y, m, d);
    if (!fest && term) { lunarText = term; return { lu, fest, term, lunarText, isTerm: true }; }
    return { lu, fest, term: '', lunarText, isTerm: false };
  }
  return { lu: null, fest, term: '', lunarText: '', isTerm: false };
}
const WEEK = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

/* ---------- 任务模型 ---------- */
function tasksOf(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const arr = [];
  store.tpl.forEach((t) => arr.push({ kind: 'tpl', id: t.id, t: t.t, title: t.title, cat: t.cat }));
  const ex = store.extra[dateStr] || [];
  ex.forEach((t) => arr.push({ kind: 'ex', id: t.id, t: t.t, title: t.title, cat: t.cat }));
  arr.sort((a, b) => a.t.localeCompare(b.t));
  return arr;
}
function isDone(dateStr, kind, id) { return !!(store.done[dateStr] && store.done[dateStr][kind + ':' + id]); }
function setDone(dateStr, kind, id, v) {
  if (!store.done[dateStr]) store.done[dateStr] = {};
  if (v) store.done[dateStr][kind + ':' + id] = 1;
  else delete store.done[dateStr][kind + ':' + id];
  save();
}
function progressOf(dateStr) {
  const list = tasksOf(dateStr);
  const dn = list.filter((x) => isDone(dateStr, x.kind, x.id)).length;
  return { dn, total: list.length };
}

/* ---------- 渲染：今日 ---------- */
function renderToday() {
  const n = new Date();
  const ds = todayISO();
  const [y, m, d] = [n.getFullYear(), n.getMonth() + 1, n.getDate()];
  document.getElementById('tdDate').textContent = m + '月' + d + '日';
  document.getElementById('tdWeek').textContent = WEEK[n.getDay()];
  const info = dayInfo(y, m, d);
  const lunarEl = document.getElementById('tdLunar');
  const gzEl = document.getElementById('tdGz');
  if (info.lu) {
    lunarEl.textContent = '农历 ' + info.lu.monthCn + info.lu.dayCn + (info.fest ? ' · ' + info.fest : info.isTerm ? ' · ' + info.term : '');
    gzEl.textContent = info.lu.gzYear + '年 · ' + info.lu.animal;
  } else { lunarEl.textContent = ''; gzEl.textContent = ''; }
  renderTasks(document.getElementById('tdList'), ds);
  const p = progressOf(ds);
  document.getElementById('tdProgTxt').textContent = p.dn + ' / ' + p.total;
  document.getElementById('tdProgBar').style.width = (p.total ? Math.round(p.dn / p.total * 100) : 0) + '%';
}

/* ---------- 渲染：任务列表（复用） ---------- */
function renderTasks(container, dateStr) {
  container.innerHTML = '';
  const list = tasksOf(dateStr);
  if (!list.length) {
    const e = document.createElement('div');
    e.className = 'empty';
    e.innerHTML = '<b>🌱</b>这一天还没有任务<br>点右上角「＋ 添加」';
    container.appendChild(e);
    return;
  }
  list.forEach((task) => {
    const done = isDone(dateStr, task.kind, task.id);
    const el = document.createElement('div');
    el.className = 'task' + (done ? ' done' : '');
    el.style.setProperty('--cat', CATS[task.cat] ? CATS[task.cat].c : '#8B5CF6');

    const ck = document.createElement('div');
    ck.className = 'ck';
    ck.textContent = done ? '✓' : '';
    ck.addEventListener('click', () => {
      setDone(dateStr, task.kind, task.id, !done);
      refresh();
    });

    const bd = document.createElement('div');
    bd.className = 'bd';
    const tt = document.createElement('div');
    tt.className = 'tt';
    tt.textContent = task.title;
    const mt = document.createElement('div');
    mt.className = 'mt';
    const tm = document.createElement('span');
    tm.className = 'tm';
    tm.textContent = task.t || '全天';
    const cat = document.createElement('span');
    cat.className = 'cat';
    cat.textContent = CATS[task.cat] ? CATS[task.cat].name : '任务';
    mt.appendChild(tm); mt.appendChild(cat);
    bd.appendChild(tt); bd.appendChild(mt);

    const del = document.createElement('button');
    del.className = 'del';
    del.title = '删除';
    del.textContent = task.kind === 'ex' ? '🗑' : '';
    del.addEventListener('click', () => {
      if (task.kind === 'ex') {
        store.extra[dateStr] = (store.extra[dateStr] || []).filter((x) => x.id !== task.id);
        save(); refresh();
      }
    });
    if (task.kind !== 'ex') del.style.visibility = 'hidden';

    el.appendChild(ck); el.appendChild(bd); el.appendChild(del);
    container.appendChild(el);
  });
}

/* ---------- 渲染：日历（万年历） ---------- */
function renderCal() {
  document.getElementById('calTitle').textContent = calY + '年' + calM + '月';
  const grid = document.getElementById('calGrid');
  grid.innerHTML = '';
  const first = new Date(calY, calM - 1, 1).getDay();
  const dim = new Date(calY, calM, 0).getDate();     // 本月天数（含闰年）
  const prevDim = new Date(calY, calM - 1, 0).getDate();
  const tds = todayISO();

  for (let i = 0; i < 42; i++) {
    let yy = calY, mm = calM, dd, out = false;
    if (i < first) { dd = prevDim - first + 1 + i; mm--; out = true; }
    else if (i >= first + dim) { dd = i - first - dim + 1; mm++; out = true; }
    else dd = i - first + 1;
    if (mm < 1) { mm = 12; yy--; }
    if (mm > 12) { mm = 1; yy++; }
    const ds = iso(yy, mm, dd);
    const cell = document.createElement('div');
    cell.className = 'cell' + (out ? ' out' : '');
    const wd = new Date(yy, mm - 1, dd).getDay();
    if (wd === 0 || wd === 6) cell.classList.add('we');
    if (ds === tds) cell.classList.add('today');
    if (ds === selDate) cell.classList.add('sel');
    const info = dayInfo(yy, mm, dd);
    if (info.fest) cell.classList.add('fest');
    else if (info.isTerm) cell.classList.add('term');

    const dEl = document.createElement('span');
    dEl.className = 'd';
    dEl.textContent = dd;
    const sEl = document.createElement('span');
    sEl.className = 's';
    sEl.textContent = info.lunarText;
    cell.appendChild(dEl); cell.appendChild(sEl);
    cell.addEventListener('click', () => {
      selDate = ds;
      renderCal();
      renderDayPanel();
    });
    grid.appendChild(cell);
  }
}

/* ---------- 渲染：日历下的当日面板 ---------- */
function renderDayPanel() {
  const [y, m, d] = selDate.split('-').map(Number);
  const info = dayInfo(y, m, d);
  const wd = new Date(y, m - 1, d).getDay();
  document.getElementById('dpDate').textContent = m + '月' + d + '日 ' + WEEK[wd] + (selDate === todayISO() ? ' · 今天' : '');
  document.getElementById('dpLunar').textContent = info.lu ? (info.lu.monthCn + info.lu.dayCn + (info.fest ? ' · ' + info.fest : info.isTerm ? ' · ' + info.term : '') + ' · ' + info.lu.gzYear + '年') : '';
  renderTasks(document.getElementById('dpList'), selDate);
}

/* ---------- 渲染：模板 ---------- */
function renderTpl() {
  const box = document.getElementById('tplList');
  box.innerHTML = '';
  if (!store.tpl.length) {
    box.innerHTML = '<div class="empty"><b>📝</b>还没有模板任务</div>';
    return;
  }
  const sorted = store.tpl.slice().sort((a, b) => a.t.localeCompare(b.t));
  sorted.forEach((t) => {
    const el = document.createElement('div');
    el.className = 'task';
    el.style.setProperty('--cat', CATS[t.cat] ? CATS[t.cat].c : '#8B5CF6');
    el.innerHTML = '<div class="bd"><div class="tt"></div><div class="mt"><span class="tm"></span><span class="cat"></span></div></div>';
    el.querySelector('.tt').textContent = t.title;
    el.querySelector('.tm').textContent = t.t;
    el.querySelector('.cat').textContent = CATS[t.cat] ? CATS[t.cat].name : '任务';
    const edit = document.createElement('button');
    edit.className = 'del';
    edit.textContent = '✎';
    edit.addEventListener('click', () => openTaskSheet('tpl', null, t));
    const del = document.createElement('button');
    del.className = 'del';
    del.textContent = '🗑';
    del.addEventListener('click', () => {
      store.tpl = store.tpl.filter((x) => x.id !== t.id);
      save(); renderTpl(); toast('已删除');
    });
    el.appendChild(edit); el.appendChild(del);
    box.appendChild(el);
  });
}

/* ---------- 渲染：体重 ---------- */
function renderWt() {
  const chart = document.getElementById('wtChart');
  const kpis = document.getElementById('wtKpis');
  const dates = Object.keys(store.wt).sort();
  if (!dates.length) {
    chart.innerHTML = '<text x="160" y="62" text-anchor="middle" fill="#C9BEE8" font-size="13">暂无记录，输入体重开始追踪</text>';
    kpis.innerHTML = '';
    return;
  }
  const vals = dates.map((k) => store.wt[k]);
  const latest = vals[vals.length - 1], first = vals[0];
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  kpis.innerHTML =
    '<div><b>' + latest.toFixed(1) + '</b><span>最新 kg</span></div>' +
    '<div><b>' + avg.toFixed(1) + '</b><span>平均 kg</span></div>' +
    '<div><b style="color:' + (latest - first <= 0 ? '#2FD7A5' : '#FF4D6D') + '">' + (latest - first >= 0 ? '+' : '') + (latest - first).toFixed(1) + '</b><span>累计变化</span></div>';

  // 近 30 个点折线
  const N = 30;
  const pts = dates.slice(-N).map((k, i, a) => ({ k, v: store.wt[k], i, n: a.length }));
  let lo = Math.min.apply(null, pts.map((p) => p.v)) - 0.6;
  let hi = Math.max.apply(null, pts.map((p) => p.v)) + 0.6;
  if (hi - lo < 1) { lo -= 0.5; hi += 0.5; }
  const X = (i) => 8 + i * (304 / Math.max(pts.length - 1, 1));
  const Y = (v) => 108 - (v - lo) * (100 / (hi - lo));
  let svg = '<polyline fill="none" stroke="#7C3AED" stroke-width="2.5" stroke-linejoin="round" points="' +
    pts.map((p, i) => X(i).toFixed(1) + ',' + Y(p.v).toFixed(1)).join(' ') + '"/>';
  const last = pts[pts.length - 1];
  svg += '<circle cx="' + X(last.i).toFixed(1) + '" cy="' + Y(last.v).toFixed(1) + '" r="4" fill="#FF7AB6"/>';
  chart.innerHTML = svg;
}

/* ---------- 弹层 ---------- */
const mask = document.getElementById('mask');
const sheet = document.getElementById('sheet');
const sheetBody = document.getElementById('sheetBody');
function openSheet(title, bodyHTML) {
  document.getElementById('sheetTitle').textContent = title;
  sheetBody.innerHTML = bodyHTML;
  mask.classList.add('on');
  sheet.classList.add('on');
}
function closeSheet() {
  mask.classList.remove('on');
  sheet.classList.remove('on');
  sheetCtx = null;
}
mask.addEventListener('click', closeSheet);
document.getElementById('sheetCancel').addEventListener('click', closeSheet);

function catPickHTML(sel) {
  let h = '<div class="cat-pick">';
  Object.keys(CATS).forEach((k) => {
    h += '<button type="button" data-k="' + k + '" class="' + (k === sel ? 'on' : '') + '" style="' +
      (k === sel ? 'background:' + CATS[k].c : '') + '">' + CATS[k].name + '</button>';
  });
  return h + '</div>';
}
function wireCatPick(defaultKey) {
  let cur = defaultKey;
  sheetBody.querySelectorAll('.cat-pick button').forEach((b) => {
    b.addEventListener('click', () => {
      cur = b.dataset.k;
      sheetBody.querySelectorAll('.cat-pick button').forEach((x) => {
        const on = x === b;
        x.classList.toggle('on', on);
        x.style.background = on ? CATS[x.dataset.k].c : '';
      });
    });
  });
  return () => cur;
}

/* 添加/编辑任务弹层。scope: 'tpl'（模板）| 某日期字符串 */
function openTaskSheet(scope, dateStr, editItem) {
  const isTpl = scope === 'tpl';
  const isEdit = !!editItem;
  sheetCtx = { scope, dateStr, isEdit, item: editItem || { t: '08:00', title: '', cat: 'base' } };
  const it = sheetCtx.item;
  openSheet(
    (isEdit ? '编辑任务' : '添加任务') + (isTpl ? '' : '<span style="font-size:12px;color:var(--mut)">（' + dateStr.slice(5) + '）</span>'),
    '<fieldset><label>时间</label><input type="time" id="fT" value="' + (it.t || '08:00') + '"></fieldset>' +
    '<fieldset><label>内容</label><input type="text" id="fTitle" maxlength="40" placeholder="要做的事…" value="' + (it.title || '').replace(/"/g, '&quot;') + '"></fieldset>' +
    '<fieldset><label>类别</label>' + catPickHTML(it.cat) + '</fieldset>'
  );
  const getCat = wireCatPick(it.cat);
  document.getElementById('fTitle').focus();
  document.getElementById('sheetOk').onclick = () => {
    const t = document.getElementById('fT').value || '08:00';
    const title = document.getElementById('fTitle').value.trim();
    if (!title) { toast('请填写内容'); return; }
    const cat = getCat();
    if (isTpl) {
      if (isEdit) Object.assign(editItem, { t, title, cat });
      else store.tpl.push({ id: 't' + Date.now().toString(36), t, title, cat });
    } else {
      if (!store.extra[dateStr]) store.extra[dateStr] = [];
      if (isEdit) Object.assign(editItem, { t, title, cat });
      else store.extra[dateStr].push({ id: 'e' + Date.now().toString(36), t, title, cat });
    }
    save(); closeSheet(); refresh(); toast(isEdit ? '已保存' : '已添加');
  };
}

/* 体重弹层 */
function openWtSheet() {
  const n = new Date();
  const ds = todayISO();
  sheetCtx = { scope: 'wt' };
  openSheet('记录体重',
    '<fieldset><label>日期</label><input type="date" id="fD" value="' + ds + '" max="' + ds + '"></fieldset>' +
    '<fieldset><label>体重（kg）</label><input type="number" step="0.1" inputmode="decimal" id="fW" placeholder="如 65.5"></fieldset>'
  );
  document.getElementById('fW').focus();
  document.getElementById('sheetOk').onclick = () => {
    const d2 = document.getElementById('fD').value;
    const w = parseFloat(document.getElementById('fW').value);
    if (!d2 || !(w > 0 && w < 500)) { toast('请输入正确体重'); return; }
    store.wt[d2] = Math.round(w * 10) / 10;
    save(); closeSheet(); renderWt(); toast('已记录');
  };
}

/* ---------- Toast ---------- */
let toastTimer = null;
function toast(msg) {
  let el = document.getElementById('toast');
  if (!el) { el = document.createElement('div'); el.id = 'toast'; document.body.appendChild(el); }
  el.textContent = msg;
  el.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('on'), 1600);
}

/* ---------- 视图切换 ---------- */
let curView = 'today';
function show(v) {
  curView = v;
  document.querySelectorAll('.view').forEach((s) => s.classList.toggle('on', s.id === 'v-' + v));
  document.querySelectorAll('.tab').forEach((b) => b.classList.toggle('on', b.dataset.v === v));
  refresh();
}
function refresh() {
  if (curView === 'today') renderToday();
  else if (curView === 'cal') { renderCal(); renderDayPanel(); }
  else if (curView === 'tpl') renderTpl();
  else if (curView === 'me') renderWt();
}
document.querySelectorAll('.tab').forEach((b) => b.addEventListener('click', () => show(b.dataset.v)));

/* ---------- 事件绑定 ---------- */
document.getElementById('tdAdd').addEventListener('click', () => openTaskSheet(todayISO(), todayISO()));
document.getElementById('dpAdd').addEventListener('click', () => openTaskSheet(selDate, selDate));
document.getElementById('tplAdd').addEventListener('click', () => openTaskSheet('tpl'));
document.getElementById('calPrev').addEventListener('click', () => { calM--; if (calM < 1) { calM = 12; calY--; } renderCal(); });
document.getElementById('calNext').addEventListener('click', () => { calM++; if (calM > 12) { calM = 1; calY++; } renderCal(); });
document.getElementById('calToday').addEventListener('click', () => {
  const n = new Date(); calY = n.getFullYear(); calM = n.getMonth() + 1;
  selDate = todayISO(); renderCal(); renderDayPanel();
});
document.getElementById('wtAdd').addEventListener('click', openWtSheet);
document.getElementById('btnExport').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(store, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = '计划表备份-' + todayISO() + '.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 3000);
  toast('已导出');
});
document.getElementById('btnImport').addEventListener('click', () => document.getElementById('fileImport').click());
document.getElementById('fileImport').addEventListener('change', (e) => {
  const f = e.target.files[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    try {
      const o = JSON.parse(r.result);
      if (!o || typeof o !== 'object') throw 0;
      if (!confirm('导入将覆盖当前数据，确定？')) return;
      store = { tpl: [], extra: {}, done: {}, wt: {}, ...o };
      if (!Array.isArray(store.tpl) || !store.tpl.length) store.tpl = DEF_TPL.map((d, i) => Object.assign({ id: 't' + i }, d));
      save(); refresh(); toast('导入成功');
    } catch (err) { toast('文件格式错误'); }
  };
  r.readAsText(f);
  e.target.value = '';
});
document.getElementById('btnClear').addEventListener('click', () => {
  if (confirm('确定清空全部数据？此操作不可恢复！')) {
    store = { tpl: DEF_TPL.map((d, i) => Object.assign({ id: 't' + i }, d)), extra: {}, done: {}, wt: {} };
    save(); refresh(); toast('已清空');
  }
});

/* ---------- PWA ---------- */
if ('serviceWorker' in navigator &&
    (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
  addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}

/* ---------- 启动 ---------- */
renderToday();
