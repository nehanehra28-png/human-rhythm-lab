import type { NextRequest } from "next/server";
import { authorized, failure, sameOrigin } from "../../../lib/server";
import { readJsonObject } from "../../../lib/request-security.mjs";
import { enforceBudget, serviceDatabase } from "../../../lib/budgets";
export async function POST(req: NextRequest) {
  try {
    if (!sameOrigin(req))
      return Response.json({ error: "Invalid origin." }, { status: 403 });
    const { user, membership: m } = await authorized(req);
    if (m.role !== "admin") throw Error("Admin access required.");
    await enforceBudget(req, user.id, "invite");
    const secret = process.env.SUPABASE_SERVICE_ROLE_KEY,
      site = process.env.APP_URL;
    if (!secret || !site) throw Error("Invitation delivery is not configured.");
    const { email } = await readJsonObject(req, 1000);
    if (
      typeof email !== "string" ||
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    )
      throw Error("Enter a valid email.");
    const admin = serviceDatabase();
    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo: site,
    });
    if (error || !data.user)
      throw Error(
        "Could not send invitation. Check email delivery and whether the account already exists.",
      );
    const { error: memberError } = await admin.from("memberships").insert({
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
