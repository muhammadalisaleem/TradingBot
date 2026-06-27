import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { getDataPath, readJson, writeJson } from '../src/storage/jsonStore.js';
import { runScan } from '../src/engine/hedgeEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

const settingsPath = getDataPath('settings.json');
const tradesPath = getDataPath('trades.json');
const logsPath = getDataPath('logs.json');

if (!fs.existsSync(settingsPath)) {
  writeJson(settingsPath, {
    mode: 'paper',
    scanIntervalMs: 30000,
    minNetProfitUsd: 0.6,
    dailyLossLimitUsd: 100,
    maxConsecutiveFailures: 3,
    symbol: 'SOLUSDT',
    fixedUsdSize: 50,
    inventoryPercent: 20
  });
}
if (!fs.existsSync(tradesPath)) writeJson(tradesPath, []);
if (!fs.existsSync(logsPath)) writeJson(logsPath, []);

function appendLog(entry) {
  const logs = readJson(logsPath, []);
  logs.unshift(entry);
  writeJson(logsPath, logs.slice(0, 200));
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true, status: 'running' });
});

app.get('/api/state', (req, res) => {
  const settings = readJson(settingsPath, {});
  const trades = readJson(tradesPath, []);
  const logs = readJson(logsPath, []);
  res.json({ settings, trades, logs });
});

app.post('/api/settings', (req, res) => {
  const settings = { ...readJson(settingsPath, {}), ...req.body };
  writeJson(settingsPath, settings);
  appendLog({ timestamp: new Date().toISOString(), stage: 'config', level: 'info', message: 'Settings updated', symbol: settings.symbol || 'SOLUSDT' });
  res.json(settings);
});

app.post('/api/trades', (req, res) => {
  const trades = readJson(tradesPath, []);
  const newTrade = {
    id: `trade-${Date.now()}`,
    symbol: req.body.symbol || 'SOLUSDT',
    status: req.body.status || 'queued',
    startedAt: new Date().toISOString(),
    completedAt: null,
    realizedPnLUsd: req.body.realizedPnLUsd || 0,
    note: req.body.note || 'Manually recorded trade'
  };
  trades.unshift(newTrade);
  writeJson(tradesPath, trades.slice(0, 100));
  res.json(newTrade);
});

app.post('/api/logs', (req, res) => {
  const logs = readJson(logsPath, []);
  const entry = {
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    stage: req.body.stage || 'scan',
    level: req.body.level || 'info',
    message: req.body.message || 'Event logged',
    symbol: req.body.symbol || 'SOLUSDT'
  };
  logs.unshift(entry);
  writeJson(logsPath, logs.slice(0, 200));
  res.json(entry);
});

app.post('/api/scan', async (req, res) => {
  try {
    const result = await runScan();
    res.json(result);
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

let scanTimer = null;
function startScanLoop() {
  if (scanTimer) clearInterval(scanTimer);
  const settings = readJson(settingsPath, {});
  const interval = Number(settings.scanIntervalMs || 30000);
  scanTimer = setInterval(() => {
    runScan().catch((error) => {
      appendLog({ timestamp: new Date().toISOString(), stage: 'scan', level: 'error', message: error.message, symbol: 'SOLUSDT' });
    });
  }, interval);
}

startScanLoop();
runScan().catch(() => {});

app.listen(PORT, () => {
  console.log(`MEXC hedge bot UI listening on http://localhost:${PORT}`);
});
