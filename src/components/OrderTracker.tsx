import { useState } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  updateStatus,
  CARRIER_SYNC_INTERVAL_SECONDS,
  MAX_WEBHOOK_RETRIES,
  STATUSES,
  type TrackingUpdate,
} from "@/lib/tracking";

export const OrderTracker = () => {
  const [statusIndex, setStatusIndex] = useState(0);
  const [update, setUpdate] = useState<TrackingUpdate | null>(null);

  // const simulateCarrierUpdate = () => {
  //   const nextIndex = Math.min(statusIndex + 1, STATUSES.length - 1);
  //   setStatusIndex(nextIndex);
  //   setUpdate(updateStatus("demo-order-001", STATUSES[nextIndex]));
  // };

  const simulateCarrierUpdate = () => {
    const nextIndex = Math.min(statusIndex + 1, STATUSES.length - 1);
    setError(null);
  
    try {
      const nextUpdate = updateStatus("demo-order-001", STATUSES[nextIndex]);
  
      // Advance the displayed status only after validation succeeds.
      setUpdate(nextUpdate);
      setStatusIndex(nextIndex);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to update order status"
      );
    }
  };

  const [error, setError] = useState<string | null>(null);

  // const reset = () => {
  //   setStatusIndex(0);
  //   setUpdate(null);
  // };

  const reset = () => {
    setStatusIndex(0);
    setUpdate(null);
    setError(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Tracking Demo</CardTitle>
        <CardDescription>
          Powered by src/lib/tracking.ts — carrier sync every{" "}
          {CARRIER_SYNC_INTERVAL_SECONDS}s, webhook retries up to{" "}
          {MAX_WEBHOOK_RETRIES}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((status, i) => (
            <Badge
              key={status}
              variant={i <= statusIndex ? "default" : "secondary"}
            >
              {status.replace(/_/g, " ")}
            </Badge>
          ))}
        </div>

        <div className="flex gap-2">
          <Button
            onClick={simulateCarrierUpdate}
            disabled={statusIndex >= STATUSES.length - 1}
          >
            Simulate Carrier Update
          </Button>
          <Button variant="outline" onClick={reset}>
            Reset
          </Button>
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        {update && (
          <p className="text-sm">
            Status: <strong>{update.status.replace(/_/g, " ")}</strong> — ETA:{" "}
            <strong>{update.etaMinutes} min</strong>
          </p>
        )}
      </CardContent>
    </Card>
  );
};
