// Cloudflare Worker 版本：把 core.js 的内容粘到本文件顶部（或用 wrangler 打包），
// 在 Worker 的 Settings → Variables 里添加 .env.example 中的变量。
// 用 wrangler：npx wrangler deploy（wrangler.toml 已配置好，会自动打包 core.js）
import core from './core.js';
export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET' } });
    const r = await core.handle(new URL(request.url), env);
    return new Response(r.body, { status: r.status, headers: r.headers });
  }
};
