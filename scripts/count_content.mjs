/* Инвентаризация контента библиотеки: жития, цитаты, ответы на вопросы */
import fs from "node:fs";

const az = fs.readFileSync("src/lib/content/azbyka.ts", "utf8");
const faq = fs.readFileSync("src/lib/content/faq.ts", "utf8");
const word = fs.readFileSync("src/lib/content/word.ts", "utf8");

/* --- границы секций azbyka.ts --- */
const idxLives = az.indexOf("export const LIVES");
const idxQuotes = az.indexOf("export const QUOTES");
const idxQa = az.indexOf("export const QA");
console.log("Секции azbyka.ts: LIVES@", idxLives, " QUOTES@", idxQuotes, " QA@", idxQa);

function countIds(block) {
  // считаем вхождения "id: \"..." на уровне элементов массива
  return (block.match(/id: "/g) || []).length;
}

if (idxLives >= 0) {
  const end = idxQuotes >= 0 ? idxQuotes : az.length;
  const block = az.slice(idxLives, end);
  console.log("\n=== ЖИТИЯ:", countIds(block));
  const names = [...block.matchAll(/name: "([^"]+)"/g)].map((m) => m[1]);
  names.forEach((n, i) => console.log(" ", String(i + 1).padStart(2), n));
  const texts = [...block.matchAll(/"((?:[^"\\]|\\.)*?)",\n  \},/gs)].map((m) => m[1]);
  // длины text-полей: ищем поле text: " ... " (многострочные строки через \n внутри)
  const textLens = [...block.matchAll(/text:\s*\n?\s*"((?:[^"\\]|\\.)*)"/g)].map((m) => m[1].length);
  if (textLens.length) {
    const avg = Math.round(textLens.reduce((a, b) => a + b, 0) / textLens.length);
    console.log("  текстов:", textLens.length, "· длина: min", Math.min(...textLens), "max", Math.max(...textLens), "avg", avg);
    console.log("  всего символов:", textLens.reduce((a, b) => a + b, 0));
  }
}

if (idxQuotes >= 0) {
  const end = idxQa >= 0 ? idxQa : az.length;
  const block = az.slice(idxQuotes, end);
  console.log("\n=== ЦИТАТЫ (QUOTES):", countIds(block));
  const authors = [...block.matchAll(/author: "([^"]+)"/g)].map((m) => m[1]);
  const byAuthor = {};
  authors.forEach((a) => (byAuthor[a] = (byAuthor[a] || 0) + 1));
  Object.entries(byAuthor).forEach(([a, n]) => console.log("  ", a, "—", n));
  const quoteLens = [...block.matchAll(/text:\s*"((?:[^"\\]|\\.)*)"/g)].map((m) => m[1].length);
  if (quoteLens.length) {
    const avg = Math.round(quoteLens.reduce((a, b) => a + b, 0) / quoteLens.length);
    console.log("  длина цитаты: min", Math.min(...quoteLens), "max", Math.max(...quoteLens), "avg", avg);
  }
}

if (idxQa >= 0) {
  const block = az.slice(idxQa);
  console.log("\n=== ВОПРОСЫ-ОТВЕТЫ (QA в azbyka.ts):", countIds(block));
}

/* --- faq.ts --- */
console.log("\n=== FAQ (faq.ts):", countIds(faq));
const faqLens = [...faq.matchAll(/a: "((?:[^"\\]|\\.)*)"/g)].map((m) => m[1].length);
if (faqLens.length) {
  const avg = Math.round(faqLens.reduce((a, b) => a + b, 0) / faqLens.length);
  console.log("  длина ответа: min", Math.min(...faqLens), "max", Math.max(...faqLens), "avg", avg);
}

/* --- word.ts: что там хранится --- */
console.log("\n=== word.ts: " + word.length + " байт");
const wordIds = countIds(word);
console.log("  записей с id:", wordIds);
const wordTitles = [...word.matchAll(/title: "([^"]+)"/g)].map((m) => m[1]);
console.log("  заголовки:", wordTitles.slice(0, 30).join(" | "));

/* --- общий вес --- */
console.log("\n=== Размер файлов контента:");
for (const f of ["azbyka.ts", "faq.ts", "word.ts", "calendar.ts", "prayers.ts"]) {
  const st = fs.statSync("src/lib/content/" + f);
  console.log("  ", f, (st.size / 1024).toFixed(1) + " КБ");
}
const bibleFiles = fs.readdirSync("src/lib/content/bible");
console.log("   bible/:", bibleFiles.length, "файлов,", (bibleFiles.reduce((s, f) => s + fs.statSync("src/lib/content/bible/" + f).size, 0) / 1024).toFixed(1) + " КБ");
