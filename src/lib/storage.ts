/* ═══════════════════════════════════════════════════════════
   Хранилище настроек (localStorage) + утилиты дат
   ═══════════════════════════════════════════════════════════ */

import { STORAGE_KEYS } from "./app-data";

export function lsGet<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function lsSet(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* переполнение или приватный режим — игнорируем */
  }
}

/* ── Безопасное чтение массива строк ──
   Данные старых версий приложения могли храниться в другом формате
   (строка вместо массива, карта { id: true }).  Без проверки такой
   формат валит рендер (Array.some/includes у массива отсутствуют)
   и даёт белый экран при каждом открытии.  Здесь приводим всё
   к массиву строк, по возможности сохраняя пользовательские данные. */
export function lsGetStrArray(key: string): string[] {
  const v = lsGet<unknown>(key, null);
  if (Array.isArray(v)) return v.filter((x): x is string => typeof x === "string");
  if (typeof v === "string") return v ? [v] : [];
  if (v && typeof v === "object") {
    /* карта { "40:5": true } → список ключей */
    return Object.entries(v as Record<string, unknown>)
      .filter(([, on]) => on === true || on === 1 || typeof on === "string")
      .map(([k]) => k);
  }
  return [];
}

/* ── Анонимный идентификатор (для вопросов священнику) ── */
export function getAnonId(): string {
  const existing = lsGet<string | null>(STORAGE_KEYS.anonId, null);
  if (existing) return existing;
  const id = "a" + Math.random().toString(36).slice(2) + Date.now().toString(36);
  lsSet(STORAGE_KEYS.anonId, id);
  return id;
}

/* ═══════════════════════════════════════════════════════════
   Библиотека: закладки в текстах и память о месте чтения.
   Всё хранится локально на устройстве (localStorage).
   ═══════════════════════════════════════════════════════════ */

export type BookmarkKind = "bible" | "life" | "fathers" | "qa";

export interface Bookmark {
  key: string; // "bible:40:5:3" | "life:serafim:0" | "fathers:..." | "qa:..."
  kind: BookmarkKind;
  title: string; // «Евангелие от Марка 5:36» / «Прп. Серафим Саровский»
  snippet: string; // первые слова текста
  anchor?: { chapter?: number; verse?: number; para?: number };
  createdAt: number;
}

export interface ReadPosEntry {
  kind: "bible" | "life";
  title: string; // «Евангелие от Марка» / название жития
  chapter?: number; // для Библии — глава
  para?: number; // для житий — абзац
  percent: number; // 0..1 прокрутки
  updatedAt: number;
}

export function loadBookmarks(): Bookmark[] {
  const v = lsGet<unknown>(STORAGE_KEYS.bookmarks, []);
  if (!Array.isArray(v)) return [];
  /* отбрасываем записи не той формы — одна битая не должна валить библиотеку */
  return v.filter(
    (x): x is Bookmark =>
      !!x &&
      typeof x === "object" &&
      typeof (x as Bookmark).key === "string" &&
      typeof (x as Bookmark).title === "string"
  );
}

export function saveBookmarks(list: Bookmark[]) {
  lsSet(STORAGE_KEYS.bookmarks, list);
}

export function toggleBookmarkInStorage(bm: Bookmark): boolean {
  const list = loadBookmarks();
  const exists = list.some((x) => x.key === bm.key);
  saveBookmarks(exists ? list.filter((x) => x.key !== bm.key) : [bm, ...list]);
  return !exists;
}

export type ReadPosMap = Record<string, ReadPosEntry>;

export function loadReadPos(): ReadPosMap {
  return lsGet<ReadPosMap>(STORAGE_KEYS.readPos, {});
}

export function saveReadPos(key: string, entry: ReadPosEntry) {
  const map = loadReadPos();
  map[key] = entry;
  lsSet(STORAGE_KEYS.readPos, map);
}

/* Самая свежая позиция чтения — для карточки «Продолжить чтение» */
export function latestReadPos(): { key: string; entry: ReadPosEntry } | null {
  const map = loadReadPos();
  let best: { key: string; entry: ReadPosEntry } | null = null;
  for (const [key, entry] of Object.entries(map)) {
    if (!best || entry.updatedAt > best.entry.updatedAt) best = { key, entry };
  }
  return best;
}

/* ── Даты ── */
export function todayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/* ── Счётчик молитвы: считаем непрерывную серию дней с отметками ── */
export function computeStreak(log: string[]): number {
  const days = new Set(log);
  if (days.size === 0) return 0;
  const one = 86_400_000;
  // Точка отсчёта: сегодня, если есть отметка; иначе вчера (серия не сломана)
  let cursor = new Date();
  if (!days.has(todayKey(cursor))) {
    cursor = new Date(Date.now() - one);
    if (!days.has(todayKey(cursor))) return 0;
  }
  let streak = 0;
  while (days.has(todayKey(cursor))) {
    streak++;
    cursor = new Date(cursor.getTime() - one);
  }
  return streak;
}

export function dayPlural(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "день";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "дня";
  return "дней";
}
