const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api/GetResourceGroups',
    createProxyMiddleware({
      target: 'https://func-datalab-resource.azurewebsites.net',
      changeOrigin: true,
      pathRewrite: {
        '^/api': '/api'
      },
      timeout: 60000, // Set timeout to 60 seconds
      proxyTimeout: 60000 // Set proxy timeout to 60 seconds
    })
  );
};
