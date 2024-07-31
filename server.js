const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve React app
app.use(express.static(path.join(__dirname, 'build')));

// Proxy requests to /api to the JSON server
app.use('/api', createProxyMiddleware({
  target: 'http://localhost:3500',
  changeOrigin: true,
  pathRewrite: {
    '^/api': ''
  }
}));

// Serve React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
