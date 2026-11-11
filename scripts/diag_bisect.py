"""Бисекция: какой ключ localStorage валит приложение"""
import asyncio
from playwright.async_api import async_playwright

URL = "https://pravoslavie.vercel.app/"

GROUPS = {
    "prayerLog(строка)":   {"pr.onboarded": "true", "pr.prayerLog": '"2026-11-01"'},
    "likedVerses(объект)": {"pr.onboarded": "true", "pr.likedVerses": '{"40:5": true}'},
    "readPos(массив)":     {"pr.onboarded": "true", "pr.readPos": '[]'},
    "profile(строка)":     {"pr.onboarded": "true", "pr.profile": '"Иван"'},
    "level/interests":     {"pr.onboarded": "true", "pr.level": '"beginner"', "pr.interests": '["saints"]', "pr.interest": '"prayer"'},
    "bookmarks":           {"pr.onboarded": "true", "pr.bookmarks": '[{"key":"bible:40:5:3","kind":"bible","title":"Мк","snippet":"...","createdAt":1}]'},
    "readPlan(объект)":    {"pr.onboarded": "true", "pr.readPlan": '{"2026-11-05": true}'},
    "visitedTemples":      {"pr.onboarded": "true", "pr.visitedTemples": '[1,2,3]'},
    "fontBig/textScale":   {"pr.onboarded": "true", "pr.fontBig": "true", "pr.textScale": '"130"'},
    "theme/evening":       {"pr.onboarded": "true", "pr.theme": '"dark"', "pr.evening": "true"},
}

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        for name, seed in GROUPS.items():
            ctx = await browser.new_context(viewport={"width": 412, "height": 915})
            calls = ";".join(f"window.localStorage.setItem('{k}','{v}')" for k, v in seed.items())
            await ctx.add_init_script(calls)
            page = await ctx.new_page()
            errs = []
            page.on("pageerror", lambda e: errs.append(str(e)[:200]))
            try:
                await page.goto(URL, wait_until="domcontentloaded", timeout=30000)
                await page.wait_for_timeout(2500)
                txt = (await page.inner_text("body"))[:120].replace("\n", " ")
                crashed = "Application error" in txt or bool(errs)
                status = "ПАДАЕТ" if crashed else "ок"
                print(f"{name:24s} -> {status}   {errs[0] if errs else ''}")
            except Exception as e:
                print(f"{name:24s} -> ТАЙМАУТ/ОШИБКА: {str(e)[:100]}")
            await ctx.close()
        await browser.close()

asyncio.run(run())
