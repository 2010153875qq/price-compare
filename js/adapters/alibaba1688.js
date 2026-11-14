PC.register({
  id: '1688', name: '1688', color: '#ff6a00', short: '1688',
  tag: '源头工厂 · 批发价',
  // 1688 搜索默认按 GBK 解码，加 charset=utf8 让它按 UTF-8 解析中文关键词
  searchUrl: kw => 'https://s.1688.com/selloffer/offer_search.htm?keywords=' + encodeURIComponent(kw) + '&charset=utf8',
  note: '1688 多为批发价、有起批量；接口需 1688 开放平台（分销/跨境）权限'
});
