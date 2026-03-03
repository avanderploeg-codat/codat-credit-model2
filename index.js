const express = require('express');
const https = require('https');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'static')));

// ── Codat fetch helper ────────────────────────────────────────────────────────
// CODAT_API_KEY should be the full "Basic xxxxxxxx==" Authorization header value
function codatFetch(apiPath, method, body) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'api.codat.io',
      path: apiPath,
      method: method || 'GET',
      headers: {
        Authorization:
          'Basic OWRlMnhpblQ2SWs0MlVqa01PUkQzd1phYldNckNIYWZ2SElKTjZHRw==',
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    };
    if (bodyStr) options.headers['Content-Length'] = Buffer.byteLength(bodyStr);

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let parsed;
        try {
          parsed = JSON.parse(data);
        } catch (e) {
          parsed = data;
        }
        resolve({ status: res.statusCode, data: parsed });
      });
    });
    req.on('error', reject);
    req.setTimeout(20000, () => {
      req.destroy();
      reject(new Error('Codat API timeout'));
    });
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

// ── API Routes ────────────────────────────────────────────────────────────────

// GET /api/companies — list all companies
app.get('/api/companies', async (req, res) => {
  try {
    const page = req.query.page || 1;
    const pageSize = req.query.pageSize || 10;
    const query = req.query.query || '';
    let apiPath = `/companies?page=${page}&pageSize=${pageSize}`;
    if (query) apiPath += `&query=${encodeURIComponent(query)}`;
    const result = await codatFetch(apiPath, 'GET');
    console.log('Codat status:', result.status);
    console.log('Codat response:', JSON.stringify(result.data));
    res.status(result.status).json(result.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/companies/:id — get a single company
app.get('/api/companies/:id', async (req, res) => {
  try {
    const result = await codatFetch(`/companies/${req.params.id}`, 'GET');
    res.status(result.status).json(result.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Serve frontend for all other routes ───────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'static', 'index.html'));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
