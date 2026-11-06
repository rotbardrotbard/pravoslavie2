#!/usr/bin/env python3
"""Выгрузка полного годового месяцеслова (святцы + краткие описания) с azbyka.ru.
Этап 1: 366 страниц дня → список святых (JSON-LD about[] + годы из якорей).
Этап 2: страницы святых → текст жития → краткое описание.
Кэш: /tmp/men_days/, /tmp/men_sv/. Результат: scripts/menology_raw.json
Запуск: python3 scripts/fetch_menology2.py [--sv]   (дни грузятся всегда, --sv = только святые)
"""
import json
import os
import re
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

import requests

ROOT = "/home/z/my-project"
DAY_CACHE = "/tmp/men_days"
SV_CACHE = "/tmp/men_sv"
RAW = os.path.join(ROOT, "scripts", "menology_raw.json")
UA = {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36"}
os.makedirs(DAY_CACHE, exist_ok=True)
os.makedirs(SV_CACHE, exist_ok=True)

MONTHS = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"]
GREAT = ["Рождество Христово", "Крещение Господне", "Богоявление", "Сретение Господне", "Благовещение",
         "Успение Пресвятой Богородицы", "Рождество Пресвятой Богородицы", "Воздвижение Креста",
         "Введение во храм Пресвятой Богородицы", "Преображение Господне", "Вознесение Господне",
         "День Святой Троицы", "Покров Пресвятой Богородицы", "Вход Господень в Иерусалим", "Пасха",
         "Обрезание Господне", "Вход Пресвятой Богородицы"]


def get(url, cache_path, tries=3):
    if os.path.exists(cache_path) and os.path.getsize(cache_path) > 3000:
        return open(cache_path, encoding="utf-8").read()
    for t in range(tries):
        try:
            r = requests.get(url, headers=UA, timeout=20)
            if r.status_code == 200 and len(r.text) > 3000:
                open(cache_path, "w", encoding="utf-8").write(r.text)
                time.sleep(0.12)
                return r.text
        except Exception:
            pass
        time.sleep(1 + t)
    return None


def clean(t):
    t = re.sub(r"<[^>]+>", " ", t)
    t = t.replace("&laquo;", "«").replace("&raquo;", "»").replace("&nbsp;", " ").replace("&mdash;", "—").replace("&ndash;", "–").replace("&amp;", "&").replace("&laquo;", "«")
    t = re.sub(r"[\u0301]", "", t)  # ударения
    return " ".join(t.split())


def parse_day(key, html):
    """key='MM-DD' → [{name, year, slug}]. Строгий источник — JSON-LD about[];
    якоря страницы используются ТОЛЬКО для извлечения годов по слагу."""
    saints = []
    m = re.search(r'<script type="application/ld\+json"[^>]*>(.*?)</script>', html, re.S)
    if not m:
        return []
    try:
        d = json.loads(m.group(1))
        wp = next((n for n in d.get("@graph", []) if n.get("@type") == "WebPage"), {})
        for it in wp.get("about", []) or []:
            u = it.get("url", "")
            sm = re.search(r"/days/([a-z0-9-]+)$", u or "")
            if not sm:
                continue
            slug = sm.group(1)
            if re.match(r"\d{4}-\d{2}-\d{2}", slug):
                continue
            name = clean(it.get("name", ""))
            if name and len(name) > 5:
                saints.append({"name": name, "year": None, "slug": slug})
    except Exception:
        return []
    # годы: только для слагов из about[]
    for hm in re.finditer(r'<a[^>]+href="[^"]*?/days/([a-z0-9-]+)"[^>]*>(.*?)</a>', html, re.S):
        slug = hm.group(1)
        ex = next((s for s in saints if s["slug"] == slug), None)
        if not ex or ex["year"]:
            continue
        txt = clean(hm.group(2))
        ym = re.search(r"\(([^)]{2,24})\)\s*$", txt)
        if ym:
            ex["year"] = ym.group(1).strip()
            ex["name"] = re.sub(r"\s*\([^)]{2,24}\)\s*$", "", txt).strip() or ex["name"]
    return saints[:14]


def kind_of(name, slug):
    if slug.startswith("ik-") or "икон" in name.lower():
        return "icon"
    if any(g.lower() in name.lower() for g in GREAT):
        return "great"
    if slug.startswith("prazdnik-") or "собор" in name.lower() or "попразднство" in name.lower():
        return "feast"
    return "saint"


def parse_saint(html):
    """Страница святого → (title, desc, full)"""
    t = re.search(r"<h1[^>]*>(.*?)</h1>", html, re.S)
    title = clean(t.group(1)) if t else ""
    # абзацы до «Тропари, кондаки»
    cut = html.find("Тропари, кондаки")
    body = html[:cut] if cut > 0 else html
    paras = []
    for pm in re.finditer(r"<p[^>]*>(.*?)</p>", body, re.S):
        p = clean(pm.group(1))
        if len(p) > 90:
            paras.append(p)
    if not paras:
        md = re.search(r'<meta name="description" content="([^"]+)"', html)
        if md:
            paras = [clean(md.group(1))]
    desc = ""
    if paras:
        desc = " ".join(paras[:2])
        if len(desc) > 480:  # обрез по концу предложения
            cut_at = desc.find(". ", 320)
            desc = desc[: cut_at + 1] if cut_at > 0 else desc[:480]
    full = " ".join(paras[:6])[:8000]
    return title, desc, full


def day_keys():
    keys = []
    for m in range(1, 13):
        nd = [31, 29 if m == 2 else 0, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1] or (29 if m == 2 else 0)
        if m == 2:
            nd = 28  # 29 февраля отдельно
        for d in range(1, nd + 1):
            keys.append(f"{m:02d}-{d:02d}")
    keys.append("02-29")
    return keys


def fetch_days():
    out, fails = {}, []
    urls = {k: f"https://azbyka.ru/days/{'2024' if k == '02-29' else '2026'}-{k}" for k in day_keys()}

    def work(k):
        return k, get(urls[k], os.path.join(DAY_CACHE, k + ".html"))

    with ThreadPoolExecutor(max_workers=6) as ex:
        futs = {ex.submit(work, k): k for k in urls}
        for i, f in enumerate(as_completed(futs)):
            k, html = f.result()
            if not html:
                fails.append(k)
                continue
            out[k] = parse_day(k, html)
            if i % 60 == 0:
                print(f"days {i}/367", flush=True)
    print(f"days done: {len(out)}, fails: {len(fails)} {fails[:6]}")
    return out


def fetch_saints(days):
    slug2meta = {}
    for k, lst in days.items():
        for s in lst:
            slug2meta.setdefault(s["slug"], {"name": s["name"], "year": s["year"], "days": []})["days"].append(k)
    print(f"unique saints: {len(slug2meta)}", flush=True)
    out, fails = {}, []

    def work(slug):
        return slug, get(f"https://azbyka.ru/days/{slug}", os.path.join(SV_CACHE, slug + ".html"))

    with ThreadPoolExecutor(max_workers=6) as ex:
        futs = {ex.submit(work, s): s for s in slug2meta}
        for i, f in enumerate(as_completed(futs)):
            slug, html = f.result()
            if not html:
                fails.append(slug)
                continue
            title, desc, full = parse_saint(html)
            out[slug] = {"title": title, "desc": desc, "full": full}
            if i % 80 == 0:
                print(f"saints {i}/{len(slug2meta)}", flush=True)
    print(f"saints done: {len(out)}, fails: {len(fails)} {fails[:8]}")
    # фолбэк описания из имени, если страница пустая
    for slug, meta in slug2meta.items():
        if slug in out and not out[slug]["desc"]:
            out[slug]["desc"] = ""
    return out, slug2meta, fails


if __name__ == "__main__":
    t0 = time.time()
    days = fetch_days()
    sv, slug2meta, fails = fetch_saints(days)
    raw = {
        "fetched": time.strftime("%Y-%m-%d %H:%M"),
        "days": {k: [{**s, "kind": kind_of(s["name"], s["slug"])} for s in lst] for k, lst in days.items()},
        "saints": sv,
        "meta": {s: {"name": m["name"], "year": m["year"], "days": sorted(set(m["days"]))} for s, m in slug2meta.items()},
        "fails": fails,
    }
    json.dump(raw, open(RAW, "w", encoding="utf-8"), ensure_ascii=False)
    n_desc = sum(1 for v in sv.values() if v["desc"])
    print(f"SAINTS WITH DESC: {n_desc}/{len(sv)}")
    print(f"saved {RAW}, elapsed {time.time()-t0:.0f}s")
    open("/tmp/men_fetch.done", "w").write("ok")
