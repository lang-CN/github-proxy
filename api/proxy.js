import { createProxyMiddleware } from 'http-proxy-middleware';

const proxy = createProxyMiddleware({
  target: 'https://github.com',
  changeOrigin: true,
  pathRewrite: {
    // 移除路径中的 "/api/proxy" 前缀
    '^/api/proxy': '',
  },
  // 处理特殊的 Git 协议头
  onProxyReq: (proxyReq, req, res) => {
    // 保留原始请求头
    if (req.headers.authorization) {
      proxyReq.setHeader('Authorization', req.headers.authorization);
    }
    // 处理 Git 推送所需的内容长度头
    if (req.headers['content-length']) {
      proxyReq.setHeader('Content-Length', req.headers['content-length']);
    }
  },
  // 延长超时时间（Vercel 最大支持 10 秒）
  timeout: 10000,
});

export default function handler(req, res) {
  // 允许跨域请求
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // 处理 OPTIONS 预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // 执行代理
  return proxy(req, res, (err) => {
    if (err) {
      console.error('Proxy error:', err);
      return res.status(500).json({ error: '代理请求失败', details: err.message });
    }
  });
}
    