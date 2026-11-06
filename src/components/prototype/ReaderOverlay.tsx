"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Bookmark as BookmarkIcon, ChevronLeft, Loader2, Minus, Plus } from "lucide-react";
import type { ReaderTarget } from "@/lib/app-data";
import { bookByNr, loadBibleBook, type BibleBookText } from "@/lib/content/bible";
import { LIVES } from "@/lib/content/library";
import { lifeCover } from "@/lib/content/covers";
import {
  loadBookmarks,
  loadReadPos,
  saveReadPos,
  toggleBookmarkInStorage,
  type Bookmark,
} from "@/lib/storage";

/* ═══════════════════════════════════════════════════════════
   Читалка библиотеки: Библия (Синодальный перевод, офлайн)
   и жития святых. Умеет:
   • ставить закладки в любом стихе/абзаце (хранятся локально);
   • запоминать место, где чтение остановилось, и возвращать
     к нему при следующем открытии книги или жития.
   ═══════════════════════════════════════════════════════════ */

const SCROLL_SAVE_MS = 450;

export default function ReaderOverlay({
  target,
  onClose,
  toast,
}: {
  target: ReaderTarget;
  onClose: () => void;
  toast: (m: string) => void;
}) {
  return (
    <div className="fixed inset-0 z-40 flex justify-center animate-fade-up">
      <div
        className="relative w-full max-w-[480px] flex flex-col"
        style={{
          background: "var(--an-bg)",
          borderLeft: "1px solid var(--an-line-strong)",
          borderRight: "1px solid var(--an-line-strong)",
        }}
      >
        {target.mode === "bible" ? (
          <BibleReader key={`b${target.nr}`} nr={target.nr} chapter={target.chapter} verse={target.verse} onClose={onClose} toast={toast} />
        ) : (
          <LifeReader key={`l${target.id}`} id={target.id} onClose={onClose} toast={toast} />
        )}
      </div>
    </div>
  );
}

/* ═══════════════ Общая шапка читалки ═══════════════ */
function ReaderHeader({
  title,
  subtitle,
  bookmarked,
  onToggleBookmark,
  onClose,
  bookmarkLabel,
}: {
  title: string;
  subtitle?: string;
  bookmarked: boolean;
  onToggleBookmark: () => void;
  onClose: () => void;
  bookmarkLabel: string;
}) {
  return (
    <div
      className="sticky top-0 z-10 flex items-center gap-2.5 px-3 py-2.5 border-b backdrop-blur-sm shrink-0"
      style={{ background: "var(--an-bar, rgba(245,245,245,.94))", borderColor: "var(--an-line)" }}
    >
      <button
        aria-label="Закрыть читалку"
        onClick={onClose}
        className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
        style={{ color: "var(--an-ink)" }}
      >
        <ChevronLeft size={19} />
      </button>
      <div className="flex-1 min-w-0">
        <div className="pr-display text-[0.98rem] leading-tight truncate" style={{ color: "var(--an-ink)" }}>
          {title}
        </div>
        {subtitle && (
          <div className="text-[0.62rem] leading-tight truncate" style={{ color: "var(--an-ink-soft)" }}>
            {subtitle}
          </div>
        )}
      </div>
      <button
        onClick={onToggleBookmark}
        aria-pressed={bookmarked}
        aria-label={bookmarkLabel}
        className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
        style={{
          color: bookmarked ? "#ffffff" : "var(--an-ink)",
          background: bookmarked ? "var(--an-ink)" : "transparent",
        }}
      >
        <BookmarkIcon size={16} fill={bookmarked ? "currentColor" : "none"} />
      </button>
    </div>
  );
}

/* ═══════════════ Библия ═══════════════ */
function BibleReader({
  nr,
  chapter,
  verse,
  onClose,
  toast,
}: {
  nr: number;
  chapter?: number;
  verse?: number;
  onClose: () => void;
  toast: (m: string) => void;
}) {
  const meta = bookByNr(nr);
  const [book, setBook] = useState<BibleBookText | null>(null);
  const [cur, setCur] = useState(chapter ?? 1);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(() => loadBookmarks());
  const [fontScale, setFontScale] = useState(0); // −1..+2
  const scrollRef = useRef<HTMLDivElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restoreRef = useRef<{ percent?: number; verse?: number } | null>(null);

  const posKey = `bible:${nr}`;

  /* Загрузка текста книги + выбор стартовой главы и восстановления прокрутки */
  useEffect(() => {
    let cancelled = false;
    loadBibleBook(nr)
      .then((b) => {
        if (cancelled) return;
        setBook(b);
        const saved = loadReadPos()[posKey];
        if (typeof chapter === "number") {
          setCur(chapter);
          restoreRef.current = { verse };
        } else if (saved?.chapter) {
          setCur(saved.chapter);
          restoreRef.current = { percent: saved.percent };
          toast(`Продолжаем: ${meta?.short ?? ""} ${saved.chapter}`);
        }
      })
      .catch(() => {
        if (!cancelled) toast("Не удалось загрузить текст книги");
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nr]);

  /* Восстановление прокрутки после отрисовки главы */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !book) return;
    const r = restoreRef.current;
    requestAnimationFrame(() => {
      if (!el) return;
      if (r?.verse) {
        const node = el.querySelector<HTMLElement>(`[data-v="${r.verse}"]`);
        if (node) el.scrollTop = node.offsetTop - 84;
      } else if (r?.percent) {
        el.scrollTop = r.percent * (el.scrollHeight - el.clientHeight);
      } else {
        el.scrollTop = 0;
      }
      restoreRef.current = null;
    });
  }, [book, cur]);

  const verses = useMemo(() => book?.chapters.find((c) => c.c === cur)?.v ?? [], [book, cur]);
  const totalChapters = meta?.chapters ?? book?.chapters.length ?? 0;

  /* Прокрутка: сохраняем место чтения (глава + процент) */
  const onScroll = () => {
    const el = scrollRef.current;
    if (!el || !book) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const max = el.scrollHeight - el.clientHeight;
      const percent = max > 0 ? Math.min(1, Math.max(0, el.scrollTop / max)) : 0;
      saveReadPos(posKey, {
        kind: "bible",
        title: meta?.name ?? book.name,
        chapter: cur,
        percent,
        updatedAt: Date.now(),
      });
    }, SCROLL_SAVE_MS);
  };

  const bookmarkKeyFor = (verseNo: number) => `bible:${nr}:${cur}:${verseNo}`;
  const activeBookmark = useMemo(
    () => bookmarks.find((b) => b.key.startsWith(`bible:${nr}:${cur}:`)) ?? null,
    [bookmarks, nr, cur]
  );

  const toggleChapterBookmark = () => {
    /* Закладка ставится на первый видимый стих главы */
    const el = scrollRef.current;
    let verseNo = 1;
    if (el) {
      const nodes = Array.from(el.querySelectorAll<HTMLElement>("[data-v]"));
      for (const node of nodes) {
        if (node.offsetTop - el.scrollTop >= -10) {
          verseNo = Number(node.dataset.v) || 1;
          break;
        }
      }
    }
    const text = verses[verseNo - 1] ?? "";
    const key = bookmarkKeyFor(verseNo);
    const existing = bookmarks.find((b) => b.key === key);
    const added = toggleBookmarkInStorage({
      key,
      kind: "bible",
      title: `${meta?.short ?? ""} ${cur}:${verseNo}`,
      snippet: text.length > 90 ? text.slice(0, 87) + "…" : text,
      anchor: { chapter: cur, verse: verseNo },
      createdAt: Date.now(),
    });
    setBookmarks(loadBookmarks());
    toast(added ? `Закладка: ${meta?.short ?? ""} ${cur}:${verseNo}` : "Закладка убрана");
    void existing;
  };

  if (!book) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 size={22} className="animate-spin" style={{ color: "var(--an-ink-soft)" }} />
      </div>
    );
  }

  return (
    <>
      <ReaderHeader
        title={meta?.name ?? book.name}
        subtitle={`Синодальный перевод · глава ${cur} из ${totalChapters}`}
        bookmarked={!!activeBookmark}
        onToggleBookmark={toggleChapterBookmark}
        onClose={onClose}
        bookmarkLabel="Закладка на главе"
      />

      {/* Выбор главы */}
      <div
        className="flex gap-1 px-3 py-2 overflow-x-auto no-scrollbar shrink-0 border-b"
        style={{ borderColor: "var(--an-line)" }}
        role="tablist"
        aria-label="Главы книги"
      >
        {Array.from({ length: totalChapters }, (_, i) => i + 1).map((n) => {
          const active = n === cur;
          return (
            <button
              key={n}
              onClick={() => {
                setCur(n);
                restoreRef.current = null;
                setBookmarks(loadBookmarks());
              }}
              className="pr-chip shrink-0 !min-w-[34px] justify-center"
              style={
                active
                  ? { background: "var(--an-ink)", color: "#fff", borderColor: "var(--an-ink)" }
                  : undefined
              }
              aria-current={active ? "true" : undefined}
            >
              {n}
            </button>
          );
        })}
      </div>

      {/* Текст главы */}
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="flex-1 overflow-y-auto px-4 py-4"
        style={{
          fontSize: `${(0.86 + fontScale * 0.07).toFixed(2)}rem`,
          lineHeight: 1.65,
        }}
      >
        <div className="pr-display text-[1.05rem] mb-3 text-center" style={{ color: "var(--an-ink)" }}>
          {meta?.name ?? book.name}
          <div className="pr-serif text-[0.7rem] font-normal mt-0.5" style={{ color: "var(--an-ink-soft)" }}>
            Глава {cur}
          </div>
        </div>
        {verses.map((text, i) => (
          <p key={i} data-v={i + 1} className="pr-read mb-2.5" style={{ color: "var(--an-ink)" }}>
            <sup
              className="pr-serif font-bold mr-1"
              style={{ color: "var(--an-accent)", fontSize: "0.62em" }}
            >
              {i + 1}
            </sup>
            {text}
          </p>
        ))}
        <div
          className="pr-serif text-[0.64rem] text-center mt-6 pt-3 border-t"
          style={{ color: "var(--an-ink-soft)", borderColor: "var(--an-line)" }}
        >
          Синодальный перевод (1876) — общественное достояние · текст хранится внутри приложения
        </div>
      </div>

      {/* Размер шрифта */}
      <div
        className="shrink-0 flex items-center justify-center gap-2 py-2 border-t"
        style={{ borderColor: "var(--an-line)", background: "var(--an-card)" }}
      >
        <button
          aria-label="Меньше шрифт"
          onClick={() => setFontScale((s) => Math.max(-1, s - 1))}
          className="pr-chip"
        >
          <Minus size={12} />
        </button>
        <span className="pr-serif text-[0.66rem]" style={{ color: "var(--an-ink-soft)" }}>
          Размер текста
        </span>
        <button
          aria-label="Больше шрифт"
          onClick={() => setFontScale((s) => Math.min(2, s + 1))}
          className="pr-chip"
        >
          <Plus size={12} />
        </button>
      </div>
    </>
  );
}

/* ═══════════════ Жития святых ═══════════════ */
function LifeReader({
  id,
  onClose,
  toast,
}: {
  id: string;
  onClose: () => void;
  toast: (m: string) => void;
}) {
  const life = useMemo(() => LIVES.find((l) => l.id === id) ?? null, [id]);
  const paragraphs = useMemo(() => life?.text.split("\n\n") ?? [], [life]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(() => loadBookmarks());
  const [fontScale, setFontScale] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restoreRef = useRef<number | null>(null);

  const posKey = `life:${id}`;

  useEffect(() => {
    const saved = loadReadPos()[posKey];
    if (saved?.percent) restoreRef.current = saved.percent;
    const el = scrollRef.current;
    if (el) {
      requestAnimationFrame(() => {
        if (restoreRef.current && el) {
          el.scrollTop = restoreRef.current * (el.scrollHeight - el.clientHeight);
        } else if (el) {
          el.scrollTop = 0;
        }
        restoreRef.current = null;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el || !life) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const max = el.scrollHeight - el.clientHeight;
      const percent = max > 0 ? Math.min(1, Math.max(0, el.scrollTop / max)) : 0;
      saveReadPos(posKey, {
        kind: "life",
        title: life.name,
        percent,
        updatedAt: Date.now(),
      });
    }, SCROLL_SAVE_MS);
  };

  const bookmarkKey = `life:${id}`;
  const activeBookmark = bookmarks.find((b) => b.key === bookmarkKey) ?? null;

  const toggleBookmark = () => {
    if (!life) return;
    const added = toggleBookmarkInStorage({
      key: bookmarkKey,
      kind: "life",
      title: life.name,
      snippet: life.title + " · память " + life.memory,
      createdAt: Date.now(),
    });
    setBookmarks(loadBookmarks());
    toast(added ? "Житие добавлено в закладки" : "Закладка убрана");
  };

  if (!life) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="pr-serif text-[0.8rem]" style={{ color: "var(--an-ink-soft)" }}>
          Текст жития не найден
        </p>
      </div>
    );
  }

  return (
    <>
      <ReaderHeader
        title={life.name}
        subtitle={life.title + " · память " + life.memory}
        bookmarked={!!activeBookmark}
        onToggleBookmark={toggleBookmark}
        onClose={onClose}
        bookmarkLabel="Закладка на житии"
      />
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="flex-1 overflow-y-auto px-4 py-4"
        style={{ fontSize: `${(0.84 + fontScale * 0.07).toFixed(2)}rem`, lineHeight: 1.7 }}
      >
        <div
          className="relative h-32 rounded-2xl overflow-hidden mb-4"
          style={{ border: "1px solid var(--an-line)" }}
        >
          <img
            src={lifeCover(life.id)}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(16,21,28,0.05) 30%, rgba(16,21,28,0.62) 100%)",
            }}
          />
          <div className="absolute bottom-2 left-3 right-3">
            <span className="pr-serif text-[0.68rem]" style={{ color: "rgba(255,255,255,0.94)" }}>
              Память: {life.memory}
            </span>
          </div>
        </div>
        {paragraphs.map((p, i) => (
          <p key={i} data-p={i} className="pr-read mb-3" style={{ color: "var(--an-ink)" }}>
            {p}
          </p>
        ))}
        <div
          className="pr-serif text-[0.64rem] text-center mt-6 pt-3 border-t"
          style={{ color: "var(--an-ink-soft)", borderColor: "var(--an-line)" }}
        >
          Краткое житие — по общецерковным сведениям
        </div>
      </div>
      <div
        className="shrink-0 flex items-center justify-center gap-2 py-2 border-t"
        style={{ borderColor: "var(--an-line)", background: "var(--an-card)" }}
      >
        <button
          aria-label="Меньше шрифт"
          onClick={() => setFontScale((s) => Math.max(-1, s - 1))}
          className="pr-chip"
        >
          <Minus size={12} />
        </button>
        <span className="pr-serif text-[0.66rem]" style={{ color: "var(--an-ink-soft)" }}>
          Размер текста
        </span>
        <button
          aria-label="Больше шрифт"
          onClick={() => setFontScale((s) => Math.min(2, s + 1))}
          className="pr-chip"
        >
          <Plus size={12} />
        </button>
      </div>
    </>
  );
}
