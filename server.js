const express = require('express');
const https = require('https');
const path = require('path');
const app = express();

const AT_TOKEN = process.env.AIRTABLE_TOKEN;
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Serve static files from root directory
app.use(express.static(__dirname));

// Proxy endpoint for Airtable
app.all('/api/airtable/*', (req, res) => {
  const atPath = req.path.replace('/api/airtable', '');
  const query = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
  const url = `https://api.airtable.com/v0${atPath}${query}`;

  const options = {
    method: req.method,
    headers: {
      'Authorization': `Bearer ${AT_TOKEN}`,
      'Content-Type': 'application/json'
    }
  };

  const proxyReq = https.request(url, options, (proxyRes) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    res.status(proxyRes.statusCode);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (e) => res.status(500).json({ error: e.message }));

  if (req.body && Object.keys(req.body).length > 0) {
    proxyReq.write(JSON.stringify(req.body));
  }
  proxyReq.end();
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
