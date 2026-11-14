PC.register({
  id: 'meituan', name: '美团 / 闪购', color: '#ffc300', short: '美',
  tag: '外卖闪购 · 30分钟达',
  // 美团没有公开的网页商品搜索；此链接会进入美团 H5 搜索，常要求滑块验证或跳 App
  searchUrl: kw => 'https://i.meituan.com/s/' + encodeURIComponent(kw),
  mobileUrl: kw => 'https://i.meituan.com/s/' + encodeURIComponent(kw),
  appUrl: kw => 'imeituan://www.meituan.com/search?q=' + encodeURIComponent(kw),
  note: '美团没有开放的商品比价接口，网页搜索常需验证；建议在美团 App 里搜，再把价格填进下面的表'
});
