import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { firstParam, safeNextPath } from "@/lib/utils";
import { LoginForm } from "./login-form";

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <div className="mx-auto max-w-sm">
      <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
      <p className="mt-1 text-sm text-muted">
        We&apos;ll email you a magic link — no password needed.
      </p>
      <Suspense fallback={<div className="card mt-6 h-40 animate-pulse" />}>
        <Login searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Login({ searchParams }: Pick<PageProps<"/login">, "searchParams">) {
  const params = await searchParams;
  const next = safeNextPath(firstParam(params.next), "/profile");

  if (await getCurrentUser()) redirect(next);

  return <LoginForm next={next} error={firstParam(params.error)} />;
}
