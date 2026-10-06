import test from "node:test";
import assert from "node:assert/strict";
import { matchesRequestOrigin } from "../lib/origin.mjs";
test("public loopback host works even when internal URL normalizes to localhost", () => {
  assert.equal(
    matchesRequestOrigin("http://127.0.0.1:3000", "127.0.0.1:3000", "http:"),
    true,
  );
});
test("reject foreign sites, port changes, scheme changes and malformed origins", () => {
  for (const origin of [
    "https://evil.example",
    "http://127.0.0.1:4000",
    "https://127.0.0.1:3000",
    "null",
    "not a url",
    "http://127.0.0.1:3000/path",
  ])
    assert.equal(
      matchesRequestOrigin(origin, "127.0.0.1:3000", "http:"),
      false,
    );
});
test("production host requires matching HTTPS origin", () => {
  assert.equal(
    matchesRequestOrigin("https://rhythm.example", "rhythm.example", "https:"),
    true,
  );
  assert.equal(
    matchesRequestOrigin("http://rhythm.example", "rhythm.example", "https:"),
    false,
  );
});
test("non-browser bearer requests can omit Origin but supplied origin requires Host", () => {
  assert.equal(matchesRequestOrigin(null, "rhythm.example", "https:"), true);
  assert.equal(
    matchesRequestOrigin("https://rhythm.example", null, "https:"),
    false,
  );
});
