import { matchesRequestOrigin } from "./origin.mjs";
import { publicFailure } from "./request-security.mjs";
import { databaseAllowed } from "./environment.mjs";
import { enforceIngress } from "./budgets";
import { createClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";
export async function authorized(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const token = req.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!url || !key) throw Error("Cloud services are not configured.");
  if (
    !databaseAllowed({
      url,
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
      developmentRef: process.env.NEXT_PUBLIC_SUPABASE_DEV_PROJECT_REF,
    })
  )
    throw Error("Security services unavailable.");
  if (!token) throw Error("Sign in required.");
  await enforceIngress(req);
  const db = createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await db.auth.getUser(token);
  if (error || !data.user) throw Error("Sign in required.");
  const { data: membership, error: memberError } = await db
    .from("memberships")
    .select("*")
    .eq("user_id", data.user.id)
    .single();
  if (
    memberError ||
    !membership ||
    !["participant", "admin"].includes(membership.role)
  )
    throw Error("Your account has not been assigned to a cohort.");
  if (!membership.started_at)
    throw Error(
      "Personal timelines need database migration 002_personal_timelines.sql. Ask your administrator to apply it.",
    );
  return { db, user: data.user, membership };
}
export function failure(error: unknown) {
  const result = publicFailure(error);
  return Response.json(
    { error: result.error },
    {
      status: result.status,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
export function sameOrigin(req: NextRequest) {
  const origin = req.headers.get("origin");
  return matchesRequestOrigin(
    origin,
    req.headers.get("host"),
    req.nextUrl.protocol,
  );
}
export function mediaReference(value: string) {
  return (
    value === "" ||
    /^storage:[a-f0-9-]+\/[a-f0-9-]+\.(mp4|webm|png|jpg|jpeg|webp)$/i.test(
      value,
    ) ||
    /^https:\/\//.test(value)
  );
}
