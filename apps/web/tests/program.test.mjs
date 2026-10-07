import test from "node:test";
import assert from "node:assert/strict";
import { programDay, participantDay, phase, completedWeeks, average } from "../lib/program.mjs";
test("participants invited on different dates follow independent timelines", () => {
  const now = new Date("2026-10-10T12:00:00Z");
  assert.equal(participantDay("2026-10-10T09:00:00Z", "Europe/Amsterdam", now), 1);
  assert.equal(participantDay("2026-10-07T09:00:00Z", "Europe/Amsterdam", now), 4);
  assert.deepEqual(completedWeeks(participantDay("2026-10-03T09:00:00Z", "Europe/Amsterdam", now)), [1]);
});
test("invitation date uses the participant timezone and advances at local midnight", () => {
  const invited = "2026-10-07T00:30:00Z";
  assert.equal(participantDay(invited, "America/New_York", new Date(invited)), 1);
  assert.equal(participantDay(invited, "America/New_York", new Date("2026-10-07T04:00:00Z")), 2);
  assert.equal(participantDay("2026-10-24T22:30:00Z", "Europe/Amsterdam", new Date("2026-10-25T23:30:00Z")), 2);
});
test("calendar days stay consistent over Amsterdam daylight saving transition", () => {
  assert.equal(
    programDay(
      "2026-10-24",
      "Europe/Amsterdam",
      new Date("2026-10-25T23:30:00Z"),
    ),
    3,
  );
});
test("same instant can unlock different local cohort days", () => {
  const now = new Date("2026-10-06T00:30:00Z");
  assert.equal(programDay("2026-10-06", "Europe/Amsterdam", now), 1);
  assert.equal(programDay("2026-10-06", "America/New_York", now), 0);
});
test("phase boundaries and review completion", () => {
  assert.equal(phase(0), "Not started");
  assert.equal(phase(14), "Daily experiences");
  assert.equal(phase(15), "Nourish & notice");
  assert.equal(phase(29), "Reflect & celebrate");
  assert.equal(phase(31), "Program complete");
  assert.deepEqual(completedWeeks(7), []);
  assert.deepEqual(completedWeeks(8), [1]);
  assert.deepEqual(completedWeeks(31), [1, 2, 3, 4]);
});
test("missing observations are not zero", () => {
  assert.equal(average([]), null);
  assert.equal(average([3, 5]), 4);
});
