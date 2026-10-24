import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";
import { supabaseKey, supabaseUrl } from "./env";

/** Browser client for Client Components (e.g. realtime subscriptions). */
export function createClient() {
  return createBrowserClient<Database>(supabaseUrl, supabaseKey);
}
