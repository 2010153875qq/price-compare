/* 价格代理核心逻辑（Node 和 Cloudflare Worker 共用，零依赖）
 * 只调用各平台「官方联盟 / 开放平台」接口，不爬网页。
 * 没填 Key 的平台返回演示数据（mock: true）。
 */
// ---- 极简 MD5（联盟接口签名用）----
function md5(str) {
  const s = unescape(encodeURIComponent(str));
  function cmn(q, a, b, x, s, t) { a = (a + q + x + t) | 0; return (((a << s) | (a >>> (32 - s))) + b) | 0; }
  const ff = (a, b, c, d, x, s, t) => cmn((b & c) | (~b & d), a, b, x, s, t);
  const gg = (a, b, c, d, x, s, t) => cmn((b & d) | (c & ~d), a, b, x, s, t);
  const hh = (a, b, c, d, x, s, t) => cmn(b ^ c ^ d, a, b, x, s, t);
  const ii = (a, b, c, d, x, s, t) => cmn(c ^ (b | ~d), a, b, x, s, t);
  const n = s.length, words = [];
  for (let i = 0; i < n; i++) words[i >> 2] |= s.charCodeAt(i) << ((i % 4) * 8);
  words[n >> 2] |= 0x80 << ((n % 4) * 8);
  const nb = (((n + 8) >> 6) + 1) * 16; for (let i = 0; i < nb; i++) words[i] = words[i] | 0;
  words[nb - 2] = n * 8;
  let a = 1732584193, b = -271733879, c = -1732584194, d = 271733878;
  const S = [7, 12, 17, 22, 5, 9, 14, 20, 4, 11, 16, 23, 6, 10, 15, 21];
  const K = []; for (let i = 0; i < 64; i++) K[i] = (Math.abs(Math.sin(i + 1)) * 4294967296) | 0;
  for (let i = 0; i < nb; i += 16) {
    let A = a, B = b, C = c, D = d;
    for (let j = 0; j < 64; j++) {
      let f, g, r = j >> 4;
      if (r === 0) { g = j; } else if (r === 1) { g = (5 * j + 1) % 16; } else if (r === 2) { g = (3 * j + 5) % 16; } else { g = (7 * j) % 16; }
      const fn = [ff, gg, hh, ii][r];
      const sh = S[r * 4 + (j % 4)];
      const t = fn(A, B, C, D, words[i + g], sh, K[j]);
      A = D; D = C; C = B; B = t;
    }
    a = (a + A) | 0; b = (b + B) | 0; c = (c + C) | 0; d = (d + D) | 0;
  }
  return [a, b, c, d].map(v => { let h = ''; for (let i = 0; i < 4; i++) h += ((v >>> (i * 8)) & 255).toString(16).padStart(2, '0'); return h; }).join('');
}
const signTop = (params, secret) => md5(secret + Object.keys(params).sort().map(k => k + params[k]).join('') + secret).toUpperCase();
const ts = () => { const d = new Date(Date.now() + 8 * 3600e3); return d.toISOString().replace('T', ' ').slice(0, 19); }; // 北京时间
const num = v => Number(v) || 0;

// ---- 京东联盟 jd.union.open.goods.query ----
async function jd(q, env) {
  const p = {
    method: 'jd.union.open.goods.query', app_key: env.JD_APP_KEY, timestamp: ts(), format: 'json', v: '1.0', sign_method: 'md5',
    '360buy_param_json': JSON.stringify({ goodsReqDTO: { keyword: q, pageIndex: 1, pageSize: 10, sortName: 'price', sort: 'asc' } })
  };
  p.sign = signTop(p, env.JD_APP_SECRET);
  const r = await fetch('https://api.jd.com/routerjson?' + new URLSearchParams(p));
  const j = await r.json();
  const raw = j.jd_union_open_goods_query_responce || j.jd_union_open_goods_query_response;
  const res = JSON.parse(raw?.queryResult || raw?.result || '{}');
  if (res.code !== 200) throw new Error('京东联盟：' + (res.message || JSON.stringify(j).slice(0, 120)));
  return (res.data || []).map(g => ({
    title: g.skuName, price: num(g.priceInfo?.lowestCouponPrice || g.priceInfo?.price), coupon: 0, shipping: 0,
    shop: g.shopInfo?.shopName, url: 'https://item.jd.com/' + g.skuId + '.html', img: g.imageInfo?.imageList?.[0]?.url
  }));
}
// ---- 淘宝联盟 taobao.tbk.dg.material.optional ----
async function taobao(q, env) {
  const p = {
    method: 'taobao.tbk.dg.material.optional', app_key: env.TB_APP_KEY, timestamp: ts(), format: 'json', v: '2.0', sign_method: 'md5', simplify: 'true',
    q, adzone_id: env.TB_ADZONE_ID, page_size: '10', sort: 'price_asc'
  };
  p.sign = signTop(p, env.TB_APP_SECRET);
  const r = await fetch('https://eco.taobao.com/router/rest?' + new URLSearchParams(p));
  const j = await r.json();
  if (j.error_response) throw new Error('淘宝联盟：' + (j.error_response.sub_msg || j.error_response.msg));
  const list = j.result_list || j.tbk_dg_material_optional_response?.result_list?.map_data || [];
  return list.map(g => ({
    title: g.title, price: num(g.zk_final_price), coupon: num(g.coupon_amount), shipping: 0,
    shop: g.shop_title, url: g.item_url || g.url, img: g.pict_url
  }));
}
// ---- 多多进宝 pdd.ddk.goods.search ----
async function pdd(q, env) {
  const p = { type: 'pdd.ddk.goods.search', client_id: env.PDD_CLIENT_ID, timestamp: String(Math.floor(Date.now() / 1000)), data_type: 'JSON', keyword: q, pid: env.PDD_PID, page_size: '10', sort_type: '3' };
  p.sign = signTop(p, env.PDD_CLIENT_SECRET);
  const r = await fetch('https://gw-api.pinduoduo.com/api/router', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(p) });
  const j = await r.json();
  if (j.error_response) throw new Error('多多进宝：' + (j.error_response.error_msg || j.error_response.sub_msg));
  return (j.goods_search_response?.goods_list || []).map(g => ({
    title: g.goods_name, price: num(g.min_group_price) / 100, coupon: num(g.coupon_discount) / 100, shipping: 0, // 金额单位：分
    shop: g.mall_name, url: 'https://mobile.yangkeduo.com/goods.html?goods_id=' + g.goods_id, img: g.goods_thumbnail_url
  }));
}

const PROVIDERS = {
  jd: { fn: jd, keys: ['JD_APP_KEY', 'JD_APP_SECRET'] },
  taobao: { fn: taobao, keys: ['TB_APP_KEY', 'TB_APP_SECRET', 'TB_ADZONE_ID'] },
  pdd: { fn: pdd, keys: ['PDD_CLIENT_ID', 'PDD_CLIENT_SECRET', 'PDD_PID'] },
  '1688': { fn: null, keys: ['ALI1688_APP_KEY'] }, // 1688 开放平台需企业资质，留作扩展
  meituan: { fn: null, keys: ['MEITUAN_KEY'] }      // 美团联盟只有 CPS 活动链接，无商品搜索，留作扩展
};

// 同一关键词稳定的演示数据
function mock(platform, q) {
  let h = 0; for (const c of platform + q) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const base = 20 + (h % 300);
  return [0, 1, 2].map(i => ({ title: `【演示】${q} 款式${i + 1}`, price: +(base * (1 + i * 0.12) * (0.85 + (h % 7) / 20)).toFixed(2), coupon: i === 0 ? 5 : 0, shipping: platform === '1688' ? 8 : 0, shop: '演示店铺', url: '' }));
}

async function handle(url, env) {
  const cors = { 'access-control-allow-origin': env.ALLOW_ORIGIN || '*', 'content-type': 'application/json; charset=utf-8' };
  const out = (o, s = 200) => ({ status: s, headers: cors, body: JSON.stringify(o) });
  if (url.pathname === '/api/health') return out({ ok: true, configured: Object.fromEntries(Object.entries(PROVIDERS).map(([k, v]) => [k, Boolean(v.fn) && v.keys.every(x => Boolean(env[x]))])) });
  if (url.pathname !== '/api/search') return out({ ok: false, error: 'not found' }, 404);
  const platform = url.searchParams.get('platform'); const q = (url.searchParams.get('q') || '').trim().slice(0, 60);
  const P = PROVIDERS[platform];
  if (!P || !q) return out({ ok: false, error: '参数错误' }, 400);
  if (!P.fn || !P.keys.every(k => env[k])) return out({ ok: true, mock: true, items: mock(platform, q) });
  try { return out({ ok: true, mock: false, items: await P.fn(q, env) }); }
  catch (e) { return out({ ok: false, error: e.message }, 502); }
}
if (typeof module !== 'undefined') module.exports = { handle, md5 };
