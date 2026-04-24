"use client";

import { startTransition, useState } from "react";
import { FormField, useToast } from "./ui";

type ProfileFormState = {
  name: string;
  email: string;
  contactNumber: string;
  countryCode: string;
  country: string;
  state: string;
  companyName: string;
  address: string;
  gstNumber: string;
  taxId: string;
};

export function CustomerProfileForms(props: { initialProfile: ProfileFormState }) {
  const [profile, setProfile] = useState(props.initialProfile);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const { pushToast } = useToast();

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          setSavingProfile(true);
          startTransition(async () => {
            try {
              const response = await fetch("/api/v1/me/profile", {
                method: "PATCH",
                headers: {
                  "content-type": "application/json"
                },
                body: JSON.stringify(profile)
              });
              const payload = (await response.json()) as {
                ok: boolean;
                error?: { message?: string };
              };

              if (!response.ok || !payload.ok) {
                throw new Error(payload.error?.message ?? "Profile update failed");
              }

              pushToast({
                title: "Profile updated",
                message: "Customer profile details were saved."
              });
            } catch (error) {
              pushToast({
                title: "Profile update failed",
                message: error instanceof Error ? error.message : "Unexpected error"
              });
            } finally {
              setSavingProfile(false);
            }
          });
        }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Full name">
            <input
              value={profile.name}
              onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value }))}
              className="w-full rounded-2xl border border-[var(--border)] bg-black/20 px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]"
            />
          </FormField>
          <FormField label="Email" hint="Email change remains locked until OTP-backed profile changes land.">
            <input
              value={profile.email}
              readOnly
              className="w-full rounded-2xl border border-[var(--border)] bg-black/10 px-4 py-3 text-sm text-[var(--muted)] outline-none"
            />
          </FormField>
          <FormField label="Country code">
            <input
              value={profile.countryCode}
              onChange={(event) =>
                setProfile((current) => ({ ...current, countryCode: event.target.value }))
              }
              className="w-full rounded-2xl border border-[var(--border)] bg-black/20 px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]"
            />
          </FormField>
          <FormField label="Contact number">
            <input
              value={profile.contactNumber}
              onChange={(event) =>
                setProfile((current) => ({ ...current, contactNumber: event.target.value }))
              }
              className="w-full rounded-2xl border border-[var(--border)] bg-black/20 px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]"
            />
          </FormField>
          <FormField label="Company name">
            <input
              value={profile.companyName}
              onChange={(event) =>
                setProfile((current) => ({ ...current, companyName: event.target.value }))
              }
              className="w-full rounded-2xl border border-[var(--border)] bg-black/20 px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]"
            />
          </FormField>
          <FormField label="Tax ID">
            <input
              value={profile.taxId}
              onChange={(event) => setProfile((current) => ({ ...current, taxId: event.target.value }))}
              className="w-full rounded-2xl border border-[var(--border)] bg-black/20 px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]"
            />
          </FormField>
          <FormField label="Country">
            <input
              value={profile.country}
              onChange={(event) =>
                setProfile((current) => ({ ...current, country: event.target.value }))
              }
              className="w-full rounded-2xl border border-[var(--border)] bg-black/20 px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]"
            />
          </FormField>
          <FormField label="State">
            <input
              value={profile.state}
              onChange={(event) => setProfile((current) => ({ ...current, state: event.target.value }))}
              className="w-full rounded-2xl border border-[var(--border)] bg-black/20 px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]"
            />
          </FormField>
          <FormField label="GST number">
            <input
              value={profile.gstNumber}
              onChange={(event) =>
                setProfile((current) => ({ ...current, gstNumber: event.target.value }))
              }
              className="w-full rounded-2xl border border-[var(--border)] bg-black/20 px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]"
            />
          </FormField>
          <div className="md:col-span-2">
            <FormField label="Address">
              <textarea
                value={profile.address}
                rows={4}
                onChange={(event) =>
                  setProfile((current) => ({ ...current, address: event.target.value }))
                }
                className="w-full rounded-2xl border border-[var(--border)] bg-black/20 px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]"
              />
            </FormField>
          </div>
        </div>
        <button
          type="submit"
          disabled={savingProfile}
          className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-medium text-black disabled:opacity-60"
        >
          {savingProfile ? "Saving…" : "Save profile"}
        </button>
      </form>

      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          setSavingPassword(true);
          startTransition(async () => {
            try {
              const response = await fetch("/api/v1/me/password", {
                method: "PATCH",
                headers: {
                  "content-type": "application/json"
                },
                body: JSON.stringify(passwordForm)
              });
              const payload = (await response.json()) as {
                ok: boolean;
                error?: { message?: string };
              };

              if (!response.ok || !payload.ok) {
                throw new Error(payload.error?.message ?? "Password update failed");
              }

              setPasswordForm({
                currentPassword: "",
                newPassword: "",
                confirmPassword: ""
              });
              pushToast({
                title: "Password updated",
                message: "Your customer password was changed."
              });
            } catch (error) {
              pushToast({
                title: "Password update failed",
                message: error instanceof Error ? error.message : "Unexpected error"
              });
            } finally {
              setSavingPassword(false);
            }
          });
        }}
      >
        <FormField label="Current password">
          <input
            type="password"
            value={passwordForm.currentPassword}
            onChange={(event) =>
              setPasswordForm((current) => ({
                ...current,
                currentPassword: event.target.value
              }))
            }
            className="w-full rounded-2xl border border-[var(--border)] bg-black/20 px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]"
          />
        </FormField>
        <FormField label="New password">
          <input
            type="password"
            value={passwordForm.newPassword}
            onChange={(event) =>
              setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))
            }
            className="w-full rounded-2xl border border-[var(--border)] bg-black/20 px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]"
          />
        </FormField>
        <FormField label="Confirm new password">
          <input
            type="password"
            value={passwordForm.confirmPassword}
            onChange={(event) =>
              setPasswordForm((current) => ({
                ...current,
                confirmPassword: event.target.value
              }))
            }
            className="w-full rounded-2xl border border-[var(--border)] bg-black/20 px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]"
          />
        </FormField>
        <button
          type="submit"
          disabled={savingPassword}
          className="rounded-full border border-[var(--border)] px-5 py-3 text-sm font-medium text-[var(--foreground)] disabled:opacity-60"
        >
          {savingPassword ? "Updating…" : "Change password"}
        </button>
      </form>
    </div>
  );
}

export function CustomerFeedbackForm() {
  const [form, setForm] = useState({
    rating: 5,
    message: "",
    featureRequest: "",
    repeatUse: "Yes"
  });
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
            const response = await fetch("/api/v1/me/feedback", {
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
              throw new Error(payload.error?.message ?? "Feedback submission failed");
            }

            setForm({
              rating: 5,
              message: "",
              featureRequest: "",
              repeatUse: "Yes"
            });
            pushToast({
              title: "Feedback received",
              message: "Thanks. The submission is now persisted in the Phase 4 workspace."
            });
          } catch (error) {
            pushToast({
              title: "Feedback failed",
              message: error instanceof Error ? error.message : "Unexpected error"
            });
          } finally {
            setSubmitting(false);
          }
        });
      }}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Rating">
          <select
            value={form.rating}
            onChange={(event) =>
              setForm((current) => ({ ...current, rating: Number(event.target.value) }))
            }
            className="w-full rounded-2xl border border-[var(--border)] bg-black/20 px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]"
          >
            {[5, 4, 3, 2, 1].map((value) => (
              <option key={value} value={value}>
                {value} / 5
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Would you use it again?">
          <select
            value={form.repeatUse}
            onChange={(event) =>
              setForm((current) => ({ ...current, repeatUse: event.target.value }))
            }
            className="w-full rounded-2xl border border-[var(--border)] bg-black/20 px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]"
          >
            <option>Yes</option>
            <option>No</option>
            <option>Maybe</option>
          </select>
        </FormField>
      </div>
      <FormField label="Feedback">
        <textarea
          value={form.message}
          rows={4}
          onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
          className="w-full rounded-2xl border border-[var(--border)] bg-black/20 px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]"
        />
      </FormField>
      <FormField label="Feature request">
        <textarea
          value={form.featureRequest}
          rows={4}
          onChange={(event) =>
            setForm((current) => ({ ...current, featureRequest: event.target.value }))
          }
          className="w-full rounded-2xl border border-[var(--border)] bg-black/20 px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]"
        />
      </FormField>
      <button
        type="submit"
        disabled={submitting}
        className="rounded-full border border-[var(--border)] px-5 py-3 text-sm font-medium text-[var(--foreground)] disabled:opacity-60"
      >
        {submitting ? "Submitting…" : "Submit feedback"}
      </button>
    </form>
  );
}
