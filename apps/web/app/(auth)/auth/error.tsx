"use client";

export default function AuthError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-2xl rounded-3xl border border-rose-400/20 bg-black/20 p-8 text-rose-50">
      <p className="text-xs uppercase tracking-[0.24em] text-rose-300">Auth Route Error</p>
      <h1 className="mt-4 text-3xl font-semibold">Authentication route failed</h1>
      <p className="mt-4 text-sm text-rose-100/80">{props.error.message}</p>
      <button
        type="button"
        onClick={props.reset}
        className="mt-6 rounded-full bg-rose-300 px-4 py-2 text-sm font-medium text-black"
      >
        Retry
      </button>
    </div>
  );
}
