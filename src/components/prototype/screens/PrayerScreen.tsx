"use client";

import { useState } from "react";
import { Bell, ChevronLeft, Flame, HeartHandshake } from "lucide-react";
import type { Level } from "@/lib/app-data";
import {
  eveningRule,
  morningRule,
  prayerNeeds,
  type Prayer,
} from "@/lib/content/prayers";
import { dayPlural } from "@/lib/storage";
import { OrnamentDivider, PhotoBanner, SectionTitle } from "../bits";

export default function PrayerScreen({
  level,
  streak,
  onComplete,
  toast,
}: {
  level: Level | null;
  streak: number;
  onComplete: (k: "morning" | "evening") => void;
  toast: (m: string) => void;
}) {
  const [tab, setTab] = useState<"rule" | "needs">("rule");
  const [reading, setReading] = useState<{ rule: Prayer; kind: "morning" | "evening" } | null>(null);
  const [need, setNeed] = useState<Prayer | null>(null);
  const [idx, setIdx] = useState(0);

  /* ── Чтение правила ── */
  if (reading) {
    const item = reading.rule.items[idx];
    return (
      <div className="px-4 py-4 pb-8 animate-fade-up">
        <button
          onClick={() => {
            setReading(null);
            setIdx(0);
          }}
          className="pr-btn pr-btn-secondary mb-3 !min-h-[38px] !px-3 !text-[0.74rem]"
        >
          <ChevronLeft size={14} /> К правилу
        </button>

        <div className="orn-card px-4 py-4 mb-3">
          <div className="text-center mb-2">
            <div className="pr-display text-[1.05rem]" style={{ color: "var(--an-ink)" }}>
              {reading.rule.title}
            </div>
            <div className="pr-serif text-[0.66rem]" style={{ color: "var(--an-ink-soft)" }}>
              Молитва {idx + 1} из {reading.rule.items.length} · {reading.rule.subtitle}
            </div>
          </div>
          <OrnamentDivider className="mb-3" />

          {item ? (
            <div className="animate-fade-up">
              <div className="pr-display text-[0.8rem] mb-2 text-center" style={{ color: "var(--an-ink)" }}>
                {item.title}
              </div>
              <p
                className="pr-read text-[0.98rem] leading-[1.8] text-center"
                style={{ color: "var(--an-ink)" }}
              >
                {item.body}
              </p>
              {item.note && (
                <p
                  className="pr-serif italic text-[0.7rem] leading-relaxed mt-3 text-center"
                  style={{ color: "var(--an-ink-soft)" }}
                >
                  {item.note}
                </p>
              )}
              <div className="flex items-center justify-center gap-1.5 mt-3">
                {reading.rule.items.map((_, i) => (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: i === idx ? "var(--an-accent)" : "var(--an-line)" }}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex gap-2">
          {idx < reading.rule.items.length - 1 && (
            <button
              onClick={() => setIdx((i) => i + 1)}
              className="pr-btn pr-btn-secondary flex-1"
            >
              Дальше
            </button>
          )}
          {idx === reading.rule.items.length - 1 && (
            <button
              onClick={() => {
                onComplete(reading.kind);
                setReading(null);
                setIdx(0);
              }}
              className="pr-btn flex-1 pr-btn-accent"
            >
              <Flame size={14} /> Завершить правило
            </button>
          )}
        </div>
      </div>
    );
  }

  /* ── Молитва по нужде ── */
  if (need) {
    return (
      <div className="px-4 py-4 pb-8 animate-fade-up">
        <button
          onClick={() => setNeed(null)}
          className="pr-btn pr-btn-secondary mb-3 !min-h-[38px] !px-3 !text-[0.74rem]"
        >
          <ChevronLeft size={14} /> К молитвам
        </button>
        <div className="orn-card px-4 py-4">
          <div className="text-center mb-2">
            <div className="pr-display text-[1.05rem]" style={{ color: "var(--an-ink)" }}>
              {need.title}
            </div>
            {need.subtitle && (
              <div className="pr-serif text-[0.66rem]" style={{ color: "var(--an-ink-soft)" }}>
                {need.subtitle}
              </div>
            )}
          </div>
          <OrnamentDivider className="mb-3" />
          {need.items.map((it, i) => (
            <div key={i} className="mb-4 last:mb-0">
              <div className="pr-display text-[0.78rem] mb-1.5 text-center" style={{ color: "var(--an-ink)" }}>
                {it.title}
              </div>
              <p className="pr-read text-[0.96rem] leading-[1.8] text-center" style={{ color: "var(--an-ink)" }}>
                {it.body}
              </p>
              {it.note && (
                <p className="pr-serif italic text-[0.68rem] mt-2 text-center" style={{ color: "var(--an-ink-soft)" }}>
                  {it.note}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ── Список ── */
  return (
    <div className="px-4 py-4 pb-8 animate-fade-up">
      {/* Счётчик */}
      <PhotoBanner
        src="/images/interior.jpg"
        alt="Иконостас храма при свечах"
        strength="soft"
        className="px-4 py-3.5 mb-4"
        contentClassName="flex items-center gap-3"
      >
        <span
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "rgba(255,255,255,.12)", color: "#ffffff" }}
        >
          <Flame size={20} />
        </span>
        <div className="flex-1">
          <div className="pr-display text-[1.12rem] text-white">
            {streak > 0 ? `Вы молитесь ${streak} ${dayPlural(streak)}` : "Начните сегодня"}
          </div>
          <div className="text-[0.68rem] text-[rgba(255,255,255,.72)]">
            Мягкий счётчик — без соревнования, только для радости постоянства
          </div>
        </div>
      </PhotoBanner>

      {/* Переключатель */}
      <div
        className="grid grid-cols-2 rounded-xl p-1 mb-4"
        style={{ background: "var(--an-tile)", border: "1px solid var(--an-line)" }}
      >
        {(
          [
            { id: "rule" as const, label: "Правило" },
            { id: "needs" as const, label: "Молитвы по нуждам" },
          ]
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="pr-serif font-bold text-[0.76rem] py-2 rounded-lg transition-all"
            style={{
              background: tab === t.id ? "var(--an-ink)" : "transparent",
              color: tab === t.id ? "#ffffff" : "var(--an-ink-soft)",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "rule" ? (
        <div className="flex flex-col gap-2.5 animate-fade-up">
          <button
            onClick={() => setReading({ rule: morningRule, kind: "morning" })}
            className="orn-card w-full text-left px-3.5 py-3 transition-all hover:shadow-lg"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="pr-display text-[0.9rem]" style={{ color: "var(--an-ink)" }}>
                {morningRule.title}
              </span>
              <span
                className="pr-serif text-[0.64rem] px-2 py-0.5 rounded-full"
                style={{ background: "var(--an-tile)", color: "var(--an-ink-soft)" }}
              >
                {morningRule.items.length} молитв
              </span>
            </div>
            <div className="pr-serif text-[0.7rem]" style={{ color: "var(--an-ink-soft)" }}>
              {level === "beginner" ? "Отче наш, псалом 50, Символ веры и другие — читайте не спеша" : morningRule.subtitle}
            </div>
          </button>

          <button
            onClick={() => setReading({ rule: eveningRule, kind: "evening" })}
            className="orn-card w-full text-left px-3.5 py-3 transition-all hover:shadow-lg"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="pr-display text-[0.9rem]" style={{ color: "var(--an-ink)" }}>
                {eveningRule.title}
              </span>
              <span
                className="pr-serif text-[0.64rem] px-2 py-0.5 rounded-full"
                style={{ background: "var(--an-tile)", color: "var(--an-ink-soft)" }}
              >
                {eveningRule.items.length} молитв
              </span>
            </div>
            <div className="pr-serif text-[0.7rem]" style={{ color: "var(--an-ink-soft)" }}>
              {eveningRule.subtitle}: молитва Златоуста, ангелу хранителю, молитва перед сном
            </div>
          </button>

          <button
            onClick={() => toast("Напоминания приходят в ОК: утро 7:00, вечер 21:00 — включаются после публикации")}
            className="orn-card-soft flex items-center gap-3 px-3.5 py-3 text-left"
          >
            <Bell size={16} style={{ color: "var(--an-ink)" }} />
            <span className="pr-serif text-[0.74rem]" style={{ color: "var(--an-ink)" }}>
              Напоминание: утро 7:00 · вечер 21:00
            </span>
          </button>
        </div>
      ) : (
        <div className="animate-fade-up">
          <SectionTitle className="mb-2">О чём молитесь сегодня?</SectionTitle>
          <div className="grid grid-cols-2 gap-2">
            {prayerNeeds.map((n) => (
              <button
                key={n.id}
                onClick={() => setNeed(n.prayer)}
                className="orn-card-soft flex items-center gap-2 px-3 py-2.5 text-left transition-all hover:shadow-md"
              >
                <HeartHandshake size={15} style={{ color: "var(--an-ink)" }} />
                <span className="pr-serif text-[0.72rem]" style={{ color: "var(--an-ink)" }}>
                  {n.label}
                </span>
              </button>
            ))}
          </div>
          <p className="pr-read italic text-[0.74rem] mt-3 text-center" style={{ color: "var(--an-ink-soft)" }}>
            «Молитесь друг за друга» (Иак. 5:16)
          </p>
        </div>
      )}
    </div>
  );
}
