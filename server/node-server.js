// 本地 / 云服务器运行：  node node-server.js   （Node 18+，零依赖）
// 环境变量见 .env.example；可以 `cp .env.example .env` 后填写
const http = require('http'); const fs = require('fs'); const path = require('path');
const { handle } = require('./core.js');
const envFile = path.join(__dirname, '.env');
if (fs.existsSync(envFile)) for (const l of fs.readFileSync(envFile, 'utf8').split('\n')) { const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2]; }
const PORT = process.env.PORT || 8787;
http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') { res.writeHead(204, { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET' }); return res.end(); }
  const r = await handle(new URL(req.url, 'http://x'), process.env);
  res.writeHead(r.status, r.headers); res.end(r.body);
}).listen(PORT, () => console.log('价格代理已启动 http://localhost:' + PORT + '/api/health'));
