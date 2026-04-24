"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
  type ReactNode
} from "react";

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function PageHeader(props: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-[var(--border)] pb-6 md:flex-row md:items-end md:justify-between">
      <div className="space-y-2">
        {props.eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
            {props.eyebrow}
          </p>
        ) : null}
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--foreground)] md:text-4xl">
          {props.title}
        </h1>
        {props.description ? (
          <p className="max-w-3xl text-sm leading-6 text-[var(--muted)] md:text-base">
            {props.description}
          </p>
        ) : null}
      </div>
      {props.actions ? <div className="flex flex-wrap gap-3">{props.actions}</div> : null}
    </div>
  );
}

export function PageSection(props: PropsWithChildren<{ title?: string; description?: string }>) {
  return (
    <section className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.18)]">
      {props.title ? (
        <div className="mb-5 space-y-1">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">{props.title}</h2>
          {props.description ? (
            <p className="text-sm text-[var(--muted)]">{props.description}</p>
          ) : null}
        </div>
      ) : null}
      {props.children}
    </section>
  );
}

export function StatusBadge(props: {
  status: string;
  tone?: "neutral" | "success" | "warning" | "danger";
}) {
  const toneClass =
    props.tone === "success"
      ? "bg-emerald-400/15 text-emerald-200"
      : props.tone === "warning"
        ? "bg-amber-300/15 text-amber-100"
        : props.tone === "danger"
          ? "bg-rose-400/15 text-rose-200"
          : "bg-white/8 text-white/80";

  return (
    <span
      className={cx(
        "inline-flex rounded-full px-3 py-1 text-xs font-medium uppercase tracking-[0.16em]",
        toneClass
      )}
    >
      {props.status}
    </span>
  );
}

export function EmptyState(props: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--border)] bg-black/10 px-6 py-10 text-center">
      <h3 className="text-lg font-semibold text-[var(--foreground)]">{props.title}</h3>
      <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
        {props.description}
      </p>
      {props.action ? <div className="mt-5 flex justify-center">{props.action}</div> : null}
    </div>
  );
}

export function DataTable(props: {
  columns: string[];
  rows: Array<Array<ReactNode>>;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)]">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead className="bg-black/20 text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
            <tr>
              {props.columns.map((column) => (
                <th key={column} className="px-4 py-3 font-medium">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {props.rows.length === 0 ? (
              <tr>
                <td
                  colSpan={props.columns.length}
                  className="px-4 py-6 text-center text-[var(--muted)]"
                >
                  No rows available.
                </td>
              </tr>
            ) : (
              props.rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-t border-[var(--border)]">
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="px-4 py-4 text-[var(--foreground)]">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function FormField(props: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-[var(--foreground)]">{props.label}</span>
      {props.children}
      {props.hint ? <span className="text-xs text-[var(--muted)]">{props.hint}</span> : null}
    </label>
  );
}

export function InputField(props: {
  type?: string;
  placeholder?: string;
  defaultValue?: string;
}) {
  return (
    <input
      type={props.type ?? "text"}
      placeholder={props.placeholder}
      defaultValue={props.defaultValue}
      className="w-full rounded-2xl border border-[var(--border)] bg-black/20 px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]"
    />
  );
}

export function PasswordField(props: { placeholder?: string }) {
  return <InputField type="password" placeholder={props.placeholder} />;
}

export function SelectField(props: { options: string[] }) {
  return (
    <select className="w-full rounded-2xl border border-[var(--border)] bg-black/20 px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]">
      {props.options.map((option) => (
        <option key={option}>{option}</option>
      ))}
    </select>
  );
}

export function TextAreaField(props: { placeholder?: string; rows?: number }) {
  return (
    <textarea
      placeholder={props.placeholder}
      rows={props.rows ?? 4}
      className="w-full rounded-2xl border border-[var(--border)] bg-black/20 px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]"
    />
  );
}

export function OtpInput() {
  return (
    <div className="grid grid-cols-6 gap-2">
      {Array.from({ length: 6 }).map((_, index) => (
        <input
          key={index}
          inputMode="numeric"
          maxLength={1}
          className="h-12 rounded-2xl border border-[var(--border)] bg-black/20 text-center text-lg text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
        />
      ))}
    </div>
  );
}

export function FileDropzone(props: { label?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--border)] bg-black/10 px-6 py-10 text-center text-sm text-[var(--muted)]">
      {props.label ?? "Drop files here or click to upload"}
    </div>
  );
}

type ToastRecord = { id: number; title: string; message?: string };
type ToastContextValue = {
  pushToast: (toast: Omit<ToastRecord, "id">) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider(props: PropsWithChildren) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const value = useMemo<ToastContextValue>(
    () => ({
      pushToast(toast: Omit<ToastRecord, "id">) {
        const id = Date.now() + Math.floor(Math.random() * 1000);
        setToasts((current: ToastRecord[]) => [...current, { id, ...toast }]);
        window.setTimeout(() => {
          setToasts((current: ToastRecord[]) =>
            current.filter((item: ToastRecord) => item.id !== id)
          );
        }, 3500);
      }
    }),
    []
  );

  return (
    <ToastContext.Provider value={value}>
      {props.children}
      <div className="pointer-events-none fixed bottom-6 right-6 z-50 flex w-full max-w-sm flex-col gap-3">
        {toasts.map((toast: ToastRecord) => (
          <div
            key={toast.id}
            className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] px-4 py-3 shadow-xl"
          >
            <p className="text-sm font-semibold text-[var(--foreground)]">{toast.title}</p>
            {toast.message ? (
              <p className="mt-1 text-sm text-[var(--muted)]">{toast.message}</p>
            ) : null}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const value = useContext(ToastContext);

  if (!value) {
    throw new Error("useToast must be used inside ToastProvider");
  }

  return value;
}

export function Modal(props: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-2xl">
      <h3 className="text-lg font-semibold text-[var(--foreground)]">{props.title}</h3>
      {props.description ? (
        <p className="mt-2 text-sm text-[var(--muted)]">{props.description}</p>
      ) : null}
      <div className="mt-5">{props.children}</div>
    </div>
  );
}

export function ConfirmDialog(props: {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
}) {
  return (
    <Modal title={props.title} description={props.description}>
      <div className="flex gap-3">
        <button className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-black">
          {props.confirmLabel ?? "Confirm"}
        </button>
        <button className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)]">
          {props.cancelLabel ?? "Cancel"}
        </button>
      </div>
    </Modal>
  );
}

export function Pagination(props: { currentPage: number; totalPages: number }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-[var(--border)] px-4 py-3 text-sm text-[var(--muted)]">
      <span>
        Page {props.currentPage} of {props.totalPages}
      </span>
      <div className="flex gap-2">
        <button className="rounded-full border border-[var(--border)] px-3 py-1.5">Previous</button>
        <button className="rounded-full border border-[var(--border)] px-3 py-1.5">Next</button>
      </div>
    </div>
  );
}

export function SearchFilterBar(props: { children?: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-black/10 p-4 md:flex-row md:items-center md:justify-between">
      <div className="flex-1">
        <InputField placeholder="Search…" />
      </div>
      <div className="flex flex-wrap gap-3">{props.children}</div>
    </div>
  );
}

export function PermissionGuard(props: {
  allowed: boolean;
  fallback?: ReactNode;
  children: ReactNode;
}) {
  if (!props.allowed) {
    return props.fallback ?? null;
  }

  return <>{props.children}</>;
}
