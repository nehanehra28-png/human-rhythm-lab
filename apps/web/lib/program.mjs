export function dateInZone(now, timezone) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (name) => parts.find((p) => p.type === name).value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}
export function programDay(start, timezone, now = new Date()) {
  return (
    Math.floor(
      (Date.parse(dateInZone(now, timezone) + "T00:00:00Z") -
        Date.parse(start + "T00:00:00Z")) /
        86400000,
    ) + 1
  );
}
export function participantDay(startedAt, timezone, now = new Date()) {
  return programDay(dateInZone(new Date(startedAt), timezone), timezone, now);
}
export function phase(day) {
  return day < 1
    ? "Not started"
    : day <= 15
      ? "Daily experiences"
      : day <= 28
        ? "Nourish & notice"
        : day <= 31
          ? "Phase 3 · Sustain your rhythm"
          : "Program complete";
}
export function completedWeeks(day) {
  return [1, 2, 3, 4].filter((week) => day > week * 7);
}
export function average(values) {
  return values.length
    ? values.reduce((a, b) => a + b, 0) / values.length
    : null;
}

export function latestCheckin(rows) {
  return (
    [...rows].sort(
      (a, b) =>
        (Date.parse(b.updated_at || "") || 0) -
          (Date.parse(a.updated_at || "") || 0) || b.day - a.day,
    )[0] || null
  );
}
