/* ═══════════════════════════════════════════════════════════
   Месяцеслов «Православных» — типы и сводный индекс.
   Данные: m01..m12; у каждого святого
   есть краткое описание; lifeId связывает запись с полным житием.
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

export type SaintKind = "great" | "feast" | "icon" | "saint";

export interface SaintRec {
  key: string;      // «MM-DD»
  name: string;
  year?: string;    // «ок. 63», «XIV» и т.п.
  kind: SaintKind;
  desc: string;     // краткое описание (есть у КАЖДОГО святого)
  lifeId?: string;  // полное житие в src/lib/content/lives.ts
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

/* Главный праздник дня (great > feast > icon) — для шапки календаря */
export function feastOfDay(key: string): SaintRec | null {
  const list = BY_KEY[key] ?? [];
  const order: Record<string, number> = { great: 0, feast: 1, icon: 2, saint: 3 };
  return list.length
    ? [...list].sort((a, b) => (order[a.kind] ?? 9) - (order[b.kind] ?? 9))[0]
    : null;
}
