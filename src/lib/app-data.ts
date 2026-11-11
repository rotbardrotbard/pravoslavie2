/* ═══════════════════════════════════════════════════════════
   «Православные» — общие типы и константы приложения
   (шаг 3: боевая версия мини-приложения для ОК)
   ═══════════════════════════════════════════════════════════ */

export type Screen =
  | "onboarding"
  | "home"
  | "calendar"
  | "prayer"
  | "map"
  | "word"
  | "question"
  | "more"
  /* «Сообщество» и «Вопрос священнику» скрыты — тип оставлен, чтобы код
     экранов можно было вернуть одним флагом (FEATURES в OrthodoxApp) */
  | "community";

export type Level = "beginner" | "occasional" | "churched";
export type Interest = "prayer" | "scripture" | "traditions" | "questions";

export const levelLabels: Record<Level, string> = {
  beginner: "Только начинаю",
  occasional: "Верю, хожу в храм редко",
  churched: "Воцерковлён(а)",
};

export const interestLabels: Record<Interest, string> = {
  prayer: "Утренняя и вечерняя молитва",
  scripture: "Чтение Писания",
  traditions: "История, традиции, праздники",
  questions: "Вопросы о вере",
};

/* ── Профиль крещения (анкета, необязательные поля) ── */
export interface BaptismProfile {
  baptismName: string | null; // имя при крещении
  baptismDate: string | null; // YYYY-MM-DD
}

/* ── Цель для читалки библиотеки ── */
export type ReaderTarget =
  | { mode: "bible"; nr: number; chapter?: number; verse?: number; label?: string }
  | { mode: "life"; id: string };

/* Публичная ссылка на приложение в ОК (заполняется после публикации) */
export const APP_LINK = "https://ok.ru/app/pravoslavnye";
export const APP_NAME = "Православные";

/* Ключи localStorage — вся настройка живёт на устройстве пользователя */
/* Версия приложения — видна внизу экрана «Ещё».
   Помогает убедиться, что внутри соцсети открылась свежая сборка
   (в webview ОК HTML может кэшироваться). */
export const APP_VERSION = "1.5.0";

export const STORAGE_KEYS = {
  onboarded: "pr.onboarded",
  level: "pr.level",
  interest: "pr.interest",
  geo: "pr.geo",
  notif: "pr.notif",
  evening: "pr.evening",
  fontBig: "pr.fontBig",
  textScale: "pr.textScale", // 100 | 115 | 130 — масштаб всего интерфейса (%), миграция с pr.fontBig
  prayerLog: "pr.prayerLog", // массив дат YYYY-MM-DD
  likedVerses: "pr.likedVerses",
  visitedTemples: "pr.visitedTemples",
  readPlan: "pr.readPlan",
  anonId: "pr.anonId",
  userName: "pr.userName",
  theme: "pr.theme", // "light" | "dark" (миграция с pr.evening)
  interests: "pr.interests", // массив (миграция с pr.interest)
  profile: "pr.profile", // имя/дата крещения
  bookmarks: "pr.bookmarks", // закладки библиотеки
  readPos: "pr.readPos", // места, где остановилось чтение
} as const;
