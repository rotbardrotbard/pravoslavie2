#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Добор описаний: для святых без «Краткое житие» берём первый абзац «Полного жития»
или вводный абзац страницы. Обновляет menology_raw.json (список дней не трогает)."""
import json, os, re, html as htmlmod
from concurrent.futures import ThreadPoolExecutor, as_completed
from urllib.request import Request, urlopen

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36"
SAINTS_DIR = "/tmp/menology_saints"
RAW = "/home/z/my-project/scripts/menology_raw.json"

TAG_RE = re.compile(r"<[^>]+>")
WS_RE = re.compile(r"\s+")


def clean(s):
    s = htmlmod.unescape(s)
    s = TAG_RE.sub("", s)
    return WS_RE.sub(" ", s).strip()


def paragraphs_after(html, heading_re, stop_re=r"<h3|<div class=\"brif|</div>"):
    m = re.search(heading_re + r"(.*?)(?:" + stop_re + r")", html, re.S)
    if not m:
        return []
    return re.findall(r"<p>(.*?)</p>", m.group(1), re.S)


def deep_desc(html: str) -> str:
    # 1. Полное житие — первый абзац
    ps = paragraphs_after(html, r"Полное житие.*?</h3>")
    if ps:
        return clean(ps[0])
    # 2. Житие (без слова «краткое»)
    ps = re.findall(r"<p>(.*?)</p>", html, re.S)
    # выбираем самый большой информативный абзац из середины (после меню, до Тропарей)
    best = ""
    for p in ps:
        t = clean(p)
        if len(t) > len(best) and 200 < len(t) < 4000 and "азбука" not in t.lower():
            best = t
    return best


def fetch(slug):
    path = os.path.join(SAINTS_DIR, slug + ".html")
    if os.path.exists(path) and os.path.getsize(path) > 5000:
        return open(path, encoding="utf-8", errors="replace").read()
    for i in range(3):
        try:
            req = Request("https://azbyka.ru/days/" + slug, headers={"User-Agent": UA})
            with urlopen(req, timeout=25) as r:
                data = r.read().decode("utf-8", "replace")
            open(path, "w", encoding="utf-8").write(data)
            import time
            time.sleep(0.05)
            return data
        except Exception:
            import time
            time.sleep(1.0 * (i + 1))
    return ""


def main():
    d = json.load(open(RAW))
    saints = d["saints"]
    need = [k for k, v in saints.items()
            if isinstance(v, dict) and not v.get("short") and not k.startswith("ikona")]
    print("need:", len(need))

    def work(slug):
        html = fetch(slug)
        return slug, deep_desc(html)

    got = 0
    with ThreadPoolExecutor(max_workers=8) as ex:
        futs = [ex.submit(work, s) for s in need]
        for f in as_completed(futs):
            slug, desc = f.result()
            if desc:
                saints[slug]["short"] = desc
                got += 1
    print("filled:", got)

    # иконы: пытаемся взять любой содержательный абзац
    icons = [k for k, v in saints.items()
             if isinstance(v, dict) and not v.get("short") and k.startswith("ikona")]
    print("icons need:", len(icons))
    goti = 0
    with ThreadPoolExecutor(max_workers=8) as ex:
        futs = [ex.submit(work, s) for s in icons]
        for f in as_completed(futs):
            slug, desc = f.result()
            if desc:
                saints[slug]["short"] = desc
                goti += 1
    print("icons filled:", goti)

    # список-значение починить
    for k, v in saints.items():
        if isinstance(v, list):
            saints[k] = {"title": "", "short": ""}

    json.dump(d, open(RAW, "w", encoding="utf-8"), ensure_ascii=False)
    print("saved")


if __name__ == "__main__":
    main()
