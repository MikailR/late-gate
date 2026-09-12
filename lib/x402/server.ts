import { isMachineTillConfigured, machineTillEnv } from "@/lib/config/env";
import {
  STUB_PAYMENT_HEADER,
  X402_PAYMENT_HEADER,
  type X402Accept,
  type X402Challenge,
  type X402Receipt,
  type X402Resource,
} from "./types";

export { isMachineTillConfigured };

type FacilitatorNetwork = {
  network?: string;
  extra?: { feePayer?: string };
};

type FacilitatorSupported = {
  kinds?: FacilitatorNetwork[];
};

let cachedFeePayer: string | null = null;

/** // status: implemented (fetch + cache). Falls back to stub if facilitator is down. */
export async function facilitatorFeePayer(): Promise<string> {
  if (cachedFeePayer) return cachedFeePayer;
  const env = machineTillEnv();
  try {
    const response = await fetch(`${env.blocky402Url.replace(/\/$/, "")}/supported`, {
      cache: "no-store",
    });
    if (response.ok) {
      const body = (await response.json()) as FacilitatorSupported;
      const hedera = body.kinds?.find((kind) => kind.network === "hedera:testnet");
      if (hedera?.extra?.feePayer) {
        cachedFeePayer = hedera.extra.feePayer;
        return cachedFeePayer;
      }
    }
  } catch {
    // facilitator optional in stub mode
  }
  cachedFeePayer = "stub-fee-payer";
  return cachedFeePayer;
}

export async function snapshotAccepts(): Promise<X402Accept[]> {
  const env = machineTillEnv();
  const feePayer = await facilitatorFeePayer();
  const amount = env.snapshotPriceTinybar.toString();
  return [
    {
      scheme: "exact",
      network: "hedera:testnet",
      maxAmountRequired: amount,
      resource: "/api/oracle/snapshot",
      description: "Official Late Gate flight snapshot",
      payTo: env.houseAccountId ?? "0.0.0",
      asset: "0.0.0",
      extra: {
        feePayer,
        price: { amount, asset: "0.0.0" },
      },
    },
  ];
}

export async function paymentChallenge(resource: X402Resource): Promise<X402Challenge> {
  const accepts = resource === "snapshot" ? await snapshotAccepts() : await snapshotAccepts();
  return {
    x402Version: 1,
    accepts,
    stub: !isMachineTillConfigured(),
  };
}

export type PaymentDecision =
  | { paid: false; challenge: X402Challenge }
  | { paid: true; receipt: X402Receipt };

function header(request: Request, name: string): string | undefined {
  return request.headers.get(name) ?? request.headers.get(name.toUpperCase()) ?? undefined;
}

/**
 * Real path: TODO verify PAYMENT-SIGNATURE with Blocky402 / @x402/next `withX402`.
 * Stub path: `X-Late-Gate-Stub-Pay: 1` (or any PAYMENT-SIGNATURE) when keys are missing.
 * // status: stub implemented; live verify TODO
 */
export async function evaluateSnapshotPayment(
  request: Request,
  flightKey: string,
): Promise<PaymentDecision> {
  const env = machineTillEnv();
  const stubHeader = header(request, STUB_PAYMENT_HEADER);
  const paymentHeader = header(request, X402_PAYMENT_HEADER) ?? header(request, "X-Payment");
  const live = isMachineTillConfigured();

  const presented = Boolean(stubHeader === "1" || stubHeader === "true" || paymentHeader);

  if (!presented) {
    return { paid: false, challenge: await paymentChallenge("snapshot") };
  }

  if (live && paymentHeader && stubHeader !== "1") {
    // TODO(x402): POST paymentHeader to Blocky402 verify/settle, then read hederaTxId.
  }

  const hederaTxId = live
    ? `pending:${Date.now()}`
    : `0.0.0@stub-${Date.now()}`;
  const payer = env.agentAccountId ?? "0.0.stub-agent";

  return {
    paid: true,
    receipt: {
      resource: "snapshot",
      flightKey,
      amountTinybar: env.snapshotPriceTinybar.toString(),
      asset: "0.0.0",
      network: "hedera:testnet",
      hederaTxId,
      payer,
      hashscanUrl: `https://hashscan.io/testnet/transaction/${hederaTxId}`,
      stub: !live,
      paidAt: new Date().toISOString(),
    },
  };
}
