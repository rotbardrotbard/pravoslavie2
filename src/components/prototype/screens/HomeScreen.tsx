"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  ChevronRight,
  Flame,
  Gift,
  Heart,
  Library,
  MapPin,
  Share2,
  Sparkles,
} from "lucide-react";
import type { GeoPoint } from "@/lib/bridge";
import { shareApp } from "@/lib/bridge";
import type { Interest, Level, Screen } from "@/lib/app-data";
import { getDayInfo, getNameDay } from "@/lib/content/calendar";
import { fetchNearestChurch, type NearestChurch } from "@/lib/content/patriarchia";
import { fmtDistance } from "@/lib/content/temples";
import { verseOfDay } from "@/lib/content/word";
import { PhotoBanner, SectionTitle } from "../bits";

type CardKey = "day" | "verse" | "rule" | "teaser";

/* Какая карточка Дома соответствует выбранному интересу */
const CARD_FOR: Record<Interest, CardKey> = {
  prayer: "rule",
  scripture: "verse",
  traditions: "day",
  questions: "teaser",
};

export default function HomeScreen({
  level,
  interests,
  userName,
  baptismName,
  geo,
  go,
  openGifts,
  likedVerses,
  toggleLikeVerse,
  morningDone,
  streak,
  toast,
  inside,
}: {
  level: Level | null;
  interests: Interest[];
  userName: string;
  baptismName: string | null;
  geo: GeoPoint;
  go: (s: Screen) => void;
  openGifts: () => void;
  likedVerses: string[];
  toggleLikeVerse: (ref: string) => void;
  morningDone: boolean;
  streak: number;
  toast: (m: string) => void;
  ready: boolean;
  inside: boolean;
}) {
  const now = useMemo(() => new Date(), []);
  const day = useMemo(() => getDayInfo(now), [now]);
  const verse = useMemo(() => verseOfDay(now), [now]);
  const nameDay = useMemo(
    () => getNameDay(baptismName, now),
    [baptismName, userName, now]
  );
  const liked = likedVerses.includes(verse.ref);

  /* Ближайший храм показываем только для подтверждённой геопозиции.
     Результат привязан к координатам, чтобы не показывать старый храм после перемещения. */
  const [nearestResult, setNearestResult] = useState<{
    key: string;
    church: NearestChurch | null;
  } | null>(null);
  const geoKey = `${geo.lat},${geo.lng}`;
  const nearest = geo.accurate && nearestResult?.key === geoKey
    ? nearestResult.church
    : null;
  useEffect(() => {
    if (!geo.accurate) return;
    let cancelled = false;
    const ac = new AbortController();
    fetchNearestChurch(geo.lat, geo.lng, { signal: ac.signal })
      .then((r) => {
        if (!cancelled) setNearestResult({ key: geoKey, church: r });
      })
      .catch(() => {
        /* база недоступна — карточка останется с обычной подписью */
      });
    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [geo.lat, geo.lng, geo.accurate, geoKey]);

  /* Порядок карточек: сначала отмеченные в анкете интересы, затем остальные */
  let order: CardKey[] = [];
  interests.forEach((it) => {
    const c = CARD_FOR[it];
    if (!order.includes(c)) order.push(c);
  });
  ("day verse rule".split(" ") as CardKey[]).forEach((c) => {
    if (!order.includes(c)) order.push(c);
  });
  if (order.length === 0) order = ["day", "verse", "rule"];

  const headFeast =
    day.feast && day.feast.kind !== "post"
      ? day.feast.label
      : day.parentSaturday
        ? "Родительская суббота — поминовение усопших"
        : null;

  return (
    <div className="px-4 py-4 pb-8 animate-fade-up">
      {/* Приветствие */}
      <div className="flex items-end justify-between mb-3">
        <div className="min-w-0">
          <div className="pr-display text-[1.12rem]" style={{ color: "var(--an-ink)" }}>
            Мир вам, {userName}
          </div>
          <div className="pr-serif text-[0.7rem] truncate" style={{ color: "var(--an-ink-soft)" }}>
            {day.weekday}, {day.dateNew} · {day.dateOld}
          </div>
        </div>
        <div
          className="pr-serif text-[0.62rem] text-right leading-tight shrink-0"
          style={{ color: "var(--an-ink-soft)" }}
        >
          Вы молитесь
          <br />
          <span className="pr-display text-[0.95rem]" style={{ color: "var(--an-accent)" }}>
            {streak} дн.
          </span>
        </div>
      </div>

      {/* Гид для новичка */}
      {level === "beginner" && (
        <button
          onClick={() => go("prayer")}
          className="w-full text-left mb-3 block animate-fade-up"
        >
          <PhotoBanner
            src="/images/candles.jpg"
            alt="Свечи в храме"
            strength="soft"
            className="px-3.5 py-3 transition-all hover:shadow-lg"
            contentClassName="flex items-center gap-3"
          >
            <span className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-white/10" style={{ color: "#ffffff" }}>
              <Sparkles size={17} />
            </span>
            <span className="flex-1">
              <span className="pr-display text-[1.02rem] block text-white">
                С чего начать
              </span>
              <span className="text-[0.7rem]" style={{ color: "rgba(255,255,255,.8)" }}>
                Краткое правило и первый шаг в храм — начнём сегодня
              </span>
            </span>
            <ChevronRight size={16} style={{ color: "#ffffff" }} />
          </PhotoBanner>
        </button>
      )}

      {/* Карточки дня — порядок зависит от интересов */}
      {order.map((k) => {
        if (k === "day")
          return (
            <button
              key="day"
              onClick={() => go("calendar")}
              className="orn-card w-full text-left px-3.5 py-3 mb-3 transition-all hover:shadow-lg"
            >
              <SectionTitle className="mb-1.5">День по календарю</SectionTitle>
              {headFeast && (
                <div className="pr-serif font-bold text-[0.84rem] mb-0.5" style={{ color: "var(--an-ink)" }}>
                  {headFeast}
                </div>
              )}
              <div className="pr-serif font-bold text-[0.84rem]" style={{ color: "var(--an-ink)" }}>
                {!headFeast && day.weekLabel + " · "}
                <span className="pr-serif font-normal text-[0.7rem]" style={{ color: "var(--an-ink-soft)" }}>
                  {day.glas} · {day.fastLabel}
                </span>
              </div>
              <div className="pr-serif text-[0.74rem] leading-relaxed" style={{ color: "var(--an-ink)" }}>
                {day.saints.slice(0, 3).join(" · ")}
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[0.66rem] pr-serif" style={{ color: "var(--an-ink-soft)" }}>
                  {day.meal}
                </span>
                <span className="pr-serif text-[0.7rem] font-bold shrink-0" style={{ color: "var(--an-ink)" }}>
                  Открыть календарь →
                </span>
              </div>
            </button>
          );

        if (k === "verse")
          return (
            <div key="verse" className="orn-card px-3.5 py-3 mb-3">
              <SectionTitle className="mb-1.5">Стих дня</SectionTitle>
              <div className="pr-read italic text-[0.92rem] leading-relaxed text-center px-1" style={{ color: "var(--an-ink)" }}>
                «{verse.text}»
              </div>
              <div className="text-[0.66rem] text-center mt-1 tracking-wide" style={{ color: "var(--an-accent)", fontWeight: 600 }}>
                {verse.ref}
              </div>
              <div className="flex gap-2 mt-2.5">
                <button
                  onClick={() => toggleLikeVerse(verse.ref)}
                  className={`pr-btn flex-1 !min-h-[40px] ${liked ? "pr-btn-accent" : "pr-btn-secondary"}`}
                  aria-pressed={liked}
                >
                  <Heart size={14} fill={liked ? "currentColor" : "none"} />
                  {liked ? "Сохранено" : "Сохранить"}
                </button>
                <button
                  onClick={() => go("word")}
                  className="pr-btn pr-btn-secondary flex-1 !min-h-[40px]"
                >
                  <Share2 size={14} /> Библиотека
                </button>
              </div>
            </div>
          );

        if (k === "rule")
          return (
            <button
              key="rule"
              onClick={() => go("prayer")}
              className="orn-card w-full text-left px-3.5 py-3 mb-3 transition-all hover:shadow-lg"
            >
              <SectionTitle className="mb-1.5">Молитвенное правило</SectionTitle>
              <div className="flex items-center gap-3">
                <span
                  className="w-11 h-11 rounded-xl flex flex-col items-center justify-center shrink-0"
                  style={{
                    background: morningDone ? "var(--an-slate)" : "var(--an-tile)",
                    color: morningDone ? "#ffffff" : "var(--an-ink)",
                  }}
                >
                  <Flame size={18} />
                </span>
                <span className="flex-1">
                  <span className="pr-serif font-bold text-[0.84rem] block" style={{ color: "var(--an-ink)" }}>
                    {morningDone ? "Правило исполнено ✓" : "Утреннее правило"}
                  </span>
                  <span className="pr-serif text-[0.7rem]" style={{ color: "var(--an-ink-soft)" }}>
                    {morningDone
                      ? "Христос посреди нас! Вечером — вечернее правило"
                      : "Приступить к правилу — 5 минут тишины"}
                  </span>
                </span>
                <ChevronRight size={16} style={{ color: "var(--an-ink)" }} />
              </div>
            </button>
          );

        if (k === "teaser")
          return (
            <button
              key="teaser"
              onClick={() => go("word")}
              className="orn-card-soft w-full text-left px-3.5 py-3 mb-3 flex items-center gap-3 transition-all hover:shadow-md"
            >
              <span
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "var(--an-tile)", color: "var(--an-ink)" }}
              >
                <Library size={17} />
              </span>
              <span className="flex-1">
                <span className="pr-serif font-bold text-[0.8rem] block" style={{ color: "var(--an-ink)" }}>
                  Библиотека
                </span>
                <span className="pr-serif text-[0.72rem]" style={{ color: "var(--an-ink)" }}>
                  Библия, жития, отцы и ответы — с закладками
                </span>
              </span>
              <ChevronRight size={16} style={{ color: "var(--an-ink)" }} />
            </button>
          );

        return null;
      })}

      {/* Храмы рядом — карта на видном месте */}
      <button
        onClick={() => go("map")}
        className="w-full text-left mb-3 block"
      >
        <PhotoBanner
          src="/images/monastery.jpg"
          alt="Храмы рядом"
          strength="firm"
          className="px-3.5 py-3"
          contentClassName="flex items-center gap-3"
        >
          <span className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-white/10" style={{ color: "#ffffff" }}>
            <MapPin size={17} />
          </span>
          <span className="flex-1 min-w-0">
            <span className="pr-display text-[1.02rem] block text-white">
              Храмы рядом
            </span>
            <span className="text-[0.72rem] leading-snug block" style={{ color: "rgba(255,255,255,.8)" }}>
              {nearest
                ? `Ближайший — ${nearest.name} · ${fmtDistance(nearest.km)}`
                : "Живая карта с храмами, расписанием и маршрутом"}
            </span>
          </span>
          <ChevronRight size={16} style={{ color: "#ffffff" }} />
        </PhotoBanner>
      </button>

      {/* Именины */}
      {nameDay && (
        <PhotoBanner
          src="/images/domes.jpg"
          alt="Золотые купола храма"
          strength="firm"
          className="px-3.5 py-3 mb-3"
          contentClassName="flex items-center gap-3"
        >
          <span className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-white/10" style={{ color: "#ffffff" }}>
            <Sparkles size={17} />
          </span>
          <span className="flex-1 min-w-0">
            <span className="pr-display text-[1.02rem] block text-white">
              Сегодня именины
            </span>
            <span className="text-[0.72rem] leading-snug" style={{ color: "rgba(255,255,255,.8)" }}>
              {nameDay}
            </span>
          </span>
          <button onClick={openGifts} className="pr-btn pr-btn-accent shrink-0 !min-h-[38px] !px-3 !text-[0.72rem]">
            Подарок
          </button>
        </PhotoBanner>
      )}

      {/* Быстрые действия */}
      <SectionTitle className="mb-2">Быстрые действия</SectionTitle>
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { icon: <Library size={17} />, label: "Библиотека", action: () => go("word") },
          { icon: <Gift size={17} />, label: "Отправить подарок", action: openGifts },
          {
            icon: <Share2 size={17} />,
            label: "Поделиться",
            action: () => {
              void (async () => {
                const how = await shareApp(
                  "«Православные» — православный ежедневник внутри ОК: святцы, молитвослов и храмы рядом"
                );
                toast(
                  how === "clipboard"
                    ? "Ссылка скопирована — вставьте в пост или сообщение"
                    : "Открываем окно публикации ОК"
                );
              })();
            },
          },
        ].map((a) => (
          <button
            key={a.label}
            onClick={a.action}
            className="orn-card-soft flex flex-col items-center gap-1.5 py-3 px-1 transition-all hover:shadow-md"
          >
            <span style={{ color: "var(--an-ink)" }}>{a.icon}</span>
            <span
              className="pr-serif text-[0.62rem] text-center leading-tight"
              style={{ color: "var(--an-ink)" }}
            >
              {a.label}
            </span>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-center gap-1.5 mt-4 text-[0.62rem]" style={{ color: "var(--an-ink-soft)" }}>
        <BookOpen size={11} /> Контент встроен в приложение {inside ? "· запущено в ОК" : "· предпросмотр"}
      </div>
    </div>
  );
}
