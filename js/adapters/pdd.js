PC.register({
  id: 'pdd', name: '拼多多', color: '#e02e24', short: '拼',
  tag: '百亿补贴 · 低价',
  searchUrl: kw => 'https://mobile.yangkeduo.com/search_result.html?search_key=' + encodeURIComponent(kw),
  mobileUrl: kw => 'https://mobile.yangkeduo.com/search_result.html?search_key=' + encodeURIComponent(kw),
  appUrl: kw => 'pinduoduo://com.xunmeng.pinduoduo/search_result.html?search_key=' + encodeURIComponent(kw),
  note: '拼多多网页版需登录才显示结果；真实价格接口：多多进宝 pdd.ddk.goods.search'
});
