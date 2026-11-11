"""Диагностика ОК: 1) страница приложения на ok.ru (десктоп/мобильная),
2) прямой запуск с типовыми параметрами ОК."""
import asyncio
from playwright.async_api import async_playwright

APP = "https://pravoslavie.vercel.app/"
OK_PARAMS = ("?vk_app_id=512005604973&api_url=https%3A%2F%2Fapi.ok.ru%2Ffb.do"
             "&vk_client=ok&language=ru&logged_user_id=12345&auth_sig=abc&session_key=k")

async def log_requests(page, tag, errs):
    def on_req(r):
        if "vercel" in r.url or "ok.ru" in r.url:
            pass
    page.on("pageerror", lambda e: errs.append(f"[{tag}] pageerror: {str(e)[:300]}"))
    page.on("requestfailed", lambda r: errs.append(f"[{tag}] FAILED: {r.url[:120]} {r.failure}") if ("vercel" in r.url) else None)
    page.on("response", lambda r: errs.append(f"[{tag}] HTTP {r.status}: {r.url[:120]}") if ("vercel" in r.url and r.status >= 400) else None)

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)

        # 1) Десктоп ОК — iframe приложения
        ctx = await browser.new_context(viewport={"width": 1280, "height": 900})
        page = await ctx.new_page()
        errs = []
        await log_requests(page, "ok-desktop", errs)
        try:
            await page.goto("https://ok.ru/app/512005604973", wait_until="domcontentloaded", timeout=40000)
            await page.wait_for_timeout(6000)
            title = await page.title()
            frames = page.frames
            vercel_frames = [f for f in frames if "vercel" in (f.url or "")]
            print("=== ok.ru/app (десктоп) ===")
            print("title:", title[:80])
            print("фреймов:", len(frames), "| с vercel:", len(vercel_frames))
            for f in vercel_frames:
                try:
                    t = await f.locator("body").inner_text(timeout=3000)
                    print("iframe content:", t[:150].replace("\n", " | ") if t.strip() else "(пусто)")
                except Exception as e:
                    print("iframe read err:", str(e)[:120])
            if not vercel_frames:
                body = (await page.inner_text("body"))[:200].replace("\n", " | ")
                print("страница:", body)
        except Exception as e:
            print("ok.ru/app ошибка:", str(e)[:200])
        for e in errs[:10]: print(e)
        await ctx.close()

        # 2) Мобильная веб-версия ОК
        ctx = await browser.new_context(viewport={"width": 412, "height": 915}, user_agent="Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119 Mobile Safari/537.36")
        page = await ctx.new_page()
        errs = []
        await log_requests(page, "ok-mobile", errs)
        try:
            await page.goto("https://m.ok.ru/app/512005604973", wait_until="domcontentloaded", timeout=40000)
            await page.wait_for_timeout(6000)
            frames = page.frames
            vercel_frames = [f for f in frames if "vercel" in (f.url or "")]
            print("\n=== m.ok.ru/app (мобильный веб) ===")
            print("фреймов:", len(frames), "| с vercel:", len(vercel_frames))
            for f in vercel_frames:
                try:
                    t = await f.locator("body").inner_text(timeout=3000)
                    print("iframe content:", t[:150].replace("\n", " | ") if t.strip() else "(пусто)")
                except Exception as e:
                    print("iframe read err:", str(e)[:120])
            if not vercel_frames:
                body = (await page.inner_text("body"))[:200].replace("\n", " | ")
                print("страница:", body)
        except Exception as e:
            print("m.ok.ru ошибка:", str(e)[:200])
        for e in errs[:10]: print(e)
        await ctx.close()

        # 3) Прямой запуск с параметрами ОК
        ctx = await browser.new_context(viewport={"width": 412, "height": 915}, user_agent="Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119 Mobile Safari/537.36")
        page = await ctx.new_page()
        errs = []
        await log_requests(page, "ok-params", errs)
        await page.goto(APP + OK_PARAMS, wait_until="networkidle", timeout=45000)
        await page.wait_for_timeout(3000)
        t = (await page.inner_text("body"))[:200].replace("\n", " | ")
        print("\n=== прямой запуск с ОК-параметрами ===")
        print(t if t.strip() else "(ПУСТО)")
        for e in errs[:10]: print(e)
        await ctx.close()

        await browser.close()

asyncio.run(run())
