import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Home, Sparkles, Brain, HeartPulse, Users, BookOpen, Shield, Moon, Sun, Menu, X, LogOut, Target, Flame, Trophy } from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { useApp, type Phase } from "@/lib/app-context";
import { useAuth } from "@/lib/auth";
import { useStats } from "@/lib/stats-context";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: Home },
  { to: "/faith", label: "Faith", icon: Sparkles },
  { to: "/mind", label: "Mind", icon: Brain },
  { to: "/body", label: "Body", icon: HeartPulse },
  { to: "/community", label: "Community", icon: Users },
];
const MORE = [
  { to: "/goals", label: "Goals", icon: Target },
  { to: "/resources", label: "Resources", icon: BookOpen },
  { to: "/admin", label: "Admin", icon: Shield },
];

const PHASES: Phase[] = ["Student", "Employee", "Business Owner", "In-Transition"];

export function AppShell({ children }: { children: ReactNode }) {
  const nav = useNavigate();
  const { theme, toggleTheme, user, setPhase } = useApp();
  const { role, signOut } = useAuth();
  const stats = useStats();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navItems = [...NAV, ...MORE.filter((m) => m.to !== "/admin" || role === "admin")];

  const handleLogout = async () => {
    await signOut();
    toast.success("Signed out");
    nav({ to: "/", replace: true });
  };

  return (
    <div className="min-h-screen flex w-full bg-background text-foreground">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-border bg-card/40 backdrop-blur p-5 sticky top-0 h-screen">
        <Link to="/" className="text-3xl font-black tracking-tight mb-8">
          me<span className="text-primary">.</span>
        </Link>
        <div className="mb-6 p-3 rounded-xl bg-muted/60">
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Active</div>
            <div className="inline-flex items-center gap-1 rounded-full bg-primary/15 text-primary px-2 py-0.5 text-[10px] font-bold" title={`${stats.totalXp} XP total`}>
              <Trophy className="h-3 w-3" /> LV {stats.level}
            </div>
          </div>
          <div className="font-semibold truncate mt-1">{user.name}</div>
          <div className="text-xs text-muted-foreground truncate">{user.detailB} · {user.phase}</div>
          <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary to-faith transition-all duration-500" style={{ width: `${stats.progressPct}%` }} />
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[10px] text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Flame className="h-3 w-3 text-orange-500" /> {stats.currentStreak}d streak</span>
            <span>{stats.currentInLevel}/{stats.neededInLevel} XP</span>
          </div>
        </div>
        <nav className="flex flex-col gap-1">
          {navItems.map((n) => {
            const active = pathname.startsWith(n.to);
            const Icon = n.icon;
            return (
              <Link key={n.to} to={n.to}
                className={cn("press flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium",
                  active ? "bg-primary text-primary-foreground shadow-md" : "hover:bg-accent")}>
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{n.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto flex flex-col gap-2">
          <PhaseSwitcher value={user.phase} onChange={setPhase} />
          <button onClick={toggleTheme} className="press flex items-center gap-2 px-3 py-2 rounded-xl border border-border text-sm">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            <span>{theme === "dark" ? "Light" : "Dark"} mode</span>
          </button>
          <button onClick={handleLogout} className="press flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground">
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="md:hidden sticky top-0 z-30 flex items-center justify-between gap-2 px-4 h-14 border-b border-border bg-background/80 backdrop-blur">
          <Link to="/" className="text-2xl font-black">me<span className="text-primary">.</span></Link>
          <div className="flex items-center gap-2">
            <PhaseSwitcher compact value={user.phase} onChange={setPhase} />
            <button onClick={toggleTheme} className="press p-2 rounded-lg border border-border">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </header>

        <main className="flex-1 px-4 md:px-8 py-6 pb-24 md:pb-10 animate-[fade-in_0.4s_ease-out]">
          {children}
        </main>

        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-background/95 backdrop-blur border-t border-border">
          <div className="grid grid-cols-6">
            {NAV.map((n) => {
              const active = pathname.startsWith(n.to);
              const Icon = n.icon;
              return (
                <Link key={n.to} to={n.to} className={cn("press flex flex-col items-center gap-1 py-2.5 text-[10px]", active ? "text-primary" : "text-muted-foreground")}>
                  <Icon className={cn("h-5 w-5", active && "animate-pop")} />
                  <span className="truncate">{n.label}</span>
                </Link>
              );
            })}
            <button onClick={() => setDrawerOpen(true)} className="press flex flex-col items-center gap-1 py-2.5 text-[10px] text-muted-foreground">
              <Menu className="h-5 w-5" /> <span>More</span>
            </button>
          </div>
        </nav>
      </div>

      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-background animate-[fade-in_0.25s_ease-out] flex flex-col p-6">
          <div className="flex justify-between items-center mb-8">
            <span className="text-2xl font-black">me<span className="text-primary">.</span></span>
            <button onClick={() => setDrawerOpen(false)} className="press p-2 rounded-lg border border-border"><X className="h-5 w-5" /></button>
          </div>
          <div className="flex flex-col gap-2 text-lg">
            {MORE.filter((m) => m.to !== "/admin" || role === "admin").map((n) => {
              const Icon = n.icon;
              return (
                <Link key={n.to} to={n.to} onClick={() => setDrawerOpen(false)} className="press flex items-center gap-3 p-4 rounded-2xl bg-card border border-border">
                  <Icon className="h-5 w-5" /> {n.label}
                </Link>
              );
            })}
            <button onClick={() => { toggleTheme(); setDrawerOpen(false); }} className="press flex items-center gap-3 p-4 rounded-2xl bg-card border border-border">
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />} Toggle theme
            </button>
            <button onClick={() => { setDrawerOpen(false); handleLogout(); }} className="press flex items-center gap-3 p-4 rounded-2xl bg-card border border-border text-destructive">
              <LogOut className="h-5 w-5" /> Logout
            </button>
          </div>
          <div className="mt-6">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Life Phase (sandbox)</div>
            <div className="grid grid-cols-2 gap-2">
              {PHASES.map((p) => (
                <button key={p} onClick={() => setPhase(p)} className={cn("press p-3 rounded-xl border text-sm", user.phase === p ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border")}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PhaseSwitcher({ value, onChange, compact }: { value: Phase; onChange: (p: Phase) => void; compact?: boolean }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as Phase)}
      className={cn(
        "press bg-card border border-border rounded-lg text-xs font-medium px-2 py-2 focus:outline-none focus:ring-2 focus:ring-ring",
        compact ? "max-w-[120px]" : "w-full",
      )}
      title="Life Phase (sandbox)"
    >
      {PHASES.map((p) => <option key={p} value={p}>{p}</option>)}
    </select>
  );
}

export function PageHeader({ title, subtitle, accent }: { title: string; subtitle?: string; accent?: "faith" | "mind" | "body" }) {
  const color = accent === "faith" ? "text-faith" : accent === "mind" ? "text-mind" : accent === "body" ? "text-body" : "text-foreground";
  return (
    <div className="mb-8 animate-[fade-in_0.4s_ease-out]">
      <h1 className={cn("text-3xl md:text-4xl font-black tracking-tight", color)}>{title}<span className="text-primary">.</span></h1>
      {subtitle && <p className="text-muted-foreground mt-2 max-w-2xl">{subtitle}</p>}
    </div>
  );
}
