"use client";

import { Sparkles } from "lucide-react";
import type { Screen } from "@/lib/prototype-data";
import { CrossInCircle } from "./bits";

const screenChips: { id: Screen; label: string }[] = [
  { id: "onboarding", label: "Онбординг" },
  { id: "home", label: "Дом" },
  { id: "calendar", label: "Календарь" },
  { id: "prayer", label: "Молитва" },
  { id: "map", label: "Карта" },
  { id: "word", label: "Слово" },
  { id: "question", label: "Вопрос" },
  { id: "community", label: "Сообщество" },
  { id: "more", label: "Ещё" },
];

const scenarios: { id: "A" | "B" | "C" | "D"; label: string; desc: string }[] = [
  { id: "A", label: "Сценарий A · Новичок", desc: "Онбординг: анкета, краткое правило, гид «С чего начать»" },
  { id: "B", label: "Сценарий B · Регулярная практика", desc: "Дом → правило → счётчик дней молитвы" },
  { id: "C", label: "Сценарий C · Праздничный пик", desc: "Подарок близкому — виральная петля через раздел подарков ОК" },
  { id: "D", label: "Сценарий D · Сомневающийся", desc: "Поиск по «Вопросам священнику»" },
];

export default function DemoPanel({
  current,
  onScenario,
  onJump,
}: {
  current: Screen;
  onScenario: (id: "A" | "B" | "C" | "D") => void;
  onJump: (s: Screen) => void;
}) {
  return (
    <>
      {/* Десктопная панель */}
      <aside
        className="hidden md:block w-[335px] shrink-0 self-center rounded-2xl p-5 max-h-[min(812px,calc(100dvh-120px))] overflow-y-auto pr-scroll"
        style={{
          background: "#ffffff",
          border: "1px solid var(--an-line)",
          boxShadow: "0 12px 32px rgba(24,29,36,.08)",
          color: "var(--an-ink)",
        }}
      >
        <div className="flex items-center gap-2 mb-1">
          <CrossInCircle size={26} />
          <span className="pr-display text-[1.05rem]" style={{ color: "var(--an-ink)" }}>
            Демо-навигация
          </span>
        </div>
        <p className="text-[0.72rem] leading-relaxed mb-4" style={{ color: "var(--an-ink-soft)" }}>
          Все данные демонстрационные. В рабочей версии контент встроен в приложение,
          соцфункции работают через API Одноклассников.
        </p>

        <div
          className="text-[0.68rem] tracking-[0.12em] uppercase mb-2"
          style={{ color: "var(--an-ink-soft)", fontWeight: 600 }}
        >
          Пути пользователя
        </div>
        <div className="flex flex-col gap-2 mb-5">
          {scenarios.map((s) => (
            <button
              key={s.id}
              onClick={() => onScenario(s.id)}
              className="orn-card-soft text-left px-3 py-2.5 rounded-xl transition-all hover:shadow-md"
            >
              <div className="font-semibold text-[0.78rem]" style={{ color: "var(--an-ink)" }}>
                {s.label}
              </div>
              <div className="text-[0.68rem] leading-snug" style={{ color: "var(--an-ink-soft)" }}>
                {s.desc}
              </div>
            </button>
          ))}
        </div>

        <div
          className="text-[0.68rem] tracking-[0.12em] uppercase mb-2"
          style={{ color: "var(--an-ink-soft)", fontWeight: 600 }}
        >
          Экраны
        </div>
        <div className="flex flex-wrap gap-1.5">
          {screenChips.map((c) => (
            <button
              key={c.id}
              onClick={() => onJump(c.id)}
              className={`pr-chip ${current === c.id ? "pr-chip-active" : ""}`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="mt-5 pt-4" style={{ borderTop: "1px solid var(--an-line)" }}>
          <div className="flex items-start gap-2">
            <Sparkles size={13} className="mt-0.5 shrink-0" style={{ color: "var(--an-accent)" }} />
            <p className="text-[0.66rem] leading-relaxed" style={{ color: "var(--an-ink-soft)" }}>
              Календарь на 1 ноября 2026 — реальные святцы церковного месяцеслова; молитвослов — полный
              молитвослов с правилом и напоминаниями; далее — квизы, радио и совместная Псалтирь.
            </p>
          </div>
        </div>

        <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--an-line)" }}>
          <div className="flex items-start gap-2">
            <span
              className="text-[0.56rem] tracking-[0.14em] uppercase px-1.5 py-0.5 rounded shrink-0 mt-0.5"
              style={{ background: "var(--an-ink)", color: "#ffffff", fontWeight: 600 }}
            >
              Референс
            </span>
            <p className="text-[0.66rem] leading-relaxed" style={{ color: "var(--an-ink-soft)" }}>
              Визуальный язык — фирменный стиль <b style={{ color: "var(--an-ink)" }}>ANTIПA LAVKA</b>{" "}
              (antipa-lavka.ru): светло-серый фон #f5f5f5, почти чёрный #181d24, серо-синие
              полутона, редкий красный акцент, антиква Cormorant Garamond + гротеск. Вместо тёмных
              плашек — фотографии храмов с виньеткой и градиентом (сгенерированы для прототипа, в
              рабочей версии заменятся на съёмки реальных храмов).
            </p>
          </div>
        </div>
      </aside>

      {/* Мобильная компактная панель */}
      <div className="md:hidden w-full px-3 pt-2 pb-1">
        <div className="flex items-center gap-2 mb-1.5">
          <CrossInCircle size={20} />
          <span className="pr-display text-[0.9rem] text-[#181d24]">
            «Православные» · прототип
          </span>
        </div>
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {scenarios.map((s) => (
            <button key={s.id} onClick={() => onScenario(s.id)} className="pr-chip shrink-0">
              {s.label.split(" · ")[0]}
            </button>
          ))}
          <span className="w-px shrink-0 bg-[#d9dcde] mx-0.5" aria-hidden="true" />
          {screenChips.map((c) => (
            <button
              key={c.id}
              onClick={() => onJump(c.id)}
              className={`pr-chip shrink-0 ${current === c.id ? "pr-chip-active" : ""}`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
