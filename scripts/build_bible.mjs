/* Скачивает Синодальный перевод (getbible.net, public domain) и собирает
   компактные JSON-файлы книг для офлайн-хранилища приложения.
   Использование: node scripts/build_bible.mjs */
import { mkdir, writeFile } from "node:fs/promises";

const BASE = "https://api.getbible.net/v2/synodal";
const OUT = new URL("../bible/", import.meta.url).pathname;

/* 40–66 — Новый Завет, 19 — Псалтирь */
const BOOKS = [19, ...Array.from({ length: 27 }, (_, i) => 40 + i)];

await mkdir(OUT, { recursive: true });

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

for (const nr of BOOKS) {
  const res = await fetch(`${BASE}/${nr}.json`);
  if (!res.ok) {
    console.error(`✗ ${nr}: HTTP ${res.status}`);
    continue;
  }
  const raw = await res.json();
  const chapters = raw.chapters.map((ch) => ({
    c: ch.chapter,
    v: ch.verses.map((v) => v.text.trim()),
  }));
  const compact = { nr: raw.nr, name: raw.name, chapters };
  await writeFile(`${OUT}${nr}.json`, JSON.stringify(compact));
  const verses = chapters.reduce((s, c) => s + c.v.length, 0);
  console.log(`✓ ${nr} ${raw.name}: ${chapters.length} гл., ${verses} стихов`);
  await delay(400);
}
console.log("Готово.");
