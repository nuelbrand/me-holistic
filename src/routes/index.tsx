import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, Brain, HeartPulse, ArrowRight, Moon, Sun } from "lucide-react";
import { useApp } from "@/lib/app-context";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "me. — The blueprint of holistic self-stewardship" },
      { name: "description", content: "Faith, Mind, Body, Community. One ecosystem for becoming the truest version of you." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { theme, toggleTheme } = useApp();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="flex items-center justify-between px-6 md:px-10 py-5">
        <span className="text-2xl md:text-3xl font-black">me<span className="text-primary">.</span></span>
        <div className="flex items-center gap-3">
          <button onClick={toggleTheme} className="press p-2 rounded-lg border border-border" aria-label="Toggle theme">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <Link to="/register" className="press text-sm font-semibold px-4 py-2 rounded-xl bg-primary text-primary-foreground">Start Free</Link>
        </div>
      </header>

      <section className="px-6 md:px-10 pt-12 md:pt-24 pb-20 max-w-5xl mx-auto text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-6 animate-[fade-in_0.4s_ease-out]">A new kind of self-care</p>
        <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.05] animate-[fade-in_0.5s_ease-out]">
          Welcome to <span className="text-primary">me.</span><br className="hidden md:block" />
          The blueprint of holistic <span className="italic font-serif">self-stewardship</span>.
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto animate-[fade-in_0.6s_ease-out]">
          Centered on Faith, Mind, and Body — designed for the life phase you're actually in.
          Build the rituals that build the person.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3 animate-[fade-in_0.7s_ease-out]">
          <Link to="/register" className="press inline-flex items-center gap-2 rounded-2xl bg-primary text-primary-foreground px-6 py-4 text-base font-semibold shadow-lg">
            Start Free <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/dashboard" className="press inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-6 py-4 text-base font-semibold">
            Peek the dashboard
          </Link>
        </div>
      </section>

      <section className="px-6 md:px-10 pb-24 max-w-6xl mx-auto grid md:grid-cols-3 gap-5">
        {[
          { icon: Sparkles, label: "Faith", text: "Daily scripture, emotional alignment, and a private prayer wall.", color: "text-faith", bg: "bg-faith/10" },
          { icon: Brain, label: "Mind", text: "Cognitive renewal, 10-minute resets, and a journaling lab.", color: "text-mind", bg: "bg-mind/10" },
          { icon: HeartPulse, label: "Body", text: "Health, relationships, finance, and active communication.", color: "text-body", bg: "bg-body/10" },
        ].map((c) => (
          <div key={c.label} className="lift rounded-3xl border border-border bg-card p-6 cursor-default">
            <div className={`h-12 w-12 rounded-2xl ${c.bg} ${c.color} grid place-items-center mb-4`}>
              <c.icon className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold">{c.label}<span className="text-primary">.</span></h3>
            <p className="text-sm text-muted-foreground mt-2">{c.text}</p>
          </div>
        ))}
      </section>

      <footer className="px-6 md:px-10 py-10 border-t border-border text-center text-xs text-muted-foreground">
        Built with intention. © me.
      </footer>
    </div>
  );
}
