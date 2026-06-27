import { Connection, Keypair, VersionedTransaction } from '@solana/web3.js';
import bs58 from 'bs58';

export class JupiterClient {
  constructor({ rpcUrl, walletSecretKey }) {
    this.rpcUrl = rpcUrl;
    this.walletSecretKey = walletSecretKey;
  }

  async getQuote({ inputMint, outputMint, amount, slippageBps = 50 }) {
    const url = new URL('https://quote-api.jup.ag/v6/quote');
    url.search = new URLSearchParams({
      inputMint,
      outputMint,
      amount: String(amount),
      slippageBps: String(slippageBps)
    }).toString();

    const response = await fetch(url, { headers: { accept: 'application/json' } });
    if (!response.ok) {
      throw new Error(`Jupiter quote error ${response.status}`);
    }
    return response.json();
  }

  async executeSwap({ quote, walletPublicKey }) {
    if (!this.walletSecretKey) {
      throw new Error('Solana wallet key is not configured.');
    }

    const response = await fetch('https://quote-api.jup.ag/v6/swap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quoteResponse: quote,
        userPublicKey: walletPublicKey,
        wrapAndUnwrapSol: true
      })
    });

    if (!response.ok) {
      throw new Error(`Jupiter swap error ${response.status}`);
    }

    const swapPayload = await response.json();
    const txBuffer = Buffer.from(swapPayload.swapTransaction, 'base64');
    const tx = VersionedTransaction.deserialize(txBuffer);
    const secretKey = bs58.decode(this.walletSecretKey);
    const signer = Keypair.fromSecretKey(secretKey);
    tx.sign([signer]);

    const connection = new Connection(this.rpcUrl, 'confirmed');
    const signature = await connection.sendRawTransaction(tx.serialize(), { skipPreflight: false });
    return { signature, txId: signature };
  }
}
