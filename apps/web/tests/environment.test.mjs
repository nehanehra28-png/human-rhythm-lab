import test from "node:test";
import assert from "node:assert/strict";
import { databaseAllowed } from "../lib/environment.mjs";
const production = "https://teeswpesyipxgwtjqmyq.supabase.co";
const developmentRef = "bmrjzdnpiujfguycurrq";
test("local development and preview reject production even when its ref is explicitly supplied", () => {
  for (const [nodeEnv, vercelEnv] of [
    ["development", undefined],
    ["production", "preview"],
  ]) {
    assert.equal(
      databaseAllowed({ url: production, nodeEnv, vercelEnv, developmentRef }),
      false,
    );
    assert.equal(
      databaseAllowed({
        url: production,
        nodeEnv,
        vercelEnv,
        developmentRef: "teeswpesyipxgwtjqmyq",
      }),
      false,
    );
    assert.equal(
      databaseAllowed({
        url: `https://${developmentRef}.supabase.co`,
        nodeEnv,
        vercelEnv,
        developmentRef,
      }),
      true,
    );
    assert.equal(
      databaseAllowed({
        url: `https://${developmentRef}.supabase.co.attacker.example`,
        nodeEnv,
        vercelEnv,
        developmentRef,
      }),
      false,
    );
  }
});
test("production runs normally; sample mode makes no cloud calls; dev without explicit ref fails closed", () => {
  assert.equal(
    databaseAllowed({
      url: production,
      nodeEnv: "production",
      vercelEnv: "production",
    }),
    true,
  );
  assert.equal(databaseAllowed({ nodeEnv: "development" }), true);
  assert.equal(
    databaseAllowed({
      url: `https://${developmentRef}.supabase.co`,
      nodeEnv: "development",
    }),
    false,
  );
});
