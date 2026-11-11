# Smoke-тест расширенной библиотеки: жития (44), цитаты (68), ответы (~103)
import asyncio, re, sys, json
from playwright.async_api import async_playwright

BASE = "http://localhost:3000"

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        ctx = await browser.new_context(viewport={"width": 420, "height": 780})
        page = await ctx.new_page()
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)

        await page.goto(BASE, wait_until="networkidle", timeout=45000)
        # пропускаем онбординг
        await page.evaluate("localStorage.setItem('pr.onboarded','true')")

        # открыть Библиотеку
        await page.evaluate("localStorage.clear()")
        await page.evaluate("localStorage.setItem('pr.onboarded','true')")
        await page.reload(wait_until="networkidle")
        await page.get_by_text("Библиотека", exact=False).first.click(timeout=10000)
        await page.wait_for_timeout(700)

        out = {}

        # ── Жития ──
        await page.get_by_text("Жития", exact=True).first.click()
        await page.wait_for_timeout(500)
        life_buttons = await page.locator("button").filter(has_text="память").count()
        out["lives_on_page"] = life_buttons
        # открыть новое житие (Екатерина — поиск)
        await page.fill("input[aria-label='Поиск по житиям']", "Екатерина")
        await page.wait_for_timeout(400)
        await page.locator("button").filter(has_text="Екатерина").first.click()
        await page.wait_for_timeout(500)
        body = await page.inner_text("body")
        out["ekaterina_reader_ok"] = ("Александрия" in body and "Синай" in body)
        paras = await page.locator("p").count()
        out["ekaterina_paras"] = paras
        await page.evaluate("document.querySelectorAll(\"button[aria-label='Назад']\")[0].click()")
        await page.wait_for_timeout(300)

        # перезагрузка и повторный вход в Жития — поиск Предтечи
        await page.reload(wait_until="networkidle")
        await page.wait_for_timeout(500)
        await page.get_by_text("Библиотека", exact=False).first.click(timeout=10000)
        await page.wait_for_timeout(500)
        await page.get_by_text("Жития", exact=True).first.click()
        await page.wait_for_timeout(400)
        await page.fill("input[aria-label='Поиск по житиям']", "Предтеча")
        await page.wait_for_timeout(400)
        out["predtecha_found"] = await page.locator("button").filter(has_text="Креститель").count() > 0
        await page.fill("input[aria-label='Поиск по житиям']", "")
        await page.wait_for_timeout(300)

        # ── Святые отцы ──
        await page.get_by_text("Отцы", exact=False).first.click()
        await page.wait_for_timeout(500)
        body = await page.inner_text("body")
        out["paisiy_quote"] = ("Гордость — это нехватка любви" in body)
        out["nektary_quote"] = ("Сила молитвы не в многословии" in body)
        out["tihon_quote"] = ("праздности" in body)
        out["luka_quote"] = ("Я полюбил страдание" in body)

        # ── Вопросы и ответы ──
        await page.get_by_text("Ответы", exact=False).first.click()
        await page.wait_for_timeout(500)
        body = await page.inner_text("body")
        out["qa_bible"] = ("С чего начать чтение Библии" in body)
        # рубрика «Жизнь»
        await page.get_by_text("Жизнь", exact=True).first.click()
        await page.wait_for_timeout(400)
        body = await page.inner_text("body")
        out["qa_life_topic"] = ("деньгам" in body)
        # рубрика «Суеверия»
        await page.get_by_text("Суеверия", exact=True).first.click()
        await page.wait_for_timeout(400)
        body = await page.inner_text("body")
        out["qa_superstition"] = ("пятница 13" in body.lower() or "Пятница 13" in body)

        # ── Календарь: 7 декабря Екатерина ──
        await page.evaluate("localStorage.setItem('pr.screen','calendar')")
        await page.reload(wait_until="networkidle")
        await page.wait_for_timeout(600)
        body = await page.inner_text("body")

        print(json.dumps(out, ensure_ascii=False, indent=1))
        real_errors = [e for e in errors if "favicon" not in e and "ok.ru" not in e]
        print("JS-ошибки:", len(real_errors))
        for e in real_errors[:5]:
            print("  ", e[:160])
        await browser.close()

asyncio.run(main())
