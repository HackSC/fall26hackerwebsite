import Image from "next/image";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { firstParam, safeNextPath } from "@/lib/utils";
import { LoginForm } from "./login-form";

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <div className="wrap grid gap-12 pt-10 sm:pt-16 lg:grid-cols-12 lg:gap-16">
      <div className="lg:col-span-6 lg:pt-8">
        <h1 className="display rise text-title">Sign in to find your team.</h1>
        <p className="rise mt-5 max-w-md text-lead text-muted" style={{ "--i": 1 } as React.CSSProperties}>
          We&apos;ll email you a sign-in code. No password to remember at 3am.
        </p>
        <Suspense fallback={<div className="skeleton mt-10 h-44 max-w-md" />}>
          <Login searchParams={searchParams} />
        </Suspense>
      </div>

      <figure className="lg:col-span-5 lg:col-start-8">
        <Image
          src="/images/tommy-trojan.jpg"
          alt="The bronze Tommy Trojan statue on the USC campus, sword raised, in front of red-brick university buildings."
          width={1550}
          height={1800}
          priority
          sizes="(min-width: 1024px) 38vw, 100vw"
          className="aspect-[4/5] h-auto w-full object-cover lg:aspect-auto"
        />
        <figcaption className="mt-3 text-sm text-muted">Tommy Trojan, USC campus.</figcaption>
      </figure>
    </div>
  );
}

async function Login({ searchParams }: Pick<PageProps<"/login">, "searchParams">) {
  const params = await searchParams;
  const next = safeNextPath(firstParam(params.next), "/profile");

  if (await getCurrentUser()) redirect(next);

  return <LoginForm next={next} error={firstParam(params.error)} />;
}
