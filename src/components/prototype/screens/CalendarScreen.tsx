"use client";

import { useMemo, useState } from "react";
import { BookOpen, ChevronLeft, ChevronRight, Library } from "lucide-react";
import { PhotoBanner, SectionTitle } from "../bits";
import ReaderOverlay from "../ReaderOverlay";
import type { ReaderTarget } from "@/lib/app-data";
import {
  dayKey,
  getDayInfo,
  monthGrid,
  monthTitle,
  type FeastKind,
} from "@/lib/content/calendar";

const kindColor: Record<FeastKind, string> = {
  great: "var(--an-accent)",
  feast: "var(--an-accent)",
  icon: "var(--an-accent)",
  saint: "var(--an-ink)",
  post: "var(--an-quiet)",
};

export default function CalendarScreen({
  go,
  toast,
}: {
  go: (s: "word") => void;
  toast: (m: string) => void;
}) {
  const now = new Date();
  const [cursor, setCursor] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [selected, setSelected] = useState<Date | null>(null);
  const [reader, setReader] = useState<ReaderTarget | null>(null);

  const info = useMemo(() => getDayInfo(selected ?? now), [selected, now]);
  const grid = useMemo(() => monthGrid(cursor.y, cursor.m), [cursor]);
  const todayInfo = useMemo(() => getDayInfo(now), [now]);

  const shiftMonth = (delta: number) => {
    setSelected(null);
    setCursor((c) => {
      const d = new Date(c.y, c.m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
  };

  return (
    <div className="px-4 py-4 pb-8 animate-fade-up">
      {/* Шапка дня */}
      <PhotoBanner
        src="/images/day-header.jpg"
        alt="Белый храм с золотым куполом утром"
        strength="center"
        className="px-4 py-3.5 mb-3 text-center"
      >
        <div className="pr-display text-[1.25rem] text-white">{info.dateNew}</div>
        <div className="pr-read italic text-[0.78rem] text-[rgba(255,255,255,.78)]">{info.dateOld}</div>
        <div className="an-divider my-2 opacity-80">
          <span className="pr-serif text-[0.7rem] text-[rgba(255,255,255,.92)]">{info.weekLabel}</span>
        </div>
        <div className="pr-serif text-[0.74rem] text-[#ffffff]">
          {info.glas} · {info.fastLabel}
        </div>
      </PhotoBanner>

      {/* Трапеза и пост */}
      <div className="orn-card-soft px-3.5 py-2.5 mb-3 flex items-center gap-2.5">
        <span
          className="text-[0.62rem] uppercase tracking-wide px-1.5 py-0.5 rounded shrink-0"
          style={{ background: info.fastLabel === "Поста нет" ? "var(--an-tile)" : "#f8e9e9", color: "var(--an-ink)" }}
        >
          {info.fastLabel}
        </span>
        <span className="pr-serif text-[0.72rem] leading-snug" style={{ color: "var(--an-ink)" }}>
          {info.meal}
        </span>
      </div>

      {/* Святые дня — полный месяцеслов: у каждого описание, у известных — полное житие */}
      <SectionTitle className="mb-2">
        {selected ? "Выбранный день" : "Сегодня — кого Церковь вспоминает"}
      </SectionTitle>
      <div className="orn-card px-3.5 py-3 mb-4">
        {info.notices.map((n, i) => (
          <p
            key={"n" + i}
            className="pr-serif text-[0.74rem] mb-2 italic"
            style={{ color: "var(--an-ink-soft)" }}
          >
            {n}
          </p>
        ))}
        {info.saintRecs.length === 0 && !info.notices.length && (
          <p className="pr-serif text-[0.78rem]" style={{ color: "var(--an-ink-soft)" }}>
            Богослужение по уставу дня
          </p>
        )}
        <ul className="flex flex-col gap-3">
          {info.saintRecs.map((s, i) => (
            <li key={i} className="flex gap-2.5">
              <span
                className="mt-[7px] w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: "var(--an-accent)" }}
              />
              <div className="min-w-0">
                <p className="pr-serif text-[0.8rem] font-semibold leading-snug" style={{ color: "var(--an-ink)" }}>
                  {s.name}
                  {s.year && (
                    <span className="font-normal text-[0.68rem]" style={{ color: "var(--an-ink-soft)" }}>
                      {"  "}· {s.year}
                    </span>
                  )}
                </p>
                <p className="pr-serif text-[0.72rem] leading-snug mt-0.5" style={{ color: "var(--an-ink-soft)" }}>
                  {s.desc}
                </p>
                {s.lifeId && (
                  <button
                    onClick={() => setReader({ mode: "life", id: s.lifeId! })}
                    className="pr-chip mt-1.5"
                  >
                    <BookOpen size={11} /> Житие полным текстом
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Месяц */}
      <SectionTitle className="mb-2">Месяцеслов</SectionTitle>
      <div className="orn-card p-3 mb-3">
        <div className="flex items-center justify-between mb-2">
          <button
            aria-label="Предыдущий месяц"
            onClick={() => shiftMonth(-1)}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-black/5"
            style={{ color: "var(--an-ink)" }}
          >
            <ChevronLeft size={16} />
          </button>
          <span className="pr-display text-[0.95rem]" style={{ color: "var(--an-ink)" }}>
            {monthTitle(cursor.y, cursor.m)}
          </span>
          <button
            aria-label="Следующий месяц"
            onClick={() => shiftMonth(1)}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-black/5"
            style={{ color: "var(--an-ink)" }}
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-1">
          {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((d) => (
            <div
              key={d}
              className="text-center pr-serif text-[0.6rem]"
              style={{ color: "var(--an-ink-soft)" }}
            >
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {grid.map((d) => {
            const inMonth = d.getMonth() === cursor.m;
            const di = getDayInfo(d);
            const feast = di.feast;
            const isToday = di.isToday;
            const isSelected = selected && dayKey(d) === dayKey(selected);
            return (
              <button
                key={dayKey(d)}
                onClick={() => setSelected(d)}
                className="h-10 rounded-lg relative flex items-start justify-center pt-1 pr-serif text-[0.72rem] transition-colors"
                style={{
                  background: isSelected ? "var(--an-slate)" : isToday ? "var(--an-ink)" : feast ? "var(--an-feast-bg)" : "transparent",
                  color: isSelected || isToday ? "#ffffff" : inMonth ? "var(--an-ink)" : "var(--an-ink-faint)",
                  border: feast && !isToday && !isSelected ? "1px solid var(--an-feast-line)" : "1px solid transparent",
                  opacity: inMonth ? 1 : 0.55,
                }}
                aria-label={`${d.getDate()} ${di.feast ? di.feast.label : ""}`}
              >
                {d.getDate()}
                {feast && (
                  <span
                    className="absolute bottom-1 w-1.5 h-1.5 rounded-full"
                    style={{ background: isSelected ? "#ffffff" : kindColor[feast.kind] }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {[
          { c: "var(--an-accent)", t: "праздник" },
          { c: "var(--an-ink)", t: "память святых" },
          { c: "var(--an-quiet)", t: "пост" },
        ].map((l) => (
          <span key={l.t} className="pr-chip" style={{ cursor: "default" }}>
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: l.c }} />
            {l.t}
          </span>
        ))}
      </div>

      {/* Чтение */}
      <button
        onClick={() => go("word")}
        className="orn-card-soft w-full flex items-center gap-3 px-3.5 py-3 text-left transition-all hover:shadow-md mb-4"
      >
        <span
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: "var(--an-tile)", color: "var(--an-ink)" }}
        >
          <Library size={16} />
        </span>
        <span className="flex-1">
          <span className="pr-serif font-bold text-[0.8rem] block" style={{ color: "var(--an-ink)" }}>
            Библиотека
          </span>
          <span className="pr-serif text-[0.68rem]" style={{ color: "var(--an-ink-soft)" }}>
            Стих дня, Библия и план чтения Евангелия
          </span>
        </span>
        <ChevronRightIcon />
      </button>

      <p className="pr-read italic text-[0.64rem] text-center" style={{ color: "var(--an-ink-soft)" }}>
        Святцы и устав упрощены для мобильной версии; точные указания уточняйте в приходе
      </p>

      {reader && <ReaderOverlay target={reader} onClose={() => setReader(null)} toast={toast} />}
    </div>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--an-ink)" }}>
      <path d="M9 6 L15 12 L9 18" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
