import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, type Phase } from "@/lib/auth";
import { awardXp } from "@/lib/xp";

export type { Phase };
export type Mood = "Excellent" | "Good" | "Neutral" | "Stressed";

export interface Task { id: string; text: string; done: boolean; time?: string }
export interface Prayer { id: string; text: string; answered: boolean }
export interface Post { id: string; tribe: string; author: string; text: string; likes: number; liked: boolean; comments: string[] }
export interface Resource {
  id: string;
  title: string;
  type: "Books" | "Audio" | "Frameworks" | "Checklists" | "Video";
  category: "Faith" | "Mind" | "Body" | "General";
  status: "not-started" | "in-progress" | "completed";
  summary: string;
  bookmarked: boolean;
}
export interface MoodLog { day: string; mood: Mood }

export interface ProfileLike {
  name: string;
  email: string;
  phase: Phase;
  detailA: string;
  detailB: string;
  focus: string;
}

interface State {
  theme: "light" | "dark";
  user: ProfileLike;
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
  foodPlan: string;
  exercisePlan: string;
  posts: Post[];
  tribes: string[];
  joinedTribes: string[];
  resources: Resource[];
  verse: { text: string; ref: string };
  promptList: string[];
  bibleBook: string;
  bibleChapter: number;
  bibleTranslation: string;
}

interface Ctx extends State {
  setTheme: (t: "light" | "dark") => void;
  toggleTheme: () => void;
  setUser: (u: Partial<ProfileLike>) => void;
  setPhase: (p: Phase) => void;
  setMood: (m: Mood) => void;
  addTask: (text: string) => void;
  toggleTask: (id: string) => void;
  removeTask: (id: string) => void;
  setLifeHappens: (v: boolean) => void;
  addPrayer: (text: string) => void;
  togglePrayer: (id: string) => void;
  setNotes: (s: string) => void;
  saveDevotionalNote: () => Promise<void>;
  setJournal: (s: string) => void;
  saveJournalEntry: (category?: string) => Promise<void>;
  setWater: (n: number) => void;
  setSleep: (n: number) => void;
  logPillFreeDay: () => void;
  setSavingsRatio: (n: number) => void;
  setIncome: (n: number) => void;
  setFoodPlan: (s: string) => void;
  setExercisePlan: (s: string) => void;
  addPost: (tribe: string, text: string) => Promise<void>;
  likePost: (id: string) => Promise<void>;
  commentPost: (id: string, text: string) => void;
  joinTribe: (t: string) => Promise<void>;
  addTribe: (name: string, description?: string) => Promise<void>;
  removeTribe: (name: string) => Promise<void>;
  toggleBookmark: (id: string) => Promise<void>;
  addResource: (r: Omit<Resource, "id" | "bookmarked" | "status"> & { status?: Resource["status"] }) => Promise<void>;
  removeResource: (id: string) => Promise<void>;
  updateResource: (id: string, patch: Partial<Resource>) => Promise<void>;
  setVerse: (text: string, ref: string) => void;
  addPrompt: (s: string) => void;
  removePrompt: (i: number) => void;
  setBible: (book: string, chapter: number) => void;
  setBibleTranslation: (t: string) => void;
}

const LOCAL_KEY = "me.app.local.v2";

const phaseTasks = (phase: Phase, simple: boolean): Task[] => {
  const base: Record<Phase, string[]> = {
    Student: ["Morning prayer & scripture", "Attend lectures / study block", "30-min focused reading", "Move your body (walk/gym)", "Review notes & plan tomorrow"],
    Employee: ["Morning prayer & scripture", "Inbox triage (20 min)", "Deep work block (2h)", "Walk / stretch break", "Reflect on wins & wind down"],
    "Business Owner": ["Morning prayer & scripture", "Review KPIs & pipeline", "Customer conversations", "Strategic deep work", "Team / vendor check-ins"],
    "In-Transition": ["Morning prayer & scripture", "1 skill-building session", "2 outreach messages", "Body movement / walk", "Journal direction & gratitude"],
  };
  const simpleSet = ["Pause & pray (5 min)", "Drink water", "One small win"];
  return (simple ? simpleSet : base[phase]).map((t, i) => ({ id: `t${i}`, text: t, done: false }));
};

// ---- Daily-rotating content ----
const VERSES = [
  { text: "Be still, and know that I am God.", ref: "Psalm 46:10" },
  { text: "Cast all your anxiety on Him because He cares for you.", ref: "1 Peter 5:7" },
  { text: "I can do all things through Christ who strengthens me.", ref: "Philippians 4:13" },
  { text: "Trust in the Lord with all your heart.", ref: "Proverbs 3:5" },
  { text: "The Lord is my shepherd; I shall not want.", ref: "Psalm 23:1" },
  { text: "Weeping may endure for a night, but joy comes in the morning.", ref: "Psalm 30:5" },
  { text: "Do not fear, for I am with you.", ref: "Isaiah 41:10" },
];
const dayIndex = () => Math.floor(Date.now() / 86400000);
const dailyVerse = () => VERSES[dayIndex() % VERSES.length];

const defaultUser: ProfileLike = { name: "Friend", email: "", phase: "Employee", detailA: "", detailB: "", focus: "Cognitive Renewal" };

const defaultState: State = {
  theme: "light",
  user: defaultUser,
  mood: null,
  moodHistory: [],
  tasks: phaseTasks("Employee", false),
  lifeHappens: false,
  prayers: [],
  notes: "",
  journal: "",
  water: 0,
  sleepHours: 7,
  pillsFreeDays: 0,
  savingsRatio: 20,
  income: 3000,
  foodPlan: "🥣 Breakfast: oats + berries + nut butter\n🥗 Lunch: protein + leafy greens + whole grain\n🍲 Dinner: light protein + roasted veg\n🍎 Snack: fruit + handful of nuts",
  exercisePlan: "Mon · 30-min walk\nWed · Strength 25 min\nFri · Mobility + stretch\nSat · Long outdoor activity",
  posts: [],
  tribes: [],
  joinedTribes: [],
  resources: [],
  verse: dailyVerse(),
  promptList: [
    "What toxic cognitive patterns am I replacing with truth today?",
    "Which fear is loudest right now, and what does it want?",
    "Where did I feel most alive this week?",
    "What is one boundary I need to honor?",
  ],
  bibleBook: "John",
  bibleChapter: 1,
  bibleTranslation: "kjv",
};

const dayName = (d: Date) => d.toLocaleDateString(undefined, { weekday: "short" });

const AppCtx = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const { user: authUser, profile } = useAuth();
  const [state, setState] = useState<State>(defaultState);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate local-only prefs
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        setState((s) => ({ ...s, ...saved, verse: dailyVerse() }));
      }
    } catch {}
    setHydrated(true);
  }, []);

  // Persist local-only prefs (theme, water, sleep, journal draft, etc.)
  useEffect(() => {
    if (!hydrated) return;
    const localOnly = {
      theme: state.theme,
      water: state.water,
      sleepHours: state.sleepHours,
      pillsFreeDays: state.pillsFreeDays,
      savingsRatio: state.savingsRatio,
      income: state.income,
      foodPlan: state.foodPlan,
      exercisePlan: state.exercisePlan,
      notes: state.notes,
      journal: state.journal,
      lifeHappens: state.lifeHappens,
      tasks: state.tasks,
      promptList: state.promptList,
      bibleBook: state.bibleBook,
      bibleChapter: state.bibleChapter,
      bibleTranslation: state.bibleTranslation,
    };
    try { localStorage.setItem(LOCAL_KEY, JSON.stringify(localOnly)); } catch {}
    document.documentElement.classList.toggle("dark", state.theme === "dark");
  }, [state, hydrated]);

  // Sync profile from auth
  useEffect(() => {
    if (profile) {
      setState((s) => ({
        ...s,
        user: {
          name: profile.username || s.user.name,
          email: profile.email || "",
          phase: (profile.life_phase as Phase) || s.user.phase,
          detailA: profile.detail_a || "",
          detailB: profile.detail_b || "",
          focus: profile.focus || s.user.focus,
        },
        tasks: phaseTasks((profile.life_phase as Phase) || s.user.phase, s.lifeHappens),
      }));
    }
  }, [profile]);

  // Load remote data on user change
  const reloadAll = async (uid: string) => {
    const since = new Date(Date.now() - 7 * 86400000).toISOString();
    const [moods, devs, ress, trbs, mbrs, pst] = await Promise.all([
      supabase.from("mood_logs").select("*").eq("user_id", uid).gte("logged_at", since).order("logged_at"),
      supabase.from("devotionals").select("*").eq("user_id", uid).neq("prayer_request", "").order("created_at", { ascending: false }),
      supabase.from("resources").select("*").eq("user_id", uid).order("created_at", { ascending: false }),
      supabase.from("tribes").select("*").order("created_at"),
      supabase.from("tribe_members").select("tribe_id").eq("user_id", uid),
      supabase.from("tribe_posts").select("*, tribes(name)").order("created_at", { ascending: false }).limit(100),
    ]);

    const moodHistory: MoodLog[] = (moods.data ?? []).map((m: any) => ({ day: dayName(new Date(m.logged_at)), mood: m.mood as Mood }));
    const latestMood = moodHistory.length ? moodHistory[moodHistory.length - 1].mood : null;

    const prayers: Prayer[] = (devs.data ?? []).map((d: any) => ({ id: d.id, text: d.prayer_request, answered: d.is_answered }));

    const resources: Resource[] = (ress.data ?? []).map((r: any) => ({
      id: r.id, title: r.title, type: r.type, category: r.category, status: r.status, summary: r.summary || "", bookmarked: r.bookmarked,
    }));

    const tribes = (trbs.data ?? []).map((t: any) => t.name);
    const joinedIds = new Set((mbrs.data ?? []).map((m: any) => m.tribe_id));
    const idToName: Record<string, string> = Object.fromEntries((trbs.data ?? []).map((t: any) => [t.id, t.name]));
    const joinedTribes = (trbs.data ?? []).filter((t: any) => joinedIds.has(t.id)).map((t: any) => t.name);

    const posts: Post[] = (pst.data ?? []).map((p: any) => ({
      id: p.id, tribe: idToName[p.tribe_id] || p.tribes?.name || "—", author: "Member", text: p.text, likes: p.likes, liked: false, comments: [],
    }));

    setState((s) => ({ ...s, moodHistory, mood: latestMood, prayers, resources, tribes, joinedTribes, posts }));
  };

  useEffect(() => {
    if (authUser) reloadAll(authUser.id);
    else setState((s) => ({ ...s, moodHistory: [], prayers: [], resources: [], tribes: [], joinedTribes: [], posts: [] }));
  }, [authUser?.id]);

  const update = (patch: Partial<State> | ((s: State) => Partial<State>)) =>
    setState((s) => ({ ...s, ...(typeof patch === "function" ? patch(s) : patch) }));

  const uid = authUser?.id;

  const ctx: Ctx = useMemo(() => ({
    ...state,
    setTheme: (theme) => update({ theme }),
    toggleTheme: () => update((s) => ({ theme: s.theme === "dark" ? "light" : "dark" })),
    setUser: async (u) => {
      update((s) => ({ user: { ...s.user, ...u } }));
      if (uid) {
        await supabase.from("profiles").update({
          username: u.name, detail_a: u.detailA, detail_b: u.detailB, focus: u.focus,
        }).eq("id", uid);
      }
    },
    setPhase: async (phase) => {
      update((s) => ({ user: { ...s.user, phase }, tasks: phaseTasks(phase, s.lifeHappens) }));
      if (uid) await supabase.from("profiles").update({ life_phase: phase }).eq("id", uid);
    },
    setMood: async (mood) => {
      const today = dayName(new Date());
      update((s) => ({ mood, moodHistory: [...s.moodHistory.filter((_, i) => i !== s.moodHistory.length - 1 || s.moodHistory[s.moodHistory.length - 1].day !== today), { day: today, mood }].slice(-7) }));
      if (uid) await supabase.from("mood_logs").insert({ user_id: uid, mood });
    },
    addTask: (text) => update((s) => ({ tasks: [...s.tasks, { id: `t${Date.now()}`, text, done: false }] })),
    toggleTask: (id) => update((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)) })),
    removeTask: (id) => update((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),
    setLifeHappens: (v) => update((s) => ({ lifeHappens: v, tasks: phaseTasks(s.user.phase, v) })),
    addPrayer: async (text) => {
      if (!uid) { update((s) => ({ prayers: [...s.prayers, { id: `p${Date.now()}`, text, answered: false }] })); return; }
      const { data } = await supabase.from("devotionals").insert({ user_id: uid, prayer_request: text }).select().single();
      if (data) update((s) => ({ prayers: [{ id: data.id, text: data.prayer_request || "", answered: data.is_answered }, ...s.prayers] }));
      awardXp(uid, "prayer_added");
    },
    togglePrayer: async (id) => {
      const p = state.prayers.find((x) => x.id === id);
      if (!p) return;
      update((s) => ({ prayers: s.prayers.map((x) => (x.id === id ? { ...x, answered: !x.answered } : x)) }));
      if (uid) {
        await supabase.from("devotionals").update({ is_answered: !p.answered }).eq("id", id);
        if (!p.answered) awardXp(uid, "prayer_answered");
      }
    },
    setNotes: (notes) => update({ notes }),
    saveDevotionalNote: async () => {
      if (!uid || !state.notes.trim()) return;
      await supabase.from("devotionals").insert({ user_id: uid, note_content: state.notes });
      awardXp(uid, "devotional_saved");
      update({ notes: "" });
    },
    setJournal: (journal) => update({ journal }),
    saveJournalEntry: async (category = "cognitive") => {
      if (!uid || !state.journal.trim()) return;
      await supabase.from("journal_entries").insert({ user_id: uid, content: state.journal, category });
      awardXp(uid, "journal_saved");
      update({ journal: "" });
    },
    setWater: (water) => update({ water }),
    setSleep: (sleepHours) => update({ sleepHours }),
    logPillFreeDay: () => update((s) => ({ pillsFreeDays: s.pillsFreeDays + 1 })),
    setSavingsRatio: (savingsRatio) => update({ savingsRatio }),
    setIncome: (income) => update({ income }),
    setFoodPlan: (foodPlan) => update({ foodPlan }),
    setExercisePlan: (exercisePlan) => update({ exercisePlan }),
    addPost: async (tribeName, text) => {
      if (!uid) return;
      const { data: tribe } = await supabase.from("tribes").select("id").eq("name", tribeName).maybeSingle();
      if (!tribe) return;
      const { data } = await supabase.from("tribe_posts").insert({ tribe_id: tribe.id, author_id: uid, text }).select().single();
      if (data) {
        update((s) => ({ posts: [{ id: data.id, tribe: tribeName, author: s.user.name, text, likes: 0, liked: false, comments: [] }, ...s.posts] }));
        awardXp(uid, "post_created");
      }
    },
    likePost: async (id) => {
      const p = state.posts.find((x) => x.id === id);
      if (!p) return;
      const newLikes = p.likes + (p.liked ? -1 : 1);
      update((s) => ({ posts: s.posts.map((x) => (x.id === id ? { ...x, liked: !x.liked, likes: newLikes } : x)) }));
      await supabase.from("tribe_posts").update({ likes: newLikes }).eq("id", id);
    },
    commentPost: (id, text) => update((s) => ({ posts: s.posts.map((p) => (p.id === id ? { ...p, comments: [...p.comments, text] } : p)) })),
    joinTribe: async (name) => {
      if (!uid) return;
      const { data: tribe } = await supabase.from("tribes").select("id").eq("name", name).maybeSingle();
      if (!tribe) return;
      const joined = state.joinedTribes.includes(name);
      if (joined) {
        await supabase.from("tribe_members").delete().eq("tribe_id", tribe.id).eq("user_id", uid);
      } else {
        await supabase.from("tribe_members").insert({ tribe_id: tribe.id, user_id: uid });
        awardXp(uid, "tribe_joined");
      }
      update((s) => ({ joinedTribes: joined ? s.joinedTribes.filter((t) => t !== name) : [...s.joinedTribes, name] }));
    },
    addTribe: async (name, description = "") => {
      if (!uid || state.tribes.includes(name)) return;
      const { data } = await supabase.from("tribes").insert({ name, description, creator_id: uid }).select().single();
      if (data) {
        await supabase.from("tribe_members").insert({ tribe_id: data.id, user_id: uid });
        update((s) => ({ tribes: [...s.tribes, name], joinedTribes: [...s.joinedTribes, name] }));
      }
    },
    removeTribe: async (name) => {
      const { data: tribe } = await supabase.from("tribes").select("id").eq("name", name).maybeSingle();
      if (tribe) await supabase.from("tribes").delete().eq("id", tribe.id);
      update((s) => ({ tribes: s.tribes.filter((t) => t !== name), joinedTribes: s.joinedTribes.filter((t) => t !== name) }));
    },
    toggleBookmark: async (id) => {
      const r = state.resources.find((x) => x.id === id);
      if (!r) return;
      const next = !r.bookmarked;
      update((s) => ({ resources: s.resources.map((x) => (x.id === id ? { ...x, bookmarked: next } : x)) }));
      if (uid) await supabase.from("resources").update({ bookmarked: next }).eq("id", id);
    },
    addResource: async (r) => {
      if (!uid) return;
      const { data } = await supabase.from("resources").insert({
        user_id: uid, title: r.title, summary: r.summary, type: r.type, category: r.category, status: r.status || "not-started",
      }).select().single();
      if (data) update((s) => ({ resources: [{ id: data.id, title: data.title, type: data.type, category: data.category, status: data.status, summary: data.summary || "", bookmarked: data.bookmarked }, ...s.resources] }));
    },
    removeResource: async (id) => {
      update((s) => ({ resources: s.resources.filter((r) => r.id !== id) }));
      if (uid) await supabase.from("resources").delete().eq("id", id);
    },
    updateResource: async (id, patch) => {
      const prev = state.resources.find((r) => r.id === id);
      update((s) => ({ resources: s.resources.map((r) => (r.id === id ? { ...r, ...patch } : r)) }));
      if (uid) {
        const dbPatch: any = {};
        if (patch.title !== undefined) dbPatch.title = patch.title;
        if (patch.summary !== undefined) dbPatch.summary = patch.summary;
        if (patch.type !== undefined) dbPatch.type = patch.type;
        if (patch.category !== undefined) dbPatch.category = patch.category;
        if (patch.status !== undefined) dbPatch.status = patch.status;
        if (patch.bookmarked !== undefined) dbPatch.bookmarked = patch.bookmarked;
        if (Object.keys(dbPatch).length) await supabase.from("resources").update(dbPatch).eq("id", id);
        if (patch.status === "completed" && prev?.status !== "completed") awardXp(uid, "resource_completed");
      }
    },
    setVerse: (text, ref) => update({ verse: { text, ref } }),
    addPrompt: (s2) => update((s) => ({ promptList: [...s.promptList, s2] })),
    removePrompt: (i) => update((s) => ({ promptList: s.promptList.filter((_, idx) => idx !== i) })),
    setBible: (bibleBook, bibleChapter) => update({ bibleBook, bibleChapter }),
    setBibleTranslation: (bibleTranslation) => update({ bibleTranslation }),
  }), [state, uid]);

  return <AppCtx.Provider value={ctx}>{children}</AppCtx.Provider>;
}

export const useApp = () => {
  const c = useContext(AppCtx);
  if (!c) throw new Error("useApp must be used inside AppProvider");
  return c;
};
