"""Прогон: полный путь онбординга -> перезагрузка (сценарий 'после рефреша')"""
import asyncio
from playwright.async_api import async_playwright

URL = "https://pravoslavie.vercel.app/"

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        ctx = await browser.new_context(viewport={"width": 480, "height": 1000}, device_scale_factor=2)
        page = await ctx.new_page()
        errs = []
        page.on("pageerror", lambda e: errs.append(str(e)[:800]))

        await page.goto(URL, wait_until="networkidle", timeout=45000)

        # Шаг 1: нажать "Начать"
        try:
            await page.get_by_text("Начать", exact=True).click(timeout=5000)
            await page.wait_for_timeout(1200)
            print("Клик 'Начать': ок")
        except Exception as e:
            print("Клик 'Начать':", str(e)[:200])

        # Пройти шаги онбординга (до 5 шагов: далее/пропустить/готово)
        for step in range(6):
            txt = (await page.inner_text("body"))[:200].replace("\n", " | ")
            print(f"Шаг {step}: {txt[:160]}")
            clicked = False
            for label in ["Далее", "Продолжить", "Готово", "Начать", "Пропустить", "Понятно"]:
                try:
                    await page.get_by_text(label, exact=True).first.click(timeout=1500)
                    clicked = True
                    await page.wait_for_timeout(1000)
                    break
                except Exception:
                    continue
            if not clicked:
                print("Кнопок не найдено — онбординг завершён или требует ввода")
                break

        # Шаг 2: перезагрузка (главный сценарий жалобы)
        print("\n=== RELOAD ===")
        await page.reload(wait_until="networkidle", timeout=45000)
        await page.wait_for_timeout(3000)
        txt = (await page.inner_text("body"))[:400].replace("\n", " | ")
        print("После reload:", txt if txt.strip() else "(ПУСТО — белый экран)")
        print("Ошибки:", [e[:300] for e in errs] if errs else "нет")
        ls = await page.evaluate("JSON.stringify(Object.fromEntries(Object.entries(localStorage)))")
        print("localStorage:", ls[:500])
        await page.screenshot(path="/tmp/diag-onboard-reload.png")
        await browser.close()

asyncio.run(run())
