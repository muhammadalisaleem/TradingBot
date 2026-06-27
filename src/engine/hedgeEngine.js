import { getConfig } from '../config.js';
import { calculateNetProfit } from './profitCalculator.js';
import { MexcClient } from '../exchanges/mexcClient.js';
import { JupiterClient } from '../dex/jupiterClient.js';
import { getDataPath, readJson, writeJson } from '../storage/jsonStore.js';

const settingsPath = getDataPath('settings.json');
const tradesPath = getDataPath('trades.json');
const logsPath = getDataPath('logs.json');

function appendLog(entry) {
  const logs = readJson(logsPath, []);
  logs.unshift(entry);
  writeJson(logsPath, logs.slice(0, 200));
}

function saveTrade(trade) {
  const trades = readJson(tradesPath, []);
  trades.unshift(trade);
  writeJson(tradesPath, trades.slice(0, 100));
}

export async function runScan() {
  const config = getConfig();
  const settings = readJson(settingsPath, {});
  const symbol = settings.symbol || 'SOLUSDT';
  const mexc = new MexcClient({ apiKey: config.mexcApiKey, secret: config.mexcSecret });
  const jupiter = new JupiterClient({ rpcUrl: config.solanaRpcUrl, walletSecretKey: config.solanaWalletKey });

  try {
    const bookTicker = await mexc.getBookTicker(symbol);
    const bidPrice = Number(bookTicker.bidPrice || 0);
    const quantity = 1;

    let quote = null;
    let quoteError = null;
    if (config.jupiterEnabled && config.defaultInputMint && config.defaultOutputMint) {
      try {
        quote = await jupiter.getQuote({
          inputMint: config.defaultInputMint,
          outputMint: config.defaultOutputMint,
          amount: 1_000_000,
          slippageBps: config.defaultSlippageBps
        });
      } catch (error) {
        quoteError = error.message;
      }
    }

    const estimatedDexCostUsd = quote ? Number(quote.inAmount || 0) / 1e6 : 0;
    const netProfit = calculateNetProfit({
      mexcBidPrice: bidPrice,
      quantity,
      dexBuyCostUsd: estimatedDexCostUsd,
      dexSlippageUsd: 0,
      networkFeeUsd: 0.0001,
      mexcFeeUsd: 0,
      refillFeeUsd: 0
    });
    const threshold = Number(settings.minNetProfitUsd || config.minNetProfitUsd);
    const shouldTrade = netProfit >= threshold;

    const trade = {
      id: `trade-${Date.now()}`,
      symbol,
      status: shouldTrade ? 'ready' : 'skipped',
      startedAt: new Date().toISOString(),
      completedAt: null,
      realizedPnLUsd: netProfit,
      note: quoteError ? `Scan complete; quote warning: ${quoteError}` : 'Scan complete'
    };
    saveTrade(trade);
    appendLog({
      timestamp: new Date().toISOString(),
      stage: 'scan',
      level: shouldTrade ? 'info' : 'warn',
      message: shouldTrade ? `Opportunity met threshold (${netProfit.toFixed(4)} USD)` : `Profit below threshold (${netProfit.toFixed(4)} USD)`,
      symbol
    });
    return { ok: true, reason: shouldTrade ? 'opportunity' : 'below-threshold', netProfit, quoteError };
  } catch (error) {
    appendLog({ timestamp: new Date().toISOString(), stage: 'scan', level: 'error', message: error.message, symbol });
    return { ok: false, error: error.message };
  }
}
