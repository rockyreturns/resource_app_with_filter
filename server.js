const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS
app.use(cors());

// Proxy requests to /api to the JSON server
app.use('/api', createProxyMiddleware({
  target: 'http://localhost:3500',
  changeOrigin: true,
  pathRewrite: {
    '^/api': '' // Remove '/api' from the request URL
  }
}));

// Serve React app
app.use(express.static(path.join(__dirname, 'build')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
