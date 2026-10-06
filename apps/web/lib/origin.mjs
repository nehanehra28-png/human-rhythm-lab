// Compare to the public Host header: Next.js can normalize a loopback URL internally.
export function matchesRequestOrigin(origin, host, protocol) {
  if (!origin) return true; // Bearer-only API callers need not send a browser Origin.
  if (!host) return false;
  try {
    const parsed = new URL(origin);
    return (
      parsed.origin === origin &&
      parsed.host === host &&
      parsed.protocol === protocol
    );
  } catch {
    return false;
  }
}
