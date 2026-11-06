
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { firstParam, safeNextPath } from "@/lib/utils";
import { LoginForm } from "./login-form";

export default function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  return (
    <div className="grid w-full gap-14 py-12 lg:min-h-[calc(100svh-11rem)] lg:grid-cols-2 lg:items-center lg:gap-20 lg:py-0">

      {/* Left: introduction */}
      <section className="max-w-md">
        <h1 className="font-display text-2xl font-semibold leading-tight tracking-tight text-ink">
          <span
            aria-hidden="true"
            className="mr-2 text-action"
          >
            ✶
          </span>
          Sign in to find your team.
        </h1>

        <p className="mt-3 text-sm leading-6 text-muted">
          No password to remember at 3am.
        </p>
      </section>

      {/* Right: login form */}
      <section className="w-full max-w-sm lg:justify-self-end">
        <h2 className="font-display text-xl font-semibold leading-snug tracking-tight text-ink">
          We&apos;ll email you a magic link.
        </h2>

        <Suspense
          fallback={
            <div className="skeleton mt-10 h-44 w-full" />
          }
        >
          <Login searchParams={searchParams} />
        </Suspense>
      </section>

    </div>
  );
}

async function Login({
  searchParams,
}: Pick<PageProps<"/login">, "searchParams">) {
  const params = await searchParams;
  const next = safeNextPath(
    firstParam(params.next),
    "/profile"
  );

  if (await getCurrentUser()) {
    redirect(next);
  }

  return (
    <LoginForm
      next={next}
      error={firstParam(params.error)}
    />
  );
}
