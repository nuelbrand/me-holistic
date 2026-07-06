import { useState } from "react";
import { Sparkles, RefreshCw, Dumbbell, Heart, Moon, Utensils } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { getBodyCoachAdvice } from "@/lib/ai.functions";
import { toast } from "sonner";

interface Advice {
  headline: string;
  recovery: string;
  workout_today: string;
  nutrition_tip: string;
  sleep_tip: string;
  encouragement: string;
}

export function BodyCoach() {
  const fetchAdvice = useServerFn(getBodyCoachAdvice);
  const [data, setData] = useState<Advice | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchAdvice({ data: {} });
      setData(res as Advice);
    } catch (e: any) {
      toast.error(e?.message ?? "AI coach unavailable");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lift rounded-3xl border border-body/40 bg-gradient-to-br from-body/10 via-card to-card p-6 md:col-span-2">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-body" />
          <div className="text-xs uppercase tracking-wider text-body font-bold">AI body coach</div>
        </div>
        <button onClick={load} disabled={loading}
          className="press inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-body text-body-foreground text-xs font-semibold disabled:opacity-60">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          {data ? "Refresh" : "Get advice"}
        </button>
      </div>

      {!data && !loading && (
        <p className="text-sm text-muted-foreground">Tap "Get advice" — I'll read your recent workouts, sleep, and weight to give personalized guidance for today.</p>
      )}
      {loading && (
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded animate-pulse w-2/3" />
          <div className="h-3 bg-muted rounded animate-pulse w-full" />
          <div className="h-3 bg-muted rounded animate-pulse w-5/6" />
        </div>
      )}
      {data && (
        <div className="space-y-3 animate-[fade-in_0.4s_ease-out]">
          <div className="text-base font-bold">{data.headline}</div>
          <p className="text-sm text-muted-foreground italic">{data.encouragement}</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <Tip icon={Dumbbell} title="Today's workout" body={data.workout_today} />
            <Tip icon={Heart} title="Recovery" body={data.recovery} />
            <Tip icon={Utensils} title="Nutrition" body={data.nutrition_tip} />
            <Tip icon={Moon} title="Sleep" body={data.sleep_tip} />
          </div>
        </div>
      )}
    </div>
  );
}

function Tip({ icon: Icon, title, body }: { icon: any; title: string; body: string }) {
  return (
    <div className="p-3 rounded-xl bg-background border border-border">
      <div className="flex items-center gap-1.5 text-[10px] uppercase text-body font-bold tracking-wider">
        <Icon className="h-3 w-3" /> {title}
      </div>
      <p className="text-xs mt-1">{body}</p>
    </div>
  );
}
