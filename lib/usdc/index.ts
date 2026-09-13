/**
 * Prize till — USDC on World Chain Sepolia (chain id 4801).
 * Named exports Proto 3 / the World Mini App should import.
 * Hedera x402 and Base ledger stay in-tree but are PARKED / not prize-critical.
 */

export {
  CIRCLE_USDC_FAUCET,
  ERC20_TRANSFER_ABI,
  STUB_TRAVELER_ADDRESS,
  USDC_DECIMALS,
  USDC_MAINNET_ADDRESS,
  USDC_SEPOLIA_ADDRESS,
  WORLDCHAIN_MAINNET_CHAIN_ID,
  WORLDCHAIN_SEPOLIA_CHAIN_ID,
  WORLDCHAIN_SEPOLIA_EXPLORER,
  WORLDCHAIN_SEPOLIA_PUBLIC_RPC,
  WORLDSCAN_SEPOLIA_EXPLORER,
  ZERO_ADDRESS,
  explorerTxUrl,
  type WorldchainNetwork,
} from "./chain";

export {
  USDC_UNITS_PER_CENT,
  USDC_UNITS_PER_DOLLAR,
  UsdcAmountException,
  centsToUsdcUnits,
  dollarsToUsdcUnits,
  formatUsdcUnits,
  usdcUnitsToCents,
  usdcUnitsToDollars,
} from "./amount";

export {
  isUsdcLiveConfigured,
  isUsdcLiveEnv,
  isUsdcTillConfigured,
  lpDeposit,
  lpWithdraw,
  payPremium,
  payout,
  usdcTill,
} from "./client";

export { LATE_GATE_VAULT_ABI } from "./vault-abi";
export { assetsForShares, sharesForDeposit, sharesForWithdraw } from "./shares";
export { isLiveTxHash, normalizePrivateKey } from "./live";

export type {
  LpDepositInput,
  LpRole,
  LpWithdrawInput,
  PayPremiumInput,
  PayoutInput,
  UsdcExecEnv,
  UsdcExecOptions,
  UsdcFailure,
  UsdcOp,
  UsdcOpError,
  UsdcReceipt,
  UsdcResult,
  UsdcTill,
  VaultSender,
  VaultWriteCall,
} from "./types";

export type { VaultWriteFn } from "./vault-abi";
