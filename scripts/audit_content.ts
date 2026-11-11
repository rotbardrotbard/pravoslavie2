/* Аудит полноты контента: святцы, жития, цитаты, ответы, библия.
   Запуск: bun scripts/audit_content.ts */
import { MENOLOGY } from "../menology/types";
import { LIVES } from "../src/lib/content/lives";
import { FATHERS_QUOTES } from "../src/lib/content/fathers";
import { QA_LIBRARY } from "../src/lib/content/library";
import { faqQuestions } from "../src/lib/content/faq";
import fs from "node:fs";

const R: string[] = [];
const bad: string[] = [];
const ok = (s: string) => R.push("✓ " + s);
const fail = (s: string) => { R.push("✗ " + s); bad.push(s); };

/* ── Святцы ── */
const saints = MENOLOGY;
const emptyDesc = saints.filter(s => !s.desc || s.desc.trim().length < 10);
const emptyName = saints.filter(s => !s.name || !s.name.trim());
const keys = new Set(saints.map(s => s.key));
const kinds: Record<string, number> = {};
for (const s of saints) kinds[s.kind] = (kinds[s.kind] ?? 0) + 1;

saints.length >= 300 ? ok(`записей в святцах: ${saints.length}`) : fail(`записей в святцах всего ${saints.length} (<300)`);
emptyDesc.length === 0
  ? ok(`у КАЖДОЙ записи есть описание (мин. 10 симв.) — нарушений: 0`)
  : fail(`записей БЕЗ описания: ${emptyDesc.length}: ` + emptyDesc.slice(0, 5).map(s => `${s.key} ${s.name}`).join("; "));
emptyName.length === 0 ? ok(`имена заполнены у всех`) : fail(`без имени: ${emptyName.length}`);
ok(`дней года с записями: ${keys.size}/366`);
ok(`типы: ${JSON.stringify(kinds)}`);

/* ── Жития ── */
const lifeArr = LIVES as unknown as { id: string }[];
const lifeIds = new Set(lifeArr.map(l => l.id));
const withLife = saints.filter(s => s.lifeId);
const dangling = withLife.filter(s => !lifeIds.has(s.lifeId!));
ok(`полных житий в библиотеке LIVES: ${lifeIds.size}`);
ok(`святых со ссылкой на полное житие (lifeId): ${withLife.length}`);
dangling.length === 0
  ? ok(`битых ссылок lifeId: 0`)
  : fail(`битых lifeId: ${dangling.length}: ` + dangling.slice(0, 6).map(s => `${s.key} ${s.name}→${s.lifeId}`).join("; "));
const emptyLife = lifeArr.filter(l => !((l as unknown as { text?: string }).text ?? "").trim() || ((l as unknown as { text?: string }).text ?? "").trim().length < 200);
emptyLife.length === 0
  ? ok(`все ${lifeArr.length} житий содержат полный текст (>200 симв.)`)
  : fail(`житий без полного текста: ${emptyLife.length}: ` + emptyLife.slice(0, 6).map(l => l.id).join("; "));

/* ── Цитаты отцов ── */
const q = FATHERS_QUOTES as { text?: string; author?: string }[];
const badQ = q.filter(x => !x.text?.trim() || !x.author?.trim());
q.length >= 50 ? ok(`цитат отцов: ${q.length}`) : fail(`цитат отцов всего ${q.length} (<50)`);
badQ.length === 0 ? ok(`все цитаты с текстом и автором`) : fail(`пустых цитат: ${badQ.length}`);

/* ── Ответы на вопросы ── */
const qa = QA_LIBRARY as unknown as { q?: string; a?: string }[];
const badA = qa.filter(x => !x.q?.trim() || !x.a?.trim() || x.a.trim().length < 40);
qa.length >= 80 ? ok(`ответов на вопросы (QA_LIBRARY): ${qa.length}`) : fail(`ответов всего ${qa.length} (<80)`);
badA.length === 0 ? ok(`все ответы содержательные (>40 симв.)`) : fail(`слабых ответов: ${badA.length}: ` + badA.slice(0, 4).map(x => x.q).join("; "));
ok(`вопросов в FAQ-базе: ${(faqQuestions as unknown[]).length}`);

/* ── Библия ── */
const bible = fs.readdirSync(new URL("../bible", import.meta.url).pathname).filter(f => f.endsWith(".json"));
bible.length >= 27 ? ok(`книг Библии (JSON-чанков): ${bible.length}`) : fail(`книг Библии: ${bible.length}`);

console.log(R.join("\n"));
console.log(bad.length ? `\nПРОВАЛОВ: ${bad.length}` : "\nАУДИТ ПРОЙДЕН ПОЛНОСТЬЮ");
process.exit(bad.length ? 1 : 0);
