import { Mic, MicOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Minimal Web Speech Recognition types (not in lib.dom by default)
type SRResult = { transcript: string };
type SREvent = { resultIndex: number; results: ArrayLike<ArrayLike<SRResult> & { isFinal: boolean }> };
type SRInstance = {
  lang: string; interimResults: boolean; continuous: boolean;
  start: () => void; stop: () => void;
  onresult: ((e: SREvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};

function getSR(): (new () => SRInstance) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => SRInstance; webkitSpeechRecognition?: new () => SRInstance };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function VoiceButton({
  onTranscript,
  className,
  lang = "en-US",
  title = "Voice input",
}: {
  onTranscript: (text: string, isFinal: boolean) => void;
  className?: string;
  lang?: string;
  title?: string;
}) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const ref = useRef<SRInstance | null>(null);

  useEffect(() => {
    const SR = getSR();
    if (!SR) { setSupported(false); return; }
    const r = new SR();
    r.lang = lang; r.interimResults = true; r.continuous = false;
    r.onresult = (e) => {
      let interim = ""; let final = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        const txt = res[0].transcript;
        if (res.isFinal) final += txt; else interim += txt;
      }
      if (final) onTranscript(final.trim(), true);
      else if (interim) onTranscript(interim.trim(), false);
    };
    r.onerror = (e) => { if (e.error !== "no-speech") toast.error(`Voice: ${e.error}`); setListening(false); };
    r.onend = () => setListening(false);
    ref.current = r;
    return () => { try { r.stop(); } catch {} ref.current = null; };
  }, [lang, onTranscript]);

  if (!supported) return null;

  const toggle = () => {
    const r = ref.current; if (!r) return;
    if (listening) { r.stop(); setListening(false); }
    else { try { r.start(); setListening(true); } catch { /* already started */ } }
  };

  return (
    <button
      type="button" onClick={toggle} title={title}
      className={cn(
        "press p-2.5 rounded-xl border transition-colors shrink-0",
        listening ? "border-destructive bg-destructive/10 text-destructive animate-pulse" : "border-border text-muted-foreground hover:text-foreground",
        className,
      )}
    >
      {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
    </button>
  );
}
