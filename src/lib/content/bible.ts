/* ═══════════════════════════════════════════════════════════
   Библия внутри приложения — Синодальный перевод (1876),
   общественное достояние. Тексты хранятся офлайн в файлах
   bible/<nr>.json (папка в корне проекта) и загружаются
   по запросу (динамический импорт — каждая книга отдельным чанком).

   Источник для выгрузки: getbible.net, перевод «synodal».
   Скрипт обновления: scripts/build_bible.mjs.
   ═══════════════════════════════════════════════════════════ */

export type BibleSection = "psalms" | "gospels" | "acts" | "epistles" | "catholic" | "apocalypse";

export interface BibleBookMeta {
  nr: number;
  name: string;
  short: string;
  chapters: number;
  section: BibleSection;
}

export const BIBLE_BOOKS: BibleBookMeta[] = [
  { nr: 19, name: "Псалтирь", short: "Пс.", chapters: 151, section: "psalms" },
  { nr: 40, name: "Евангелие от Матфея", short: "Мф.", chapters: 28, section: "gospels" },
  { nr: 41, name: "Евангелие от Марка", short: "Мк.", chapters: 16, section: "gospels" },
  { nr: 42, name: "Евангелие от Луки", short: "Лк.", chapters: 24, section: "gospels" },
  { nr: 43, name: "Евангелие от Иоанна", short: "Ин.", chapters: 21, section: "gospels" },
  { nr: 44, name: "Деяния святых апостолов", short: "Деян.", chapters: 28, section: "acts" },
  { nr: 45, name: "Послание к Римлянам", short: "Рим.", chapters: 16, section: "epistles" },
  { nr: 46, name: "1-е послание к Коринфянам", short: "1 Кор.", chapters: 16, section: "epistles" },
  { nr: 47, name: "2-е послание к Коринфянам", short: "2 Кор.", chapters: 13, section: "epistles" },
  { nr: 48, name: "Послание к Галатам", short: "Гал.", chapters: 6, section: "epistles" },
  { nr: 49, name: "Послание к Ефесянам", short: "Еф.", chapters: 6, section: "epistles" },
  { nr: 50, name: "Послание к Филиппийцам", short: "Флп.", chapters: 4, section: "epistles" },
  { nr: 51, name: "Послание к Колоссянам", short: "Кол.", chapters: 4, section: "epistles" },
  { nr: 52, name: "1-е послание к Фессалоникийцам", short: "1 Фес.", chapters: 5, section: "epistles" },
  { nr: 53, name: "2-е послание к Фессалоникийцам", short: "2 Фес.", chapters: 3, section: "epistles" },
  { nr: 54, name: "1-е послание к Тимофею", short: "1 Тим.", chapters: 6, section: "epistles" },
  { nr: 55, name: "2-е послание к Тимофею", short: "2 Тим.", chapters: 4, section: "epistles" },
  { nr: 56, name: "Послание к Титу", short: "Тит.", chapters: 3, section: "epistles" },
  { nr: 57, name: "Послание к Филимону", short: "Флм.", chapters: 1, section: "epistles" },
  { nr: 58, name: "Послание к Евреям", short: "Евр.", chapters: 13, section: "epistles" },
  { nr: 59, name: "Соборное послание апостола Иакова", short: "Иак.", chapters: 5, section: "catholic" },
  { nr: 60, name: "1-е соборное послание апостола Петра", short: "1 Пет.", chapters: 5, section: "catholic" },
  { nr: 61, name: "2-е соборное послание апостола Петра", short: "2 Пет.", chapters: 3, section: "catholic" },
  { nr: 62, name: "1-е соборное послание апостола Иоанна", short: "1 Ин.", chapters: 5, section: "catholic" },
  { nr: 63, name: "2-е соборное послание апостола Иоанна", short: "2 Ин.", chapters: 1, section: "catholic" },
  { nr: 64, name: "3-е соборное послание апостола Иоанна", short: "3 Ин.", chapters: 1, section: "catholic" },
  { nr: 65, name: "Соборное послание апостола Иуды", short: "Иуд.", chapters: 1, section: "catholic" },
  { nr: 66, name: "Откровение апостола Иоанна Богослова", short: "Откр.", chapters: 22, section: "apocalypse" },
];

export const SECTION_LABELS: Record<BibleSection, string> = {
  psalms: "Ветхий Завет",
  gospels: "Евангелия",
  acts: "Деяния",
  epistles: "Послания апостола Павла",
  catholic: "Соборные послания",
  apocalypse: "Апокалипсис",
};

const SECTION_ORDER: BibleSection[] = ["gospels", "acts", "epistles", "catholic", "apocalypse", "psalms"];

export function groupedBibleBooks(): { section: BibleSection; label: string; books: BibleBookMeta[] }[] {
  return SECTION_ORDER.map((section) => ({
    section,
    label: SECTION_LABELS[section],
    books: BIBLE_BOOKS.filter((b) => b.section === section),
  }));
}

export function bookByNr(nr: number): BibleBookMeta | undefined {
  return BIBLE_BOOKS.find((b) => b.nr === nr);
}

/* ── Тексты книг ── */
export interface BibleChapterText {
  c: number;
  v: string[];
}

export interface BibleBookText {
  nr: number;
  name: string;
  chapters: BibleChapterText[];
}

/* Динамические импорты с литеральными путями — Next.js разбивает каждую книгу на свой чанк */
const LOADERS: Record<number, () => Promise<{ default: BibleBookText }>> = {
  19: () => import("../../../bible/19.json"),
  40: () => import("../../../bible/40.json"),
  41: () => import("../../../bible/41.json"),
  42: () => import("../../../bible/42.json"),
  43: () => import("../../../bible/43.json"),
  44: () => import("../../../bible/44.json"),
  45: () => import("../../../bible/45.json"),
  46: () => import("../../../bible/46.json"),
  47: () => import("../../../bible/47.json"),
  48: () => import("../../../bible/48.json"),
  49: () => import("../../../bible/49.json"),
  50: () => import("../../../bible/50.json"),
  51: () => import("../../../bible/51.json"),
  52: () => import("../../../bible/52.json"),
  53: () => import("../../../bible/53.json"),
  54: () => import("../../../bible/54.json"),
  55: () => import("../../../bible/55.json"),
  56: () => import("../../../bible/56.json"),
  57: () => import("../../../bible/57.json"),
  58: () => import("../../../bible/58.json"),
  59: () => import("../../../bible/59.json"),
  60: () => import("../../../bible/60.json"),
  61: () => import("../../../bible/61.json"),
  62: () => import("../../../bible/62.json"),
  63: () => import("../../../bible/63.json"),
  64: () => import("../../../bible/64.json"),
  65: () => import("../../../bible/65.json"),
  66: () => import("../../../bible/66.json"),
};

/* Номера книг, доступных офлайн */
export const BIBLE_AVAILABLE = new Set(Object.keys(LOADERS).map(Number));

const cache = new Map<number, Promise<BibleBookText>>();

export function loadBibleBook(nr: number): Promise<BibleBookText> {
  const loader = LOADERS[nr];
  if (!loader) return Promise.reject(new Error(`Книга ${nr} не входит в офлайн-хранилище`));
  let p = cache.get(nr);
  if (!p) {
    p = loader().then((m) => m.default);
    cache.set(nr, p);
  }
  return p;
}
