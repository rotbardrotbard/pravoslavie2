"use client";

import { BookOpen, CalendarDays, Flame, Home, MapPin, Menu } from "lucide-react";
import type { Screen } from "@/lib/app-data";

export type TabId = "home" | "calendar" | "prayer" | "library" | "map" | "more";

const tabs: { id: TabId; label: string; icon: React.ReactNode; screen: Screen }[] = [
  { id: "home", label: "Дом", icon: <Home size={18} />, screen: "home" },
  { id: "calendar", label: "Календарь", icon: <CalendarDays size={18} />, screen: "calendar" },
  { id: "prayer", label: "Молитва", icon: <Flame size={18} />, screen: "prayer" },
  { id: "library", label: "Библиотека", icon: <BookOpen size={18} />, screen: "word" },
  { id: "map", label: "Карта", icon: <MapPin size={18} />, screen: "map" },
  { id: "more", label: "Ещё", icon: <Menu size={18} />, screen: "more" },
];

export default function BottomNav({
  active,
  onChange,
}: {
  active: TabId;
  onChange: (s: Screen) => void;
}) {
  return (
    <nav
      aria-label="Основная навигация"
      className="shrink-0 grid grid-cols-6 border-t"
      style={{
        background: "var(--an-card)",
        borderColor: "var(--an-line)",
      }}
    >
      {tabs.map((t) => {
        const isActive = t.id === active;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.screen)}
            aria-current={isActive ? "page" : undefined}
            className="relative flex flex-col items-center justify-center gap-1 pt-2 pb-2 min-h-[64px] transition-colors px-0.5"
            style={{ color: isActive ? "var(--an-ink)" : "var(--an-ink-faint)" }}
          >
            {isActive && (
              <span
                className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] rounded-b"
                style={{ background: "var(--an-accent)" }}
              />
            )}
            {t.icon}
            <span
              className="text-[0.7rem] leading-tight text-center whitespace-normal break-words"
              style={{ fontWeight: isActive ? 600 : 500 }}
            >
              {t.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
