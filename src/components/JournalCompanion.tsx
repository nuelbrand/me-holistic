import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, X } from "lucide-react";
import { getJournalReflection } from "@/lib/ai.functions";
import { toast } from "sonner";

interface Reflection {
  encouragement: string;
  insight: string;
  verse_text: string;
  verse_ref: string;
  next_step: string;
}

export function JournalCompanion({ content }: { content: string }) {
  const reflect = useServerFn(getJournalReflection);
  const [loading, setLoading] = useState(false);
  const [reflection, setReflection] = useState<Reflection | null>(null);

  const run = async () => {
    if (!content.trim()) { toast.error("Write something first."); return; }
    setLoading(true);
    try {
      const r = await reflect({ data: { content } });
      setReflection(r as Reflection);
    } catch { toast.error("Reflection failed. Try again."); }
    setLoading(false);
  };

  return (
    <div className="mt-3">
      <button onClick={run} disabled={loading || !content.trim()}
        className="press inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-mind/30 bg-mind/10 text-mind text-xs font-semibold disabled:opacity-50">
        <Sparkles className={loading ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />
        {loading ? "Reflecting…" : "Get AI reflection"}
      </button>

      {reflection && (
        <div className="mt-3 p-4 rounded-2xl bg-mind/5 border border-mind/20 space-y-2 animate-[fade-in_0.3s_ease-out] relative">
          <button onClick={() => setReflection(null)} className="press absolute top-2 right-2 text-muted-foreground hover:text-foreground">
            <X className="h-3.5 w-3.5" />
          </button>
          <p className="text-sm font-semibold">{reflection.encouragement}</p>
          <p className="text-xs text-muted-foreground italic">💡 {reflection.insight}</p>
          <blockquote className="border-l-2 border-faith pl-3 py-1 text-xs italic text-faith">
            "{reflection.verse_text}" — {reflection.verse_ref}
          </blockquote>
          <p className="text-xs"><span className="font-bold text-mind">Next step:</span> {reflection.next_step}</p>
        </div>
      )}
    </div>
  );
}
