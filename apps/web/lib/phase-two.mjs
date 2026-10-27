// Supplied program routine. Stable IDs are stored with each participant's day.
export const phaseTwoGroups = [
  {
    title: "Morning routine",
    time: "6 am–11:30 am",
    items: [
      {
        id: "affirmations",
        label: "Affirmations × 5",
        detail: "Use your personalised affirmations from the program team.",
      },
      { id: "goals", label: "Write 3 goals" },
      {
        id: "morning-water",
        label: "Alkaline water",
        detail:
          "Supplied routine: 2 glasses (at least 500 ml). Follow any personal fluid restrictions.",
      },
      {
        id: "juice",
        label: "‘Immunity bomb’ / red juice",
        detail:
          "Supplied routine: 1 cube + water. Use the recipe provided by your program team.",
      },
      {
        id: "fruit",
        label: "4 different-colour fruits",
        detail: "Supplied routine: at least 200 g.",
      },
    ],
  },
  ...[
    ["lunch", "Lunch routine", "11:30 am–2 pm"],
    ["dinner", "Dinner routine", "6 pm–9 pm"],
  ].map(([key, title, time]) => ({
    title,
    time,
    items: [
      {
        id: `${key}-before`,
        label: "Water / liquid break before meal",
        detail: "Supplied routine: 30 minutes.",
      },
      {
        id: `${key}-salad`,
        label: "Plate 1 — salad",
        detail:
          "Supplied routine: 200–250 g, cherry tomato and cucumber; other salad items optional.",
      },
      {
        id: `${key}-cooked`,
        label: "Plate 2 — cooked food",
        detail: "As per your choice.",
      },
      {
        id: `${key}-after`,
        label: "Water / liquid break after meal",
        detail: "Supplied routine: 30 minutes.",
      },
    ],
  })),
  {
    title: "Bedtime routine",
    time: "8 pm–9 pm",
    items: [
      { id: "gratitude", label: "Write 5 things you’re grateful for" },
      { id: "greyscale", label: "Set phone to greyscale" },
      { id: "screens", label: "No screens for 30 minutes before bed" },
    ],
  },
  {
    title: "Suggested daily practice",
    time: "Optional",
    items: [
      {
        id: "daylight",
        label: "Time outdoors in daylight",
        detail:
          "Supplied target: 30 minutes, where appropriate. Never look directly at the sun; use sun protection.",
      },
      {
        id: "earthing",
        label: "Barefoot time on safe ground",
        detail:
          "Supplied target: 30 minutes, morning, afternoon or evening. Skip if unsafe or unsuitable for your feet.",
      },
      {
        id: "meditation",
        label: "Meditation / prayer",
        detail: "5–10 minutes.",
      },
      {
        id: "water",
        label: "Personal water target",
        detail: "Follow the target agreed with your care or program team.",
      },
    ],
  },
];
export const phaseTwoIds = phaseTwoGroups.flatMap((group) =>
  group.items.map((item) => item.id),
);
export function canSavePhaseTwo(day, today) {
  return (
    Number.isInteger(day) &&
    day >= 16 &&
    day <= 31 &&
    today >= 16 &&
    today <= 31 &&
    day <= today
  );
}
export function validPhaseTwoItems(items) {
  return (
    items &&
    !Array.isArray(items) &&
    typeof items === "object" &&
    Object.entries(items).every(
      ([key, value]) =>
        phaseTwoIds.includes(key) && ["done", "skipped"].includes(value),
    )
  );
}
