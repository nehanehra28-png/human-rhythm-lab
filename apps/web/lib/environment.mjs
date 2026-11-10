// Development and Vercel Preview must explicitly identify their non-production DB.
export function databaseAllowed({ url, nodeEnv, vercelEnv, developmentRef }) {
  if (!url) return true; // Local sample mode makes no cloud requests.
  if (nodeEnv !== "development" && vercelEnv !== "preview") return true;
  try {
    const hostname = new URL(url).hostname;
    return Boolean(
      developmentRef &&
      hostname === `${developmentRef}.supabase.co` &&
      developmentRef !== "teeswpesyipxgwtjqmyq",
    );
  } catch {
    return false;
  }
}
