"""Визуальная проверка канонического креста: стартовый экран, шапка, иконка."""
import asyncio
from playwright.async_api import async_playwright
from PIL import Image

BASE = "http://127.0.0.1:3111"

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        # стартовый (приветственный) экран онбординга — свежий localStorage
        ctx = await browser.new_context(viewport={"width": 412, "height": 915}, device_scale_factor=2)
        page = await ctx.new_page()
        await page.goto(BASE + "/", wait_until="networkidle", timeout=30000)
        await page.wait_for_timeout(2500)
        await page.screenshot(path="/tmp/canon-start.png")

        # шапка на домашнем (onboarded)
        ctx2 = await browser.new_context(viewport={"width": 412, "height": 915}, device_scale_factor=2)
        await ctx2.add_init_script("window.localStorage.setItem('pr.onboarded','true');")
        page2 = await ctx2.new_page()
        await page2.goto(BASE + "/", wait_until="networkidle", timeout=30000)
        await page2.wait_for_timeout(2000)
        await page2.screenshot(path="/tmp/canon-header.png", clip={"x": 0, "y": 0, "width": 412, "height": 120})
        await browser.close()

    # лист иконок — верхний ряд слева (вариант А)
    sheet = Image.open("/home/z/my-project/download/icon-variants-preview.png")
    sheet.crop((0, 0, 700, 700)).save("/tmp/canon-icon-a.png")
    print("скриншоты готовы")

asyncio.run(run())
