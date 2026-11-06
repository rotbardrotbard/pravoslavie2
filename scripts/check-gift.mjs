/* Скриншоты проверки замены «Открытка близким» → «Отправить подарок» */
import { chromium } from "playwright";
import fs from "fs";

const BASE = "http://localhost:3000";
const OUT = "/home/z/my-project/download/screens-step3";

const shot = async (page, name) => {
  const el = page.locator(".app-column");
  await el.screenshot({ path: `${OUT}/${name}.png` });
  console.log("✓", name);
};

const run = async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 420, height: 860 },
    deviceScaleFactor: 2,
    locale: "ru-RU",
  });
  const page = await ctx.newPage();

  // Пропускаем онбординг: предзаполняем localStorage
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.evaluate(() => {
    localStorage.setItem("pr.onboarded", "true");
    localStorage.setItem("pr.level", "occasional");
    localStorage.setItem("pr.interest", "prayer");
    localStorage.setItem("pr.geo", "false");
    localStorage.setItem("pr.userName", JSON.stringify("Мария"));
  });
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(1200);

  /* 1. Дом: быстрые действия с «Отправить подарок» */
  await shot(page, "02-home");

  /* 2. Модалка «Отправить подарок» (клик по быстрому действию) */
  await page.getByText("Отправить подарок", { exact: true }).first().click();
  await page.waitForTimeout(600);
  await shot(page, "12-gift-modal");

  /* 3. Клик по коллекции — тост о переходе в ОК */
  await page.getByText("Ангел-хранитель").first().click();
  await page.waitForTimeout(500);
  await shot(page, "12b-gift-toast");
  await page.getByLabel("Закрыть").last().click();
  await page.waitForTimeout(300);

  /* 4. Ещё: строка «Отправить подарок» */
  await page.locator('nav[aria-label="Основная навигация"]').getByRole("button", { name: "Ещё" }).click();
  await page.waitForTimeout(700);
  await shot(page, "11-more");

  /* 5. Модалка из «Ещё» */
  await page.getByText("Отправить подарок", { exact: true }).first().click();
  await page.waitForTimeout(600);
  await shot(page, "11b-more-gift");
  await page.getByLabel("Закрыть").last().click();
  await page.waitForTimeout(300);

  /* 6. Сообщество: строка «Отправить подарок» — через «Ещё» → «Сообщество» */
  await page.getByText("Сообщество", { exact: true }).first().click();
  await page.waitForTimeout(800);
  await shot(page, "10-community");

  await browser.close();
  console.log("DONE");
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
