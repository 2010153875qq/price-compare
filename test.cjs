const { chromium } = require('/workspace/snake-online/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const root = '/workspace/price-compare/site';
const types = { html: 'text/html; charset=utf-8', css: 'text/css', js: 'application/javascript', json: 'application/json', webmanifest: 'application/manifest+json', png: 'image/png', svg: 'image/svg+xml' };
const srv = http.createServer((q, s) => { let p = path.join(root, decodeURIComponent(q.url.split('?')[0].split('#')[0])); if (p.endsWith('/')) p += 'index.html'; fs.readFile(p, (e, d) => { if (e) { s.writeHead(404); return s.end(); } const ext = p.split('.').pop(); s.writeHead(200, { 'content-type': types[ext] || 'application/octet-stream' }); s.end(d); }); }).listen(8099);
(async () => {
  const b = await chromium.launch(); const errs = [];
  const pg = await b.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 1 });
  pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => m.type() === 'error' && errs.push(m.text()));
  await pg.goto('http://localhost:8099/');
  await pg.fill('#kw', '维达抽纸'); await pg.click('#btnSearch');
  const links = await pg.$$eval('[data-open]', as => as.map(a => [a.dataset.open, a.href]));
  console.log(links);
  const exp = { jd: 'https://search.jd.com/Search?keyword=%E7%BB%B4%E8%BE%BE%E6%8A%BD%E7%BA%B8&enc=utf-8', taobao: 'https://s.taobao.com/search?q=%E7%BB%B4%E8%BE%BE%E6%8A%BD%E7%BA%B8', pdd: 'https://mobile.yangkeduo.com/search_result.html?search_key=%E7%BB%B4%E8%BE%BE%E6%8A%BD%E7%BA%B8' };
  for (const [id, h] of links) if (exp[id] && exp[id] !== h) throw new Error('bad link ' + id);
  // fill table
  const set = async (i, k, v) => { await pg.fill(`#cmpBody tr:nth-child(${i}) [data-k=${k}]`, String(v)); };
  await set(1, 'price', 39.9); await set(1, 'ship', 0); await set(1, 'title', '维达 3层 24包 京东自营');
  await set(2, 'price', 36.5); await set(2, 'ship', 6); await set(2, 'title', '维达旗舰店');
  await set(3, 'price', 35.8); await set(3, 'coupon', 3); await set(3, 'title', '百亿补贴');
  await set(4, 'price', 30); await set(4, 'qty', 1); await set(4, 'ship', 12); await set(4, 'title', '批发 起批1件');
  await set(5, 'price', 45); await set(5, 'title', '美团闪购 30分钟达');
  const cheap = await pg.$eval('tr.cheapest [data-k=title]', e => e.value);
  const best = await pg.textContent('#bestBox');
  console.log('cheapest row:', cheap, '|', best);
  if (!cheap.includes('百亿补贴')) throw new Error('cheapest wrong');
  await pg.click('#thFinal');
  const order = await pg.$$eval('#cmpBody td.final', t => t.map(x => x.textContent));
  console.log('sorted:', order);
  await pg.click('#btnSaveCmp');
  await pg.reload(); // persistence + hash restore
  const hist = await pg.$$eval('.hitem .t', t => t.map(x => x.textContent));
  console.log('history:', hist, 'rows after reload', await pg.$$eval('#cmpBody tr', r => r.length));
  await pg.evaluate(() => window.scrollTo(0, 0));
  await pg.screenshot({ path: '/workspace/price-compare/screenshot-desktop.png', fullPage: true });
  // live mode with mock proxy
  await pg.click('#btnSettings'); await pg.fill('#cfgProxy', 'http://localhost:8787'); await pg.click('#btnSaveCfg');
  await pg.waitForSelector('#live-jd .it'); await pg.waitForTimeout(500);
  console.log('live hint:', await pg.textContent('#liveHint'));
  await pg.screenshot({ path: '/workspace/price-compare/screenshot-live.png', fullPage: false });
  const m = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile' });
  await m.goto('http://localhost:8099/#q=' + encodeURIComponent('罗技 G304'));
  await m.waitForSelector('.pcard');
  console.log('mobile jd link:', await m.$eval('[data-open=jd]', a => a.href));
  await m.evaluate(() => window.scrollTo(0, 0));
  await m.screenshot({ path: '/workspace/price-compare/screenshot-mobile.png', fullPage: true });
  console.log('errors:', errs);
  await b.close(); srv.close();
})().catch(e => { console.error('FAIL', e); process.exit(1); });
