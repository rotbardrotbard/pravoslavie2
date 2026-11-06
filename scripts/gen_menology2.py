#!/usr/bin/env python3
"""Генерация menology/*.ts (m01..m12 + types.ts) из scripts/menology_raw.json.
Каждый святой получает desc (краткое описание); у известных — lifeId на LIVES.
Запуск: python3 scripts/gen_menology2.py"""
import json
import os
import re
import unicodedata

ROOT = "/home/z/my-project"
RAW = os.path.join(ROOT, "scripts", "menology_raw.json")
OUTDIR = os.path.join(ROOT, "menology")

# ── lifeId: slug-правила для 44 житий LIVES ──
LIFE_SLUGS = {
    "nikolay": ["sv-nikolaj-chudotvorec", "sv-nikolaj-mirlikijsk", "sv-nikolaj-udotvorec"],
    "serafim": ["sv-serafim-sarovskij"],
    "sergiy": ["sv-sergij-radonezhskij"],
    "matrona": ["sv-matrona-moskovskaja", "sv-matrona"],
    "spiridon": ["sv-spiridon-trimifuntskij"],
    "kseniya": ["sv-ksenija-peterburgskaja", "sv-ksenija"],
    "panteleimon": ["sv-panteleimon"],
    "luka": ["sv-luka-krymskij", "sv-luka-vojno-jasenckij"],
    "georgiy": ["sv-georgij-pobedonosets", "sv-georgij"],
    "petr-fevroniya": ["sv-petr-i-fevronija"],
    "alexander-nevsky": ["sv-aleksandr-nevskij"],
    "iliya": ["sv-ilija-prorok", "sv-ilija-fesvitjanin"],
    "ioann-predtecha": ["sv-prorok-i-krestitel-ioann-predtecha", "prazdnik-rozhdestvo-chestnogo-slavnogo-proroka-predtechi", "prazdnik-pervoe-i-vtoroe-obretenija-glavy-proroka-predtechi", "prazdnik-trete-obretenie-glavy-proroka-predtechi", "sv-ioann-predtecha", "sv-ioann-krestitel", "zachatije-ioanna"],
    "andrey": ["sv-andrej-pervozvannyj"],
    "petr-pavel": ["prazdnik-slavnyh-i-vsehvalnyh-pervoverhovnyh-apostolov", "sv-petr-i-pavel", "sv-petr-apostol", "sv-pavel-apostol"],
    "matfey": ["sv-matfej-levij", "sv-matfej-apostol", "sv-mattej", "sv-matfej-evangelist"],
    "filipp": ["sv-filipp-apostol"],
    "arhangel-mihail": ["sv-sobor-arhistratiga-mihaila", "prazdnik-vospominanie-chuda-arhistratiga-mihaila", "arhistratig-mihail"],
    "stephan": ["sv-stefan-pervomuchenik", "sv-stefan-archidiakon"],
    "ioann-zlatoust": ["sv-ioann-zlatoust"],
    "vasily-veliky": ["sv-vasilij-velikij"],
    "ambrosiy-medio": ["sv-amvrosij-mediolanskij", "sv-ambrosij-mediolanskij"],
    "kirill-mefodiy": ["sv-kirill-konstantin-filosof", "sv-mefodij-moravskij", "ravnoap-kirill", "ravnoap-mefodij"],
    "tihon-zadonsky": ["sv-tihon-zadonskij"],
    "nectariy-eginsky": ["sv-nektarij-eginskij"],
    "ignatiy-bryanchaninov": ["sv-ignatij-brjanchaninov", "sv-ignatij-brijanchaninov"],
    "feofan-zatvornik": ["sv-feofan-zatvornik", "sv-teofan-zatvornik", "sv-feofan-vyshenskij"],
    "ioann-kronstadt": ["sv-ioann-kronshtadtskij", "sv-ioann-iljinskij"],
    "amvrosiy-optinsky": ["sv-amvrosij-optinskij"],
    "aleksey-mechov": ["sv-aleksij-moskovskij-mechev", "sv-aleksej-mechov"],
    "pausiy-svyatogorets": ["sv-paisij-svjatogorets", "sv-paisij-svjatogorec", "sv-paisij-afonskij"],
    "dimitry-solunsky": ["prazdnik-vmch-dimitrija-solunskogo", "sv-dimitrij-solunskij", "sv-dimitrij-mirlik"],
    "kosma-damian": ["sv-kosma-i-damian", "sv-kozma-i-damian", "prazdnik-bessrebrenikov-kosmy-i-damiana", "bes-srebr-kosma"],
    "ekaterina": ["sv-ekaterina-velikomuchenica", "sv-ekaterina-aleksandrijskaja"],
    "varvara": ["sv-varvara-velikomuchenica", "sv-varvara-ilopoljskaja"],
    "anastasia": ["sv-anastasija-uzoreshitelnica", "sv-anastasija-uzoresnitelnica"],
    "tatiana": ["sv-tatiana-rimskaja", "sv-tatjana-rimskaja"],
    "vera-nadezhda-lyubov": ["sv-vera-nadezhda-ljubov", "sv-vera-nadezhda-ljubov-i-mat-sofija"],
    "ioakim-anna": ["sv-ioakim-i-anna", "pravednye-ioakim-i-anna", "prazdnik-zachatie-prav-annoju", "sv-anna-prorocica"],
    "kiprian-iustina": ["sv-kiprian-i-justina", "smch-kiprian", "mc-justina"],
    "pecherskie": ["sv-antonij-pecherskij", "sv-feodosij-pecherskij", "sbor-prepodobnyh-otc-pecherskih"],
    "efrem-sirin": ["sv-efrem-sirin"],
    "olga-vladimir": ["sv-olga-v-kreshchenii-elena", "sv-vel-kn-vladimir-v-kreshchenii-vasilij", "ravnoap-olga", "ravnoap-vladimir", "sv-vladimir-ravnoapostolnyj", "sv-olga-ravnoapostolnaja"],
    "ludmila": ["sv-ljudmila-cheskaja", "mc-ljudmila"],
}

GENERIC_DESC = "Память этого святого совершается Церковью в этот день. Житие святого читается в храме и в полной Минее."

def esc(s):
    return json.dumps(s, ensure_ascii=False)

def main():
    raw = json.load(open(RAW, encoding="utf-8"))
    days, saints_meta = raw["days"], raw["saints"]
    meta = raw["meta"]

    # slug → lifeId
    slug2life = {}
    for life_id, rules in LIFE_SLUGS.items():
        for rule in rules:
            for slug in meta:
                if rule in slug and slug not in slug2life:
                    slug2life[slug] = life_id
    lives_found = sorted(set(slug2life.values()))
    print(f"lifeId привязок: {len(slug2life)} (покрыто {len(lives_found)}/44 житий)")
    missing = sorted(set(LIFE_SLUGS) - set(lives_found))
    if missing:
        print("  без привязки:", missing)

    # сборка записей по месяцам
    per_month = {m: [] for m in range(1, 13)}
    n_no_desc = 0
    for key, lst in sorted(days.items()):
        mm = int(key[:2])
        for s in lst:
            slug = s["slug"]
            sv = saints_meta.get(slug, {})
            desc = (sv.get("desc") or "").strip()
            if len(desc) > 240:  # компактный чанк: обрез по концу предложения
                cut = desc.find(". ", 150)
                if cut > 0:
                    desc = desc[: cut + 1]
                else:
                    desc = desc[:240]
            if not desc:
                desc = GENERIC_DESC
                n_no_desc += 1
            rec = {
                "key": key,
                "name": s["name"],
                "kind": s["kind"],
                "desc": desc,
            }
            if s.get("year"):
                rec["year"] = s["year"]
            life = slug2life.get(slug)
            if life:
                rec["lifeId"] = life
            per_month[mm].append(rec)

    total = sum(len(v) for v in per_month.values())
    print(f"записей всего: {total}, без описания с источником: {n_no_desc}")

    os.makedirs(OUTDIR, exist_ok=True)
    for m in range(1, 13):
        recs = per_month[m]
        lines = [
            f"/* Месяцеслов «Православных» — {m:02d}. Выгрузка azbyka.ru/days.",
            "   Каждый святой имеет краткое описание; lifeId — полное житие (src/lib/content/lives.ts). */",
            "",
            'import type { SaintRec } from "./types";',
            "",
            "export const " + f"M{m:02d}" + ": SaintRec[] = [",
        ]
        for r in recs:
            parts = [f'key: {esc(r["key"])}', f'name: {esc(r["name"])}', f'kind: {esc(r["kind"])}', f'desc: {esc(r["desc"])}']
            if r.get("year"):
                parts.insert(2, f'year: {esc(r["year"])}')
            if r.get("lifeId"):
                parts.append(f'lifeId: {esc(r["lifeId"])}')
            lines.append("  { " + ", ".join(parts) + " },")
        lines.append("];")
        open(os.path.join(OUTDIR, f"m{m:02d}.ts"), "w", encoding="utf-8").write("\n".join(lines) + "\n")

    types_ts = '''/* ═══════════════════════════════════════════════════════════
   Месяцеслов «Православных» — типы и сводный индекс.
   Данные: m01..m12 (выгрузка azbyka.ru/days); у каждого святого
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
'''
    open(os.path.join(OUTDIR, "types.ts"), "w", encoding="utf-8").write(types_ts)

    size = sum(os.path.getsize(os.path.join(OUTDIR, f)) for f in os.listdir(OUTDIR))
    print(f"menology/: {len(os.listdir(OUTDIR))} файлов, {size/1024:.0f} КБ")


if __name__ == "__main__":
    main()
