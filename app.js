/* 重塑计划表 v1.1.0 —— 紫色多巴胺 · 万年历计划 */
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

/* ---------- 状态 ----------
 * daily: 日常任务 {id, title, cat, start, end, remind}  —— 今日页展示
 * todo:  待办事项 {id, title, cat, start, end, remind}  —— 日历当日面板展示
 * done:  完成状态 done[dateStr][type+':'+id] = 1
 * wt:    体重记录
 */
const LS = 'plan-pwa.v1';
let store = { daily: [], todo: [], done: {}, wt: {} };
try {
  const raw = localStorage.getItem(LS);
  if (raw) { const o = JSON.parse(raw); if (o && typeof o === 'object') store = Object.assign(store, o); }
} catch (e) {}
if (!Array.isArray(store.daily)) store.daily = [];
if (!Array.isArray(store.todo)) store.todo = [];
if (typeof store.done !== 'object' || store.done === null) store.done = {};
if (typeof store.wt !== 'object' || store.wt === null) store.wt = {};

function save() { try { localStorage.setItem(LS, JSON.stringify(store)); } catch (e) { toast('保存失败'); } }

const pad2 = (x) => (x < 10 ? '0' : '') + x;
const iso = (y, m, d) => y + '-' + pad2(m) + '-' + pad2(d);
const todayISO = () => { const n = new Date(); return iso(n.getFullYear(), n.getMonth() + 1, n.getDate()); };
const nowHM = () => { const n = new Date(); return pad2(n.getHours()) + ':' + pad2(n.getMinutes()); };

let selDate = todayISO();
let calY, calM;
{ const n = new Date(); calY = n.getFullYear(); calM = n.getMonth() + 1; }
let sheetCtx = null;

/* ---------- 节日 ---------- */
const FEST_S = { '1-1': '元旦', '2-14': '情人节', '3-8': '妇女节', '3-12': '植树节', '4-1': '愚人节', '5-1': '劳动节', '5-4': '青年节', '6-1': '儿童节', '7-1': '建党节', '8-1': '建军节', '9-10': '教师节', '10-1': '国庆节', '12-24': '平安夜', '12-25': '圣诞节' };
const FEST_L = { '1-1': '春节', '1-15': '元宵', '2-2': '龙抬头', '5-5': '端午', '7-7': '七夕', '8-15': '中秋', '9-9': '重阳', '12-8': '腊八' };

function dayInfo(y, m, d) {
  const lu = solar2lunar(y, m, d);
  let fest = FEST_S[m + '-' + d] || '';
  let lunarText = '';
  if (lu) {
    fest = fest || FEST_L[lu.m + '-' + lu.d] || '';
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
// 判断某任务在指定日期是否有效（日期落在 start~end 之间）
function inRange(task, dateStr) {
  const s = task.start || dateStr, e = task.end || dateStr;
  return dateStr >= s && dateStr <= e;
}

// 日常任务：指定日期有效的
function dailyOf(dateStr) {
  return store.daily.filter((t) => inRange(t, dateStr)).sort((a, b) => (a.remind || '').localeCompare(b.remind || ''));
}
// 待办事项：指定日期有效的
function todoOf(dateStr) {
  return store.todo.filter((t) => inRange(t, dateStr)).sort((a, b) => (a.remind || '').localeCompare(b.remind || ''));
}

function isDone(dateStr, type, id) { return !!(store.done[dateStr] && store.done[dateStr][type + ':' + id]); }
function setDone(dateStr, type, id, v) {
  if (!store.done[dateStr]) store.done[dateStr] = {};
  if (v) store.done[dateStr][type + ':' + id] = 1;
  else delete store.done[dateStr][type + ':' + id];
  save();
}
function progressOf(dateStr) {
  const list = dailyOf(dateStr);
  const dn = list.filter((x) => isDone(dateStr, 'daily', x.id)).length;
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
  renderDailyList(document.getElementById('tdList'), ds);
  const p = progressOf(ds);
  document.getElementById('tdProgTxt').textContent = p.dn + ' / ' + p.total;
  document.getElementById('tdProgBar').style.width = (p.total ? Math.round(p.dn / p.total * 100) : 0) + '%';
  renderCal();
  renderTodoList(document.getElementById('tdTodoList'), ds);
  renderWt();
}

/* ---------- 渲染：日常任务列表（今日页） ---------- */
function renderDailyList(container, dateStr) {
  container.innerHTML = '';
  const list = dailyOf(dateStr);
  if (!list.length) {
    const e = document.createElement('div');
    e.className = 'empty';
    e.innerHTML = '<b>🌱</b>今天没有日常任务<br>点右上角「＋ 添加」设置带日期范围和提醒的任务';
    container.appendChild(e);
    return;
  }
  list.forEach((task) => renderTaskRow(container, task, dateStr, 'daily'));
}

/* ---------- 渲染：今日待办列表 ---------- */
function renderTodoList(container, dateStr) {
  container.innerHTML = '';
  const list = todoOf(dateStr);
  if (!list.length) {
    const e = document.createElement('div');
    e.className = 'empty';
    e.innerHTML = '<b>📋</b>今天没有待办<br>点右上角「＋ 添加」';
    container.appendChild(e);
    return;
  }
  list.forEach((task) => renderTaskRow(container, task, dateStr, 'todo'));
}

/* 通用任务行渲染 */
function renderTaskRow(container, task, dateStr, type) {
  const done = isDone(dateStr, type, task.id);
  const el = document.createElement('div');
  el.className = 'task' + (done ? ' done' : '');
  el.style.setProperty('--cat', CATS[task.cat] ? CATS[task.cat].c : '#8B5CF6');

  const ck = document.createElement('div');
  ck.className = 'ck';
  ck.textContent = done ? '✓' : '';
  ck.addEventListener('click', () => {
    setDone(dateStr, type, task.id, !done);
    refresh();
  });

  const bd = document.createElement('div');
  bd.className = 'bd';
  const tt = document.createElement('div');
  tt.className = 'tt';
  tt.textContent = task.title;
  const mt = document.createElement('div');
  mt.className = 'mt';

  // 日期范围
  const range = document.createElement('span');
  range.className = 'tm';
  if (task.start === task.end) {
    range.textContent = '📅 ' + task.start.slice(5);
  } else {
    range.textContent = '📅 ' + (task.start || '').slice(5) + ' ~ ' + (task.end || '').slice(5);
  }
  mt.appendChild(range);

  // 提醒时间
  if (task.remind) {
    const rm = document.createElement('span');
    rm.className = 'tm';
    rm.textContent = '⏰ ' + task.remind;
    mt.appendChild(rm);
  }

  const cat = document.createElement('span');
  cat.className = 'cat';
  cat.textContent = CATS[task.cat] ? CATS[task.cat].name : '任务';
  mt.appendChild(cat);
  bd.appendChild(tt); bd.appendChild(mt);

  // 编辑 + 删除
  const edit = document.createElement('button');
  edit.className = 'del';
  edit.title = '编辑';
  edit.textContent = '✎';
  edit.addEventListener('click', () => openTaskSheet(type, null, task));

  const del = document.createElement('button');
  del.className = 'del';
  del.title = '删除';
  del.textContent = '🗑';
  del.addEventListener('click', () => {
    if (type === 'daily') store.daily = store.daily.filter((x) => x.id !== task.id);
    else store.todo = store.todo.filter((x) => x.id !== task.id);
    save(); refresh(); toast('已删除');
  });

  el.appendChild(ck); el.appendChild(bd); el.appendChild(edit); el.appendChild(del);
  container.appendChild(el);
}

/* ---------- 渲染：日历（万年历） ---------- */
function renderCal() {
  document.getElementById('calTitle').textContent = calY + '年' + calM + '月';
  const grid = document.getElementById('calGrid');
  grid.innerHTML = '';
  const first = new Date(calY, calM - 1, 1).getDay();
  const dim = new Date(calY, calM, 0).getDate();
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
    });
    grid.appendChild(cell);
  }
}

/* ---------- 渲染：体重 ---------- */
function renderWt() {
  const chart = document.getElementById('wtChart');
  const kpis = document.getElementById('wtKpis');
  const dates = Object.keys(store.wt).sort();
  if (!dates.length) {
    chart.innerHTML = '<text x="160" y="62" text-anchor="middle" fill="#C9BEE8" font-size="13">暂无记录，输入体重开始追踪</text>';
    kpis.innerHTML = '';
    document.getElementById('wtHistory').innerHTML = '';
    return;
  }
  const vals = dates.map((k) => store.wt[k]);
  const latest = vals[vals.length - 1], first = vals[0];
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  kpis.innerHTML =
    '<div><b>' + latest.toFixed(1) + '</b><span>最新 kg</span></div>' +
    '<div><b>' + avg.toFixed(1) + '</b><span>平均 kg</span></div>' +
    '<div><b style="color:' + (latest - first <= 0 ? '#2FD7A5' : '#FF4D6D') + '">' + (latest - first >= 0 ? '+' : '') + (latest - first).toFixed(1) + '</b><span>累计变化</span></div>';

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

  // 体重历史记录列表（最新在前）
  const hist = document.getElementById('wtHistory');
  const sorted = dates.slice().sort((a, b) => b.localeCompare(a));
  let h = '<div class="wt-hist-title">历史记录</div><div class="wt-hist-list">';
  sorted.forEach((d, i) => {
    const v = store.wt[d];
    const prev = sorted[i + 1] ? store.wt[sorted[i + 1]] : null;
    let diff = '';
    if (prev !== null) {
      const delta = Math.round((v - prev) * 10) / 10;
      const color = delta <= 0 ? '#2FD7A5' : '#FF4D6D';
      diff = '<span class="wt-diff" style="color:' + color + '">' + (delta >= 0 ? '+' : '') + delta.toFixed(1) + '</span>';
    }
    const isToday = d === todayISO();
    h += '<div class="wt-hist-item">' +
      '<span class="wt-hist-date">' + d.slice(5) + (isToday ? ' 今天' : '') + '</span>' +
      '<span class="wt-hist-val">' + v.toFixed(1) + ' kg</span>' +
      diff +
      '</div>';
  });
  h += '</div>';
  hist.innerHTML = h;
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

/* 添加/编辑 日常任务 或 待办事项。type: 'daily' | 'todo' */
function openTaskSheet(type, _, editItem) {
  const isEdit = !!editItem;
  const ds = todayISO();
  const item = editItem || { title: '', cat: 'base', start: ds, end: ds, remind: '08:00' };
  sheetCtx = { type, isEdit, item };
  const titleLabel = type === 'daily' ? '日常任务' : '待办事项';
  openSheet(
    (isEdit ? '编辑' : '添加') + titleLabel,
    '<fieldset><label>内容</label><input type="text" id="fTitle" maxlength="40" placeholder="要做的事…" value="' + (item.title || '').replace(/"/g, '&quot;') + '"></fieldset>' +
    '<fieldset><label>类别</label>' + catPickHTML(item.cat) + '</fieldset>' +
    '<div class="row2">' +
      '<fieldset><label>开始日期</label><input type="date" id="fStart" value="' + (item.start || ds) + '"></fieldset>' +
      '<fieldset><label>结束日期</label><input type="date" id="fEnd" value="' + (item.end || ds) + '"></fieldset>' +
    '</div>' +
    '<fieldset><label>提醒时间 <span style="color:var(--mut);font-weight:400">（不填则不提醒）</span></label><input type="time" id="fRemind" value="' + (item.remind || '') + '"></fieldset>'
  );
  const getCat = wireCatPick(item.cat);
  setTimeout(() => document.getElementById('fTitle').focus(), 100);
  document.getElementById('sheetOk').onclick = () => {
    const title = document.getElementById('fTitle').value.trim();
    if (!title) { toast('请填写内容'); return; }
    const start = document.getElementById('fStart').value || ds;
    const end = document.getElementById('fEnd').value || start;
    if (end < start) { toast('结束日期不能早于开始日期'); return; }
    const remind = document.getElementById('fRemind').value || '';
    const cat = getCat();
    const data = { title, cat, start, end, remind };
    if (isEdit) {
      Object.assign(editItem, data);
    } else {
      data.id = type + Date.now().toString(36);
      if (type === 'daily') store.daily.push(data);
      else store.todo.push(data);
    }
    save(); closeSheet(); refresh(); toast(isEdit ? '已保存' : '已添加');
  };
}

/* 体重记录：直接读取输入框，按今天日期保存 */
function recordWeight() {
  const input = document.getElementById('wtVal');
  const w = parseFloat(input.value);
  if (!(w > 0 && w < 500)) { toast('请输入正确体重'); return; }
  const ds = todayISO();
  store.wt[ds] = Math.round(w * 10) / 10;
  save();
  input.value = '';
  renderWt();
  toast('已记录 ' + store.wt[ds] + ' kg');
}

/* ---------- 闹钟提醒 ---------- */
let remindedToday = new Set();   // 今天已提醒过的任务 id
let audioCtx = null;
function ensureAudio() {
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {}
  }
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}
// 播放闹钟声（重复 beep）
function playAlarm() {
  const ctx = ensureAudio();
  if (!ctx) return;
  const now = ctx.currentTime;
  for (let i = 0; i < 5; i++) {
    const t0 = now + i * 0.5;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, t0);
    osc.frequency.setValueAtTime(660, t0 + 0.2);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(0.25, t0 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.25);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(t0); osc.stop(t0 + 0.3);
  }
}
// 检查并触发提醒
function checkReminders() {
  const ds = todayISO();
  const hm = nowHM();
  const all = [].concat(
    store.daily.map((t) => ({ ...t, type: 'daily' })),
    store.todo.map((t) => ({ ...t, type: 'todo' }))
  );
  all.forEach((t) => {
    if (!t.remind || !inRange(t, ds)) return;
    if (t.remind <= hm && !remindedToday.has(t.id)) {
      remindedToday.add(t.id);
      fireReminder(t);
    }
  });
}
function fireReminder(task) {
  playAlarm();
  // 浏览器通知
  if ('Notification' in window && Notification.permission === 'granted') {
    try { new Notification(task.title, { body: '⏰ ' + task.remind + ' · ' + (CATS[task.cat] ? CATS[task.cat].name : '任务'), icon: 'icons/icon-192.png' }); } catch (e) {}
  }
  // 页内弹层提醒
  showReminderPopup(task);
  toast('⏰ 提醒：' + task.title);
}
let reminderPopup = null;
function showReminderPopup(task) {
  if (reminderPopup) return;
  const el = document.createElement('div');
  el.className = 'reminder-popup';
  el.innerHTML =
    '<div class="rp-card">' +
      '<div class="rp-icon">⏰</div>' +
      '<div class="rp-body">' +
        '<div class="rp-title">' + task.title + '</div>' +
        '<div class="rp-meta">' + (task.remind || '') + ' · ' + (CATS[task.cat] ? CATS[task.cat].name : '任务') + '</div>' +
      '</div>' +
      '<button class="rp-ok">知道了</button>' +
    '</div>';
  el.style.setProperty('--cat', CATS[task.cat] ? CATS[task.cat].c : '#8B5CF6');
  document.body.appendChild(el);
  el.addEventListener('click', (e) => {
    if (e.target.classList.contains('rp-ok') || e.target === el) {
      el.remove();
      reminderPopup = null;
    }
  });
  reminderPopup = el;
}
// 请求通知权限（用户首次交互后）
function requestNotifyPerm() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission().catch(() => {});
  }
  ensureAudio();
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
}
document.querySelectorAll('.tab').forEach((b) => b.addEventListener('click', () => { requestNotifyPerm(); show(b.dataset.v); }));

/* ---------- 事件绑定 ---------- */
document.getElementById('tdAdd').addEventListener('click', () => { requestNotifyPerm(); openTaskSheet('daily'); });
document.getElementById('tdTodoAdd').addEventListener('click', () => { requestNotifyPerm(); openTaskSheet('todo'); });
document.getElementById('calPrev').addEventListener('click', () => { calM--; if (calM < 1) { calM = 12; calY--; } renderCal(); });
document.getElementById('calNext').addEventListener('click', () => { calM++; if (calM > 12) { calM = 1; calY++; } renderCal(); });
document.getElementById('calToday').addEventListener('click', () => {
  const n = new Date(); calY = n.getFullYear(); calM = n.getMonth() + 1;
  selDate = todayISO(); renderCal();
});
document.getElementById('wtAdd').addEventListener('click', recordWeight);
document.getElementById('wtVal').addEventListener('keydown', (e) => { if (e.key === 'Enter') recordWeight(); });
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
      store = { daily: [], todo: [], done: {}, wt: {}, ...o };
      if (!Array.isArray(store.daily)) store.daily = [];
      if (!Array.isArray(store.todo)) store.todo = [];
      save(); refresh(); toast('导入成功');
    } catch (err) { toast('文件格式错误'); }
  };
  r.readAsText(f);
  e.target.value = '';
});
document.getElementById('btnClear').addEventListener('click', () => {
  if (confirm('确定清空全部数据？此操作不可恢复！')) {
    store = { daily: [], todo: [], done: {}, wt: {} };
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
// 提醒检查：每 30 秒一次
setInterval(checkReminders, 30000);
checkReminders();
// 首次用户交互后请求通知权限 + 激活音频
document.addEventListener('click', requestNotifyPerm, { once: true });
