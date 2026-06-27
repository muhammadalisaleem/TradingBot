import crypto from 'crypto';

const BASE_URL = 'https://api.mexc.com/api/v3';

export class MexcClient {
  constructor({ apiKey, secret }) {
    this.apiKey = apiKey;
    this.secret = secret;
  }

  async request(path, { method = 'GET', params = {}, signed = false } = {}) {
    if (signed && (!this.apiKey || !this.secret)) {
      throw new Error('MEXC API credentials are not configured.');
    }

    const url = new URL(`${BASE_URL}${path}`);
    const timestamp = Date.now().toString();
    const queryParams = new URLSearchParams({ ...params, timestamp });

    if (signed) {
      const signature = crypto.createHmac('sha256', this.secret).update(queryParams.toString()).digest('hex');
      queryParams.set('signature', signature);
    }

    url.search = queryParams.toString();

    const headers = {};
    if (signed) {
      headers['X-MEXC-APIKEY'] = this.apiKey;
    }

    const response = await fetch(url, {
      method,
      headers,
      body: method === 'POST' ? queryParams.toString() : undefined
    });

    const text = await response.text();
    let payload;
    try {
      payload = text ? JSON.parse(text) : {};
    } catch {
      payload = text;
    }

    if (!response.ok) {
      throw new Error(`MEXC API error ${response.status}: ${JSON.stringify(payload)}`);
    }

    return payload;
  }

  async getBookTicker(symbol) {
    return this.request('/ticker/bookTicker', { params: { symbol } });
  }

  async getExchangeInfo() {
    return this.request('/exchangeInfo');
  }

  async getAccount() {
    return this.request('/account', { signed: true });
  }

  async createMarketSellOrder(symbol, quantity) {
    return this.request('/order', {
      method: 'POST',
      params: { symbol, side: 'SELL', type: 'MARKET', quantity },
      signed: true
    });
  }

  async getOrder(symbol, orderId) {
    return this.request('/order', { params: { symbol, orderId }, signed: true });
  }

  async getDepositAddress(coin, network = 'SOL') {
    return this.request('/capital/deposit/address', { params: { coin, network }, signed: true });
  }

  async getDepositHistory(coin, startTime) {
    return this.request('/capital/deposit/hisrec', { params: { coin, startTime }, signed: true });
  }
}
