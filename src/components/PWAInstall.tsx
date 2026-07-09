import { Download, BellRing, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

const DISMISS_KEY = "me.pwa.dismissed.v1";

export function PWAInstall() {
  const [evt, setEvt] = useState<BIPEvent | null>(null);
  const [dismissed, setDismissed] = useState(true); // start true; enable after mount

  useEffect(() => {
    try { setDismissed(!!localStorage.getItem(DISMISS_KEY)); } catch {}
    const handler = (e: Event) => { e.preventDefault(); setEvt(e as BIPEvent); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const install = async () => {
    if (!evt) return;
    await evt.prompt();
    const c = await evt.userChoice;
    if (c.outcome === "accepted") toast.success("Installing me. — enjoy!");
    setEvt(null);
  };
  const askPush = async () => {
    if (typeof Notification === "undefined") { toast.error("Notifications unsupported"); return; }
    const p = await Notification.requestPermission();
    if (p === "granted") { new Notification("me.", { body: "Notifications enabled ✨", icon: "/icon-192.png" }); toast.success("Notifications enabled"); }
    else toast.info("Notifications not enabled");
  };
  const dismiss = () => { try { localStorage.setItem(DISMISS_KEY, "1"); } catch {} setDismissed(true); setEvt(null); };

  if (dismissed || !evt) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 z-40 max-w-xs animate-[slide-in_0.35s_ease-out]">
      <div className="rounded-2xl border border-border bg-card shadow-xl p-4">
        <div className="flex items-start gap-2">
          <div className="flex-1">
            <div className="font-bold text-sm">Install me.</div>
            <p className="text-xs text-muted-foreground mt-1">Get one-tap access + push reminders.</p>
          </div>
          <button onClick={dismiss} className="press p-1 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>
        <div className="mt-3 flex gap-2">
          <button onClick={install} className="press flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold">
            <Download className="h-3.5 w-3.5" /> Install
          </button>
          <button onClick={askPush} className="press inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-border text-xs font-semibold">
            <BellRing className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
