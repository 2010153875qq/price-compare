(function () {
  'use strict';
  const $ = s => document.querySelector(s);
  const LS = { cfg: 'pc_cfg', rows: 'pc_rows', hist: 'pc_hist', kw: 'pc_kw' };
  const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
  const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = n => (Math.round(n * 100) / 100).toFixed(2);
  const isMobile = /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);
  const A = window.PC.adapters;
  const byId = id => A.find(a => a.id === id);

  let cfg = load(LS.cfg, { proxy: '', preferApp: false });
  let rows = load(LS.rows, []);
  let hist = load(LS.hist, []);
  let sortAsc = true;
  let curKw = '';

  function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 1800); }

  // ---------- 热门词 ----------
  const HOT = ['iPhone 16 256G', '维达抽纸', '罗技 G304', '小米手环 9', '奶粉 飞鹤', '洗衣液 蓝月亮', '耐克 跑鞋'];
  $('#hotChips').innerHTML = HOT.map(h => `<button class="chip" type="button" data-kw="${esc(h)}">${esc(h)}</button>`).join('');
  $('#hotChips').addEventListener('click', e => { const k = e.target.dataset.kw; if (k) { $('#kw').value = k; doSearch(k); } });

  // ---------- 搜索 ----------
  function urlFor(a, kw) { if (isMobile && cfg.preferApp && a.appUrl) return a.appUrl(kw); return (isMobile && a.mobileUrl ? a.mobileUrl(kw) : a.searchUrl(kw)); }
  function doSearch(kw) {
    kw = kw.trim(); if (!kw) return;
    curKw = kw; localStorage.setItem(LS.kw, kw);
    $('#platformSection').classList.remove('hidden');
    $('#kwLabel').textContent = '「' + kw + '」';
    $('#platformGrid').innerHTML = A.map(a => `
      <div class="pcard" style="--c:${a.color}" data-id="${a.id}">
        <div class="ph"><div class="badge">${esc(a.short)}</div><div><div class="pn">${esc(a.name)}</div><div class="pt">${esc(a.tag || '')}</div></div></div>
        <div class="acts">
          <a href="${esc(urlFor(a, kw))}" target="_blank" rel="noopener noreferrer" data-open="${a.id}">去搜索 ↗</a>
          ${a.appUrl ? `<a class="alt" href="${esc(a.appUrl(kw))}" data-app="${a.id}">App</a>` : ''}
        </div>
        <div class="note">${esc(a.note || '')}</div>
        <div class="live" id="live-${a.id}" ${cfg.proxy ? '' : 'hidden'}></div>
      </div>`).join('');
    $('#liveHint').textContent = cfg.proxy ? '正在通过你的价格接口获取实时价格…' : '提示：看到价格后，填到下面的表格里自动算最低价。想自动抓价格，请在「设置」里配置价格接口。';
    addHist({ type: 'search', kw, t: Date.now() });
    if (location.hash !== '#q=' + encodeURIComponent(kw)) history.replaceState(null, '', '#q=' + encodeURIComponent(kw));
    if (cfg.proxy) fetchLive(kw);
    $('#platformSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  $('#searchForm').addEventListener('submit', e => { e.preventDefault(); doSearch($('#kw').value); });

  async function fetchLive(kw) {
    let anyMock = false;
    await Promise.all(A.map(async a => {
      const box = document.getElementById('live-' + a.id); if (!box) return;
      box.innerHTML = '<span class="pt">获取中…</span>';
      try {
        const res = await a.fetchPrices(kw, cfg);
        if (kw !== curKw) return;
        anyMock = anyMock || res.mock;
        const items = (res.items || []).filter(i => i.price > 0).sort((x, y) => (x.price + (x.shipping || 0) - (x.coupon || 0)) - (y.price + (y.shipping || 0) - (y.coupon || 0))).slice(0, 3);
        if (!items.length) { box.innerHTML = '<span class="pt">没有结果</span>'; return; }
        box.innerHTML = (res.mock ? '<span class="mock">演示数据</span>' : '') + items.map((it, i) => `
          <div class="it"><span title="${esc(it.title)}">${esc(it.title)}</span><b>¥${money(it.price - (it.coupon || 0))}</b></div>`).join('') +
          `<button class="ghost" style="width:100%;margin-top:6px;font-size:13px;padding:6px" data-add="${a.id}">把最低的加入比价表</button>`;
        box._items = items;
      } catch (err) { box.innerHTML = '<span class="pt">⚠️ ' + esc(err.message) + '</span>'; }
    }));
    if (kw === curKw) $('#liveHint').textContent = anyMock ? '⚠️ 价格接口还没填 API Key，上面是演示数据，不是真实价格。' : '实时价格来自各平台联盟接口，以平台页面为准。';
  }
  $('#platformGrid').addEventListener('click', e => {
    const id = e.target.dataset.add;
    if (id) {
      const it = document.getElementById('live-' + id)._items[0];
      rows.push({ p: id, title: it.title + (it.shop ? ' / ' + it.shop : ''), price: it.price, qty: 1, ship: it.shipping || 0, coupon: it.coupon || 0, url: it.url || '' });
      saveRows(); renderTable(); toast('已加入比价表');
    }
    const app = e.target.dataset.app;
    if (app && !isMobile) { e.preventDefault(); toast('App 按钮需要在手机上用'); }
  });

  $('#btnOpenAll').addEventListener('click', () => {
    let blocked = 0;
    A.forEach(a => { const w = window.open(urlFor(a, curKw), '_blank', 'noopener'); if (!w) blocked++; });
    if (blocked) toast('浏览器拦截了弹窗，请允许本站弹窗或逐个点击');
  });
  $('#btnCopyKw').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(curKw); toast('已复制：' + curKw); } catch { toast('复制失败，请手动复制'); }
  });

  // ---------- 比价表 ----------
  const finalOf = r => (Number(r.price) || 0) * (Number(r.qty) || 1) + (Number(r.ship) || 0) - (Number(r.coupon) || 0);
  const valid = r => Number(r.price) > 0;
  function saveRows() { save(LS.rows, rows); }
  function newRow(p) { return { p: p || A[rows.length % A.length].id, title: '', price: '', qty: 1, ship: 0, coupon: 0, url: '' }; }
  if (!rows.length) rows = A.map(a => newRow(a.id));

  function renderTable() {
    const opts = id => A.map(a => `<option value="${a.id}" ${a.id === id ? 'selected' : ''}>${esc(a.name)}</option>`).join('') + `<option value="other" ${id === 'other' ? 'selected' : ''}>其他</option>`;
    const vs = rows.filter(valid);
    const min = vs.length ? Math.min(...vs.map(finalOf)) : null;
    $('#cmpBody').innerHTML = rows.map((r, i) => `
      <tr data-i="${i}" class="${valid(r) && finalOf(r) === min ? 'cheapest' : ''}">
        <td><select data-k="p">${opts(r.p)}</select></td>
        <td><input data-k="title" value="${esc(r.title)}" placeholder="商品名 / 店铺（可选）"></td>
        <td class="num"><input class="n" data-k="price" type="number" step="0.01" min="0" inputmode="decimal" value="${esc(r.price)}" placeholder="0.00"></td>
        <td class="num"><input class="n" data-k="qty" type="number" step="1" min="1" inputmode="numeric" value="${esc(r.qty)}" style="width:60px"></td>
        <td class="num"><input class="n" data-k="ship" type="number" step="0.01" min="0" inputmode="decimal" value="${esc(r.ship)}"></td>
        <td class="num"><input class="n" data-k="coupon" type="number" step="0.01" min="0" inputmode="decimal" value="${esc(r.coupon)}"></td>
        <td class="final">${valid(r) ? '¥' + money(finalOf(r)) : '—'}</td>
        <td><button class="del" data-del="${i}" title="删除">✕</button></td>
      </tr>`).join('');
    renderBest();
  }
  function renderBest() {
    const vs = rows.filter(valid).map(r => ({ r, f: finalOf(r) })).sort((a, b) => a.f - b.f);
    const box = $('#bestBox');
    if (!vs.length) { box.className = 'best'; box.innerHTML = '还没有价格，在各平台看到价格后填到下面（到手价 = 单价 × 数量 + 运费 − 优惠）。'; return; }
    const b = vs[0], w = vs[vs.length - 1];
    const name = b.r.p === 'other' ? '其他' : (byId(b.r.p)?.name || b.r.p);
    box.className = 'best win';
    box.innerHTML = `🏆 最便宜：<b>${esc(name)}</b>${b.r.title ? '（' + esc(b.r.title) + '）' : ''}，到手 <span class="big">¥${money(b.f)}</span>` +
      (vs.length > 1 ? `<br>比最贵的 ${esc(w.r.p === 'other' ? '其他' : byId(w.r.p)?.name)} 省 <b>¥${money(w.f - b.f)}</b>（${((w.f - b.f) / w.f * 100).toFixed(1)}%），共比较 ${vs.length} 家。` : '<br>再填一家就能对比了。');
  }
  // 输入时只更新计算结果，不重建输入框（保留光标）
  $('#cmpBody').addEventListener('input', e => {
    const tr = e.target.closest('tr'); const k = e.target.dataset.k; if (!tr || !k) return;
    rows[+tr.dataset.i][k] = e.target.value; saveRows();
    const vs = rows.filter(valid); const min = vs.length ? Math.min(...vs.map(finalOf)) : null;
    document.querySelectorAll('#cmpBody tr').forEach((t, i) => {
      const r = rows[i]; t.querySelector('.final').textContent = valid(r) ? '¥' + money(finalOf(r)) : '—';
      t.classList.toggle('cheapest', valid(r) && finalOf(r) === min);
    });
    renderBest();
  });
  $('#cmpBody').addEventListener('click', e => { const i = e.target.dataset.del; if (i != null) { rows.splice(+i, 1); saveRows(); renderTable(); } });
  $('#btnAddRow').addEventListener('click', () => { rows.push(newRow()); saveRows(); renderTable(); });
  $('#btnClear').addEventListener('click', () => { if (confirm('清空比价表？')) { rows = A.map(a => newRow(a.id)); saveRows(); renderTable(); } });
  $('#thFinal').addEventListener('click', () => {
    rows.sort((a, b) => (valid(b) - valid(a)) || (sortAsc ? finalOf(a) - finalOf(b) : finalOf(b) - finalOf(a)));
    sortAsc = !sortAsc; saveRows(); renderTable();
  });
  $('#btnSaveCmp').addEventListener('click', () => {
    const vs = rows.filter(valid); if (!vs.length) return toast('先填至少一个价格');
    const best = vs.reduce((a, b) => finalOf(a) <= finalOf(b) ? a : b);
    addHist({ type: 'cmp', kw: curKw || $('#kw').value || '未命名比价', t: Date.now(), rows: JSON.parse(JSON.stringify(rows)), best: { p: best.p, f: finalOf(best) } });
    toast('已保存到历史记录');
  });
  $('#btnCsv').addEventListener('click', () => {
    const head = ['平台', '商品', '单价', '数量', '运费', '优惠', '到手价'];
    const lines = [head].concat(rows.filter(valid).map(r => [byId(r.p)?.name || '其他', r.title, r.price, r.qty, r.ship, r.coupon, money(finalOf(r))]));
    const csv = '\ufeff' + lines.map(l => l.map(v => '"' + String(v ?? '').replace(/"/g, '""') + '"').join(',')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = '比价-' + (curKw || '表格') + '.csv'; a.click();
  });

  // ---------- 历史 ----------
  function addHist(h) {
    if (h.type === 'search') hist = hist.filter(x => !(x.type === 'search' && x.kw === h.kw));
    hist.unshift(h); hist = hist.slice(0, 50); save(LS.hist, hist); renderHist();
  }
  function renderHist() {
    const box = $('#histBox');
    if (!hist.length) { box.innerHTML = '<div class="empty">还没有记录。</div>'; return; }
    box.innerHTML = hist.map((h, i) => {
      const d = new Date(h.t).toLocaleString('zh-CN', { hour12: false });
      if (h.type === 'cmp') return `<div class="hitem"><div><div class="t">📊 ${esc(h.kw)}</div><div class="m">${d} · 最低 ${esc(byId(h.best.p)?.name || '其他')} ¥${money(h.best.f)}</div></div><button class="ghost" data-h="${i}">载入</button></div>`;
      return `<div class="hitem"><div><div class="t">🔍 ${esc(h.kw)}</div><div class="m">${d}</div></div><button class="ghost" data-h="${i}">再搜</button></div>`;
    }).join('');
  }
  $('#histBox').addEventListener('click', e => {
    const i = e.target.dataset.h; if (i == null) return; const h = hist[+i];
    $('#kw').value = h.kw;
    if (h.type === 'cmp') { rows = JSON.parse(JSON.stringify(h.rows)); saveRows(); renderTable(); curKw = h.kw; toast('已载入'); }
    else doSearch(h.kw);
  });
  $('#btnClearHist').addEventListener('click', () => { if (confirm('清空历史记录？')) { hist = []; save(LS.hist, hist); renderHist(); } });

  // ---------- 设置 ----------
  $('#btnSettings').addEventListener('click', () => { $('#cfgProxy').value = cfg.proxy || ''; $('#cfgPreferApp').checked = !!cfg.preferApp; $('#dlgSettings').showModal(); });
  $('#btnSaveCfg').addEventListener('click', () => {
    cfg = { proxy: $('#cfgProxy').value.trim(), preferApp: $('#cfgPreferApp').checked }; save(LS.cfg, cfg);
    toast('已保存'); if (curKw) doSearch(curKw);
  });

  // ---------- 启动 ----------
  renderTable(); renderHist();
  const m = location.hash.match(/q=([^&]+)/);
  if (m) { const k = decodeURIComponent(m[1]); $('#kw').value = k; doSearch(k); }
  window.PC.app = { doSearch, finalOf, get rows() { return rows; } };
})();
