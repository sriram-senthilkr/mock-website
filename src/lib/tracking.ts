import { hasCapturedPayment } from "./payment";

export const CARRIER_SYNC_INTERVAL_SECONDS = 600;
export const ETA_RECALC_THRESHOLD_MINUTES = 30;
export const MAX_WEBHOOK_RETRIES = 5;
export const STATUSES = [
  "placed",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered",
  "returned"
] as const;

export type OrderStatus = (typeof STATUSES)[number];

export class UnknownCarrierEventError extends Error {}
export class PaymentRequiredError extends Error {}

export interface TrackingUpdate {
  orderId: string;
  status: OrderStatus;
  etaMinutes: number;
}

/** Mirrors backend/tracking.py's update_status(): validates the event, then recalculates ETA. */
export function updateStatus(orderId: string, carrierEvent: string): TrackingUpdate {
  if (!STATUSES.includes(carrierEvent as OrderStatus)) {
    throw new UnknownCarrierEventError(`Unrecognized carrier event: ${carrierEvent}`);
  }

  const status = carrierEvent as OrderStatus;
  const requiresPayment =
    status === "packed" ||
    status === "shipped" ||
    status === "out_for_delivery" ||
    status === "delivered";

  if (requiresPayment && !hasCapturedPayment(orderId)) {
    throw new PaymentRequiredError(
      `Order ${orderId} cannot advance to ${status}: payment is not captured`
    );
  }

  return {
    orderId,
    status,
    etaMinutes: recalculateEta(status),
  };
}

/**
 * Mirrors backend/tracking.py's _recalculate_eta(): a simple stand-in that
 * shrinks the estimate as the order moves through STATUSES, snapped to
 * ETA_RECALC_THRESHOLD_MINUTES increments.
 * test comment3
 */
function recalculateEta(status: OrderStatus): number {  

  const remainingSteps = STATUSES.length - 1 - STATUSES.indexOf(status);
  return remainingSteps * ETA_RECALC_THRESHOLD_MINUTES;
}
