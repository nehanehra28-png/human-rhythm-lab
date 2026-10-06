# UI guidelines

Calm, warm design with soft greens, warm neutrals, clear typography, generous spacing, and simple navigation. Beautiful UI is the approved visual reference. This version uses original CSS and lucide-react icons; no Beautiful UI component source or its commercial icon package is copied.

## Participant surfaces

- Today: program day, phase, content, check-in, habits.
- My week: charts, weekly review, AI reflection.
- Program: timeline, past experiences, meeting link, closing feedback.
- Account: identity, privacy information, eventual data controls.

## Admin surfaces

Cohort setup, participants/progress, content editing and preview/publication, shared diet plan, and call details.

## Content and accessibility

Follow the sample's introduction, activity, preparation, explanation, and health-callout structure. Emojis support tone but do not carry meaning alone. Keep callouts prominent before instructions. Provide captions or transcripts for video and meaningful alternatives for infographics. Avoid autoplay with sound.

Use keyboard-accessible controls, visible focus, labeled inputs, sufficient contrast, and text summaries for charts. Include mobile, loading, empty, error, partial-data, and completed-program states. Avoid shaming streaks or failure labels.


## First-build update — 6 October 2026

See DECISIONS.md for the latest questionnaire answers and README.md for verified implementation status. The Next.js app now exists. Supabase is selected for auth, database, and private media; its migration has not been applied. Admin access excludes private notes. Daily unlocking and diet-phase check-ins are confirmed. Weekly AI is scheduled automatically after each completed program week, with a daily job and bounded processing. Local-time unlocking and 90-day retention remain provisional; retention deletion is not implemented.


The admin experience editor now has two text fields: Title and Experience (the complete message, including health callouts). Video and infographic controls are in an optional expandable section. Existing structured content is preserved.
