"use client";

import { useActionState } from "react";
import { signInWithCode, type SignInState } from "@/app/auth/actions";

export function LoginForm({ next, error }: { next: string; error?: string }) {
  const [state, action, pending] = useActionState<SignInState, FormData>(signInWithCode, {
    status: error ? "error" : "idle",
    message: error,
  });

  if (state.status === "sent") {
    return (
      <form action={action} className="rise mt-10 max-w-md space-y-5">
        <input type="hidden" name="next" value={next} />
        <input type="hidden" name="email" value={state.email} />
        <div>
          <label htmlFor="code" className="field-label">
            Code from your email
          </label>
          <p id="code-help" className="mt-1 text-sm text-muted">
            We sent it to {state.email}.
          </p>
          <input
            id="code"
            name="code"
            required
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9 ]{6,10}"
            maxLength={10}
            autoFocus
            aria-invalid={state.message ? true : undefined}
            aria-describedby={state.message ? "code-help code-error" : "code-help"}
            className="input mt-2 tracking-[0.3em]"
          />
        </div>
        {state.message && (
          <p id="code-error" role="alert" className="font-semibold text-danger">
            {state.message}
          </p>
        )}
        <button type="submit" className="btn w-full" disabled={pending}>
          {pending ? "Checking…" : "Sign in"}
        </button>
        {/* A full reload resets the form so they can fix the email or get a new code. */}
        <a href={`/login?next=${encodeURIComponent(next)}`} className="block text-sm text-muted underline">
          Wrong email or no code? Start over
        </a>
      </form>
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
        {pending ? "Sending…" : "Email me a sign-in code"}
      </button>
    </form>
  );
}
