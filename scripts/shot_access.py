# -*- coding: utf-8 -*-
"""Скриншоты режима «Очень крупный шрифт» (130%): Дом + Ещё + Слово."""
import asyncio
from pathlib import Path

from playwright.async_api import async_playwright

OUT = Path("/home/z/my-project/download/screens-access")
OUT.mkdir(parents=True, exist_ok=True)
BASE = "http://localhost:3000"

INIT = """
localStorage.setItem('pr.onboarded', 'true');
localStorage.setItem('pr.textScale', '%SCALE%');
localStorage.setItem('pr.userName', JSON.stringify('Иван'));
localStorage.removeItem('nextjs-portal');
"""


async def main():
    async with async_playwright() as pw:
        browser = await pw.chromium.launch()
        for scale in ("130", "100"):
            page = await browser.new_page(
                viewport={"width": 480, "height": 1000},
                device_scale_factor=2,
                locale="ru-RU",
            )
            await page.add_init_script(INIT.replace("%SCALE%", scale))
            await page.goto(BASE, wait_until="networkidle")
            await page.wait_for_timeout(800)
            tag = "xlarge" if scale == "130" else "normal"

            # Дом
            await page.screenshot(path=str(OUT / f"home-{tag}.png"))

            # Ещё
            await page.locator('[aria-label="Основная навигация"]').get_by_text("Ещё", exact=True).click()
            await page.wait_for_timeout(600)
            await page.screenshot(path=str(OUT / f"more-{tag}.png"))
            await page.close()
        await browser.close()
    print("готово:", sorted(p.name for p in OUT.iterdir()))


asyncio.run(main())
