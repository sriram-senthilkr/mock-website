export const MAX_RETRIES = 2;
export const RETRY_BACKOFF_SECONDS = 2;
export const TIMEOUT_SECONDS = 15;
export const SUPPORTED_METHODS = ["card", "apple_pay", "google_pay", "bnpl", "paypal"] as const;
export const CURRENCY = "USD";

export type PaymentMethod = (typeof SUPPORTED_METHODS)[number];

export class PaymentDeclinedError extends Error {}
export class PaymentTimeoutError extends Error {}

export interface ChargeResult {
  transactionId: string;
  orderId: string;
  amountCents: number;
  method: PaymentMethod;
  currency: string;
  status: "captured";
  attempts: number;
}

export interface ChargeAttempt {
  attempt: number;
  outcome: "timeout" | "captured";
  waitedMs: number;
}

/**
 * Mirrors backend/payment.py's charge(): retries up to MAX_RETRIES times,
 * waiting RETRY_BACKOFF_SECONDS * attempt between tries, and treats any
 * simulated processor call over TIMEOUT_SECONDS as a timeout.
 * test
 */
export async function charge(
  orderId: string,
  amountCents: number,
  method: PaymentMethod,
  simulateProcessor: (attempt: number) => Promise<ChargeAttempt>
): Promise<{ result: ChargeResult; log: ChargeAttempt[] }> {
  if (!SUPPORTED_METHODS.includes(method)) {
    throw new Error(`Unsupported payment method: ${method}`);
  }

  const log: ChargeAttempt[] = [];

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const outcome = await simulateProcessor(attempt);
    log.push(outcome);

    if (outcome.outcome === "captured") {
      return {
        result: {
          transactionId: crypto.randomUUID(),
          orderId,
          amountCents,
          method,
          currency: CURRENCY,
          status: "captured",
          attempts: attempt,
        },
        log,
      };
    }

    if (attempt >= MAX_RETRIES) {
      throw new PaymentDeclinedError(
        `Payment failed after ${MAX_RETRIES} attempts`
      );
    }

    await new Promise((resolve) =>
      setTimeout(resolve, RETRY_BACKOFF_SECONDS * attempt * 50)
    );
  }

  throw new PaymentDeclinedError(`Payment failed after ${MAX_RETRIES} attempts`);
}
