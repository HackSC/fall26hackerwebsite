import type { Metadata } from "next";
import { Hanken_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { getProfile } from "@/lib/data";
import { Avatar } from "./avatar";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { signOut } from "@/app/auth/actions";
import { NavLinks } from "./nav-links";
import "./globals.css";

// Figma's three families: font/heading, font/body, font/mono.
const heading = Hanken_Grotesk({ variable: "--font-heading", subsets: ["latin"] });
const body = Inter({ variable: "--font-body", subsets: ["latin"] });
const data = JetBrains_Mono({ variable: "--font-data", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HackSC",
  description: "Schedule, countdown, and team formation for hackers.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${heading.variable} ${body.variable} ${data.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col overflow-x-clip font-sans">
        <header className="sticky top-0 z-10 border-b border-border bg-surface/70 backdrop-blur-xl">
          <nav className="mx-auto flex max-w-5xl items-center gap-8 px-4">
            <Link href="/" className="font-display text-xl font-bold">
              HackSC
            </Link>
            <NavLinks />
            <div className="ml-auto text-sm">
              <Suspense fallback={<div className="size-10 rounded-full bg-placeholder" />}>
                <AuthStatus />
              </Suspense>
            </div>
          </nav>
        </header>

        {!isSupabaseConfigured && (
          <div className="border-b border-gold/50 bg-gold/15 px-4 py-2 text-center text-xs">
            Supabase isn&apos;t configured. Copy <code>.env.example</code> to{" "}
            <code>.env.local</code> and add your project URL and publishable key.
          </div>
        )}

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
      </body>
    </html>
  );
}

async function AuthStatus() {
  const user = await getCurrentUser();
  const profile = user ? await getProfile(user.id) : null;

  if (!user) {
    return (
      <Link href="/login" className="btn">
        Sign in
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <form action={signOut}>
        <button type="submit" className="text-xs font-medium text-muted hover:text-ink">
          Sign out
        </button>
      </form>
      <Link href="/profile" aria-label="My profile" className="block transition hover:opacity-80">
        <Avatar url={profile?.avatar_url} name={profile?.name} />
      </Link>
    </div>
  );
}
