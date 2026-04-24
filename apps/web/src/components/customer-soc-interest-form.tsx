"use client";

import { startTransition, useState } from "react";
import { useToast } from "./ui";

type SocInterest = {
  useCase: string;
  companySize: string;
  contactPreference: string;
  notes: string;
};

export function CustomerSocInterestForm(props: {
  initialInterest: Record<string, unknown> | null;
}) {
  const [form, setForm] = useState<SocInterest>({
    useCase: "",
    companySize: "",
    contactPreference: "email",
    notes: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const { pushToast } = useToast();

  if (props.initialInterest?.submittedAt) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-black/10 px-5 py-5">
        <p className="text-sm font-medium text-[var(--foreground)]">Interest already captured</p>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Submitted on {String(props.initialInterest.submittedAt)}. The Phase 4 slice keeps this
          persisted in the customer profile payload for later admin visibility.
        </p>
      </div>
    );
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitting(true);
        startTransition(async () => {
          try {
            const response = await fetch("/api/v1/me/soc-interest", {
              method: "POST",
              headers: {
                "content-type": "application/json"
              },
              body: JSON.stringify(form)
            });
            const payload = (await response.json()) as {
              ok: boolean;
              error?: { message?: string };
            };

            if (!response.ok || !payload.ok) {
              throw new Error(payload.error?.message ?? "SOC interest submission failed");
            }

            pushToast({
              title: "SOC interest recorded",
              message: "The customer workspace now has a persisted SOC-interest record."
            });
          } catch (error) {
            pushToast({
              title: "Submission failed",
              message: error instanceof Error ? error.message : "Unexpected error"
            });
          } finally {
            setSubmitting(false);
          }
        });
      }}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium text-[var(--foreground)]">Primary use case</span>
          <textarea
            value={form.useCase}
            rows={4}
            onChange={(event) => setForm((current) => ({ ...current, useCase: event.target.value }))}
            className="w-full rounded-2xl border border-[var(--border)] bg-black/20 px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]"
          />
        </label>
        <div className="space-y-4">
          <label className="space-y-2">
            <span className="text-sm font-medium text-[var(--foreground)]">Company size</span>
            <input
              value={form.companySize}
              onChange={(event) =>
                setForm((current) => ({ ...current, companySize: event.target.value }))
              }
              className="w-full rounded-2xl border border-[var(--border)] bg-black/20 px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-[var(--foreground)]">Contact preference</span>
            <select
              value={form.contactPreference}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  contactPreference: event.target.value
                }))
              }
              className="w-full rounded-2xl border border-[var(--border)] bg-black/20 px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]"
            >
              <option value="email">Email</option>
              <option value="phone">Phone</option>
              <option value="either">Either</option>
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-[var(--foreground)]">Additional notes</span>
            <textarea
              value={form.notes}
              rows={4}
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
              className="w-full rounded-2xl border border-[var(--border)] bg-black/20 px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]"
            />
          </label>
        </div>
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-medium text-black disabled:opacity-60"
      >
        {submitting ? "Submitting…" : "Submit SOC interest"}
      </button>
    </form>
  );
}
