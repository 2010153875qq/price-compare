PC.register({
  id: 'jd', name: '京东', color: '#e1251b', short: '京',
  tag: '自营快 · 正品',
  searchUrl: kw => 'https://search.jd.com/Search?keyword=' + encodeURIComponent(kw) + '&enc=utf-8',
  mobileUrl: kw => 'https://so.m.jd.com/ware/search.action?keyword=' + encodeURIComponent(kw),
  appUrl: kw => 'openapp.jdmobile://virtual?params=' + encodeURIComponent(JSON.stringify({ category: 'jump', des: 'productList', keyWord: kw })),
  note: '真实价格接口：京东联盟 jd.union.open.goods.query'
});
