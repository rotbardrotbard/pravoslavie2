#!/usr/bin/env python3
"""Визуальная проверка превью библиотеки: скриншот вкладки «Жития»
и читалки жития (dev-сервер :3000, имитация ОК через pr.onboarded)."""
import subprocess
import sys
import time

from playwright.sync_api import sync_playwright

BASE = "http://localhost:3000"
OUT = "/tmp/render"


def main():
    server = subprocess.Popen(
        ["npx", "next", "dev", "-p", "3000"],
        cwd="/home/z/my-project",
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    try:
        # ждём готовности сервера
        import urllib.request

        ready = False
        for _ in range(60):
            try:
                urllib.request.urlopen(BASE, timeout=2)
                ready = True
                break
            except Exception:
                time.sleep(1)
        if not ready:
            print("Сервер не поднялся")
            return 1

        with sync_playwright() as p:
            b = p.chromium.launch()
            ctx = b.new_context(viewport={"width": 390, "height": 780}, device_scale_factor=2)
            ctx.add_init_script('localStorage.setItem("pr.onboarded","true");')
            page = ctx.new_page()
            page.goto(BASE, wait_until="networkidle", timeout=60000)

            # открываем раздел «Библиотека» → вкладку «Жития»
            page.get_by_text("Библиотека", exact=True).first.click()
            page.wait_for_timeout(600)
            page.get_by_text("Жития", exact=True).first.click()
            page.wait_for_timeout(1200)
            page.screenshot(path=f"{OUT}/library-list.png")
            print("скриншот списка: /tmp/render/library-list.png")

            # открываем первое житие (Николай Чудотворец)
            page.get_by_text("Николай Чудотворец", exact=False).first.click()
            page.wait_for_timeout(1500)
            page.screenshot(path=f"{OUT}/library-reader.png")
            print("скриншот читалки: /tmp/render/library-reader.png")
            b.close()
        return 0
    finally:
        server.terminate()


if __name__ == "__main__":
    sys.exit(main())
