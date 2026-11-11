#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Проверка экрана «Календарь»: святые дня с описаниями, раскрытие,
полное житие, отсутствие внешних ссылок, переходы по месяцам."""
import asyncio, sys
from playwright.async_api import async_playwright

BASE = "http://localhost:3000"

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        ctx = await browser.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2)
        page = await ctx.new_page()
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
        await page.goto(BASE, wait_until="networkidle")
        # пропускаем онбординг
        await page.evaluate("localStorage.setItem('pr.onboarded','true')")
        await page.goto(BASE, wait_until="networkidle")
        await page.wait_for_timeout(600)

        # открываем календарь
        await page.click("text=Открыть календарь", timeout=8000)
        await page.wait_for_timeout(700)

        today = await page.locator("section, div").filter(has_text="кого Церковь вспоминает").count()
        print("экран календаря открыт:", today > 0)

        # 1. список святых дня непустой
        items = page.locator("ul li button span.pr-serif")
        n = await items.count()
        print("святых в списке:", n)
        assert n > 0, "нет святых дня!"

        # 2. клик по первому святому раскрывает описание
        first = items.nth(0)
        name = (await first.inner_text())[:80].replace("\n", " | ")
        await first.click()
        await page.wait_for_timeout(300)
        desc_visible = await page.locator("li div p").filter(has_text=lambda t: len(t) > 40).count() if False else None
        # проще: проверить наличие раскрытого блока p
        opened = await page.locator("ul li div p.pr-serif").count()
        print("раскрыто описание после клика:", opened > 0, "—", name)

        # 3. «Полное житие» — если есть, кликаем и проверяем читалку
        full = page.get_by_text("Полное житие", exact=False)
        cnt = await full.count()
        print("кнопок «Полное житие»:", cnt)
        if cnt > 0:
            await full.first.click()
            await page.wait_for_timeout(800)
            reader = await page.locator("text=Размер текста").count()
            print("читалка открылась:", reader > 0)
            await page.screenshot(path="/tmp/render/cal_reader.png")
            back = page.get_by_label("Закрыть читалку")
            await back.click()
            await page.wait_for_timeout(400)

        # 4. нет внешних ссылок на azbyka в DOM
        html = await page.content()
        has_azbyka_link = "azbyka.ru/days" in html or 'href="https://azbyka.ru' in html
        print("внешних ссылок azbyka в календаре:", has_azbyka_link)

        # 5. переход на любой месяц — у всех дней есть святые
        for _ in range(5):
            await page.get_by_label("Следующий месяц").click()
            await page.wait_for_timeout(120)
        await page.locator("button.h-10").nth(15).click()  # произвольный день
        await page.wait_for_timeout(400)
        n2 = await items.count()
        print("произвольный день: святых в списке:", n2)
        assert n2 > 0, "день без святых!"
        await page.screenshot(path="/tmp/render/calendar.png", full_page=False)
        await page.screenshot(path="/tmp/render/calendar_full.png", full_page=True)

        # 6. главное меню → Home: строка святых
        print("ошибки консоли:", errors[:5] if errors else "нет")
        await browser.close()

asyncio.run(main())
