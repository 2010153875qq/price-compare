PC.register({
  id: 'taobao', name: '淘宝 / 天猫', color: '#ff5000', short: '淘',
  tag: '品类全 · 店铺多',
  searchUrl: kw => 'https://s.taobao.com/search?q=' + encodeURIComponent(kw),
  mobileUrl: kw => 'https://main.m.taobao.com/search/index.html?q=' + encodeURIComponent(kw),
  appUrl: kw => 'taobao://s.taobao.com/search?q=' + encodeURIComponent(kw),
  note: '真实价格接口：淘宝联盟 taobao.tbk.dg.material.optional'
});
