const { createProxyMiddleware } = require('http-proxy-middleware');

const backendTarget = process.env.REACT_APP_PROXY_TARGET || 'http://127.0.0.1:5000';

module.exports = function setupProxy(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: backendTarget,
      changeOrigin: true,
      secure: false
    })
  );

  app.use(
    '/uploads',
    createProxyMiddleware({
      target: backendTarget,
      changeOrigin: true,
      secure: false
    })
  );

  app.use(
    '/socket.io',
    createProxyMiddleware({
      target: backendTarget,
      changeOrigin: true,
      secure: false,
      ws: true,
      logLevel: 'warn'
    })
  );
};
