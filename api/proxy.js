import { createProxyMiddleware } from 'http-proxy-middleware';

// 配置 Git 代理（针对 GitHub 的 HTTPS 地址）
const proxy = createProxyMiddleware({
  target: 'https://github.com',
  changeOrigin: true,
  pathRewrite: {
    '^/api/proxy': '', // 移除代理路径前缀
  },
  // 支持 Git 所需的 HTTP 方法（包括 PUT、POST 等用于 push 的方法）
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  // 保留原始请求头（尤其是认证信息）
  preserveHeaderKeyCase: true,
  headers: {
    'User-Agent': 'git/2.30.0', // 模拟 Git 客户端 UA，避免被拒绝
  },
  // 处理大文件推送（需注意 Vercel 函数超时限制）
  onProxyReq: (proxyReq, req, res) => {
    // 传递认证信息（如 GitHub 的 token）
    if (req.headers.authorization) {
      proxyReq.setHeader('Authorization', req.headers.authorization);
    }
  },
  // 延长超时时间（Vercel 最大超时为 10 秒，大型推送可能失败）
  timeout: 10000,
});

export default function handler(req, res) {
  // 允许跨域（可选，根据需求配置）
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  
  // 处理 OPTIONS 预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // 执行代理
  return proxy(req, res);
}
    