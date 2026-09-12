/** House markup on the fair premium. π = p * B * (1 + λ) */
export const LAMBDA = 0.2;

/** Fixed payout B, shown as dollars on Day 1. */
export const DEFAULT_PAYOUT_USD = 100;

/** Gate-lateness threshold τ in minutes. */
export const DEFAULT_TAU_MINUTES = 60;

/** Refuse CUTOFF when now is past scheduled departure − T. */
export const CUTOFF_HOURS = 8;
