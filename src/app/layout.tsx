import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { getProfile } from "@/lib/data";
import { Avatar } from "./avatar";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { signOut } from "@/app/auth/actions";
import { NavLinks } from "./nav-links";
import "./globals.css";

const geistSans = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI@USC",
  description: "Schedule, countdown, and team formation for hackers.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <header className="sticky top-0 z-10 border-b border-border bg-card">
          <nav className="mx-auto flex max-w-5xl items-center gap-8 px-4">
            <Link href="/" className="text-lg font-bold tracking-tight">
              AI@USC
            </Link>
            <NavLinks />
            <div className="ml-auto text-sm">
              <Suspense fallback={<div className="size-10 rounded-full bg-foreground/10" />}>
                <AuthStatus />
              </Suspense>
            </div>
          </nav>
        </header>

        {!isSupabaseConfigured && (
          <div className="border-b border-gold/50 bg-gold/15 px-4 py-2 text-center text-sm">
            Supabase isn&apos;t configured. Copy <code>.env.example</code> to{" "}
            <code>.env.local</code> and add your project URL and publishable key.
          </div>
        )}

        <main className="mx-auto w-full max-w-5xl flex-1 overflow-x-clip px-4 py-8">{children}</main>
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
        <button type="submit" className="text-muted hover:text-foreground">
          Sign out
        </button>
      </form>
      <Link href="/profile" aria-label="My profile" className="block transition hover:opacity-80">
        <Avatar url={profile?.avatar_url} name={profile?.name} />
      </Link>
    </div>
  );
}
