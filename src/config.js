import dotenv from 'dotenv';

dotenv.config();

export const config = {
  mode: process.env.BOT_MODE || 'paper',
  scanIntervalMs: Number(process.env.SCAN_INTERVAL_MS || 30000),
  minNetProfitUsd: Number(process.env.MIN_NET_PROFIT_USD || 0.6),
  dailyLossLimitUsd: Number(process.env.DAILY_LOSS_LIMIT_USD || 100),
  maxConsecutiveFailures: Number(process.env.MAX_CONSECUTIVE_FAILURES || 3),
  mexcApiKey: process.env.MEXC_API_KEY || '',
  mexcSecret: process.env.MEXC_SECRET || '',
  solanaRpcUrl: process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
  solanaWalletKey: process.env.SOL_WALLET_KEY || '',
  jupiterEnabled: process.env.JUPITER_ENABLED === 'true',
  enableLiveTrading: process.env.ENABLE_LIVE_TRADING === 'true',
  defaultSlippageBps: Number(process.env.DEFAULT_SLIPPAGE_BPS || 50),
  defaultInputMint: process.env.DEFAULT_INPUT_MINT || 'So11111111111111111111111111111111111111112',
  defaultNetwork: process.env.DEFAULT_NETWORK || 'solana'
};

export function getConfig() {
  return config;
}
