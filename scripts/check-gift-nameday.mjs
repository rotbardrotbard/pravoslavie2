/* Проверка именинного баннера с кнопкой «Подарок» (2 ноября — Артемий) + тостов */
import { chromium } from "playwright";

const OUT = "/home/z/my-project/download/screens-step3";
const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 420, height: 860 },
  deviceScaleFactor: 2,
  locale: "ru-RU",
});
const page = await ctx.newPage();
/* 4 ноября — именины «Марии» (Казанская икона): виден баннер с кнопкой «Подарок» */
await page.clock.install({ time: new Date("2026-11-04T10:00:00") });
const popups = [];
ctx.on("page", async (p) => {
  try {
    await p.waitForLoadState("domcontentloaded", { timeout: 8000 }).catch(() => {});
    await p.waitForTimeout(800);
    const u = p.url();
    popups.push(u);
    console.log("POPUP →", u);
  } catch {
    /* страница закрылась раньше — не важно */
  }
});

await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
await page.evaluate(() => {
  localStorage.setItem("pr.onboarded", "true");
  localStorage.setItem("pr.level", "occasional");
  localStorage.setItem("pr.interest", "prayer");
  localStorage.setItem("pr.geo", "false");
  localStorage.setItem("pr.userName", JSON.stringify("Мария"));
});
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(1500);

/* 1. Дом с именинным баннером */
const el = page.locator(".app-column");
await el.screenshot({ path: `${OUT}/02-home.png` });
console.log("✓ 02-home");

/* 2. Клик «Подарок» на баннере → модалка → коллекция → тост */
await page.getByRole("button", { name: "Подарок", exact: true }).first().click();
await page.waitForTimeout(600);
await el.screenshot({ path: `${OUT}/12-gift-modal.png` });
console.log("✓ 12-gift-modal");

await page.getByText("Ангел-хранитель").first().click();
await page.waitForTimeout(1500);
await el.screenshot({ path: `${OUT}/12b-gift-toast.png` });
console.log("✓ 12b-gift-toast");

/* 3. Закрыть модалку */
await page.getByLabel("Закрыть").last().click();
await page.waitForTimeout(300);

/* даём слушателю попапа время завершиться */
await page.waitForTimeout(2500);
const okGifts = popups.filter((u) => u.startsWith("https://ok.ru/gifts")).length;
console.log(`Переходов в ok.ru/gifts: ${okGifts}`);
await browser.close();
if (okGifts >= 1) console.log("PASS");
else { console.log("FAIL"); process.exit(1); }
