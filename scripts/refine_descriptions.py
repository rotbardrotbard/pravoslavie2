#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Пересборка описаний святых из кэша: приоритет «Краткое житие»,
иначе — лучший биографический абзац страницы (отсев тропарей и сносок).
Обновляет short для ВСЕХ святых в menology_raw.json."""
import json, os, re, html as htmlmod
from concurrent.futures import ThreadPoolExecutor, as_completed

SAINTS_DIR = "/tmp/menology_saints"
RAW = "/home/z/my-project/scripts/menology_raw.json"

TAG_RE = re.compile(r"<[^>]+>")
WS_RE = re.compile(r"\s+")
ACUTE = "\u0301"
MONTH_RE = r"(?:января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)"

LIT_RE = re.compile(r"//|\w+ /\s|Мученик Твой|Апостол[иы] Твои|Святитель Твой|Преподобне отче|"
                    r"В тебе, мати|Днесь град|Яко приял|Яко приимши|Того молитвами|Его молитвами|"
                    r"спаси души наша|умири живот", re.I)

# восклицательные литургические возгласы «О, всехвальный…»
VOC_RE = re.compile(r"^О,\s|^О\s+[а-яё]+(ий|ый|ая|ея|ею|ою|е|у)\b", re.U)


def clean(s):
    s = htmlmod.unescape(s)
    s = TAG_RE.sub("", s)
    return WS_RE.sub(" ", s).strip()


def strip_noise(t: str) -> str:
    t = t.replace(ACUTE, "").strip()
    t = re.sub(r"\[\d+\]\s*", "", t)
    t = re.sub(r"\((?:переходящая|переходящие)\)", "", t)
    DATE_TOK = r"\d{1,2}\s+" + MONTH_RE + r"\s*"
    TITLE_TOK = r"-\s+[А-ЯЁ][\wё\-]*(\s+[\wё\-]+){0,6}\s*"
    pat = re.compile(r"^(?:\s*(" + DATE_TOK + r"|\(\s*\))?\s*" + TITLE_TOK + r")+", re.U)
    m = pat.match(t)
    if m:
        rest = t[m.end():]
        if re.match(r"^(Блж|Свт|Св|Прп|Прмч|Сщмч|Мч|Вмч|Вмц|Мц|Апостол|Ап\.\s|Иер|Еп|Свят|Род|Преподобн|Икон|Собор|Преставл|Обрет|Перенес|Прослав|Равноап|Блгв|Первомч|Великомуч)", rest):
            t = rest
    t = re.sub(r"\d{1,2}\s+" + MONTH_RE + r"\s+-\s+[^.]{2,60}\.", "", t)
    return re.sub(r"\s{2,}", " ", t).strip()


def is_bad(t: str) -> bool:
    if len(t) < 60:
        return True
    if LIT_RE.search(t):
        return True
    if VOC_RE.match(t) and t.count(",", 0, 80) >= 2:
        return True
    return False


def bio_score(t: str) -> int:
    markers = ["родил", "пострад", "сконча", "подвиза", "епископ", "монастыр", "император",
               "гонени", "прославлен", "канонизир", "мученик", "преподобн", "святитель",
               "монашеств", "постриг", "обители", "служил", "церков", "веру", "христ",
               "город", "иерарх", "родител", "семь", "отец", "мать", "образован"]
    return sum(1 for m in markers if m in t.lower())


def paragraphs_of(html: str):
    out = []
    for p in re.findall(r"<p>(.*?)</p>", html, re.S):
        t = strip_noise(clean(p)).replace("(*)", "")
        if not is_bad(t) and len(t) < 4000:
            out.append(t)
    return out


def extract(html: str):
    res = {"title": "", "short": ""}
    t = re.search(r"<h1>(.*?)</h1>", html, re.S)
    if t:
        res["title"] = clean(t.group(1))
    # Краткое житие — приоритет
    m = re.search(r'Краткое житие.*?</h3>(.*?)(?:<h3|<div class="brif)', html, re.S)
    if m:
        paras = [strip_noise(clean(p)) for p in re.findall(r"<p>(.*?)</p>", m.group(1), re.S)]
        paras = [p for p in paras if not is_bad(p)]
        if paras:
            res["short"] = " ".join(paras)
            return res
    # иначе лучший биографический абзац страницы (при равенстве — самый ранний)
    cands = paragraphs_of(html)
    if cands:
        best_idx, best = 0, cands[0]
        bs = bio_score(cands[0])
        for i, c in enumerate(cands[1:], 1):
            s = bio_score(c)
            if s > bs:
                best_idx, best, bs = i, c, s
        if bs >= 2:
            res["short"] = best
    return res


def main():
    d = json.load(open(RAW))
    saints = d["saints"]
    slugs = [k for k, v in saints.items() if isinstance(v, dict)]

    def work(slug):
        path = os.path.join(SAINTS_DIR, slug + ".html")
        if not (os.path.exists(path) and os.path.getsize(path) > 5000):
            return slug, None
        html = open(path, encoding="utf-8", errors="replace").read()
        return slug, extract(html)

    changed = 0
    with ThreadPoolExecutor(max_workers=12) as ex:
        futs = [ex.submit(work, s) for s in slugs]
        done = 0
        for f in as_completed(futs):
            slug, info = f.result()
            done += 1
            if done % 500 == 0:
                print(done, flush=True)
            if info and info.get("short"):
                new = info["short"]
                old = saints[slug].get("short", "")
                if new != old:
                    changed += 1
                saints[slug]["short"] = new
            if info and info.get("title") and not saints[slug].get("title"):
                saints[slug]["title"] = info["title"]
    print("changed:", changed)
    empty = [k for k, v in saints.items() if isinstance(v, dict) and not v.get("short")]
    print("still empty:", len(empty))
    json.dump(d, open(RAW, "w", encoding="utf-8"), ensure_ascii=False)
    print("saved")


if __name__ == "__main__":
    main()
