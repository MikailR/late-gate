/**
 * Pro-rata LP share math mirrored by LateGateVault.sol.
 * First deposit is 1:1. Premiums/payouts move assets without mint/burn.
 */

export function sharesForDeposit(assets: bigint, totalShares: bigint, totalAssets: bigint): bigint {
  if (assets <= 0n) throw new Error("assets must be positive");
  if (totalShares > 0n && totalAssets === 0n) {
    throw new Error("insolvent");
  }
  if (totalShares === 0n || totalAssets === 0n) return assets;
  return (assets * totalShares) / totalAssets;
}

export function sharesForWithdraw(assets: bigint, totalShares: bigint, totalAssets: bigint): bigint {
  if (assets <= 0n) throw new Error("assets must be positive");
  if (totalAssets === 0n || totalShares === 0n) throw new Error("empty vault");
  if (assets > totalAssets) throw new Error("insufficient assets");
  const shares = (assets * totalShares) / totalAssets;
  if (shares === 0n) throw new Error("assets too small");
  return shares;
}

export function assetsForShares(shares: bigint, totalShares: bigint, totalAssets: bigint): bigint {
  if (shares < 0n) throw new Error("shares must be >= 0");
  if (totalShares === 0n) return shares;
  return (shares * totalAssets) / totalShares;
}
