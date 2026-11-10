import test from "node:test";
import assert from "node:assert/strict";
import { trustedIp } from "../lib/budgets.ts";
import { publicFailure } from "../lib/request-security.mjs";

test("IP limits use only trusted Vercel ingress, rejecting spoofed generic forwarding", () => {
  const req = new Request("https://app.example", {
    headers: { "x-forwarded-for": "203.0.113.1", "x-real-ip": "203.0.113.2" },
  });
  assert.throws(
    () => trustedIp(req, { vercel: true, development: false }),
    /Security services unavailable/,
  );
  for (const bad of ["203.0.113.1, 198.51.100.1", "not-an-ip"])
    assert.throws(() =>
      trustedIp(
        new Request("https://app.example", {
          headers: { "x-vercel-forwarded-for": bad },
        }),
        { vercel: true, development: false },
      ),
    );
  assert.equal(
    trustedIp(
      new Request("https://app.example", {
        headers: {
          "x-vercel-forwarded-for": "2001:db8::1",
          "x-forwarded-for": "203.0.113.9",
        },
      }),
      { vercel: true, development: false },
    ),
    "2001:db8::1",
  );
});
test("unknown production hosting fails closed; development never trusts client IP headers", () => {
  const req = new Request("https://app.example", {
    headers: { "x-forwarded-for": "203.0.113.1" },
  });
  assert.throws(() => trustedIp(req, { vercel: false, development: false }));
  assert.equal(
    trustedIp(req, { vercel: false, development: true }),
    "local-development",
  );
  assert.equal(publicFailure(new Error("Rate limit exceeded.")).status, 429);
  assert.equal(
    publicFailure(new Error("Security services unavailable.")).status,
    503,
  );
});
