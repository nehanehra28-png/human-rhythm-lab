import test from "node:test";
import assert from "node:assert/strict";
import {
  publicFailure,
  readJsonObject,
  validatedReflection,
} from "../lib/request-security.mjs";

test("errors never disclose provider details, input or stack traces", () => {
  const result = publicFailure(
    new Error("database password=synthetic-secret SQL private_notes admin"),
  );
  assert.equal(result.status, 400);
  assert.doesNotMatch(
    JSON.stringify(result),
    /password|synthetic-secret|SQL|private_notes/,
  );
  assert.equal(publicFailure(new Error("Sign in required.")).status, 401);
  assert.equal(publicFailure(new Error("Admin access required.")).status, 403);
});
test("JSON bounds actual streamed bytes even when content-length lies or is absent", async () => {
  for (const headers of [{}, { "content-length": "1" }]) {
    const req = new Request("http://localhost", {
      method: "POST",
      headers,
      body: JSON.stringify({ notes: "🙂".repeat(100) }),
    });
    await assert.rejects(readJsonObject(req, 100), /Request too large/);
  }
  const req = new Request("http://localhost", {
    method: "POST",
    body: '{"rating":5}',
  });
  assert.deepEqual(await readJsonObject(req, 100), { rating: 5 });
});
test("JSON input must be a valid object", async () => {
  for (const body of ["null", "[]", "5", "{broken"]) {
    await assert.rejects(
      readJsonObject(
        new Request("http://localhost", { method: "POST", body }),
        100,
      ),
    );
  }
});
test("AI response only accepts a bounded reflection, never actions or extra fields", () => {
  assert.equal(
    validatedReflection({
      reflection: "You recorded three check-ins this week.",
    }),
    "You recorded three check-ins this week.",
  );
  for (const value of [
    { reflection: "A valid reflection.", action: "refund" },
    { reflection: "word ".repeat(151) },
    [],
    null,
    { reflection: 3 },
  ])
    assert.throws(() => validatedReflection(value), /Invalid reflection/);
});
