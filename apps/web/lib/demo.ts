import type { Store } from "./types";
export function initialStore(): Store {
  const start = new Date();
  start.setDate(start.getDate() - 6);
  const localDate = [
    start.getFullYear(),
    String(start.getMonth() + 1).padStart(2, "0"),
    String(start.getDate()).padStart(2, "0"),
  ].join("-");
  return {
    settings: {
      start: localDate,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      meeting: "",
      meetingTime: "",
      diet: "",
    },
    checkins: [],
    reviews: {},
    experiences: [
      {
        day: 1,
        title: "A moment of stillness",
        subtitle: "Make a little room for yourself.",
        instructions:
          "Find a comfortable place to sit. Spend a few quiet moments noticing your surroundings. You can stop or skip whenever you like.",
        needs: "A comfortable place and a moment for yourself.",
        why: "This sample experience introduces the daily content format. Your program team will supply the final reviewed content.",
        callout:
          "Sample content for interface testing, not the published program.",
        video: "",
        transcript: "",
        infographic: "",
        alt: "",
        published: true,
      },
      {
        day: 7,
        title: "Pause. Notice. Begin again.",
        subtitle: "A small pause in a busy world.",
        instructions:
          "Take a comfortable pause. Notice how you feel today, then record your check-in. There is no right answer.",
        needs: "A comfortable place and a moment for yourself.",
        why: "A check-in is an opportunity to notice your own experience. This is sample content awaiting replacement by the program team.",
        callout:
          "Sample content. Choose what feels comfortable; skipping is always available.",
        video: "",
        transcript: "",
        infographic: "",
        alt: "",
        published: true,
      },
    ],
  };
}
