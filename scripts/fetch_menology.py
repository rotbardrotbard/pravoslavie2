#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Выгрузка полного месяцеслова с azbyka.ru для приложения «Православные».
Кэширует страницы в /tmp/menology_days/ и /tmp/menology_saints/.
Результат: /home/z/my-project/scripts/menology_raw.json
"""
import json, os, re, sys, time, html as htmlmod
from concurrent.futures import ThreadPoolExecutor, as_completed
from urllib.request import Request, urlopen

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
BASE = "https://azbyka.ru/days/"
DAYS_DIR = "/tmp/menology_days"
SAINTS_DIR = "/tmp/menology_saints"
OUT = "/home/z/my-project/scripts/menology_raw.json"
os.makedirs(DAYS_DIR, exist_ok=True)
os.makedirs(SAINTS_DIR, exist_ok=True)

TAG_RE = re.compile(r"<[^>]+>")
WS_RE = re.compile(r"\s+")


def clean(s: str) -> str:
    s = htmlmod.unescape(s)
    s = TAG_RE.sub("", s)
    return WS_RE.sub(" ", s).strip()


def cached_get(url: str, cache_dir: str, tries: int = 3) -> str:
    path = os.path.join(cache_dir, re.sub(r"[^a-z0-9\-]", "_", url.split("/days/")[-1]) + ".html")
    if os.path.exists(path) and os.path.getsize(path) > 5000:
        return open(path, encoding="utf-8", errors="replace").read()
    last = None
    for i in range(tries):
        try:
            req = Request(url, headers={"User-Agent": UA, "Accept-Language": "ru,en"})
            with urlopen(req, timeout=25) as r:
                data = r.read().decode("utf-8", "replace")
            with open(path, "w", encoding="utf-8") as f:
                f.write(data)
            time.sleep(0.05)
            return data
        except Exception as e:
            last = e
            time.sleep(1.0 * (i + 1))
    raise RuntimeError(f"fail {url}: {last}")


def parse_day(html: str):
    m = re.search(r'<div class="text day__text">(.*?)<div id="chteniya"', html, re.S)
    if not m:
        m = re.search(r'<div class="text day__text">(.*?)</div>\s*</div>', html, re.S)
    if not m:
        return []
    block = m.group(1)
    out = []
    for ul in re.finditer(r'<ul class="paragraph-(\d+)">(.*?)</ul>', block, re.S):
        para = int(ul.group(1))
        for li in re.finditer(r"<li[^>]*class=\"ideograph-(\d+)\"[^>]*>(.*?)</li>", ul.group(2), re.S):
            ideo = int(li.group(1))
            content = li.group(2)
            am = re.search(r"<a\s+href=['\"]([^'\"]+)['\"]>(.*?)</a>", content, re.S)
            if not am:
                continue
            href = am.group(1)
            raw_name = am.group(2)
            slug_m = re.search(r"/days/([a-z0-9\-]+)", href)
            slug = slug_m.group(1) if slug_m else ""
            year_m = re.search(r'<span class=secondary-content>\(([^)]+)\)</span>', raw_name)
            year = year_m.group(1) if year_m else ""
            name = clean(raw_name)
            name = re.sub(r"\s*\(" + re.escape(year) + r"\)\s*", " ", name).strip(" ,")
            strong = "<strong>" in content
            is_ikon = ("ikona" in slug or "icon" in slug or "икон" in name.lower() or "Божией Матери" in name)
            kind = "icon" if is_ikon else ("feast" if (slug.startswith("prazdnik-") or slug.startswith("srp") or slug.startswith("sobor-") and "sv-sobor" not in slug) else "saint")
            if strong and not is_ikon:
                kind = "feast"
            if slug.startswith("sv-sobor") or slug.startswith("sobor"):
                kind = "sobor" if not is_ikon else "icon"
            out.append({"slug": slug, "name": name, "year": year, "kind": kind,
                        "para": para, "ideo": ideo})
    return out


def parse_saint(html: str):
    res = {"title": "", "short": ""}
    t = re.search(r"<h1>(.*?)</h1>", html, re.S)
    if t:
        res["title"] = clean(t.group(1))
    m = re.search(r'Краткое житие.*?</h3>(.*?)(?:<h3|<div class="brif)', html, re.S)
    if m:
        paras = re.findall(r"<p>(.*?)</p>", m.group(1), re.S)
        res["short"] = clean(" ".join(paras)) if paras else clean(m.group(1))
    if not res["short"]:
        m2 = re.search(r"<p>(.*?)</p>\s*<div class=\"brif expandable\">", html, re.S)
        if m2:
            res["short"] = clean(m2.group(1))
    if not res["short"]:
        m3 = re.search(r"Полное житие.*?</h3>\s*<p>(.*?)</p>", html, re.S)
        if m3:
            res["short"] = clean(m3.group(1))
    return res


def day_list():
    days = []
    for month in range(1, 13):
        ndays = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1]
        for day in range(1, ndays + 1):
            y = 2024 if (month == 2 and day == 29) else 2026
            days.append(f"{y}-{month:02d}-{day:02d}")
    return days


def main():
    days = day_list()

    def work_day(d):
        try:
            html = cached_get(BASE + d, DAYS_DIR)
            return d, parse_day(html)
        except Exception as e:
            return d, ("ERR", str(e))

    day_data = {}
    errs = []
    with ThreadPoolExecutor(max_workers=8) as ex:
        futs = {ex.submit(work_day, d): d for d in days}
        done = 0
        for f in as_completed(futs):
            d, res = f.result()
            done += 1
            if done % 90 == 0:
                print(f"days {done}/{len(days)}", flush=True)
            if isinstance(res, tuple) and isinstance(res[1], tuple):
                errs.append(res)
            else:
                day_data[d] = res
    print(f"days parsed: {len(day_data)}/{len(days)}, errors: {len(errs)}")
    for d, e in errs[:8]:
        print("day err:", d, e, file=sys.stderr)

    all_saints = {}
    for d, lst in day_data.items():
        for s in lst:
            if s["slug"] and s["slug"] not in all_saints:
                all_saints[s["slug"]] = s
    print("unique saint pages:", len(all_saints))

    def work_saint(slug):
        try:
            html = cached_get(BASE + slug, SAINTS_DIR)
            return slug, parse_saint(html)
        except Exception as e:
            return slug, ("ERR", str(e))

    saints_info = {}
    errs2 = []
    with ThreadPoolExecutor(max_workers=8) as ex:
        futs = {ex.submit(work_saint, s): s for s in sorted(all_saints)}
        done = 0
        for f in as_completed(futs):
            slug, res = f.result()
            done += 1
            if done % 100 == 0:
                print(f"saints {done}/{len(all_saints)}", flush=True)
            if isinstance(res, tuple) and isinstance(res[1], tuple):
                errs2.append(res)
            else:
                saints_info[slug] = res
    print(f"saints fetched: {len(saints_info)}, errors: {len(errs2)}")

    json.dump({"days": day_data, "saints": saints_info},
              open(OUT, "w", encoding="utf-8"), ensure_ascii=False)
    print("saved", OUT)


if __name__ == "__main__":
    main()
