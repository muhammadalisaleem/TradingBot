import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateNetProfit } from '../src/engine/profitCalculator.js';

test('calculateNetProfit returns expected value', () => {
  const netProfit = calculateNetProfit({
    mexcBidPrice: 2.5,
    quantity: 10,
    dexBuyCostUsd: 20,
    dexSlippageUsd: 1,
    networkFeeUsd: 0.2,
    mexcFeeUsd: 0,
    refillFeeUsd: 0.1
  });

  assert.equal(netProfit, 25 - 20 - 1 - 0.2 - 0 - 0.1);
});

test('calculateNetProfit handles missing values safely', () => {
  const netProfit = calculateNetProfit({});
  assert.equal(netProfit, 0);
});
