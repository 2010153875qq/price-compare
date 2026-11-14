# 🏷️ 一键比价（京东 · 淘宝 · 拼多多 · 1688 · 美团）

输入商品名 → 一键打开 5 个平台的搜索结果 → 把看到的价格填进表格 → 自动算出**含运费、减优惠后的到手价**，标出最便宜的一家。
纯静态网页，**不卖货、不代购、不收款**，数据只存在你自己的浏览器里。


## 在线使用
- 网站：https://2010153875qq.github.io/price-compare/
- 源码：https://github.com/2010153875qq/price-compare
- 下载整站：[price-compare.zip](./price-compare.zip)（解压后打开 `site/index.html` 即可本地使用）

本仓库根目录就是可直接访问的网站（GitHub Pages 从 `main` 分支根目录发布）。压缩包里保留完整项目结构（`site/`、`server/`、说明和测试）。

## 功能
- 🔍 搜索：5 个平台的官方搜索页一键打开（电脑开网页版，手机开手机版，「App」按钮可唤起 App 搜索）
- 🧮 比价表：单价 × 数量 + 运费 − 优惠 = 到手价，自动排序、高亮最低价、显示能省多少
- 📜 历史：搜索记录、保存的比价方案，随时载入；可导出 CSV 表格
- ⚡ 自动价格（可选）：部署 `server/` 代理并填联盟 API Key 后，卡片上直接显示各平台最低价
- 📱 手机适配、深色模式；链接带关键词，可分享：`index.html#q=维达抽纸`
- 📲 iPhone 可「添加到主屏幕」，像 App 一样全屏打开，没网也能用

## 目录
```
site/                    网站本体（直接部署这个文件夹）
  index.html
  manifest.webmanifest   添加到主屏幕 / PWA 配置（相对路径，可用于子目录）
  sw.js                  离线缓存
  icons/                 180（苹果）、192、512 图标
  css/style.css
  js/app.js
  js/pwa.js              注册 Service Worker、iPhone 安装提示
  js/adapters/           每个平台一个适配器（搜索链接 + 取价接口），想加平台照着写一个即可
server/                  可选的价格代理（Cloudflare Worker / Node），见 server/README.md
test.cjs / test-pwa.cjs  功能测试、PWA / 离线测试（Playwright）
```

## 本地打开
直接双击 `site/index.html` 就能用（比价功能可用）。或：`cd site && python3 -m http.server 8080`，浏览器打开 http://localhost:8080
「添加到主屏幕」和离线打开需要通过 http(s) 访问（本地服务器或下面的公开部署），不能靠在手机里直接打开下载的 html 文件。

## 在 iPhone 上添加到主屏幕
用 **Safari** 打开已发布的网址（不要用微信、Chrome 或其他 App 内置浏览器）：
1. 点底栏中间的「分享」按钮（方框加向上箭头）
2. 向下滑动，选「添加到主屏幕」
3. 右上角点「添加」

桌面上会出现「购物比价」图标，点开就是全屏 App，没网也能打开（去各平台查价格仍需联网）。如果页面底部出现安装提示，关掉后不会再显示。

## 公开部署（任选一种，都免费）
### GitHub Pages
本仓库已按此方式发布：`site/` 中的文件在仓库根目录，Pages 源为 `main` / `(root)`，地址见上方「在线使用」。若要自己再部署一份：把 `site/` 里的所有文件（含 `.nojekyll`）放到目标仓库根目录，然后 Settings → Pages → `main` / `(root)`。
> 想放在自己的域名下（如 zhourunzheng.com.cn/price-compare/）：把 `site/` 复制到网站仓库的 `price-compare/` 文件夹即可。

### Gitee Pages（国内访问快）
Gitee 新建仓库 → 上传 `site/` 内容 → 服务 → Gitee Pages → 启动（需实名认证）。

### Vercel / Netlify / Cloudflare Pages
登录后把 `site/` 文件夹拖进去（或导入 GitHub 仓库，输出目录填 `site`），无需构建命令。

## 自动显示价格（可选）
各平台网页都有反爬和登录墙，网页没法直接抓价格。正规做法是用**官方联盟接口**：
| 平台 | 申请 | 接口 |
|---|---|---|
| 京东 | [京东联盟](https://union.jd.com) | `jd.union.open.goods.query` |
| 淘宝/天猫 | [阿里妈妈](https://pub.alimama.com) + [淘宝开放平台](https://open.taobao.com) | `taobao.tbk.dg.material.optional` |
| 拼多多 | [多多进宝](https://jinbao.pinduoduo.com) + [开放平台](https://open.pinduoduo.com) | `pdd.ddk.goods.search` |
| 1688 | [1688 开放平台](https://open.1688.com)，需企业资质 | 暂未接入 |
| 美团 | 无公开商品搜索接口 | 只能手动填价 |

拿到 Key 后按 `server/README.md` 部署代理（Cloudflare Worker 免费），然后网页右上角「设置」填代理地址。没填 Key 时代理返回「演示数据」，网页会明确标注。

## 已知限制
- 拼多多、美团网页版通常要登录 / 滑块验证才显示结果，手机上用「App」按钮更顺。
- 1688 搜索页用 `charset=utf8` 参数传中文；若出现乱码，在 1688 页面里重新输入关键词即可。
- 联盟接口返回的是推广商品，可能不含全部店铺；价格以平台下单页为准。
- 本站只比价，**不下单、不付款**。

## 开源协议
MIT，可随意下载、修改、部署。
