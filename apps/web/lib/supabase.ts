import { createClient } from "@supabase/supabase-js";
import { databaseAllowed } from "./environment.mjs";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
export const databaseConfigurationBlocked = !databaseAllowed({
  url,
  nodeEnv: process.env.NODE_ENV,
  vercelEnv: process.env.NEXT_PUBLIC_DEPLOYMENT_ENV,
  developmentRef: process.env.NEXT_PUBLIC_SUPABASE_DEV_PROJECT_REF,
});
export const supabase =
  url && key && !databaseConfigurationBlocked
    ? createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      })
    : null;
