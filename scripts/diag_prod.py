"""Диагностика белого экрана на https://pravoslavie.vercel.app"""
import asyncio, json, sys
from playwright.async_api import async_playwright

URL = "https://pravoslavie.vercel.app/"

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        ctx = await browser.new_context(
            viewport={"width": 480, "height": 1000},
            device_scale_factor=2,
        )
        page = await ctx.new_page()

        console_msgs, page_errors, failed_reqs = [], [], []

        page.on("console", lambda m: console_msgs.append((m.type, m.text[:800])))
        page.on("pageerror", lambda e: page_errors.append(str(e)[:1200]))
        page.on("requestfailed", lambda r: failed_reqs.append((r.url[:160], r.failure)))
        page.on("response", lambda r: failed_reqs.append((r.url[:160], f"HTTP {r.status}")) if r.status >= 400 else None)

        await page.goto(URL, wait_until="networkidle", timeout=45000)
        await page.wait_for_timeout(3000)

        # виден ли контент
        body_text = (await page.inner_text("body"))[:400].replace("\n", " | ")
        root_children = await page.evaluate("document.querySelector('.pr-root') ? document.querySelector('.pr-root').children.length : -1")

        await page.screenshot(path="/tmp/diag-prod.png")

        print("=== PAGE ERRORS ===")
        for e in page_errors:
            print(e, "\n")
        print("=== CONSOLE (error/warning) ===")
        for t, m in console_msgs:
            if t in ("error", "warning"):
                print(f"[{t}] {m}\n")
        print("=== FAILED REQUESTS ===")
        for u, f in failed_reqs:
            print(u, "->", f)
        print("=== ВИДИМЫЙ ТЕКСТ ===")
        print(body_text if body_text.strip() else "(пусто — белый экран)")
        print("=== .pr-root children:", root_children)

        # второй заход: с предзаполненным textScale=130 и onboarded
        await ctx.close()
        ctx2 = await browser.new_context(
            viewport={"width": 480, "height": 1000},
            device_scale_factor=2,
        )
        await ctx2.add_init_script("""
            window.localStorage.setItem('pr.onboarded', 'true');
            window.localStorage.setItem('pr.textScale', '130');
        """)
        page2 = await ctx2.new_page()
        errs2 = []
        page2.on("pageerror", lambda e: errs2.append(str(e)[:1200]))
        await page2.goto(URL, wait_until="networkidle", timeout=45000)
        await page2.wait_for_timeout(2500)
        t2 = (await page2.inner_text("body"))[:300].replace("\n", " | ")
        print("\n=== С textScale=130: PAGE ERRORS ===")
        for e in errs2:
            print(e, "\n")
        print("Видимый текст:", t2 if t2.strip() else "(пусто)")
        await page2.screenshot(path="/tmp/diag-prod-130.png")

        await browser.close()

asyncio.run(run())
