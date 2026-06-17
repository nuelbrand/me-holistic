import { useEffect, useRef, useState } from "react";
import { BookOpen, ChevronLeft, ChevronRight, Maximize2, Minimize2, Loader2 } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { cn } from "@/lib/utils";

// Canonical 66-book list with chapter counts
const BIBLE_BOOKS: { name: string; chapters: number }[] = [
  { name: "Genesis", chapters: 50 }, { name: "Exodus", chapters: 40 }, { name: "Leviticus", chapters: 27 },
  { name: "Numbers", chapters: 36 }, { name: "Deuteronomy", chapters: 34 }, { name: "Joshua", chapters: 24 },
  { name: "Judges", chapters: 21 }, { name: "Ruth", chapters: 4 }, { name: "1 Samuel", chapters: 31 },
  { name: "2 Samuel", chapters: 24 }, { name: "1 Kings", chapters: 22 }, { name: "2 Kings", chapters: 25 },
  { name: "1 Chronicles", chapters: 29 }, { name: "2 Chronicles", chapters: 36 }, { name: "Ezra", chapters: 10 },
  { name: "Nehemiah", chapters: 13 }, { name: "Esther", chapters: 10 }, { name: "Job", chapters: 42 },
  { name: "Psalms", chapters: 150 }, { name: "Proverbs", chapters: 31 }, { name: "Ecclesiastes", chapters: 12 },
  { name: "Song of Solomon", chapters: 8 }, { name: "Isaiah", chapters: 66 }, { name: "Jeremiah", chapters: 52 },
  { name: "Lamentations", chapters: 5 }, { name: "Ezekiel", chapters: 48 }, { name: "Daniel", chapters: 12 },
  { name: "Hosea", chapters: 14 }, { name: "Joel", chapters: 3 }, { name: "Amos", chapters: 9 },
  { name: "Obadiah", chapters: 1 }, { name: "Jonah", chapters: 4 }, { name: "Micah", chapters: 7 },
  { name: "Nahum", chapters: 3 }, { name: "Habakkuk", chapters: 3 }, { name: "Zephaniah", chapters: 3 },
  { name: "Haggai", chapters: 2 }, { name: "Zechariah", chapters: 14 }, { name: "Malachi", chapters: 4 },
  { name: "Matthew", chapters: 28 }, { name: "Mark", chapters: 16 }, { name: "Luke", chapters: 24 },
  { name: "John", chapters: 21 }, { name: "Acts", chapters: 28 }, { name: "Romans", chapters: 16 },
  { name: "1 Corinthians", chapters: 16 }, { name: "2 Corinthians", chapters: 13 }, { name: "Galatians", chapters: 6 },
  { name: "Ephesians", chapters: 6 }, { name: "Philippians", chapters: 4 }, { name: "Colossians", chapters: 4 },
  { name: "1 Thessalonians", chapters: 5 }, { name: "2 Thessalonians", chapters: 3 }, { name: "1 Timothy", chapters: 6 },
  { name: "2 Timothy", chapters: 4 }, { name: "Titus", chapters: 3 }, { name: "Philemon", chapters: 1 },
  { name: "Hebrews", chapters: 13 }, { name: "James", chapters: 5 }, { name: "1 Peter", chapters: 5 },
  { name: "2 Peter", chapters: 3 }, { name: "1 John", chapters: 5 }, { name: "2 John", chapters: 1 },
  { name: "3 John", chapters: 1 }, { name: "Jude", chapters: 1 }, { name: "Revelation", chapters: 22 },
];

// bible-api.com supported free translations
const TRANSLATIONS = [
  { id: "kjv", label: "KJV" },
  { id: "web", label: "WEB" },
  { id: "bbe", label: "BBE" },
];

interface Verse { book_name: string; chapter: number; verse: number; text: string }

export function BibleReader() {
  const { bibleBook, bibleChapter, bibleTranslation, setBible, setBibleTranslation } = useApp();
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focus, setFocus] = useState(false);
  const [fade, setFade] = useState(true);
  const reqId = useRef(0);

  const currentBook = BIBLE_BOOKS.find((b) => b.name === bibleBook) ?? BIBLE_BOOKS[0];
  const maxChapter = currentBook.chapters;
  const safeChapter = Math.min(Math.max(1, bibleChapter), maxChapter);

  useEffect(() => {
    const id = ++reqId.current;
    setLoading(true); setError(null); setFade(false);
    const ref = encodeURIComponent(`${bibleBook} ${safeChapter}`);
    fetch(`https://bible-api.com/${ref}?translation=${bibleTranslation}`)
      .then((r) => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))
      .then((data) => {
        if (id !== reqId.current) return;
        setVerses(data.verses ?? []);
        setLoading(false);
        requestAnimationFrame(() => setFade(true));
      })
      .catch((e) => {
        if (id !== reqId.current) return;
        setError(e.message || "Could not load passage");
        setLoading(false);
        setFade(true);
      });
  }, [bibleBook, safeChapter, bibleTranslation]);

  // ESC exits focus mode
  useEffect(() => {
    if (!focus) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setFocus(false); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [focus]);

  const goChapter = (n: number) => {
    if (n < 1 || n > maxChapter) return;
    setBible(bibleBook, n);
  };

  const containerCls = focus
    ? "fixed inset-0 z-50 bg-background overflow-auto p-6 md:p-12 animate-[fade-in_0.3s_ease-out]"
    : "lift rounded-3xl border border-border bg-card p-6";

  return (
    <div className={containerCls}>
      <div className={cn("flex flex-wrap items-center gap-3", focus && "max-w-3xl mx-auto")}>
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-faith">
          <BookOpen className="h-3.5 w-3.5" /> Bible reader
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="flex rounded-lg border border-border overflow-hidden">
            {TRANSLATIONS.map((t) => (
              <button
                key={t.id}
                onClick={() => setBibleTranslation(t.id)}
                className={cn(
                  "press px-2.5 py-1 text-xs font-semibold transition-colors",
                  bibleTranslation === t.id ? "bg-faith text-faith-foreground" : "bg-background text-muted-foreground hover:text-foreground",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setFocus((f) => !f)}
            title={focus ? "Exit focus mode" : "Focus mode"}
            className="press p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground"
          >
            {focus ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className={cn("mt-4 flex flex-col sm:flex-row gap-2", focus && "max-w-3xl mx-auto")}>
        <select
          value={bibleBook}
          onChange={(e) => setBible(e.target.value, 1)}
          className="press bg-background border border-border rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {BIBLE_BOOKS.map((b) => <option key={b.name} value={b.name}>{b.name}</option>)}
        </select>
        <select
          value={safeChapter}
          onChange={(e) => goChapter(+e.target.value)}
          className="press bg-background border border-border rounded-lg px-3 py-2 text-sm sm:w-32 focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {Array.from({ length: maxChapter }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>Chapter {n}</option>
          ))}
        </select>
        <div className="flex gap-2">
          <button
            onClick={() => goChapter(safeChapter - 1)}
            disabled={safeChapter <= 1}
            className="press flex-1 sm:flex-none px-3 py-2 rounded-lg border border-border text-sm disabled:opacity-40 inline-flex items-center justify-center gap-1"
          >
            <ChevronLeft className="h-4 w-4" /> Prev
          </button>
          <button
            onClick={() => goChapter(safeChapter + 1)}
            disabled={safeChapter >= maxChapter}
            className="press flex-1 sm:flex-none px-3 py-2 rounded-lg border border-border text-sm disabled:opacity-40 inline-flex items-center justify-center gap-1"
          >
            Next <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        className={cn(
          "mt-5 rounded-xl bg-background border border-border transition-opacity duration-500",
          fade ? "opacity-100" : "opacity-0",
          focus ? "max-w-3xl mx-auto p-6 md:p-10 border-0 bg-transparent" : "p-5 max-h-[28rem] overflow-auto",
        )}
      >
        <div className="font-serif">
          <div className={cn("font-bold mb-4 not-italic", focus ? "text-3xl md:text-4xl" : "text-xl")}>
            {bibleBook} {safeChapter}
            <span className="ml-2 text-xs font-sans font-medium uppercase tracking-wider text-muted-foreground">
              {TRANSLATIONS.find((t) => t.id === bibleTranslation)?.label}
            </span>
          </div>

          {loading && (
            <div className="flex items-center gap-2 text-muted-foreground text-sm font-sans">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading passage…
            </div>
          )}
          {error && !loading && (
            <div className="text-sm text-destructive font-sans">Could not load passage. {error}</div>
          )}
          {!loading && !error && (
            <p className={cn("leading-relaxed text-foreground", focus ? "text-lg md:text-xl leading-9" : "text-base")}>
              {verses.map((v) => (
                <span key={v.verse}>
                  <sup className="text-[0.65em] font-sans font-bold text-faith mr-1 align-super">{v.verse}</sup>
                  {v.text.trim()}{" "}
                </span>
              ))}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
