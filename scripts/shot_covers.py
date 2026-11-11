"""Скриншоты проверки обложек: Отцы, Ответы, Жития, Подарки, TempleSheet."""
import time
from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost:3000/"
OUT = "/tmp"

with sync_playwright() as p:
    browser = p.chromium.launch()
    ctx = browser.new_context(
        viewport={"width": 480, "height": 1000},
        device_scale_factor=2,
        locale="ru-RU",
        timezone_id="Europe/Moscow",
    )
    ctx.add_init_script('localStorage.setItem("pr.onboarded", "true");')
    page = ctx.new_page()
    page.goto(BASE_URL, wait_until="domcontentloaded", timeout=90_000)
    page.get_by_text("Мир вам").first.wait_for(timeout=60_000)
    page.add_style_tag(content=(
        "nextjs-portal{display:none!important}"
    ))
    time.sleep(2)

    # 1. Слово → Отцы (цитаты с обложками)
    page.locator('[aria-label="Основная навигация"]').get_by_text("Библиотека", exact=True).click()
    page.get_by_text("Отцы", exact=True).first.wait_for(timeout=30_000)
    page.get_by_text("Отцы", exact=True).first.click()
    page.get_by_text("Слова святых отцов").first.wait_for(timeout=30_000)
    time.sleep(1.5)
    page.screenshot(path=f"{OUT}/shot_fathers.png")
    print("1/5 отцы")

    # 2. Ответы (баннер с Псалтирью)
    page.get_by_text("Ответы", exact=True).first.click()
    time.sleep(1.5)
    page.screenshot(path=f"{OUT}/shot_answers.png")
    print("2/5 ответы")

    # 3. Жития (новые обложки)
    page.get_by_text("Жития", exact=True).first.click()
    time.sleep(1.5)
    page.screenshot(path=f"{OUT}/shot_lives.png")
    print("3/5 жития")

    # 4. Ещё → подарки (6 обложек коллекций)
    page.locator('[aria-label="Основная навигация"]').get_by_text("Ещё", exact=True).click()
    time.sleep(1.5)
    gift_btn = page.get_by_text("Отправить подарок").first
    gift_btn.click()
    time.sleep(2)
    page.screenshot(path=f"{OUT}/shot_gifts.png")
    print("4/5 подарки")
    # закрыть модалку (X в шапке — последний aria-label="Закрыть")
    page.locator('[aria-label="Закрыть"]').last.click()
    time.sleep(1)

    # 5. Карта → первый храм в списке → TempleSheet
    page.locator('[aria-label="Основная навигация"]').get_by_text("Карта", exact=True).click()
    time.sleep(5)
    # первая карточка списка храмов
    first_temple = page.locator(".orn-card.w-full.text-left").first
    first_temple.click()
    time.sleep(2.5)
    page.screenshot(path=f"{OUT}/shot_temple.png")
    print("5/5 храм")

    browser.close()
print("ГОТОВО")
