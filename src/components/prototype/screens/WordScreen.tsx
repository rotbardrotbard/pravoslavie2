"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Book,
  BookOpen,
  Bookmark as BookmarkIcon,
  ChevronRight,
  Heart,
  Library,
  Play,
  Search,
  Share2,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";
import type { ReaderTarget } from "@/lib/app-data";
import { BIBLE_AVAILABLE, bookByNr, groupedBibleBooks } from "@/lib/content/bible";
import { FATHERS_QUOTES, LIVES, QA_LIBRARY, QA_TOPICS } from "@/lib/content/library";
import { fatherCover, lifeCover } from "@/lib/content/covers";
import { currentReading, recentVerses, verseOfDay } from "@/lib/content/word";
import { loadBookmarks, latestReadPos, toggleBookmarkInStorage, type Bookmark } from "@/lib/storage";
import { OrnamentDivider, PhotoBanner, SectionTitle } from "../bits";

type WordTab = "bible" | "verse" | "lives" | "fathers" | "answers" | "bookmarks";

const TABS: { id: WordTab; label: string; icon: React.ReactNode }[] = [
  { id: "bible", label: "Библия", icon: <Book size={15} /> },
  { id: "lives", label: "Жития", icon: <Sparkles size={15} /> },
  { id: "fathers", label: "Отцы", icon: <Users size={15} /> },
  { id: "verse", label: "Стих", icon: <BookOpen size={15} /> },
  { id: "answers", label: "Ответы", icon: <Library size={15} /> },
  { id: "bookmarks", label: "Закладки", icon: <BookmarkIcon size={15} /> },
];

export default function WordScreen({
  likedVerses,
  toggleLikeVerse,
  share,
  openReader,
  libTick,
  toast,
}: {
  likedVerses: string[];
  toggleLikeVerse: (ref: string) => void;
  share: (text: string) => Promise<void>;
  openReader: (t: ReaderTarget) => void;
  libTick: number;
  toast: (m: string) => void;
}) {
  const [tab, setTab] = useState<WordTab>("bible");
  const now = useMemo(() => new Date(), []);
  const verse = useMemo(() => verseOfDay(now), [now]);
  const archive = useMemo(() => recentVerses(5, now), [now]);
  const reading = useMemo(() => currentReading(now), [now]);
  const liked = likedVerses.includes(verse.ref);

  /* Закладки перечитываются после закрытия читалки (libTick) */
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [continueReading, setContinueReading] = useState<ReturnType<typeof latestReadPos>>(null);
  useEffect(() => {
    setBookmarks(loadBookmarks());
    setContinueReading(latestReadPos());
  }, [libTick]);

  const shareText = `«${verse.text}» — ${verse.ref}. Стих дня из мини-приложения «Православные»`;

  /* Стих дня можно открыть в офлайн-Библии (если книга скачана) */
  const verseInBible = useMemo(() => {
    if (!BIBLE_AVAILABLE.has(verse.book)) return null;
    const m = /:(\d+)/.exec(verse.ref);
    return { nr: verse.book, chapter: verse.chapter, vn: m ? Number(m[1]) : 1 };
  }, [verse]);

  const openContinue = () => {
    if (!continueReading) return;
    const { key, entry } = continueReading;
    if (entry.kind === "bible") {
      const nr = Number(key.split(":")[1]);
      openReader({ mode: "bible", nr, chapter: entry.chapter });
    } else {
      openReader({ mode: "life", id: key.split(":")[1] });
    }
  };

  const continueLabel = (() => {
    if (!continueReading) return null;
    const { key, entry } = continueReading;
    const pct = Math.round((entry.percent ?? 0) * 100);
    if (entry.kind === "bible") {
      const nr = Number(key.split(":")[1]);
      const meta = bookByNr(nr);
      return `${meta?.name ?? entry.title} · глава ${entry.chapter ?? 1} · ${pct}%`;
    }
    return `${entry.title} · ${pct}%`;
  })();

  return (
    <div className="px-4 py-4 pb-8 animate-fade-up">
      {/* Переключатель разделов библиотеки */}
      <div
        className="grid grid-cols-3 gap-1 p-1 rounded-xl mb-4"
        style={{ background: "var(--an-tile)", border: "1px solid var(--an-line)" }}
        role="tablist"
        aria-label="Разделы библиотеки"
      >
        {TABS.map((t) => {
          const active = t.id === tab;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.id)}
              className="flex flex-col items-center gap-0.5 py-2 rounded-lg transition-all"
              style={{
                background: active ? "var(--an-card)" : "transparent",
                boxShadow: active ? "0 1px 4px rgba(24,29,36,.12)" : "none",
                color: active ? "var(--an-ink)" : "var(--an-ink-soft)",
                fontWeight: active ? 600 : 500,
              }}
            >
              {t.icon}
              <span className="pr-serif text-[0.66rem] leading-none">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Библия: план чтения + офлайн-книги ── */}
      {tab === "bible" && (
        <div>
          {/* Продолжить чтение */}
          {continueReading && (
            <button
              onClick={openContinue}
              className="orn-card-soft w-full flex items-center gap-3 px-3.5 py-3 text-left mb-3 transition-all hover:shadow-md"
            >
              <span
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "var(--an-ink)", color: "#ffffff" }}
              >
                <Play size={15} />
              </span>
              <span className="flex-1 min-w-0">
                <span className="pr-serif font-bold text-[0.8rem] block" style={{ color: "var(--an-ink)" }}>
                  Продолжить чтение
                </span>
                <span className="pr-serif text-[0.68rem] block truncate" style={{ color: "var(--an-ink-soft)" }}>
                  {continueLabel}
                </span>
              </span>
              <ChevronRight size={15} style={{ color: "var(--an-ink)" }} />
            </button>
          )}

          {/* Чтение дня */}
          <div className="orn-card px-4 py-4 mb-4">
            <div className="text-center mb-1">
              <div className="pr-display text-[0.95rem]" style={{ color: "var(--an-ink)" }}>
                Евангелие дня
              </div>
              <div className="pr-serif text-[0.68rem]" style={{ color: "var(--an-ink-soft)" }}>
                План: по одной главе в день
              </div>
            </div>
            <OrnamentDivider className="mb-3" />
            <div className="pr-serif font-bold text-[0.86rem] text-center" style={{ color: "var(--an-ink)" }}>
              {reading.book.name}, глава {reading.chapter}
            </div>
            <p className="pr-serif text-[0.74rem] leading-relaxed text-center mt-1.5" style={{ color: "var(--an-ink-soft)" }}>
              Сегодня читаем главу {reading.chapter} из {reading.book.chapters}. Одна глава в день — и
              Евангелие будет прочитано полностью.
            </p>
            <button
              onClick={() => openReader({ mode: "bible", nr: reading.book.nr, chapter: reading.chapter })}
              className="pr-btn pr-btn-primary w-full mt-3"
            >
              <BookOpen size={14} /> Читать главу {reading.book.short} {reading.chapter}
            </button>
          </div>

          {/* Книги Библии — все тексты внутри приложения */}
          <SectionTitle className="mb-1">Библия · Синодальный перевод</SectionTitle>
          <p className="pr-serif text-[0.66rem] mb-3" style={{ color: "var(--an-ink-soft)" }}>
            Полные тексты хранятся внутри приложения и доступны без интернета
          </p>
          <div className="flex flex-col gap-3">
            {groupedBibleBooks().map((group) => (
              <div key={group.section}>
                <div className="pr-serif text-[0.68rem] font-bold uppercase tracking-wide mb-1.5" style={{ color: "var(--an-ink-soft)" }}>
                  {group.label}
                </div>
                <div className="flex flex-col gap-2">
                  {group.books.map((b) => (
                    <button
                      key={b.nr}
                      onClick={() => openReader({ mode: "bible", nr: b.nr })}
                      className="orn-card-soft flex items-center gap-3 px-3.5 py-2.5 text-left transition-all hover:shadow-md"
                    >
                      <span
                        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: "var(--an-tile)", color: "var(--an-ink)" }}
                      >
                        <Book size={16} />
                      </span>
                      <span className="flex-1">
                        <span className="pr-serif font-bold text-[0.8rem] block" style={{ color: "var(--an-ink)" }}>
                          {b.name}
                        </span>
                        <span className="pr-serif text-[0.66rem]" style={{ color: "var(--an-ink-soft)" }}>
                          {b.chapters} {plural(b.chapters, "глава", "главы", "глав")}
                        </span>
                      </span>
                      <ChevronRight size={14} style={{ color: "var(--an-ink-soft)" }} />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Стих дня ── */}
      {tab === "verse" && (
        <div>
          <div className="orn-card px-3.5 py-3 mb-3">
            <SectionTitle className="mb-2">Стих дня</SectionTitle>
            <p className="pr-read italic text-[0.92rem] leading-relaxed text-center" style={{ color: "var(--an-ink)" }}>
              «{verse.text}»
            </p>
            <p className="text-[0.66rem] text-center mt-1 tracking-wide" style={{ color: "var(--an-accent)", fontWeight: 600 }}>
              {verse.ref}
            </p>
            <div className="flex gap-2 mt-2.5">
              <button
                onClick={() => toggleLikeVerse(verse.ref)}
                className={`pr-btn flex-1 ${liked ? "pr-btn-accent" : "pr-btn-secondary"}`}
                aria-pressed={liked}
              >
                <Heart size={14} fill={liked ? "currentColor" : "none"} />
                {liked ? "Сохранено" : "Сохранить"}
              </button>
              <button onClick={() => share(shareText)} className="pr-btn pr-btn-primary flex-1">
                <Share2 size={14} /> Поделиться
              </button>
            </div>
            {verseInBible && (
              <button
                onClick={() =>
                  openReader({
                    mode: "bible",
                    nr: verseInBible.nr,
                    chapter: verseInBible.chapter,
                    verse: verseInBible.vn,
                    label: verse.ref,
                  })
                }
                className="pr-btn pr-btn-secondary w-full mt-2 !min-h-[38px]"
              >
                <BookOpen size={13} /> Открыть в Библии
              </button>
            )}
          </div>

          {/* Архив стихов */}
          <SectionTitle className="mb-2">Стихи последних дней</SectionTitle>
          <div className="flex flex-col gap-2 mb-4">
            {archive.slice(1).map(({ verse: v, date }) => {
              const wasLiked = likedVerses.includes(v.ref);
              return (
                <div key={v.ref + date.toDateString()} className="orn-card-soft px-3.5 py-2.5">
                  <div className="pr-serif text-[0.62rem] mb-0.5" style={{ color: "var(--an-ink-soft)" }}>
                    {date.toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}
                  </div>
                  <p className="pr-read italic text-[0.8rem] leading-relaxed" style={{ color: "var(--an-ink)" }}>
                    «{v.text}»
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[0.62rem] tracking-wide" style={{ color: "var(--an-accent)", fontWeight: 600 }}>
                      {v.ref}
                    </span>
                    <button
                      onClick={() => toggleLikeVerse(v.ref)}
                      aria-pressed={wasLiked}
                      className="pr-chip"
                      style={wasLiked ? { background: "var(--an-ink)", color: "#fff", borderColor: "var(--an-ink)" } : undefined}
                    >
                      <Heart size={10} fill={wasLiked ? "currentColor" : "none"} /> {wasLiked ? "Сохранено" : "Сохранить"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Жития святых ── */}
      {tab === "lives" && <LivesSection openReader={openReader} />}

      {/* ── Святые отцы ── */}
      {tab === "fathers" && (
        <div>
          <SectionTitle className="mb-2">Слова святых отцов</SectionTitle>
          <div className="flex flex-col gap-2.5 mb-3">
            {FATHERS_QUOTES.map((q) => {
              const bmKey = `fathers:${q.author}`;
              const marked = bookmarks.some((b) => b.key === bmKey);
              return (
                <div key={q.author + q.text} className="orn-card px-3.5 py-3">
                  {/* Шапка цитаты: обложка автора + имя + закладка */}
                  <div className="flex items-center gap-3">
                    <span
                      className="relative w-[44px] h-[56px] rounded-xl overflow-hidden shrink-0"
                      style={{ border: "1px solid var(--an-line)" }}
                    >
                      <img
                        src={fatherCover(q.author)}
                        alt=""
                        loading="lazy"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <span
                        className="absolute inset-0"
                        style={{
                          background:
                            "linear-gradient(180deg, rgba(16,21,28,0.05) 35%, rgba(16,21,28,0.55) 100%)",
                        }}
                      />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="pr-serif font-bold text-[0.74rem] leading-snug" style={{ color: "var(--an-ink)" }}>
                        {q.author}
                      </div>
                      <div className="pr-serif text-[0.62rem] leading-snug" style={{ color: "var(--an-ink-soft)" }}>
                        {q.role}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const added = toggleBookmarkInStorage({
                          key: bmKey,
                          kind: "fathers",
                          title: q.author,
                          snippet: `«${q.text}» — ${q.source}`,
                          createdAt: Date.now(),
                        });
                        setBookmarks(loadBookmarks());
                        toast(added ? "Цитата добавлена в закладки" : "Закладка убрана");
                      }}
                      aria-pressed={marked}
                      aria-label={marked ? "Убрать закладку" : "В закладки"}
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors"
                      style={{
                        color: marked ? "#ffffff" : "var(--an-ink)",
                        background: marked ? "var(--an-ink)" : "var(--an-tile)",
                      }}
                    >
                      <BookmarkIcon size={14} fill={marked ? "currentColor" : "none"} />
                    </button>
                  </div>
                  <p className="pr-read italic text-[0.88rem] leading-relaxed mt-2.5" style={{ color: "var(--an-ink)" }}>
                    «{q.text}»
                  </p>
                  <button
                    onClick={() => share(`«${q.text}» — ${q.author}. Из мини-приложения «Православные»`)}
                    className="pr-btn pr-btn-secondary w-full mt-2.5 !min-h-[38px]"
                  >
                    <Share2 size={13} /> Поделиться цитатой
                  </button>
                </div>
              );
            })}
          </div>
          <p className="pr-serif italic text-[0.68rem] text-center" style={{ color: "var(--an-ink-soft)" }}>
            Цитаты — по изданиям творений святых отцов
          </p>
        </div>
      )}

      {/* ── Вопросы и ответы ── */}
      {tab === "answers" && <AnswersSection share={share} bookmarks={bookmarks} setBookmarks={setBookmarks} toast={toast} />}

      {/* ── Закладки ── */}
      {tab === "bookmarks" && (
        <BookmarksSection
          bookmarks={bookmarks}
          setBookmarks={setBookmarks}
          openReader={openReader}
        />
      )}

      <p className="pr-read italic text-[0.7rem] mt-5 text-center" style={{ color: "var(--an-ink-soft)" }}>
        Тексты хранятся внутри приложения. Писание — Синодальный перевод (общественное достояние)
      </p>
    </div>
  );
}

function plural(n: number, one: string, few: string, many: string): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}

/* ═══ Жития: список → читалка ═══ */
function LivesSection({ openReader }: { openReader: (t: ReaderTarget) => void }) {
  const [query, setQuery] = useState("");

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return LIVES;
    return LIVES.filter((l) => (l.name + l.title).toLowerCase().includes(q));
  }, [query]);

  return (
    <div>
      <SectionTitle className="mb-2">Жития святых</SectionTitle>
      <div className="orn-card-soft flex items-center gap-2 px-3 py-2.5 mb-3">
        <Search size={15} style={{ color: "var(--an-ink-soft)" }} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск по имени: Николай, Матрона…"
          className="flex-1 bg-transparent outline-none pr-serif text-[0.78rem]"
          style={{ color: "var(--an-ink)" }}
          aria-label="Поиск по житиям"
        />
      </div>
      <div className="flex flex-col gap-2">
        {list.map((l) => (
          <button
            key={l.id}
            onClick={() => openReader({ mode: "life", id: l.id })}
            className="orn-card-soft w-full flex items-center gap-3 px-3.5 py-3 text-left transition-all hover:shadow-md"
          >
            <span
              className="relative w-[52px] h-[64px] rounded-xl overflow-hidden shrink-0"
              style={{ border: "1px solid var(--an-line)" }}
            >
              <img
                src={lifeCover(l.id)}
                alt=""
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <span
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(16,21,28,0.05) 35%, rgba(16,21,28,0.55) 100%)",
                }}
              />
            </span>
            <span className="flex-1 min-w-0">
              <span className="pr-serif font-bold text-[0.8rem] block" style={{ color: "var(--an-ink)" }}>
                {l.name}
              </span>
              <span className="pr-serif text-[0.66rem] block truncate" style={{ color: "var(--an-ink-soft)" }}>
                {l.title} · память {l.memory}
              </span>
            </span>
            <ChevronRight size={15} style={{ color: "var(--an-ink)" }} />
          </button>
        ))}
        {list.length === 0 && (
          <p className="pr-serif text-[0.74rem] text-center py-4" style={{ color: "var(--an-ink-soft)" }}>
            Святого с таким именем пока нет в подборке — полный месяцеслов см. в календаре
          </p>
        )}
      </div>
    </div>
  );
}

/* ═══ Вопросы и ответы: поиск + рубрики + раскрытие ═══ */
function AnswersSection({
  share,
  bookmarks,
  setBookmarks,
  toast,
}: {
  share: (text: string) => Promise<void>;
  bookmarks: Bookmark[];
  setBookmarks: (b: Bookmark[]) => void;
  toast: (m: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState("Все");
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return QA_LIBRARY.filter((item) => {
      const okTopic = topic === "Все" || item.topic === topic;
      const okQuery = !q || (item.q + item.a).toLowerCase().includes(q);
      return okTopic && okQuery;
    });
  }, [query, topic]);

  return (
    <div>
      <SectionTitle className="mb-2">Вопросы и ответы</SectionTitle>
      <PhotoBanner
        src="/images/lib-psalter.jpg"
        alt="Обложка раздела ответов: открытая книга при тёплом свете"
        strength="firm"
        className="h-20 mb-2.5"
        contentClassName="flex items-end justify-end"
      >
        <span
          className="pr-serif text-[0.6rem] tracking-wide px-2 pb-1.5 text-right"
          style={{ color: "rgba(255,255,255,.85)" }}
        >
          Православная катехизация — на большинство вопросов уже ответили
        </span>
      </PhotoBanner>
      <div className="orn-card-soft flex items-center gap-2 px-3 py-2.5 mb-2.5">
        <Search size={15} style={{ color: "var(--an-ink-soft)" }} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск по вопросам: «свечи», «пост», «исповедь»…"
          className="flex-1 bg-transparent outline-none pr-serif text-[0.78rem]"
          style={{ color: "var(--an-ink)" }}
          aria-label="Поиск по вопросам и ответам"
        />
      </div>
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-2 mb-1">
        {QA_TOPICS.map((t) => (
          <button
            key={t}
            onClick={() => setTopic(t)}
            className={`pr-chip shrink-0 ${topic === t ? "pr-chip-active" : ""}`}
            aria-pressed={topic === t}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-2">
        {list.map((item) => {
          const idx = QA_LIBRARY.indexOf(item);
          const open = openIdx === idx;
          const bmKey = `qa:${item.q}`;
          const marked = bookmarks.some((b) => b.key === bmKey);
          return (
            <div key={item.q} className="orn-card-soft overflow-hidden">
              <button
                onClick={() => setOpenIdx(open ? null : idx)}
                className="w-full flex items-center gap-3 px-3.5 py-3 text-left"
                aria-expanded={open}
              >
                <span className="flex-1 min-w-0">
                  <span className="pr-serif font-bold text-[0.78rem] block leading-snug" style={{ color: "var(--an-ink)" }}>
                    {item.q}
                  </span>
                  <span className="pr-serif text-[0.62rem]" style={{ color: "var(--an-accent)" }}>
                    {item.topic}
                  </span>
                </span>
                <span
                  className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                  style={{
                    color: marked ? "#ffffff" : "var(--an-ink-soft)",
                    background: marked ? "var(--an-ink)" : "transparent",
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={marked ? "Убрать закладку" : "В закладки"}
                  onClick={(e) => {
                    e.stopPropagation();
                    const added = toggleBookmarkInStorage({
                      key: bmKey,
                      kind: "qa",
                      title: item.q,
                      snippet: item.a.length > 90 ? item.a.slice(0, 87) + "…" : item.a,
                      createdAt: Date.now(),
                    });
                    setBookmarks(loadBookmarks());
                    toast(added ? "Ответ добавлен в закладки" : "Закладка убрана");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      e.currentTarget.click();
                    }
                  }}
                >
                  <BookmarkIcon size={13} fill={marked ? "currentColor" : "none"} />
                </span>
                <ChevronRight
                  size={14}
                  style={{ color: "var(--an-ink)", transform: open ? "rotate(90deg)" : "none", transition: "transform .15s" }}
                />
              </button>
              {open && (
                <div className="px-3.5 pb-3.5 animate-fade-up">
                  <p className="pr-read text-[0.76rem] leading-relaxed mb-2.5" style={{ color: "var(--an-ink)" }}>
                    {item.a}
                  </p>
                  <button
                    onClick={() => share(`${item.q}\n\n${item.a}\n\n— из библиотеки мини-приложения «Православные»`)}
                    className="pr-btn pr-btn-secondary w-full !min-h-[38px]"
                  >
                    <Share2 size={13} /> Поделиться ответом
                  </button>
                </div>
              )}
            </div>
          );
        })}
        {list.length === 0 && (
          <p className="pr-serif text-[0.74rem] text-center py-4" style={{ color: "var(--an-ink-soft)" }}>
            Такого вопроса в базе пока нет — фонд ответов будет пополняться
          </p>
        )}
      </div>
    </div>
  );
}

/* ═══ Закладки: все сохранённые места чтения ═══ */
const KIND_LABELS: Record<string, string> = {
  bible: "Библия",
  life: "Жития",
  fathers: "Святые отцы",
  qa: "Вопросы и ответы",
};

function BookmarksSection({
  bookmarks,
  setBookmarks,
  openReader,
}: {
  bookmarks: Bookmark[];
  setBookmarks: (b: Bookmark[]) => void;
  openReader: (t: ReaderTarget) => void;
}) {
  const [openKey, setOpenKey] = useState<string | null>(null);

  if (bookmarks.length === 0) {
    return (
      <div>
        <SectionTitle className="mb-2">Закладки</SectionTitle>
        <div className="orn-card px-4 py-6 text-center">
          <BookmarkIcon size={22} className="mx-auto mb-2" style={{ color: "var(--an-ink-faint)" }} />
          <p className="pr-serif text-[0.76rem] leading-relaxed" style={{ color: "var(--an-ink-soft)" }}>
            Закладок пока нет. Откройте Библию, житие или ответ на вопрос — и нажмите значок закладки
            в шапке текста. Приложение также запомнит место, где вы остановили чтение.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <SectionTitle className="mb-2">Закладки</SectionTitle>
      <p className="pr-serif text-[0.66rem] mb-3" style={{ color: "var(--an-ink-soft)" }}>
        Хранятся на устройстве — нажмите, чтобы вернуться к тексту
      </p>
      <div className="flex flex-col gap-2">
        {bookmarks.map((b) => {
          const open = openKey === b.key;
          const go = () => {
            if (b.kind === "bible" && b.anchor?.chapter) {
              const nr = Number(b.key.split(":")[1]);
              openReader({ mode: "bible", nr, chapter: b.anchor.chapter, verse: b.anchor.verse });
            } else if (b.kind === "life") {
              openReader({ mode: "life", id: b.key.split(":")[1] });
            } else {
              setOpenKey(open ? null : b.key);
            }
          };
          return (
            <div key={b.key} className="orn-card-soft overflow-hidden">
              <div className="w-full flex items-center gap-3 px-3.5 py-3">
                <button onClick={go} className="flex-1 flex items-center gap-3 min-w-0 text-left">
                  <span
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: "var(--an-tile)", color: "var(--an-ink)" }}
                  >
                    <BookmarkIcon size={15} fill="currentColor" />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="pr-serif font-bold text-[0.78rem] block truncate" style={{ color: "var(--an-ink)" }}>
                      {b.title}
                    </span>
                    <span className="pr-serif text-[0.64rem] block truncate" style={{ color: "var(--an-ink-soft)" }}>
                      {KIND_LABELS[b.kind]} · {b.snippet}
                    </span>
                  </span>
                </button>
                <button
                  aria-label="Удалить закладку"
                  onClick={() => {
                    toggleBookmarkInStorage(b);
                    setBookmarks(loadBookmarks());
                  }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ color: "var(--an-ink-faint)" }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
              {(b.kind === "fathers" || b.kind === "qa") && open && (
                <div className="px-3.5 pb-3.5 animate-fade-up">
                  <p className="pr-read text-[0.76rem] leading-relaxed" style={{ color: "var(--an-ink)" }}>
                    {b.snippet}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
