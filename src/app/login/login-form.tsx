"use client";

import { useActionState } from "react";
import { sendMagicLink, type MagicLinkState } from "@/app/auth/actions";

export function LoginForm({ next, error }: { next: string; error?: string }) {
  const [state, action, pending] = useActionState<MagicLinkState, FormData>(sendMagicLink, {
    status: error ? "error" : "idle",
    message: error,
  });

  if (state.status === "sent") {
    return <p className="card mt-6 text-sm">{state.message}</p>;
  }

  return (
    <form action={action} className="card mt-6 space-y-4">
      <input type="hidden" name="next" value={next} />
      <div>
        <label htmlFor="email" className="label">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="tommy@usc.edu"
          className="input"
        />
      </div>
      {state.status === "error" && <p className="text-sm text-accent">{state.message}</p>}
      <button type="submit" className="btn w-full" disabled={pending}>
        {pending ? "Sending…" : "Send magic link"}
      </button>
    </form>
  );
}
