import type { NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import { authorized, failure, sameOrigin } from "../../../lib/server";
import { enforceBudget, serviceDatabase } from "../../../lib/budgets";
import { readJsonObject } from "../../../lib/request-security.mjs";
export async function POST(req: NextRequest) {
  try {
    if (!sameOrigin(req))
      return Response.json({ error: "Invalid origin." }, { status: 403 });
    const { user, membership } = await authorized(req);
    if (membership.role !== "admin") throw Error("Admin access required.");
    if (process.env.PROGRAM_UPLOADS_ENABLED !== "true")
      throw Error("Security services unavailable.");
    const p = await readJsonObject(req, 1000);
    const formats: Record<string, string> = {
      "image/png": "png",
      "image/jpeg": "jpg",
      "image/webp": "webp",
      "video/mp4": "mp4",
      "video/webm": "webm",
    };
    if (
      !["video", "infographic"].includes(p.kind) ||
      typeof p.mime !== "string" ||
      !Object.hasOwn(formats, p.mime) ||
      !Number.isInteger(p.size) ||
      p.size < 1 ||
      p.size > 50 * 1024 * 1024 ||
      (p.kind === "video"
        ? !p.mime.startsWith("video/")
        : !p.mime.startsWith("image/"))
    )
      throw Error("Invalid upload.");
    // Always reserve a FULL 50MiB slot: never trust the browser's claimed size.
    // Two tokens/day cap reserved storage at100MiB, even if every size is forged.
    await enforceBudget(req, user.id, "upload");
    const path = `${membership.cohort_id}/${randomUUID()}.${formats[p.mime]}`;
    const { data, error } = await serviceDatabase()
      .storage.from("program-media")
      .createSignedUploadUrl(path, { upsert: false });
    if (error || !data) throw Error("Security services unavailable.");
    return Response.json(
      { path, uploadToken: data.token },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return failure(e);
  }
}
