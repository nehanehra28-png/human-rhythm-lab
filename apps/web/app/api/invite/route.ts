import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { authorized, failure, sameOrigin } from "../../../lib/server";
export async function POST(req: NextRequest) {
  try {
    if (!sameOrigin(req))
      return Response.json({ error: "Invalid origin." }, { status: 403 });
    const { membership: m } = await authorized(req);
    if (m.role !== "admin") throw Error("Admin access required.");
    const secret = process.env.SUPABASE_SERVICE_ROLE_KEY,
      site = process.env.APP_URL;
    if (!secret || !site) throw Error("Invitation delivery is not configured.");
    const body = await req.text();
    if (body.length > 1000) throw Error("Request too large.");
    const { email } = JSON.parse(body);
    if (
      typeof email !== "string" ||
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    )
      throw Error("Enter a valid email.");
    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, secret, {
      auth: { persistSession: false },
    });
    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo: site,
    });
    if (error || !data.user)
      throw Error(
        "Could not send invitation. Check email delivery and whether the account already exists.",
      );
    const { error: memberError } = await admin
      .from("memberships")
      .insert({
        user_id: data.user.id,
        cohort_id: m.cohort_id,
        display_name: email,
        role: "participant",
        timezone: "UTC",
      });
    if (memberError)
      throw Error(
        "Invitation sent, but cohort assignment failed. Ask your administrator to complete setup.",
      );
    return Response.json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
