const express = require('express');
const app = express();
const port = 5000;

app.get('/api/test', (req, res) => {
  res.json({ message: 'Proxy is working!' });
});

app.listen(port, () => {
  console.log(`Test server running at http://localhost:${port}`);
});
