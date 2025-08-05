const { createProxyMiddleware } = require('http-proxy-middleware');

// 配置 CORS 响应头
const setCorsHeaders = (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // 处理预检请求
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  
  next();
};

// 创建代理配置
const proxyOptions = {
  target: 'https://github.com',
  changeOrigin: true,
  pathRewrite: {
    '^/api/proxy': '', // 移除 URL 中的 /api/proxy 前缀
  },
  followRedirects: true,
  selfHandleResponse: false,
  onProxyReq: (proxyReq, req, res) => {
    // 传递原始请求头
    if (req.headers.authorization) {
      proxyReq.setHeader('Authorization', req.headers.authorization);
    }
    // 处理 Git 推送所需的特殊头
    if (req.headers['content-length']) {
      proxyReq.setHeader('Content-Length', req.headers['content-length']);
    }
  },
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    res.status(500).send('代理服务错误: ' + err.message);
  }
};

// 创建代理中间件
const proxy = createProxyMiddleware(proxyOptions);

// 导出 Vercel 云函数
module.exports = async (req, res) => {
  try {
    // 先处理 CORS
    await new Promise((resolve, reject) => {
      setCorsHeaders(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    // 执行代理
    await new Promise((resolve, reject) => {
      proxy(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  } catch (err) {
    console.error('处理请求时出错:', err);
    res.status(500).send('处理请求时出错: ' + err.message);
  }
};