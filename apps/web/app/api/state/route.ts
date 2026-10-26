import { createClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";
import {
  authorized,
  failure,
  sameOrigin,
  mediaReference,
} from "../../../lib/server";
import { average, participantDay, dateInZone } from "../../../lib/program.mjs";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  try {
    const { db, user, membership: m } = await authorized(req);
    const results = await Promise.all([
      db.from("cohorts").select("*").eq("id", m.cohort_id).single(),
      db
        .from("experiences")
        .select("*")
        .eq("cohort_id", m.cohort_id)
        .order("day"),
      db
        .from("checkins")
        .select("*")
        .eq("user_id", user.id)
        .eq("cohort_id", m.cohort_id),
      db
        .from("private_notes")
        .select("day,notes")
        .eq("user_id", user.id)
        .eq("cohort_id", m.cohort_id),
      db
        .from("reviews")
        .select("week,reflection")
        .eq("user_id", user.id)
        .eq("cohort_id", m.cohort_id),
      db
        .from("feedback")
        .select("answers")
        .eq("user_id", user.id)
        .eq("cohort_id", m.cohort_id)
        .maybeSingle(),
      db
        .from("checkin_entries")
        .select("id,day,mood,energy,sleep,notes,created_at")
        .eq("user_id", user.id)
        .eq("cohort_id", m.cohort_id)
        .order("created_at", { ascending: false }),
    ]);
    for (const r of results)
      if (r.error)
        throw Error("Could not load program data. Check database setup.");
    const cohort = results[0].data!;
    const notes = results[3].data || [];
    let participants: unknown[] = [];
    if (m.role === "admin") {
      const { data: members, error: me } = await db
        .from("memberships")
        .select("user_id,display_name,started_at,timezone")
        .eq("cohort_id", m.cohort_id)
        .eq("role", "participant");
      const { data: entries, error: ce } = await db
        .from("checkins")
        .select("user_id,mood,energy,sleep,day,status")
        .eq("cohort_id", m.cohort_id);
      if (me || ce) throw Error("Could not load cohort progress.");
      participants = (members || []).map((person) => {
        const rows = (entries || []).filter(
          (e) => e.user_id === person.user_id,
        );
        return {
          name: person.display_name || person.user_id,
          day: participantDay(person.started_at, person.timezone),
          count: rows.length,
          completed: rows.filter((r) => r.status === "completed").length,
          mood: average(rows.map((c) => c.mood)),
          energy: average(rows.map((c) => c.energy)),
          sleep: average(rows.map((c) => c.sleep)),
        };
      });
    }
    return Response.json({
      role: m.role,
      cohortId: m.cohort_id,
      participants,
      store: {
        settings: {
          start: dateInZone(new Date(m.started_at), m.timezone),
          startedAt: m.started_at,
          timezone: m.timezone,
          meeting: cohort.meeting_url || "",
          meetingTime: cohort.meeting_time || "",
          diet: cohort.diet_plan || "",
        },
        experiences: results[1].data,
        checkins: (results[2].data || []).map((c) => ({
          ...c,
          notes: notes.find((n) => n.day === c.day)?.notes || "",
        })),
        reviews: Object.fromEntries(
          (results[4].data || []).map((r) => [String(r.week), r.reflection]),
        ),
        feedback: results[5].data?.answers,
        checkinEntries: results[6].data || [],
      },
    });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(req: NextRequest) {
  try {
    if (!sameOrigin(req))
      return Response.json({ error: "Invalid origin." }, { status: 403 });
    const { db, user, membership: m } = await authorized(req);
    const body = await req.text();
    if (body.length > 40000) throw Error("Request too large.");
    const { action, payload: p } = JSON.parse(body);
    let error;
    if (action === "checkin" || action === "checkinEntry") {
      const today = participantDay(m.started_at, m.timezone);
      if (
        !Number.isInteger(p.day) ||
        p.day < 1 ||
        p.day > 30 ||
        p.day > today ||
        today > 30
      )
        throw Error("This program day is not available for check-ins.");
      if (
        ![p.mood, p.energy].every(
          (n) => Number.isInteger(n) && n >= 1 && n <= 5,
        ) ||
        !Number.isFinite(p.sleep) ||
        p.sleep < 0 ||
        p.sleep > 24 ||
        typeof p.notes !== "string" ||
        p.notes.length > 2000 ||
        !Array.isArray(p.habits) ||
        p.habits.length > 20 ||
        p.habits.some((h: unknown) => typeof h !== "string" || h.length > 60) ||
        ![
          "not recorded",
          "completed",
          "partially completed",
          "skipped",
        ].includes(p.status) ||
        typeof p.diet !== "boolean"
      )
        throw Error("Check your check-in values.");
      ({ error } = await db.rpc(
        action === "checkinEntry" ? "save_checkin_entry" : "save_checkin",
        {
          cohort: m.cohort_id,
          program_day: p.day,
          mood_score: p.mood,
          energy_score: p.energy,
          sleep_hours: p.sleep,
          habit_names: p.habits,
          response_status: p.status,
          diet_followed: p.diet,
          private_note: p.notes,
        },
      ));
    } else if (action === "timezone") {
      try {
        new Intl.DateTimeFormat("en", { timeZone: p.timezone }).format();
      } catch {
        throw Error("Select a valid timezone.");
      }
      ({ error } = await db
        .from("memberships")
        .update({ timezone: p.timezone })
        .eq("user_id", user.id)
        .eq("cohort_id", m.cohort_id));
    } else if (action === "experience") {
      if (m.role !== "admin") throw Error("Admin access required.");
      if (
        !Number.isInteger(p.day) ||
        p.day < 1 ||
        p.day > 14 ||
        typeof p.published !== "boolean"
      )
        throw Error("Invalid experience.");
      for (const k of [
        "title",
        "subtitle",
        "instructions",
        "needs",
        "why",
        "callout",
        "video",
        "transcript",
        "infographic",
        "alt",
      ])
        if (typeof p[k] !== "string" || p[k].length > 10000)
          throw Error("Invalid experience content.");
      if (
        !p.title.trim() ||
        !mediaReference(p.video) ||
        !mediaReference(p.infographic)
      )
        throw Error("Add a title and valid HTTPS media links.");
      if (p.published && p.infographic && !p.alt.trim())
        throw Error("Add an infographic description before publishing.");
      const fields = Object.fromEntries(
        [
          "day",
          "title",
          "subtitle",
          "instructions",
          "needs",
          "why",
          "callout",
          "video",
          "transcript",
          "infographic",
          "alt",
          "published",
        ].map((k) => [k, p[k]]),
      );
      ({ error } = await db
        .from("experiences")
        .upsert(
          { ...fields, cohort_id: m.cohort_id },
          { onConflict: "cohort_id,day" },
        ));
    } else if (action === "settings") {
      if (m.role !== "admin") throw Error("Admin access required.");
      if (
        typeof p.diet !== "string" ||
        p.diet.length > 10000 ||
        typeof p.meeting !== "string" ||
        p.meeting.length > 2000 ||
        (p.meeting && !/^https:\/\//.test(p.meeting))
      )
        throw Error("Check the diet plan and HTTPS meeting link.");
      const meetingTime = p.meetingTime
        ? new Date(p.meetingTime).toISOString()
        : null;
      ({ error } = await db
        .from("cohorts")
        .update({
          meeting_url: p.meeting,
          meeting_time: meetingTime,
          diet_plan: p.diet,
        })
        .eq("id", m.cohort_id));
    } else if (action === "feedback") {
      if (participantDay(m.started_at, m.timezone) < 29)
        throw Error("Closing feedback opens on day 29.");
      if (
        !Number.isInteger(p.rating) ||
        p.rating < 1 ||
        p.rating > 5 ||
        ["useful", "ease", "changes", "improve"].some(
          (k) => typeof p[k] !== "string" || p[k].length > 2000,
        )
      )
        throw Error("Invalid feedback.");
      ({ error } = await db
        .from("feedback")
        .upsert(
          { user_id: user.id, cohort_id: m.cohort_id, answers: p },
          { onConflict: "user_id,cohort_id" },
        ));
    } else if (action === "retryReviews") {
      if (m.role !== "admin") throw Error("Admin access required.");
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!key) throw Error("Weekly reviews are not configured.");
      const service = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
        auth: { persistSession: false },
      });
      ({ error } = await service
        .from("reviews")
        .update({ status: "pending", updated_at: "1970-01-01T00:00:00Z" })
        .eq("cohort_id", m.cohort_id)
        .eq("status", "failed"));
    } else throw Error("Unknown action.");
    if (error) throw Error("Could not save. Check database permissions.");
    return Response.json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
