export function formatUsd(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function roundCents(amount: number): number {
  return Math.round(amount * 100) / 100;
}
