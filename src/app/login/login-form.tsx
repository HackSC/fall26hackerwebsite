"use client";

import { useActionState } from "react";
import { sendMagicLink, type MagicLinkState } from "@/app/auth/actions";

export function LoginForm({ next, error }: { next: string; error?: string }) {
  const [state, action, pending] = useActionState<MagicLinkState, FormData>(sendMagicLink, {
    status: error ? "error" : "idle",
    message: error,
  });

  if (state.status === "sent") {
    return (
      <div role="status" className="rise mt-10 max-w-md bg-surface p-6">
        <p className="text-lead font-semibold">Check your inbox.</p>
        <p className="mt-2 text-muted">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={action} className="mt-10 max-w-md space-y-5">
      <input type="hidden" name="next" value={next} />
      <div>
        <label htmlFor="email" className="field-label">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="tommy@usc.edu"
          aria-invalid={state.status === "error" || undefined}
          aria-describedby={state.status === "error" ? "email-error" : undefined}
          className="input"
        />
      </div>
      {state.status === "error" && (
        <p id="email-error" role="alert" className="font-semibold text-danger">
          {state.message}
        </p>
      )}
      <button type="submit" className="btn w-full" disabled={pending}>
        {pending ? "Sending…" : "Email me a magic link"}
      </button>
    </form>
  );
}
