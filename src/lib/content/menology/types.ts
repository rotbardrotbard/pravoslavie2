/* ═══════════════════════════════════════════════════════════
   Месяцеслов «Православных» — типы и сводный индекс.
   Сами данные — в файлах m01..m12 (выгрузка с azbyka.ru):
   у каждого дня года — праздники и святые с описанием;
   lifeId связывает запись с полным житием (lives.ts).
   ═══════════════════════════════════════════════════════════ */

import { M01 } from "./m01";
import { M02 } from "./m02";
import { M03 } from "./m03";
import { M04 } from "./m04";
import { M05 } from "./m05";
import { M06 } from "./m06";
import { M07 } from "./m07";
import { M08 } from "./m08";
import { M09 } from "./m09";
import { M10 } from "./m10";
import { M11 } from "./m11";
import { M12 } from "./m12";
import { NAME_DAY_DATES } from "./name-days";

export type SaintKind = "great" | "feast" | "icon" | "saint" | "sobor" | "post";

export interface SaintRec {
  key: string; // «11-08»
  name: string;
  year?: string;
  kind: SaintKind;
  desc: string;
  lifeId?: string;
}

export const MENOLOGY: SaintRec[] = [
  ...M01, ...M02, ...M03, ...M04, ...M05, ...M06,
  ...M07, ...M08, ...M09, ...M10, ...M11, ...M12,
];

const BY_KEY: Record<string, SaintRec[]> = {};
for (const r of MENOLOGY) {
  (BY_KEY[r.key] ??= []).push(r);
}

/* Святые и праздники дня по ключу «MM-DD» */
export function saintsOfDay(key: string): SaintRec[] {
  return BY_KEY[key] ?? [];
}

/* Главный праздник дня (great/feast/icon) — для шапки календаря */
export function feastOfDay(key: string): SaintRec | null {
  const list = BY_KEY[key] ?? [];
  return list.find((r) => r.kind === "great" || r.kind === "feast" || r.kind === "icon") ?? null;
}

export { NAME_DAY_DATES };
