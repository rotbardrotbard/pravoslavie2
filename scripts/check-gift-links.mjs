/* Проверка: клики по коллекциям и CTA ведут на ok.ru/gifts */
import { chromium } from "playwright";

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 420, height: 860 }, locale: "ru-RU" });
const page = await ctx.newPage();
await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
await page.evaluate(() => {
  localStorage.setItem("pr.onboarded", "true");
  localStorage.setItem("pr.level", "occasional");
  localStorage.setItem("pr.geo", "false");
});
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(1200);

const popups = [];
ctx.on("page", (p) => {
  popups.push(p.url());
  console.log("POPUP →", p.url());
});

await page.getByText("Отправить подарок", { exact: true }).first().click();
await page.waitForTimeout(500);

// 1. Клик по коллекции «Ангел-хранитель»
await page.getByText("Ангел-хранитель").first().click();
await page.waitForTimeout(800);

// 2. Клик по коллекции «Бесплатные» (ведёт в группу «Подарки — это ОК»)
await page.getByText("Бесплатные").first().click();
await page.waitForTimeout(800);

// 3. CTA «Открыть каталог подарков ОК»
await page.getByText("Открыть каталог подарков ОК").first().click();
await page.waitForTimeout(800);

console.log("Всего переходов:", popups.length);
const ok = popups.filter((u) => u.includes("ok.ru/gifts")).length;
const free = popups.filter((u) => u.includes("ok.ru/group/52832661209219")).length;
console.log(`ok.ru/gifts: ${ok}, группа бесплатных: ${free}`);
await browser.close();
if (ok >= 2 && free >= 1) console.log("PASS");
else { console.log("FAIL"); process.exit(1); }
