"use client";

import { startTransition, useState } from "react";
import { useToast } from "./ui";

type NotificationState = {
  paymentSuccess: boolean;
  paymentFailure: boolean;
  paymentPending: boolean;
  scanStarted: boolean;
  scanCompleted: boolean;
  scanFailed: boolean;
  targetCreated: boolean;
  targetDeleted: boolean;
  ticketCreated: boolean;
  ticketUpdated: boolean;
  vulnerabilityNotifications: boolean;
  globalUnsub: boolean;
};

const preferenceMeta: Array<{ key: keyof NotificationState; label: string; description: string }> = [
  { key: "paymentSuccess", label: "Payment success", description: "Successful purchase and renewal notifications." },
  { key: "paymentFailure", label: "Payment failure", description: "Failed billing attempts and follow-up reminders." },
  { key: "paymentPending", label: "Payment pending", description: "Pending orders that still need completion." },
  { key: "scanStarted", label: "Scan started", description: "Start events for long-running workflows." },
  { key: "scanCompleted", label: "Scan completed", description: "Completion summaries for finished scans." },
  { key: "scanFailed", label: "Scan failed", description: "Failure and retry-needed events." },
  { key: "targetCreated", label: "Target created", description: "Notifications for new monitored assets." },
  { key: "targetDeleted", label: "Target deleted", description: "Notifications when assets are removed." },
  { key: "ticketCreated", label: "Ticket created", description: "Support ticket creation acknowledgements." },
  { key: "ticketUpdated", label: "Ticket updated", description: "Replies and status updates for support work." },
  { key: "vulnerabilityNotifications", label: "Vulnerability alerts", description: "New issue and severity-change notifications." },
  { key: "globalUnsub", label: "Global unsubscribe", description: "Stops all future optional notifications." }
];

export function CustomerNotificationForm(props: { initialPreferences: NotificationState }) {
  const [preferences, setPreferences] = useState(props.initialPreferences);
  const [submitting, setSubmitting] = useState(false);
  const { pushToast } = useToast();

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitting(true);
        startTransition(async () => {
          try {
            const response = await fetch("/api/v1/me/notification-preferences", {
              method: "PUT",
              headers: {
                "content-type": "application/json"
              },
              body: JSON.stringify(preferences)
            });
            const payload = (await response.json()) as {
              ok: boolean;
              error?: { message?: string };
            };

            if (!response.ok || !payload.ok) {
              throw new Error(payload.error?.message ?? "Notification update failed");
            }

            pushToast({
              title: "Preferences updated",
              message: "Mail delivery preferences were saved."
            });
          } catch (error) {
            pushToast({
              title: "Update failed",
              message: error instanceof Error ? error.message : "Unexpected error"
            });
          } finally {
            setSubmitting(false);
          }
        });
      }}
    >
      <div className="grid gap-3">
        {preferenceMeta.map((item) => (
          <label
            key={item.key}
            className="flex items-start justify-between gap-4 rounded-2xl border border-[var(--border)] bg-black/10 px-4 py-4"
          >
            <div>
              <p className="text-sm font-medium text-[var(--foreground)]">{item.label}</p>
              <p className="mt-1 text-sm text-[var(--muted)]">{item.description}</p>
            </div>
            <input
              type="checkbox"
              checked={preferences[item.key]}
              onChange={(event) =>
                setPreferences((current) => ({
                  ...current,
                  [item.key]: event.target.checked
                }))
              }
              className="mt-1 h-4 w-4 rounded border-[var(--border)] bg-black/20"
            />
          </label>
        ))}
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-medium text-black disabled:opacity-60"
      >
        {submitting ? "Saving…" : "Save notification preferences"}
      </button>
    </form>
  );
}
