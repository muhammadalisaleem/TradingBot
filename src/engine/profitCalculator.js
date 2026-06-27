export function calculateNetProfit({ mexcBidPrice, quantity, dexBuyCostUsd, dexSlippageUsd = 0, networkFeeUsd = 0, mexcFeeUsd = 0, refillFeeUsd = 0 }) {
  const sellProceeds = Number(mexcBidPrice || 0) * Number(quantity || 0);
  return sellProceeds - Number(dexBuyCostUsd || 0) - Number(dexSlippageUsd || 0) - Number(networkFeeUsd || 0) - Number(mexcFeeUsd || 0) - Number(refillFeeUsd || 0);
}
