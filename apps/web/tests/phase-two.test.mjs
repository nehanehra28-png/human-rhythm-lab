import test from "node:test";
import assert from "node:assert/strict";
import {
  canSavePhaseTwo,
  validPhaseTwoItems,
  phaseTwoIds,
} from "../lib/phase-two.mjs";
test("Phase 2 and 3 only save unlocked days 16–31 during the personal program", () => {
  for (const [day, today, expected] of [
    [15, 15, false],
    [16, 15, false],
    [16, 16, true],
    [17, 16, false],
    [28, 28, true],
    [28, 30, true],
    [29, 28, false],
    [29, 29, true],
    [31, 30, false],
    [31, 31, true],
    [32, 32, false],
    [16, 31, true],
    [16, 32, false],
    [16.5, 20, false],
  ])
    assert.equal(canSavePhaseTwo(day, today), expected);
});
test("Checklist allows only supplied steps with done or skipped state", () => {
  assert.equal(new Set(phaseTwoIds).size, phaseTwoIds.length);
  assert.equal(
    validPhaseTwoItems({ affirmations: "done", gratitude: "skipped" }),
    true,
  );
  assert.equal(validPhaseTwoItems({ invented: "done" }), false);
  assert.equal(validPhaseTwoItems({ affirmations: "failed" }), false);
  assert.equal(validPhaseTwoItems([]), false);
});
