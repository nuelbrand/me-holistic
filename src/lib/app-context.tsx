import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Phase = "Student" | "Employee" | "Business Owner" | "In-Transition";
export type Mood = "Excellent" | "Good" | "Neutral" | "Stressed";

export interface User {
  name: string;
  email: string;
  phase: Phase;
  detailA: string; // school/company/business/transition target
  detailB: string; // major/role/industry/next industry
  focus: string;
}

export interface Task { id: string; text: string; done: boolean; time?: string }
export interface Prayer { id: string; text: string; answered: boolean }
export interface Post { id: string; tribe: string; author: string; text: string; likes: number; liked: boolean; comments: string[] }
export interface Resource { id: string; title: string; type: "Books" | "Audio" | "Frameworks" | "Checklists"; summary: string; bookmarked: boolean }
export interface MoodLog { day: string; mood: Mood }

interface State {
  theme: "light" | "dark";
  user: User;
  mood: Mood | null;
  moodHistory: MoodLog[];
  tasks: Task[];
  lifeHappens: boolean;
  prayers: Prayer[];
  notes: string;
  journal: string;
  water: number;
  sleepHours: number;
  pillsFreeDays: number;
  savingsRatio: number;
  income: number;
  posts: Post[];
  tribes: string[];
  joinedTribes: string[];
  resources: Resource[];
  verse: { text: string; ref: string };
  promptList: string[];
  bibleBook: string;
  bibleChapter: number;
}

interface Ctx extends State {
  setTheme: (t: "light" | "dark") => void;
  toggleTheme: () => void;
  setUser: (u: Partial<User>) => void;
  setPhase: (p: Phase) => void;
  setMood: (m: Mood) => void;
  addTask: (text: string) => void;
  toggleTask: (id: string) => void;
  removeTask: (id: string) => void;
  setLifeHappens: (v: boolean) => void;
  addPrayer: (text: string) => void;
  togglePrayer: (id: string) => void;
  setNotes: (s: string) => void;
  setJournal: (s: string) => void;
  setWater: (n: number) => void;
  setSleep: (n: number) => void;
  logPillFreeDay: () => void;
  setSavingsRatio: (n: number) => void;
  setIncome: (n: number) => void;
  addPost: (tribe: string, text: string) => void;
  likePost: (id: string) => void;
  commentPost: (id: string, text: string) => void;
  joinTribe: (t: string) => void;
  addTribe: (t: string) => void;
  removeTribe: (t: string) => void;
  toggleBookmark: (id: string) => void;
  addResource: (r: Omit<Resource, "id" | "bookmarked">) => void;
  removeResource: (id: string) => void;
  updateResource: (id: string, patch: Partial<Resource>) => void;
  setVerse: (text: string, ref: string) => void;
  addPrompt: (s: string) => void;
  removePrompt: (i: number) => void;
  setBible: (book: string, chapter: number) => void;
}

const STORAGE_KEY = "me.app.state.v1";

const phaseTasks = (phase: Phase, simple: boolean): Task[] => {
  const base: Record<Phase, string[]> = {
    Student: ["Morning prayer & scripture", "Attend lectures / study block", "30-min focused reading", "Move your body (walk/gym)", "Review notes & plan tomorrow"],
    Employee: ["Morning prayer & scripture", "Inbox triage (20 min)", "Deep work block (2h)", "Walk / stretch break", "Reflect on wins & wind down"],
    "Business Owner": ["Morning prayer & scripture", "Review KPIs & pipeline", "Customer conversations", "Strategic deep work", "Team / vendor check-ins"],
    "In-Transition": ["Morning prayer & scripture", "1 skill-building session", "2 outreach messages", "Body movement / walk", "Journal direction & gratitude"],
  };
  const simpleSet = ["Pause & pray (5 min)", "Drink water", "One small win"];
  const list = simple ? simpleSet : base[phase];
  return list.map((t, i) => ({ id: `t${i}`, text: t, done: false }));
};

const defaultState: State = {
  theme: "light",
  user: { name: "Friend", email: "", phase: "Employee", detailA: "Acme Inc", detailB: "Designer", focus: "Cognitive Renewal" },
  mood: null,
  moodHistory: [
    { day: "Mon", mood: "Good" }, { day: "Tue", mood: "Neutral" }, { day: "Wed", mood: "Good" },
    { day: "Thu", mood: "Excellent" }, { day: "Fri", mood: "Stressed" }, { day: "Sat", mood: "Good" }, { day: "Sun", mood: "Good" },
  ],
  tasks: phaseTasks("Employee", false),
  lifeHappens: false,
  prayers: [
    { id: "p1", text: "Wisdom for the week ahead", answered: false },
    { id: "p2", text: "Healing for a dear friend", answered: true },
  ],
  notes: "",
  journal: "",
  water: 0,
  sleepHours: 7,
  pillsFreeDays: 12,
  savingsRatio: 20,
  income: 3000,
  posts: [
    { id: "po1", tribe: "Faith & Fitness", author: "Maya", text: "Ran 5k after morning devotion — clarity unlocked.", likes: 12, liked: false, comments: ["Inspiring!"] },
    { id: "po2", tribe: "Ethical Young Leaders", author: "Daniel", text: "How do you say no without burning bridges?", likes: 7, liked: false, comments: [] },
  ],
  tribes: ["Holy Spirit Study Group", "Ethical Young Leaders", "Faith & Fitness", "Cognitive Renewal Circle"],
  joinedTribes: ["Faith & Fitness"],
  resources: [
    { id: "r1", title: "Atomic Habits — Summary", type: "Books", summary: "Tiny changes, remarkable results. Identity-based habit loops.", bookmarked: false },
    { id: "r2", title: "10-Min Stoic Reset", type: "Audio", summary: "Quick audio reset for an anxious afternoon.", bookmarked: true },
    { id: "r3", title: "Make-Manage-Grow Framework", type: "Frameworks", summary: "Three-bucket money stewardship system.", bookmarked: false },
    { id: "r4", title: "Evening Wind-Down Checklist", type: "Checklists", summary: "8 steps to a restorative night.", bookmarked: false },
  ],
  verse: { text: "Be still, and know that I am God.", ref: "Psalm 46:10" },
  promptList: [
    "What toxic cognitive patterns am I replacing with truth today?",
    "Which fear is loudest right now, and what does it want?",
    "Where did I feel most alive this week?",
    "What is one boundary I need to honor?",
  ],
  bibleBook: "John",
  bibleChapter: 1,
};

const AppCtx = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(defaultState);
  const [hydrated, setHydrated] = useState(false);

  // Load persisted state on the client after first render to avoid SSR/CSR mismatch.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState((s) => ({ ...s, ...JSON.parse(raw) }));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
    document.documentElement.classList.toggle("dark", state.theme === "dark");
  }, [state, hydrated]);

  const update = (patch: Partial<State> | ((s: State) => Partial<State>)) =>
    setState((s) => ({ ...s, ...(typeof patch === "function" ? patch(s) : patch) }));

  const ctx: Ctx = useMemo(() => ({
    ...state,
    setTheme: (theme) => update({ theme }),
    toggleTheme: () => update((s) => ({ theme: s.theme === "dark" ? "light" : "dark" })),
    setUser: (u) => update((s) => ({ user: { ...s.user, ...u } })),
    setPhase: (phase) => update((s) => ({ user: { ...s.user, phase }, tasks: phaseTasks(phase, s.lifeHappens) })),
    setMood: (mood) => update((s) => ({
      mood,
      moodHistory: [...s.moodHistory.slice(-6), { day: new Date().toLocaleDateString(undefined, { weekday: "short" }), mood }],
    })),
    addTask: (text) => update((s) => ({ tasks: [...s.tasks, { id: `t${Date.now()}`, text, done: false }] })),
    toggleTask: (id) => update((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)) })),
    removeTask: (id) => update((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),
    setLifeHappens: (v) => update((s) => ({ lifeHappens: v, tasks: phaseTasks(s.user.phase, v) })),
    addPrayer: (text) => update((s) => ({ prayers: [...s.prayers, { id: `p${Date.now()}`, text, answered: false }] })),
    togglePrayer: (id) => update((s) => ({ prayers: s.prayers.map((p) => (p.id === id ? { ...p, answered: !p.answered } : p)) })),
    setNotes: (notes) => update({ notes }),
    setJournal: (journal) => update({ journal }),
    setWater: (water) => update({ water }),
    setSleep: (sleepHours) => update({ sleepHours }),
    logPillFreeDay: () => update((s) => ({ pillsFreeDays: s.pillsFreeDays + 1 })),
    setSavingsRatio: (savingsRatio) => update({ savingsRatio }),
    setIncome: (income) => update({ income }),
    addPost: (tribe, text) => update((s) => ({ posts: [{ id: `po${Date.now()}`, tribe, author: s.user.name, text, likes: 0, liked: false, comments: [] }, ...s.posts] })),
    likePost: (id) => update((s) => ({ posts: s.posts.map((p) => (p.id === id ? { ...p, liked: !p.liked, likes: p.likes + (p.liked ? -1 : 1) } : p)) })),
    commentPost: (id, text) => update((s) => ({ posts: s.posts.map((p) => (p.id === id ? { ...p, comments: [...p.comments, text] } : p)) })),
    joinTribe: (t) => update((s) => ({ joinedTribes: s.joinedTribes.includes(t) ? s.joinedTribes.filter((x) => x !== t) : [...s.joinedTribes, t] })),
    addTribe: (t) => update((s) => (s.tribes.includes(t) ? {} : ({ tribes: [...s.tribes, t] }))),
    removeTribe: (t) => update((s) => ({ tribes: s.tribes.filter((x) => x !== t), joinedTribes: s.joinedTribes.filter((x) => x !== t) })),
    toggleBookmark: (id) => update((s) => ({ resources: s.resources.map((r) => (r.id === id ? { ...r, bookmarked: !r.bookmarked } : r)) })),
    addResource: (r) => update((s) => ({ resources: [...s.resources, { ...r, id: `r${Date.now()}`, bookmarked: false }] })),
    removeResource: (id) => update((s) => ({ resources: s.resources.filter((r) => r.id !== id) })),
    updateResource: (id, patch) => update((s) => ({ resources: s.resources.map((r) => (r.id === id ? { ...r, ...patch } : r)) })),
    setVerse: (text, ref) => update({ verse: { text, ref } }),
    addPrompt: (s2) => update((s) => ({ promptList: [...s.promptList, s2] })),
    removePrompt: (i) => update((s) => ({ promptList: s.promptList.filter((_, idx) => idx !== i) })),
    setBible: (bibleBook, bibleChapter) => update({ bibleBook, bibleChapter }),
  }), [state]);

  return <AppCtx.Provider value={ctx}>{children}</AppCtx.Provider>;
}

export const useApp = () => {
  const c = useContext(AppCtx);
  if (!c) throw new Error("useApp must be used inside AppProvider");
  return c;
};
