import { Sun, Moon, BookOpen, Type } from "lucide-react";
import { useTheme, type Theme, type FontSize } from "@/lib/theme";
import { cn } from "@/lib/utils";

const THEMES: { id: Theme; label: string; icon: typeof Sun }[] = [
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "sepia", label: "Sepia", icon: BookOpen },
];

const SIZES: { id: FontSize; label: string }[] = [
  { id: "sm", label: "A-" },
  { id: "md", label: "A" },
  { id: "lg", label: "A+" },
];

export function ThemeSwitcher({ compact }: { compact?: boolean }) {
  const { theme, fontSize, setTheme, setFontSize } = useTheme();
  return (
    <div className={cn("flex flex-col gap-2", compact && "gap-1.5")}>
      <div className="grid grid-cols-3 gap-1 p-1 rounded-xl border border-border bg-background">
        {THEMES.map(({ id, label, icon: Icon }) => (
          <button
            key={id} onClick={() => setTheme(id)}
            title={label}
            className={cn(
              "press flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium",
              theme === id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {!compact && <span>{label}</span>}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-[auto_1fr] items-center gap-2 px-1">
        <Type className="h-3.5 w-3.5 text-muted-foreground" />
        <div className="grid grid-cols-3 gap-1 p-1 rounded-xl border border-border bg-background">
          {SIZES.map(({ id, label }) => (
            <button
              key={id} onClick={() => setFontSize(id)}
              className={cn(
                "press py-1 rounded-lg text-xs font-semibold",
                fontSize === id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >{label}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
