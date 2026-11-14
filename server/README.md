# 价格代理（可选）

网页本身是纯静态的，只能「打开各平台搜索页 + 手动填价比价」。
想让网页**自动显示价格**，需要部署这个小代理，它调用各平台**官方联盟接口**（不爬网页，不会被封），并处理跨域和签名。

## 需要哪些 Key

| 平台 | 去哪申请 | 填哪些变量 | 接口 |
|---|---|---|---|
| 京东 | [京东联盟](https://union.jd.com) 注册推广者 → 我的API 申请权限 | `JD_APP_KEY` `JD_APP_SECRET` | `jd.union.open.goods.query` |
| 淘宝/天猫 | [阿里妈妈](https://pub.alimama.com) + [淘宝开放平台](https://open.taobao.com) 建应用、建推广位 | `TB_APP_KEY` `TB_APP_SECRET` `TB_ADZONE_ID` | `taobao.tbk.dg.material.optional` |
| 拼多多 | [多多进宝](https://jinbao.pinduoduo.com) + [拼多多开放平台](https://open.pinduoduo.com) | `PDD_CLIENT_ID` `PDD_CLIENT_SECRET` `PDD_PID` | `pdd.ddk.goods.search` |
| 1688 | [1688 开放平台](https://open.1688.com)（需企业资质，暂未接入） | — | — |
| 美团 | 美团联盟只提供活动推广链接，**没有商品搜索接口** | — | — |

> 不想自己申请？也可以用「大淘客 / 折淘客」这类聚合 API（付费或需注册），在 `core.js` 里仿照 `jd()` 加一个函数即可。

**没填 Key 的平台会返回「演示数据」**，网页上会标出「演示数据」，不是真实价格。

## 方式一：Cloudflare Worker（免费，推荐）

```bash
cd server
npx wrangler login          # 登录 Cloudflare 账号
npx wrangler deploy         # 部署，得到 https://price-proxy.xxx.workers.dev
npx wrangler secret put JD_APP_KEY   # 逐个添加 .env.example 里的变量
```

## 方式二：任意云服务器 / 本机（Node 18+）

```bash
cd server
cp .env.example .env   # 填 Key
node node-server.js    # 默认端口 8787
```

部署好后打开网页 → 右上角「设置」→ 填代理地址（如 `https://price-proxy.xxx.workers.dev`）→ 保存。

接口：`GET /api/health`（看哪些平台已配置）、`GET /api/search?platform=jd&q=关键词`

⚠️ Key 只放在服务器环境变量里，**不要写进网页代码或提交到公开仓库**。
