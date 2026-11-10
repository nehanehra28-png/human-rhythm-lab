import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import { createClient } from "@supabase/supabase-js";
import { databaseAllowed } from "./environment.mjs";

export function serviceDatabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (
    !url ||
    !key ||
    !databaseAllowed({
      url,
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
      developmentRef: process.env.NEXT_PUBLIC_SUPABASE_DEV_PROJECT_REF,
    })
  )
    throw Error("Security services unavailable.");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function trustedIp(
  req: Request,
  hosting: { vercel: boolean; development: boolean },
) {
  // Only Vercel's overwritten ingress header is trusted in deployed environments.
  let ip: string;
  if (hosting.vercel) {
    ip = req.headers.get("x-vercel-forwarded-for")?.trim() || "";
    if (!isIP(ip)) throw Error("Security services unavailable.");
  } else if (hosting.development) ip = "local-development";
  else throw Error("Security services unavailable.");
  return ip;
}

async function consume(
  req: Request,
  identity: string | null,
  action: string,
  limits: number[],
) {
  const ip = trustedIp(req, {
    vercel: process.env.VERCEL === "1",
    development: process.env.NODE_ENV === "development",
  });
  const secret = process.env.RATE_LIMIT_HASH_KEY;
  if (!secret || secret.length < 32)
    throw Error("Security services unavailable.");
  const digest = (value: string) =>
    createHmac("sha256", secret).update(value).digest("hex");
  const keys = identity
    ? [`${action}:user:${digest(identity)}`, `${action}:ip:${digest(ip)}`]
    : [`${action}:ip:${digest(ip)}`];
  const { error } = await serviceDatabase().rpc("consume_app_budget", {
    scope_keys: keys,
    max_counts: identity ? [limits[0], limits[1]] : [limits[1]],
    window_seconds: keys.map(() => limits[2]),
  });
  if (error) {
    if (error.code === "P0001" && error.message === "Rate limit exceeded.")
      throw Error("Rate limit exceeded.");
    throw Error("Security services unavailable.");
  }
}

export function enforceIngress(req: Request) {
  return consume(req, null, "auth-ingress", [120, 240, 60]);
}

export function enforceBudget(
  req: Request,
  identity: string,
  action: "read" | "write" | "invite" | "upload" | "retry" | "ai",
) {
  const limits = {
    read: [120, 240, 60],
    write: [30, 60, 60],
    invite: [10, 10, 3600],
    upload: [2, 2, 86400],
    retry: [4, 8, 86400],
    ai: [1, 4, 60],
  }[action];
  return consume(req, identity, action, limits);
}
