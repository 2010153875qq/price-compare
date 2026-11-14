/* 适配器注册中心：每个平台一个文件，调用 PC.register({...}) 注册。
 * 字段：
 *   id        平台代号（jd / taobao / pdd / 1688 / meituan）
 *   name      显示名
 *   color     品牌色
 *   searchUrl(kw)  返回该平台公开搜索页链接（网页版，新标签打开）
 *   appUrl(kw)     可选，手机 App 深链（唤起 App 搜索）
 *   note           可选，提示文字
 *   fetchPrices(kw, cfg) 可选，返回 Promise<[{title,price,shipping,coupon,url,shop,img}]>
 *                  默认实现：调用你自己部署的代理 cfg.proxy + /api/search?platform=id&q=kw
 */
(function () {
  const PC = (window.PC = window.PC || {});
  PC.adapters = [];
  PC.defaultFetch = async function (id, kw, cfg) {
    if (!cfg || !cfg.proxy) throw new Error('未配置价格接口（设置里填代理地址）');
    const url = cfg.proxy.replace(/\/$/, '') + '/api/search?platform=' + encodeURIComponent(id) + '&q=' + encodeURIComponent(kw);
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 12000);
    try {
      const r = await fetch(url, { signal: ctrl.signal });
      if (!r.ok) throw new Error('接口返回 ' + r.status);
      const j = await r.json();
      if (!j.ok) throw new Error(j.error || '接口出错');
      return { items: j.items || [], mock: !!j.mock };
    } finally { clearTimeout(t); }
  };
  PC.register = function (a) {
    if (!a.fetchPrices) a.fetchPrices = (kw, cfg) => PC.defaultFetch(a.id, kw, cfg);
    PC.adapters.push(a);
  };
})();
