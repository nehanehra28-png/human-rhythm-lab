export type CheckIn = {
  day: number;
  mood: number;
  energy: number;
  sleep: number;
  notes: string;
  habits: string[];
  status: string;
  diet: boolean;
};
export type Experience = {
  day: number;
  title: string;
  subtitle: string;
  instructions: string;
  needs: string;
  why: string;
  callout: string;
  video: string;
  transcript: string;
  infographic: string;
  alt: string;
  published: boolean;
};
export type Settings = {
  start: string;
  timezone: string;
  meeting: string;
  meetingTime: string;
  diet: string;
};
export type Store = {
  checkins: CheckIn[];
  experiences: Experience[];
  settings: Settings;
  feedback?: {
    rating: number;
    useful: string;
    ease: string;
    changes: string;
    improve: string;
  };
  reviews: Record<string, string>;
};
