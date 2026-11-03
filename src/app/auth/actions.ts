"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/utils";

export type SignInState = { status: "idle" | "sent" | "error"; email?: string; message?: string };

// We email a one-time code instead of a link: USC's mail scanner opens links
// before the hacker does, which used up the one-time token.
export async function signInWithCode(_prev: SignInState, formData: FormData): Promise<SignInState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { status: "error", message: "Enter your email." };

  const supabase = await createClient();
  const code = formData.get("code");

  if (code === null) {
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) return { status: "error", message: error.message };
    return { status: "sent", email };
  }

  const token = String(code).replace(/\D/g, "");
  const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
  if (error) {
    return { status: "sent", email, message: "That code is wrong or expired. Use the newest email, or start over." };
  }
  redirect(safeNextPath(formData.get("next")));
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
