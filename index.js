const express = require('express');
const https   = require('https');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'static')));

// ── Codat fetch helper ────────────────────────────────────────────────────────
function codatFetch(apiPath, method, body) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'api.codat.io',
      path:     apiPath,
      method:   method || 'GET',
      headers: {
        'Authorization': process.env.CODAT_API_KEY,
        'Accept':        'application/json',
        'Content-Type':  'application/json',
      },
    };
    if (bodyStr) options.headers['Content-Length'] = Buffer.byteLength(bodyStr);
    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let parsed;
        try { parsed = JSON.parse(data); } catch (e) { parsed = data; }
        resolve({ status: res.statusCode, data: parsed });
      });
    });
    req.on('error', reject);
    req.setTimeout(20000, () => { req.destroy(); reject(new Error('Codat API timeout')); });
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

// ── Companies ─────────────────────────────────────────────────────────────────
app.get('/api/companies', async (req, res) => {
  try {
    const page     = req.query.page     || 1;
    const pageSize = req.query.pageSize || 10;
    const query    = req.query.query    || '';
    let apiPath    = `/companies?page=${page}&pageSize=${pageSize}`;
    if (query) apiPath += `&query=${encodeURIComponent(query)}`;
    const result = await codatFetch(apiPath, 'GET');
    res.status(result.status).json(result.data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/companies/:id', async (req, res) => {
  try {
    const result = await codatFetch(`/companies/${req.params.id}`, 'GET');
    res.status(result.status).json(result.data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Financial Summary ─────────────────────────────────────────────────────────

// Categorized P&L — returns accounts with Codat's standard category taxonomy
app.get('/api/companies/:id/financials/pl', async (req, res) => {
  try {
    const reportDate = req.query.reportDate || getTodayDate();
    const numberOfPeriods = req.query.numberOfPeriods || 24;
    const apiPath = `/lending/companies/${req.params.id}/reports/enhancedProfitAndLoss/accounts?reportDate=${reportDate}&numberOfPeriods=${numberOfPeriods}`;
    const result = await codatFetch(apiPath, 'GET');
    res.status(result.status).json(result.data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Categorized Balance Sheet
app.get('/api/companies/:id/financials/bs', async (req, res) => {
  try {
    const reportDate = req.query.reportDate || getTodayDate();
    const numberOfPeriods = req.query.numberOfPeriods || 24;
    const apiPath = `/lending/companies/${req.params.id}/reports/enhancedBalanceSheet/accounts?reportDate=${reportDate}&numberOfPeriods=${numberOfPeriods}`;
    const result = await codatFetch(apiPath, 'GET');
    res.status(result.status).json(result.data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function getTodayDate() {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2,'0');
  const mm = String(now.getMonth()+1).padStart(2,'0');
  const yyyy = now.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

// ── Serve frontend ────────────────────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'static', 'index.html'));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));