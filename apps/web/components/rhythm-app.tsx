"use client";
import { phaseTwoGroups } from "../lib/phase-two.mjs";
import { useEffect, useState } from "react";
import {
  Leaf,
  LayoutDashboard,
  Sun,
  CalendarDays,
  ChartNoAxesCombined,
  Settings,
  ArrowUpRight,
  ArrowRight,
  Check,
  Play,
  ShieldCheck,
  LogOut,
  Heart,
  Flame,
  Moon,
  Wind,
  Lock,
  ChevronLeft,
  ChevronRight,
  Upload,
  Sparkles,
} from "lucide-react";
import type { CheckIn, Experience, Store } from "../lib/types";
import { initialStore } from "../lib/demo";
import {
  programDay,
  participantDay,
  phase,
  average,
  completedWeeks,
} from "../lib/program.mjs";
import { supabase } from "../lib/supabase";
const commonTimezones = [
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "UTC", label: "UTC / GMT" },
  { value: "Europe/Amsterdam", label: "Central European Time (CET / CEST)" },
  { value: "Asia/Kolkata", label: "India Standard Time (IST)" },
];
type View = "today" | "program" | "week" | "admin" | "account";
const blankExperience: Experience = {
  day: 1,
  title: "",
  subtitle: "",
  instructions: "",
  needs: "",
  why: "",
  callout: "",
  video: "",
  transcript: "",
  infographic: "",
  alt: "",
  published: false,
};
export default function RhythmApp() {
  const [sessionError, setSessionError] = useState("");
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [otpDestination, setOtpDestination] = useState("");
  const [resendAt, setResendAt] = useState(0);
  const [store, setStore] = useState<Store | null>(null),
    [view, setView] = useState<View>("today"),
    [role, setRole] = useState("participant"),
    [token, setToken] = useState(""),
    [ready, setReady] = useState(false),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [selectedDay, setSelectedDay] = useState<number | null>(null),
    [editing, setEditing] = useState<Experience>(blankExperience),
    [tab, setTab] = useState("instructions"),
    [participants, setParticipants] = useState<
      {
        name: string;
        day: number;
        count: number;
        completed: number;
        mood: number | null;
        energy: number | null;
        sleep: number | null;
        latestAt: string | null;
        latestStatus: string | null;
      }[]
    >([]);
  const [form, setForm] = useState<CheckIn>({
    day: 1,
    mood: 3,
    energy: 3,
    sleep: 7,
    notes: "",
    habits: [],
    status: "not recorded",
    diet: false,
  });
  const [cohortId, setCohortId] = useState("");
  const demo = !supabase && process.env.NODE_ENV === "development";
  useEffect(() => {
    if (demo) {
      try {
        const saved = localStorage.getItem("hrl-preview-v1");
        const preview = saved ? JSON.parse(saved) : initialStore();
        const previewDay = Number(
          new URLSearchParams(window.location.search).get("previewDay"),
        );
        if (
          Number.isInteger(previewDay) &&
          previewDay >= 1 &&
          previewDay <= 31
        ) {
          const start = new Date();
          start.setDate(start.getDate() - (previewDay - 1));
          preview.settings.start = new Intl.DateTimeFormat("en-CA", {
            timeZone: preview.settings.timezone,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          }).format(start);
          delete preview.settings.startedAt;
        }
        setStore(preview);
      } catch {
        setStore(initialStore());
      }
      setReady(true);
      return;
    }
    if (!supabase) {
      setReady(true);
      return;
    }
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setToken(session?.access_token || "");
      setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, [demo]);
  useEffect(() => {
    let cancelled = false;
    if (token) {
      setSessionError("");
      fetch("/api/state", { headers: { Authorization: `Bearer ${token}` } })
        .then(async (r) => {
          const d = await r.json();
          if (!r.ok) throw Error(d.error);
          if (cancelled) return;
          setStore(d.store);
          setRole(d.role);
          setCohortId(d.cohortId);
          setParticipants(d.participants || []);
        })
        .catch(() => {
          if (!cancelled)
            setSessionError(
              "We could not load your dashboard. Your session is still signed in.",
            );
        });
    } else if (!demo) setStore(null);
    return () => {
      cancelled = true;
    };
  }, [token, demo, loadAttempt]);
  useEffect(() => {
    if (!token || role !== "admin" || view !== "admin") return;
    let cancelled = false;
    let running = false;
    const refresh = async () => {
      if (running) return;
      running = true;
      try {
        const response = await fetch("/api/state", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const state = await response.json();
          if (!cancelled) setParticipants(state.participants || []);
        }
      } finally {
        running = false;
      }
    };
    const timer = window.setInterval(() => {
      void refresh().catch(() => {});
    }, 30_000);
    void refresh().catch(() => {});
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [token, role, view]);
  const day = store
    ? store.settings.startedAt
      ? participantDay(store.settings.startedAt, store.settings.timezone)
      : programDay(store.settings.start, store.settings.timezone)
    : 1;
  const current = Math.min(31, Math.max(1, day));
  const shown = selectedDay ?? current;
  useEffect(() => {
    if (store)
      setForm(
        store.checkins.find((c) => c.day === shown) || {
          day: shown,
          mood: 3,
          energy: 3,
          sleep: 7,
          notes: "",
          habits: [],
          status: "not recorded",
          diet: false,
        },
      );
  }, [store, shown]);
  async function mutate(action: string, payload: unknown, next: Store) {
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      if (demo) {
        localStorage.setItem("hrl-preview-v1", JSON.stringify(next));
        setStore(next);
      } else {
        const r = await fetch("/api/state", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ action, payload }),
        });
        const d = await r.json();
        if (!r.ok) throw Error(d.error);
        setStore(next);
      }
      if (action === "checkinEntry" && !demo) {
        const refreshed = await fetch("/api/state", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (refreshed.ok) {
          const state = await refreshed.json();
          setStore(state.store);
        }
      }
      setMessage("Saved successfully.");
    } catch (e) {
      setMessage(
        e instanceof Error ? e.message : "Could not save. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function sendOtp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    if (Date.now() < resendAt) {
      setMessage("Please wait a minute before requesting another code.");
      return;
    }
    const destination =
      otpDestination ||
      String(new FormData(e.currentTarget).get("destination")).trim();
    setBusy(true);
    setMessage("");
    try {
      const options = { shouldCreateUser: false };
      const { error } = await supabase!.auth.signInWithOtp({
        email: destination,
        options,
      });
      if (error) throw error;
      setOtpDestination(destination);
      setResendAt(Date.now() + 60_000);
      setMessage(
        "If this email is invited, a code is on its way. Check your inbox and enter it here.",
      );
    } catch {
      setMessage(
        "Could not send a code. Check your details or try again shortly.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function verifyOtp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const code = String(new FormData(e.currentTarget).get("code")).trim();
    if (!/^\d{6}$/.test(code)) {
      setMessage("Enter the six-digit code from your email.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const { error } = await supabase!.auth.verifyOtp({
        email: otpDestination,
        token: code,
        type: "email",
      });
      if (error) throw error;
      setOtpDestination("");
      setView("today");
    } catch {
      setMessage(
        "That code is invalid or expired. Try again or request a new code.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function media(file: File, kind: "video" | "infographic") {
    if (demo) {
      setMessage(
        "Uploads need a connected storage account. You can test with an HTTPS media URL below.",
      );
      return;
    }
    setBusy(true);
    try {
      if (file.size > 50 * 1024 * 1024) throw Error("File too large");
      const ext = file.name.split(".").pop();
      const path = `${cohortId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase!.storage
        .from("program-media")
        .upload(path, file);
      if (error) throw error;
      setEditing((e) => ({ ...e, [kind]: `storage:${path}` }));
      setMessage("Uploaded. Save the experience to attach this file.");
    } catch {
      setMessage(
        "Upload failed. Use MP4/WebM or PNG/JPEG/WebP files up to 50 MB, and check storage setup.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function signedMedia(url: string) {
    if (url.startsWith("storage:")) {
      const { data } = await supabase!.storage
        .from("program-media")
        .createSignedUrl(url.slice(8), 3600);
      return data?.signedUrl || "";
    }
    return /^https:\/\//.test(url) ? url : "";
  }
  const [videoUrl, setVideoUrl] = useState(""),
    [imageUrl, setImageUrl] = useState("");
  const exp = store?.experiences.find(
    (e) => e.day === shown && (e.published || role === "admin"),
  );
  useEffect(() => {
    let active = true;
    Promise.all([
      signedMedia(exp?.video || ""),
      signedMedia(exp?.infographic || ""),
    ]).then(([v, i]) => {
      if (active) {
        setVideoUrl(v);
        setImageUrl(i);
      }
    });
    return () => {
      active = false;
    };
  }, [exp?.video, exp?.infographic]);
  function navigate(v: View) {
    if (v === "admin" && store)
      setEditing(
        store.experiences.find((e) => e.day === editing.day) || {
          ...blankExperience,
          day: editing.day,
        },
      );
    setView(v);
    setMessage("");
    if (v === "today") setSelectedDay(null);
  }
  if (!ready)
    return (
      <div className="loading">
        <Leaf /> Finding your rhythm…
      </div>
    );
  if (!supabase && !demo)
    return (
      <main className="login">
        <div className="login-card">
          <Leaf />
          <h1>Your program is being prepared.</h1>
          <p>
            Account services have not been connected yet. Please check back with
            your program team.
          </p>
        </div>
      </main>
    );
  if (!demo && token && !store)
    return (
      <main className="login">
        <div className="login-card">
          <Leaf />
          <h1>{sessionError ? "Let’s try again." : "Finding your rhythm…"}</h1>
          <p role="status">{sessionError || "Restoring your dashboard."}</p>
          {sessionError && (
            <button onClick={() => setLoadAttempt((n) => n + 1)}>Retry</button>
          )}
        </div>
      </main>
    );
  if (!demo && !store)
    return (
      <main className="login">
        <div className="brand">
          <img
            className="brand-logo"
            src="/human-rhythm-lab-logo.png"
            alt=""
            width={42}
            height={42}
          />{" "}
          The Human Rhythm Lab
        </div>
        <div className="login-card">
          <span className="eyebrow">YOUR 31-DAY EXPERIENCE</span>
          <h1>
            {otpDestination ? "Check your code." : "Welcome back."}
            <br />A little more in tune.
          </h1>
          <p>
            {otpDestination
              ? `Enter the six-digit code sent to ${otpDestination}.`
              : "Enter your invited email. We’ll send a one-time code for you to enter here."}
          </p>
          {token ? (
            <>
              <p role="status">{message || "Opening your dashboard…"}</p>
              <button
                type="button"
                onClick={() => {
                  void supabase!.auth.signOut();
                  setMessage("");
                }}
              >
                Back to sign in
              </button>
            </>
          ) : (
            <>
              <form onSubmit={otpDestination ? verifyOtp : sendOtp}>
                {otpDestination ? (
                  <label>
                    Six-digit code
                    <input
                      key="code"
                      name="code"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]{6}"
                      minLength={6}
                      maxLength={6}
                      autoComplete="one-time-code"
                      required
                      autoFocus
                      disabled={busy}
                    />
                  </label>
                ) : (
                  <label>
                    Email
                    <input
                      key="email"
                      name="destination"
                      type="email"
                      autoComplete="email"
                      maxLength={254}
                      required
                      disabled={busy}
                    />
                  </label>
                )}
                <button className="primary" disabled={busy}>
                  {busy
                    ? "Please wait…"
                    : otpDestination
                      ? "Verify and sign in"
                      : "Send one-time code"}{" "}
                  <ArrowRight size={18} />
                </button>
              </form>
              {otpDestination && (
                <>
                  <form onSubmit={sendOtp}>
                    <button type="submit" disabled={busy}>
                      Resend code
                    </button>
                  </form>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      setOtpDestination("");
                      setMessage("");
                    }}
                  >
                    Use a different email
                  </button>
                </>
              )}
              <p role="status">{message}</p>
            </>
          )}
          <p className="small">
            Access is by invitation only. Enter the code from your email to sign
            in. You can paste the full code here.
          </p>
        </div>
      </main>
    );
  if (!store) return null;
  const checks = store.checkins;
  const completed = checks.filter((c) => c.status === "completed").length;
  const week = Math.min(4, Math.ceil(current / 7));
  const weekChecks = checks.filter(
    (c) => c.day > (week - 1) * 7 && c.day <= week * 7,
  );
  const av = (key: "mood" | "energy" | "sleep", records = weekChecks) => {
    const a = average(records.map((c) => c[key]));
    return a === null ? "—" : a.toFixed(1);
  };
  const nav = [
    { id: "today", name: "My dashboard", icon: LayoutDashboard },
    { id: "program", name: "My experience", icon: CalendarDays },
    { id: "week", name: "Weekly reflections", icon: ChartNoAxesCombined },
  ] as const;
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="/" aria-label="Human Rhythm Lab home">
          <span className="brand-icon">
            <img
              className="brand-logo"
              src="/human-rhythm-lab-logo.png"
              alt=""
              width={42}
              height={42}
            />
          </span>
          <span>
            The Human Rhythm<span className="brand-sub">Lab</span>
          </span>
        </a>
        <div className="cohort-label">THE 31-DAY EXPERIENCE</div>
        <nav>
          {nav.map((n) => (
            <button
              key={n.id}
              onClick={() => navigate(n.id)}
              className={view === n.id ? "nav active" : "nav"}
            >
              <n.icon size={19} />
              {n.name}
              {view === n.id && <span className="nav-dot" />}
            </button>
          ))}
          {role === "admin" && (
            <button
              className={view === "admin" ? "nav active" : "nav"}
              onClick={() => navigate("admin")}
            >
              <ShieldCheck size={19} />
              Admin workspace
            </button>
          )}
        </nav>
        <div className="sidebar-bottom">
          <div className="little-note">
            <Wind size={24} />
            <p>
              Small moments.
              <br />
              Meaningful rhythms.
            </p>
            <span>One day at a time.</span>
          </div>
          <button className="nav" onClick={() => navigate("account")}>
            <Settings size={19} />
            Account & preferences
          </button>
          <div className="profile">
            <span className="avatar">{demo ? "R" : "Y"}</span>
            <div>
              <strong>{demo ? "Rhythm explorer" : "Your account"}</strong>
              <small>
                {role === "admin" ? "Program admin" : "Experience participant"}
              </small>
            </div>
            {!demo && (
              <button
                aria-label="Sign out"
                onClick={() => supabase!.auth.signOut()}
              >
                <LogOut size={18} />
              </button>
            )}
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <img
            className="header-logo"
            src="/human-rhythm-lab-logo.png"
            alt="The Human Rhythm Lab"
            width={30}
            height={30}
          />
          <span>Human Rhythm Reset Experience</span>
        </header>
        {demo && (
          <div className="demo-banner">
            <span>
              <span className="live-dot" /> Local preview · sample program ·
              saved on this browser
            </span>
            <button
              onClick={() => {
                setRole(role === "admin" ? "participant" : "admin");
                navigate(role === "admin" ? "today" : "admin");
              }}
            >
              {role === "admin" ? "Participant preview" : "Admin preview"}{" "}
              <ArrowUpRight size={14} />
            </button>
          </div>
        )}
        <main className="content">
          {message && (
            <div className="notice" role="status">
              {message}
              <button
                onClick={() => setMessage("")}
                aria-label="Dismiss message"
              >
                ×
              </button>
            </div>
          )}
          {view === "today" && (
            <>
              <div className="page-heading">
                <div>
                  <span className="eyebrow">
                    A LITTLE MORE IN TUNE WITH YOURSELF
                  </span>
                  <h1>
                    Your rhythm, one day at a time
                    <span className="green">.</span>
                  </h1>
                  <p>Welcome to your space to pause, notice, and grow.</p>
                </div>
                <span className="phase-tag">
                  <span className="live-dot" />
                  {phase(day)}
                </span>
              </div>
              <section className="journey">
                <div className="journey-main">
                  <span className="pill">YOUR 31-DAY JOURNEY</span>
                  <h2>
                    {day < 1
                      ? "Your next chapter is coming."
                      : day > 31
                        ? "A chapter worth reflecting on."
                        : `Day ${current}. A little closer to you.`}
                  </h2>
                  <p>
                    {day < 1
                      ? "Your personal program starts when you are invited."
                      : "No perfect scores. Just a little curiosity, every day."}
                  </p>
                  <div className="journey-progress">
                    <div className="progress-track">
                      <span
                        style={{
                          width: `${Math.max(0, Math.min(100, ((day - 1) / 31) * 100))}%`,
                        }}
                      />
                    </div>
                    <span>{Math.max(0, Math.min(31, day - 1))} of 31 days</span>
                  </div>
                  <div className="phase-steps">
                    <span className={day <= 15 ? "selected" : ""}>
                      01 · Experience
                    </span>
                    <span className={day >= 16 && day <= 28 ? "selected" : ""}>
                      02 · Nourish
                    </span>
                    <span className={day >= 29 ? "selected" : ""}>
                      03 · Sustain
                    </span>
                  </div>
                </div>
                <div className="botanical" aria-hidden="true">
                  <div className="orbit o1" />
                  <div className="orbit o2" />
                  <div className="orbit o3" />
                  <Leaf size={105} strokeWidth={0.8} />
                  <span>GROW AT YOUR OWN PACE</span>
                </div>
              </section>
              <div className="section-heading">
                <h2>A moment to check in</h2>
                <span>YOUR WEEK SO FAR</span>
              </div>
              <div className="stats">
                {[
                  {
                    name: "Mood",
                    value: av("mood"),
                    unit: "/ 5",
                    icon: Heart,
                    color: "rose",
                    desc: "How you’ve been feeling",
                  },
                  {
                    name: "Energy",
                    value: av("energy"),
                    unit: "/ 5",
                    icon: Flame,
                    color: "amber",
                    desc: "Your everyday spark",
                  },
                  {
                    name: "Sleep",
                    value: av("sleep"),
                    unit: "hrs",
                    icon: Moon,
                    color: "lavender",
                    desc: "Room for rest",
                  },
                  {
                    name: "Experiences",
                    value: String(completed),
                    unit: "done",
                    icon: Leaf,
                    color: "sage",
                    desc: "Every small step counts",
                  },
                ].map((s) => (
                  <div className="stat" key={s.name}>
                    <div className="stat-label">
                      <span>{s.name}</span>
                      <span className={`stat-icon ${s.color}`}>
                        <s.icon size={18} />
                      </span>
                    </div>
                    <div className="stat-value">
                      {s.value}
                      <span>{s.unit}</span>
                    </div>
                    <small>{s.desc}</small>
                  </div>
                ))}
              </div>
              {day < 16 && (
                <div className="callout">
                  <Lock size={18} />
                  <span>
                    Phase 2 opens on your Day 16, after Phase 1 (Days 1–15).
                  </span>
                </div>
              )}
              {day < 29 && (
                <div className="callout">
                  <Lock size={18} />
                  <span>
                    Phase 3 opens on your Day 29, after Phase 2 (Days 16–28).
                  </span>
                </div>
              )}
              {day >= 16 && shown >= 16 && shown <= 31 && (
                <section className="card phase-two-checklist">
                  <span className="eyebrow">
                    {shown <= 28
                      ? "PHASE 2 · DAYS 16–28"
                      : "PHASE 3 · DAYS 29–31"}
                  </span>
                  <h2>Your daily lifestyle checklist</h2>
                  <p>
                    Day {shown} · Your own record for today. Tick completed
                    steps or choose Skip. You can update this day later.
                  </p>
                  <div className="callout">
                    <ShieldCheck size={18} />
                    <span>
                      This routine was supplied by your program team. Follow
                      your personal medical advice, food requirements and fluid
                      restrictions. You may skip any step. Personalised
                      affirmations and recipes must come from your team.
                    </span>
                  </div>
                  {phaseTwoGroups.map((group) => (
                    <fieldset key={group.title} disabled={busy || day > 31}>
                      <legend>
                        {group.title} · {group.time}
                      </legend>
                      {group.items.map((item) => {
                        const items =
                          store.phaseTwoChecks?.find((row) => row.day === shown)
                            ?.items || {};
                        const save = (
                          status: "done" | "skipped" | undefined,
                        ) => {
                          const nextItems = { ...items };
                          if (status) nextItems[item.id] = status;
                          else delete nextItems[item.id];
                          mutate(
                            "phaseTwoChecklist",
                            { day: shown, items: nextItems },
                            {
                              ...store,
                              phaseTwoChecks: [
                                ...(store.phaseTwoChecks || []).filter(
                                  (row) => row.day !== shown,
                                ),
                                { day: shown, items: nextItems },
                              ],
                            },
                          );
                        };
                        return (
                          <div className="lifestyle-step" key={item.id}>
                            <label>
                              <input
                                type="checkbox"
                                checked={items[item.id] === "done"}
                                onChange={(event) =>
                                  save(
                                    event.target.checked ? "done" : undefined,
                                  )
                                }
                              />
                              <span>
                                {item.label}
                                {item.detail && <small>{item.detail}</small>}
                              </span>
                            </label>
                            <button
                              type="button"
                              aria-label={
                                "Skip " + item.label + " — " + group.title
                              }
                              aria-pressed={items[item.id] === "skipped"}
                              onClick={() =>
                                save(
                                  items[item.id] === "skipped"
                                    ? undefined
                                    : "skipped",
                                )
                              }
                            >
                              {items[item.id] === "skipped"
                                ? "Skipped"
                                : "Skip"}
                            </button>
                          </div>
                        );
                      })}
                    </fieldset>
                  ))}
                </section>
              )}
              <div className="dashboard-grid">
                <section
                  className="card experience"
                  hidden={shown >= 16 && shown <= 31}
                >
                  <div className="card-top">
                    <span className="eyebrow">
                      {shown <= 15
                        ? `EXPERIENCE ${String(shown).padStart(2, "0")}`
                        : shown <= 28
                          ? "YOUR NOURISH PHASE"
                          : "CLOSING YOUR EXPERIENCE"}
                    </span>
                    <span className="soft-tag">
                      {shown === current ? "Today" : `Day ${shown}`}
                    </span>
                  </div>
                  <h2>
                    {shown <= 15
                      ? exp?.title || "Your next experience awaits"
                      : shown <= 28
                        ? "Nourish & notice"
                        : "Look how far you’ve come"}
                  </h2>
                  <p>
                    {exp?.subtitle ||
                      "Your program team will share the content here."}
                  </p>
                  <div className="media-preview">
                    {videoUrl ? (
                      <video
                        controls
                        src={videoUrl}
                        aria-label="Experience video"
                      />
                    ) : (
                      <>
                        <div className="media-art">
                          <Wind size={50} strokeWidth={1} />
                        </div>
                        <span>Make space for a small pause.</span>
                        <small>
                          {exp
                            ? "Video will appear when added by your admin."
                            : "Content has not been published yet."}
                        </small>
                      </>
                    )}
                  </div>
                  <div className="tabs">
                    {["instructions", "infographic", "why"].map((t) => (
                      <button
                        key={t}
                        className={tab === t ? "tab selected" : "tab"}
                        onClick={() => setTab(t)}
                      >
                        {t === "instructions"
                          ? "Your experience"
                          : t === "why"
                            ? "Why it matters"
                            : "Infographic"}
                      </button>
                    ))}
                  </div>
                  {shown <= 15 ? (
                    <>
                      {exp?.callout && (
                        <div className="callout">
                          <ShieldCheck size={18} />
                          <span>{exp.callout}</span>
                        </div>
                      )}
                      {tab === "instructions" ? (
                        <div>
                          <p className="body-copy">
                            {exp?.instructions ||
                              "Come back when your admin has published this experience."}
                          </p>
                          {exp?.needs && (
                            <>
                              <h3 style={{ marginTop: 18 }}>What you need</h3>
                              <p className="body-copy">{exp.needs}</p>
                            </>
                          )}
                        </div>
                      ) : tab === "why" ? (
                        <p className="body-copy">
                          {exp?.why ||
                            "Supporting explanation will appear here."}
                        </p>
                      ) : imageUrl ? (
                        <img
                          className="infographic"
                          src={imageUrl}
                          alt={exp?.alt || "Experience infographic"}
                        />
                      ) : (
                        <div className="empty-inline">
                          Your infographic will appear here once uploaded.
                        </div>
                      )}
                      {exp?.transcript && (
                        <details>
                          <summary>Video transcript</summary>
                          <p className="body-copy">{exp.transcript}</p>
                        </details>
                      )}
                    </>
                  ) : (
                    <p className="body-copy">
                      {shown <= 28
                        ? store.settings.diet ||
                          "Your admin has not published the shared diet plan yet."
                        : "Visit My experience to complete your final feedback on days 29–31."}
                    </p>
                  )}
                </section>
                <section className="card checkin">
                  <div className="card-top">
                    <span className="eyebrow">YOUR DAILY CHECK-IN</span>
                    <span className="soft-tag">~1 minute</span>
                  </div>
                  <h2>How are you, really?</h2>
                  <p>
                    Check in as often as you like. Each save adds a new entry.
                  </p>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      mutate("checkinEntry", form, {
                        ...store,
                        checkinEntries: [
                          {
                            id: crypto.randomUUID(),
                            day: form.day,
                            mood: form.mood,
                            energy: form.energy,
                            sleep: form.sleep,
                            notes: form.notes,
                            created_at: new Date().toISOString(),
                          },
                          ...(store.checkinEntries || []),
                        ],
                        checkins: [
                          ...checks.filter((c) => c.day !== shown),
                          form,
                        ],
                      });
                    }}
                  >
                    <fieldset disabled={busy || day < 1 || day > 31}>
                      <legend className="sr-only">Daily check-in</legend>
                      {(["mood", "energy"] as const).map((k) => (
                        <div className="rating" key={k}>
                          <label>
                            {k === "mood"
                              ? "How is your mood?"
                              : "How is your energy?"}
                          </label>
                          <div className="rating-options">
                            {(k === "mood"
                              ? [
                                  { label: "Bad", emoji: "🙁", value: 1 },
                                  { label: "Neutral", emoji: "😐", value: 3 },
                                  { label: "Good", emoji: "🙂", value: 5 },
                                ]
                              : [
                                  { label: "Low", emoji: "🪫", value: 1 },
                                  { label: "Medium", emoji: "🔋", value: 3 },
                                  { label: "High", emoji: "⚡", value: 5 },
                                ]
                            ).map(({ label, emoji, value }) => {
                              const selected =
                                form[k] >= 4 ? 5 : form[k] <= 2 ? 1 : 3;
                              return (
                                <button
                                  type="button"
                                  aria-label={k + ": " + label}
                                  aria-pressed={selected === value}
                                  key={value}
                                  onClick={() =>
                                    setForm({ ...form, [k]: value })
                                  }
                                  className={selected === value ? "chosen" : ""}
                                >
                                  <span
                                    className="rating-emoji"
                                    aria-hidden="true"
                                  >
                                    {emoji}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                      <label className="sleep-label">
                        How much did you sleep?
                        <div className="sleep-input">
                          <Moon size={18} />
                          <input
                            aria-label="Sleep duration in hours"
                            type="number"
                            min="0"
                            max="24"
                            step="0.5"
                            required
                            value={form.sleep}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                sleep: Number(e.target.value),
                              })
                            }
                          />
                          <span>hours</span>
                        </div>
                      </label>
                      <label>
                        A note to yourself{" "}
                        <span className="optional">optional · private</span>
                        <textarea
                          maxLength={2000}
                          value={form.notes}
                          onChange={(e) =>
                            setForm({ ...form, notes: e.target.value })
                          }
                          placeholder="What’s on your mind today?"
                        />
                      </label>
                      <label>
                        Experience response
                        <select
                          value={form.status}
                          onChange={(e) =>
                            setForm({ ...form, status: e.target.value })
                          }
                        >
                          <option>not recorded</option>
                          <option>completed</option>
                          <option>partially completed</option>
                          <option>skipped</option>
                        </select>
                      </label>
                      {shown >= 16 && shown <= 31 && (
                        <label className="checkbox-row">
                          <input
                            type="checkbox"
                            checked={form.diet}
                            onChange={(e) =>
                              setForm({ ...form, diet: e.target.checked })
                            }
                          />
                          I followed the shared diet plan today
                        </label>
                      )}
                      <button className="primary full" disabled={busy}>
                        Add check-in <ArrowRight size={17} />
                      </button>
                    </fieldset>
                  </form>
                  <section aria-label="Check-in history">
                    <h3>Your check-ins for this day</h3>
                    <ul>
                      {(store.checkinEntries || [])
                        .filter((entry) => entry.day === shown)
                        .map((entry) => (
                          <li key={entry.id}>
                            <time dateTime={entry.created_at}>
                              {new Date(entry.created_at).toLocaleString(
                                undefined,
                                {
                                  timeZone: store.settings.timezone,
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  second: "2-digit",
                                },
                              )}
                            </time>
                            {" · Mood "}
                            {entry.mood >= 4
                              ? "🙂"
                              : entry.mood <= 2
                                ? "🙁"
                                : "😐"}
                            {" · Energy "}
                            {entry.energy >= 4
                              ? "⚡"
                              : entry.energy <= 2
                                ? "🪫"
                                : "🔋"}
                          </li>
                        ))}
                    </ul>
                    {!(store.checkinEntries || []).some(
                      (entry) => entry.day === shown,
                    ) && (
                      <p>
                        No new check-ins recorded for this day yet. Earlier
                        daily records remain in your summaries.
                      </p>
                    )}
                  </section>
                  <span className="privacy-note">
                    <Lock size={12} /> Your notes are private. Admins see scores
                    and completion.
                  </span>
                </section>
              </div>
              <footer className="page-footer">
                <Leaf size={15} /> Progress isn’t always a straight line. You
                belong here, wherever you are today.
              </footer>
            </>
          )}
          {view === "program" && (
            <>
              <div className="page-heading">
                <div>
                  <span className="eyebrow">THIRTY DAYS. YOUR OWN PACE.</span>
                  <h1>Your experience</h1>
                  <p>One shared journey, many personal discoveries.</p>
                </div>
              </div>
              <div className="program-phases">
                {[
                  "01 · Experience · Days 1–15",
                  "02 · Nourish · Days 16–28",
                  "03 · Sustain · Days 29–31",
                ].map((t) => (
                  <div className="card" key={t}>
                    <Leaf size={23} />
                    <h3>{t}</h3>
                  </div>
                ))}
              </div>
              <div className="day-grid">
                {Array.from({ length: 31 }, (_, i) => i + 1).map((n) => (
                  <button
                    disabled={n > day}
                    key={n}
                    className={`day-card ${n === current ? "current" : ""}`}
                    onClick={() => {
                      setSelectedDay(n);
                      setView("today");
                    }}
                  >
                    <span>DAY {String(n).padStart(2, "0")}</span>
                    <strong>
                      {n <= 15
                        ? store.experiences.find(
                            (e) => e.day === n && e.published,
                          )?.title || "Experience coming soon"
                        : n <= 28
                          ? "Nourish & notice"
                          : "Sustain your rhythm"}
                    </strong>
                    <small>
                      {n > day ? (
                        <>
                          <Lock size={12} /> Opens on your program day
                        </>
                      ) : (
                        checks.find((c) => c.day === n)?.status ||
                        "Open experience →"
                      )}
                    </small>
                  </button>
                ))}
              </div>
              <section className="card meeting">
                <CalendarDays size={26} />
                <div>
                  <h2>Your midpoint conversation</h2>
                  <p>
                    {store.settings.meetingTime
                      ? new Date(store.settings.meetingTime).toLocaleString(
                          "en",
                          { timeZone: store.settings.timezone },
                        )
                      : "Your admin will add the call date and time."}
                  </p>
                </div>
                {/^https:\/\//.test(store.settings.meeting) ? (
                  <a
                    className="primary"
                    target="_blank"
                    rel="noreferrer"
                    href={store.settings.meeting}
                  >
                    Join feedback call <ArrowUpRight size={17} />
                  </a>
                ) : (
                  <span className="soft-tag">Link coming soon</span>
                )}
              </section>
              {day >= 29 && (
                <section className="card">
                  <h2>Your closing reflection</h2>
                  <p>Tell us about your 31-day experience.</p>
                  <form
                    className="admin-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const f = new FormData(e.currentTarget);
                      const feedback = {
                        rating: Number(f.get("rating")),
                        useful: String(f.get("useful")),
                        ease: String(f.get("ease")),
                        changes: String(f.get("changes")),
                        improve: String(f.get("improve")),
                      };
                      mutate("feedback", feedback, { ...store, feedback });
                    }}
                  >
                    <label>
                      Overall experience
                      <select
                        name="rating"
                        defaultValue={store.feedback?.rating || 5}
                      >
                        {[1, 2, 3, 4, 5].map((n) => (
                          <option key={n}>{n}</option>
                        ))}
                      </select>
                    </label>
                    {[
                      { key: "useful", label: "What was most useful?" },
                      {
                        key: "ease",
                        label: "How easy was the program to follow?",
                      },
                      {
                        key: "changes",
                        label: "What did you notice about yourself?",
                      },
                      { key: "improve", label: "What could we improve?" },
                    ].map((f) => (
                      <label key={f.key}>
                        {f.label}
                        <textarea
                          name={f.key}
                          maxLength={2000}
                          defaultValue={
                            store.feedback?.[f.key as "useful"] || ""
                          }
                        />
                      </label>
                    ))}
                    <button className="primary" disabled={busy}>
                      Save feedback
                    </button>
                  </form>
                </section>
              )}
            </>
          )}
          {view === "week" && (
            <>
              <div className="page-heading">
                <div>
                  <span className="eyebrow">NOTICE THE PATTERNS</span>
                  <h1>A week in your rhythm</h1>
                  <p>Curiosity, not comparison. Here’s what you’ve recorded.</p>
                </div>
              </div>
              {[1, 2, 3, 4].map((w) => {
                const rows = checks.filter(
                  (c) => c.day > (w - 1) * 7 && c.day <= w * 7,
                );
                return (
                  <section className="card weekly-card" key={w}>
                    <div className="section-heading">
                      <h2>
                        Week {w}
                        <span className="week-days">
                          Days {(w - 1) * 7 + 1}–{w * 7}
                        </span>
                      </h2>
                      <span className="soft-tag">
                        {rows.length} / 7 check-ins
                      </span>
                    </div>
                    <div
                      className="weekly-chart"
                      aria-label={`Week ${w} energy chart. ${rows.map((c) => `Day ${c.day}: ${c.energy} out of 5`).join(". ") || "No entries yet."}`}
                    >
                      {Array.from({ length: 7 }, (_, i) => {
                        const d = (w - 1) * 7 + i + 1,
                          c = rows.find((c) => c.day === d);
                        return (
                          <div className="bar-column" key={d}>
                            <span>{c?.energy ?? "—"}</span>
                            <div className="bar-space">
                              <div
                                style={{
                                  height: c
                                    ? `${(c.energy / 5) * 100}%`
                                    : "3px",
                                }}
                                className={c ? "bar" : "bar empty"}
                              />
                            </div>
                            <small>Day {d}</small>
                          </div>
                        );
                      })}
                    </div>
                    <div className="weekly-summary">
                      <span>
                        Mood <b>{av("mood", rows)}/5</b>
                      </span>
                      <span>
                        Energy <b>{av("energy", rows)}/5</b>
                      </span>
                      <span>
                        Sleep <b>{av("sleep", rows)} hrs</b>
                      </span>
                    </div>
                    <div className="reflection">
                      <Sparkles size={22} />
                      <div>
                        <h3>Your weekly reflection</h3>
                        <p>
                          {store.reviews[String(w)] ||
                            (!completedWeeks(day).includes(w)
                              ? "Your reflection will arrive after this program week ends."
                              : demo
                                ? "AI reflections need OpenRouter and cloud setup. Your recorded summary above is available now."
                                : "Your reflection is being prepared. Check back after the scheduled weekly review.")}
                        </p>
                      </div>
                    </div>
                  </section>
                );
              })}
            </>
          )}
          {view === "admin" && role === "admin" && (
            <>
              <div className="page-heading">
                <div>
                  <span className="eyebrow">THE PROGRAM WORKSPACE</span>
                  <h1>Make room for growth.</h1>
                  <p>Publish experiences and support your cohort.</p>
                </div>
              </div>
              <section className="card">
                <div className="section-heading">
                  <h2>Cohort progress</h2>
                  <span className="soft-tag">
                    Latest saved scores · refreshes every 30 seconds · notes
                    remain private
                  </span>
                </div>
                {demo ? (
                  <p className="empty-inline">
                    No real testers connected. Your preview has {checks.length}{" "}
                    check-ins and {completed} completed experiences.
                  </p>
                ) : (
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Participant</th>
                          <th>Program day</th>
                          <th>Days recorded</th>
                          <th>Completed</th>
                          <th>Latest mood</th>
                          <th>Latest energy</th>
                          <th>Latest sleep</th>
                          <th>Latest response</th>
                          <th>Last saved</th>
                        </tr>
                      </thead>
                      <tbody>
                        {participants.map((p) => (
                          <tr key={p.name}>
                            <td>{p.name}</td>
                            <td>{p.day > 31 ? "Complete" : `Day ${p.day}`}</td>
                            <td>{p.count}</td>
                            <td>{p.completed}</td>
                            <td>{p.mood?.toFixed(1) || "—"}</td>
                            <td>{p.energy?.toFixed(1) || "—"}</td>
                            <td>{p.sleep?.toFixed(1) || "—"}</td>
                            <td>{p.latestStatus || "—"}</td>
                            <td>
                              {p.latestAt
                                ? new Date(p.latestAt).toLocaleString(
                                    undefined,
                                    { timeZone: store.settings.timezone },
                                  )
                                : "Not recorded"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <button
                  className="secondary"
                  disabled={busy || demo}
                  onClick={() => mutate("retryReviews", {}, store)}
                >
                  Queue failed AI reviews for retry
                </button>
              </section>
              <section className="card">
                <h2>Invite a tester</h2>
                <form
                  className="inline-form"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (demo) {
                      setMessage(
                        "Invitations become available after Supabase and email delivery are configured.",
                      );
                      return;
                    }
                    const f = new FormData(e.currentTarget);
                    setBusy(true);
                    try {
                      const r = await fetch("/api/invite", {
                        method: "POST",
                        headers: {
                          Authorization: `Bearer ${token}`,
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ email: f.get("email") }),
                      });
                      const d = await r.json();
                      if (!r.ok) throw Error(d.error);
                      setMessage("Invitation sent.");
                    } catch (e) {
                      setMessage(
                        e instanceof Error ? e.message : "Could not invite.",
                      );
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="tester@example.com"
                    aria-label="Tester email"
                  />
                  <button className="primary" disabled={busy}>
                    Send invitation <ArrowRight size={16} />
                  </button>
                </form>
              </section>
              <div className="dashboard-grid">
                <section className="card">
                  <h2>Experience studio</h2>
                  <p>
                    Write the message. Add the video and infographic. Publish
                    when ready.
                  </p>
                  <div className="editor-select">
                    <select
                      aria-label="Choose experience to edit"
                      onChange={(e) =>
                        setEditing(
                          store.experiences.find(
                            (x) => x.day === Number(e.target.value),
                          ) || {
                            ...blankExperience,
                            day: Number(e.target.value),
                          },
                        )
                      }
                      value={editing.day}
                    >
                      {Array.from({ length: 15 }, (_, i) => (
                        <option key={i} value={i + 1}>
                          Day {i + 1}
                        </option>
                      ))}
                    </select>
                    <span className="soft-tag">
                      {store.experiences.find(
                        (experience) => experience.day === editing.day,
                      )?.published
                        ? "Published"
                        : "Draft"}
                    </span>
                  </div>
                  <form
                    className="admin-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const content = {
                        ...editing,
                        alt:
                          editing.alt ||
                          (editing.infographic
                            ? `Infographic for ${editing.title}. Refer to the written experience for instructions.`
                            : ""),
                      };
                      mutate("experience", content, {
                        ...store,
                        experiences: [
                          ...store.experiences.filter(
                            (x) => x.day !== editing.day,
                          ),
                          content,
                        ],
                      });
                    }}
                  >
                    <label>
                      Title
                      <input
                        required
                        maxLength={300}
                        value={editing.title}
                        onChange={(e) =>
                          setEditing({ ...editing, title: e.target.value })
                        }
                        placeholder="Human Rhythm Experience 01 — Stillness"
                      />
                    </label>
                    <label>
                      Experience
                      <textarea
                        rows={12}
                        maxLength={10000}
                        value={editing.instructions}
                        onChange={(e) =>
                          setEditing({
                            ...editing,
                            instructions: e.target.value,
                          })
                        }
                        placeholder="Paste your complete experience message here, including instructions and any health callouts."
                      />
                    </label>
                    <details className="optional-media">
                      <summary>Add video or infographic (optional)</summary>
                      {(["video", "infographic"] as const).map((kind) => (
                        <label key={kind}>
                          {kind === "video" ? "Video" : "Infographic"}
                          <input
                            aria-label={`${kind} HTTPS URL`}
                            placeholder="HTTPS URL or upload below"
                            value={editing[kind]}
                            onChange={(e) =>
                              setEditing({ ...editing, [kind]: e.target.value })
                            }
                          />
                          <input
                            type="file"
                            accept={
                              kind === "video"
                                ? "video/mp4,video/webm"
                                : "image/png,image/jpeg,image/webp"
                            }
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) media(file, kind);
                            }}
                          />
                        </label>
                      ))}
                    </details>
                    <label className="checkbox-row">
                      <input
                        type="checkbox"
                        checked={editing.published}
                        onChange={(e) =>
                          setEditing({
                            ...editing,
                            published: e.target.checked,
                          })
                        }
                      />
                      Publish to cohort (content reviewed by your team)
                    </label>
                    <button className="primary" disabled={busy}>
                      Save {editing.published ? "& publish" : "draft"}{" "}
                      <Check size={16} />
                    </button>
                    {message && (
                      <p className="small" aria-live="polite">
                        {message}
                      </p>
                    )}
                    <p className="small">
                      After saving, choose Day 2 (or another day) from the
                      selector above to add the next experience.
                    </p>
                  </form>
                </section>
                <section className="card">
                  <h2>Program settings</h2>
                  <p>
                    Each participant starts at Day 1 when invited. Content is
                    shared; timelines are personal.
                  </p>
                  <form
                    className="admin-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const f = new FormData(e.currentTarget);
                      const settings = {
                        ...store.settings,
                        meeting: String(f.get("meeting")),
                        meetingTime: String(f.get("meetingTime")),
                        diet: String(f.get("diet")),
                      };
                      mutate("settings", settings, { ...store, settings });
                    }}
                  >
                    <label>
                      Feedback meeting link
                      <input
                        type="url"
                        name="meeting"
                        placeholder="https://zoom.us/… or Teams link"
                        defaultValue={store.settings.meeting}
                      />
                    </label>
                    <label>
                      Feedback meeting time (your local time)
                      <input
                        type="datetime-local"
                        name="meetingTime"
                        defaultValue={
                          store.settings.meetingTime
                            ? new Date(
                                new Date(store.settings.meetingTime).getTime() -
                                  new Date().getTimezoneOffset() * 60000,
                              )
                                .toISOString()
                                .slice(0, 16)
                            : ""
                        }
                      />
                    </label>
                    <label>
                      Shared diet plan
                      <textarea
                        rows={10}
                        maxLength={10000}
                        name="diet"
                        defaultValue={store.settings.diet}
                        placeholder="Add your reviewed shared diet guidance…"
                      />
                    </label>
                    <button className="primary" disabled={busy}>
                      Save program settings
                    </button>
                  </form>
                  <div className="callout">
                    <ShieldCheck size={20} />
                    <span>
                      Scores and completion are visible to admins. Personal
                      notes are excluded from this workspace and AI requests.
                    </span>
                  </div>
                </section>
              </div>
            </>
          )}
          {view === "account" && (
            <>
              <div className="page-heading">
                <div>
                  <span className="eyebrow">YOUR PREFERENCES</span>
                  <h1>A space that fits you.</h1>
                  <p>Keep your local time and account details up to date.</p>
                </div>
              </div>
              <section className="card account-card">
                <h2>Your timezone</h2>
                <p>
                  Choose your timezone from the short list below. Daylight
                  saving is handled automatically.
                </p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const timezone = String(
                      new FormData(e.currentTarget).get("timezone"),
                    );
                    mutate(
                      "timezone",
                      { timezone },
                      { ...store, settings: { ...store.settings, timezone } },
                    );
                  }}
                >
                  <label>
                    Timezone
                    <select
                      name="timezone"
                      defaultValue={store.settings.timezone}
                    >
                      {!commonTimezones.some(
                        (zone) => zone.value === store.settings.timezone,
                      ) && (
                        <option value={store.settings.timezone}>
                          Current timezone (
                          {store.settings.timezone.replaceAll("_", " ")})
                        </option>
                      )}
                      {commonTimezones.map((zone) => (
                        <option key={zone.value} value={zone.value}>
                          {zone.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button className="primary" disabled={busy}>
                    Save timezone
                  </button>
                </form>
                <p className="small">
                  Local-midnight unlocking is provisional until the group timing
                  is confirmed.
                </p>
              </section>
              <section className="card account-card">
                <h2>Your data</h2>
                <p>
                  Your notes stay private. Admins can view completion and
                  scores. Weekly AI reviews use structured check-ins, without
                  your notes.
                </p>
                <p>
                  A 90-day retention period after completion is proposed;
                  automatic deletion is not enabled in this preview.
                </p>
                {demo && (
                  <button
                    className="secondary"
                    onClick={() => {
                      if (
                        window.confirm(
                          "Clear all check-ins and content edits saved in this local preview?",
                        )
                      ) {
                        const next = initialStore();
                        localStorage.setItem(
                          "hrl-preview-v1",
                          JSON.stringify(next),
                        );
                        setStore(next);
                        setMessage("Local preview reset.");
                      }
                    }}
                  >
                    Reset local preview
                  </button>
                )}
              </section>
            </>
          )}
        </main>
      </div>
      <nav className="bottom-navigation" aria-label="Main navigation">
        {[...nav, { id: "account", name: "Account", icon: Settings }].map(
          (item) => (
            <button
              type="button"
              key={item.id}
              aria-current={view === item.id ? "page" : undefined}
              onClick={() => {
                navigate(item.id as View);
                window.scrollTo({ top: 0, behavior: "instant" });
              }}
            >
              <item.icon size={21} aria-hidden="true" />
              <span>
                {item.id === "today"
                  ? "Dashboard"
                  : item.id === "program"
                    ? "Experience"
                    : item.id === "week"
                      ? "Reflections"
                      : "Account"}
              </span>
            </button>
          ),
        )}
      </nav>
    </div>
  );
}
