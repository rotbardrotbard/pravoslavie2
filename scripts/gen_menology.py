#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Генерация TS-файлов месяцеслова для приложения из menology_raw.json.
- выбор до 3 святых на день (приоритет: главный праздник/святой дня);
- описание ≤ ~420 символов, обрезка по границе предложения;
- привязка к полным житиям LIVES (lifeId);
- вывод: menology/m01.ts … m12.ts + name-days.ts (именины).
"""
import json, os, re, unicodedata

RAW = "/home/z/my-project/scripts/menology_raw.json"
OUTDIR = "/home/z/my-project/menology"
os.makedirs(OUTDIR, exist_ok=True)

MAX_DESC = 420

# слаги azbyka → id полных житий в src/lib/content/lives.ts
LIFE_SLUGS = {
    "sv-nikolaj-mirlikijskij": "nikolay",
    "sv-nikolaj-chudotvorec": "nikolay",
    "perenesenie-moshhej-svjatitelja-nikolaja-chudotvorca-iz-mir-likijjskih-v-bar": "nikolay",
    "sv-serafim-sarovskij": "serafim",
    "sv-sergij-radonezhskij": "sergiy",
    "sv-matrona-moskovskaja": "matrona",
    "sv-spiridon-trimifuntskij": "spiridon",
    "sv-ksenija-peterburgskaja": "kseniya",
    "sv-panteleimon-celitel": "panteleimon",
    "sv-luka-vojno-yasenecckij-krymskij": "luka",
    "sv-luka-krymskij": "luka",
    "sv-georgij-pobedonosets": "georgiy",
    "sv-petr-fevroniya-muromskie": "petr-fevroniya",
    "sv-petr-fevronija-muromskie": "petr-fevroniya",
    "sv-aleksandr-nevskij": "alexander-nevsky",
    "sv-ilija-prorok": "iliya",
    "sv-ioann-predtecha": "ioann-predtecha",
    "usseknovenie-glavy-ioanna-predtechi": "ioann-predtecha",
    "rozhdestvo-ioanna-predtechi": "ioann-predtecha",
    "sv-andrej-pervozvannyj": "andrey",
    "sv-petr-pavel": "petr-pavel",
    "sv-apostoly-petr-pavel": "petr-pavel",
    "sv-matfej-apostol": "matfey",
    "sv-filipp-apostol": "filipp",
    "sobor-arhistratiga-mihaila": "arhangel-mihail",
    "sv-arhangel-mihail": "arhangel-mihail",
    "sv-stepan-archidiakon": "stephan",
    "sv-ioann-zlatoust": "ioann-zlatoust",
    "sv-vasilij-velikij": "vasily-veliky",
    "sv-ambrosij-mediolanskij": "ambrosiy-medio",
    "sv-kirill-mefodij": "kirill-mefodiy",
    "sv-tihon-zadonskij": "tihon-zadonsky",
    "sv-nektarij-eginskij": "nectariy-eginsky",
    "sv-ignatij-bryanchaninov": "ignatiy-bryanchaninov",
    "sv-feofan-zatvornik-vyshenskij": "feofan-zatvornik",
    "sv-ioann-kronshtadtskij": "ioann-kronstadt",
    "sv-amvrosij-optinskij": "amvrosiy-optinsky",
    "sv-aleksej-mechov": "aleksey-mechov",
    "sv-arsenij-kapadokijskij": "pausiy-svyatogorets",
    "sv-dimitrij-solunskij": "dimitry-solunsky",
    "sv-kosma-damian": "kosma-damian",
    "sv-kosma-damian-asijjskie": "kosma-damian",
    "sv-ekaterina-velikomuchenica": "ekaterina",
    "sv-varvara-velikomuchenica": "varvara",
    "sv-anastasija-uzoreshitelnica": "anastasia",
    "sv-tatiana-rimskaja": "tatiana",
    "sv-vera-nadezhda-lyubov-sofija": "vera-nadezhda-lyubov",
    "sv-ioakim-anna": "ioakim-anna",
    "sv-kiprian-justina": "kiprian-iustina",
    "sv-prepodobnye-pecherskie": "pecherskie",
    "sv-efrem-sirin": "efrem-sirin",
    "sv-olga-vladimir": "olga-vladimir",
    "sv-olga-ravnopostolnaya": "olga-vladimir",
    "sv-vladimir-velikij": "olga-vladimir",
    "sv-ludmila": "ludmila",
}

# известные слаги по фрагментам (для надёжности): (фрагмент слага, id)
LIFE_FRAGMENTS = [
    ("perenesenie-moshhej-svjatitelja-i-chudotvorca-nikolaja", "nikolay"),
    ("nikolaj-mirlikij", "nikolay"), ("nikolaj-chudotvorec", "nikolay"),
    ("serafim-sarovskij", "serafim"), ("sergij-radonezhskij", "sergiy"),
    ("matrona-moskovskaja", "matrona"), ("spiridon-trimifuntskij", "spiridon"),
    ("ksenija-peterburgskaja", "kseniya"), ("panteleimon", "panteleimon"),
    ("vojno-yasenecckij", "luka"), ("vojno-jaseneckij", "luka"), ("jaseneckij", "luka"), ("georgij-pobedonosets", "georgiy"),
    ("petr-fevron", "petr-fevroniya"), ("aleksandr-nevskij", "alexander-nevsky"),
    ("ilija-prorok", "iliya"), ("ioann-predtecha", "ioann-predtecha"),
    ("andrej-pervozvannyj", "andrey"), ("matfej-apostol", "matfey"),
    ("filipp-apostol", "filipp"), ("arhangel-mihail", "arhangel-mihail"),
    ("stepan-archidiakon", "stephan"), ("ioann-zlatoust", "ioann-zlatoust"),
    ("vasilij-velikij", "vasily-veliky"), ("ambrosij-mediolanskij", "ambrosiy-medio"),
    ("kirill-mefodij", "kirill-mefodiy"), ("tihon-zadonskij", "tihon-zadonsky"),
    ("nektarij-eginskij", "nectariy-eginsky"),
    ("ignatij-bryanchaninov", "ignatiy-bryanchaninov"),
    ("feofan-zatvornik", "feofan-zatvornik"),
    ("ioann-kronshtadtskij", "ioann-kronstadt"),
    ("amvrosij-optinskij", "amvrosiy-optinsky"),
    ("aleksej-mechov", "aleksey-mechov"),
    ("dimitrij-solunskij", "dimitry-solunsky"),
    ("kosma-damian", "kosma-damian"),
    ("ekaterina", "ekaterina"), ("varvara", "varvara"),
    ("anastasija-uzoreshitelnica", "anastasia"),
    ("vera-nadezhda-lyubov", "vera-nadezhda-lyubov"),
    ("ioakim-anna", "ioakim-anna"),
    ("efrem-sirin", "efrem-sirin"),
    ("olga", "olga-vladimir"), ("vladimir-velikij", "olga-vladimir"),
    ("ludmila", "ludmila"),
]

GREAT_FEASTS = {  # ключ дня → точная подпись (наши кураторские названия)
    "01-07": "Рождество Христово",
    "01-19": "Крещение Господне (Богоявление)",
    "02-15": "Сретение Господне",
    "04-07": "Благовещение Пресвятой Богородицы",
    "08-19": "Преображение Господне",
    "08-28": "Успение Пресвятой Богородицы",
    "09-21": "Рождество Пресвятой Богородицы",
    "09-27": "Воздвижение Креста Господня",
    "10-14": "Покров Пресвятой Богородицы",
    "12-04": "Введение во храм Пресвятой Богородицы",
}

ICON_OVERRIDES = {  # ключ дня → подпись иконы (наши кураторские)
    "11-04": "Иконы Божией Матери «Казанская»",
    "11-06": "Иконы Божией Матери «Всех скорбящих Радость»",
    "07-21": "Иконы Божией Матери «Казанская» (летняя)",
}

# Кураторские описания главных праздников (если у azbyka текст не подошёл)
FEAST_DESCS = {
    "Рождество Христово": "Один из двенадцати великих праздников: воспоминание о рождении Спасителя от Пресвятой Девы Марии в Вифлееме. Ему предшествует сорокадневный Рождественский пост и навечерие (сочельник).",
    "Крещение Господне (Богоявление)": "Воспоминание о крещении Господа Иоанном Предтечей в реке Иордан, когда Дух Святой сошёл на Христа в виде голубя и голос Отца назвал Его возлюбленным Сыном. В этот день освящают воду.",
    "Сретение Господне": "Встреча (церк.-слав. «сретение») Богомладенца Христа со старцем Симеоном в Иерусалимском храме на сороковой день по рождении. Симеон принял Младенца на руки и произнёс «Ныне отпущаеши…».",
    "Благовещение Пресвятой Богородицы": "Воспоминание о возвещении Архангелом Гавриилом Деве Марии благой вести: Она родит Сына и наречёт имя Ему Иисус. Праздник отмечается ровно за девять месяцев до Рождества.",
    "Преображение Господне": "Воспоминание о том, как на горе Фавор Христос преобразился перед учениками: лицо Его воссияло как солнце, а одежды стали белыми как свет; явились Моисей и Илия. В народе — Яблочный Спас.",
    "Успение Пресвятой Богородицы": "Праздник блаженной кончины (успения) Божией Матери, когда апостолы, собранные в Иерусалим, погребли Её в Гефсимании; по преданию, на третий день тело Богородицы было взято на небо.",
    "Рождество Пресвятой Богородицы": "Рождение Девы Марии у праведных Иоакима и Анны, долго молящихся о детях. С этого события начинается подготовка пришествия Спасителя в мир.",
    "Воздвижение Креста Господня": "Воспоминание об обретении Честного Креста святой Еленой в Иерусалиме в 326 году и установлении его для поклонения народy. Один из двунадесятых праздников, день строгого поста.",
    "Покров Пресвятой Богородицы": "Воспоминание явления Божией Матери во Влахернском храме Константинополя (X век): Она простёрла над молящимися свой покров (омафор) в защиту от нападавших врагов.",
    "Введение во храм Пресвятой Богородицы": "Воспоминание о том, как трёхлетняя Мария была приведена родителями в Иерусалимский храм и введена во святая святых, где пробыла до обручения с Иосифом.",
    "Вход Господень в Иерусалим": "Воспоминание о торжественном входе Христа в Иерусалим за шесть дней до Пасхи, когда народ встречал Его с ветвями верб и пальм. В России — Вербное воскресенье.",
    "Вознесение Господне": "Праздник на сороковой день после Пасхи: воскресший Христос вывел апостолов из Иерусалима, благословил их и вознёсся на небо, обещав пребывать с ними до скончания века.",
    "День Святой Троицы (Пятидесятница)": "Праздник на пятидесятый день после Пасхи: сошествие Святого Духа на апостолов, рождение Церкви. Дома и храмы украшают берёзовыми ветвями, пол посыпают травой.",
    "Пасха (Светлое Христово Воскресение)": "Главный праздник Православия: Воскресение Христово из мёртвых, победа над смертью. «Пасха» значит «переход» — от смерти к жизни, от земли к небу.",
    "Антипасха (Неделя о Фоме)": "Первое воскресенье после Пасхи, когда Христос явился апостолам и уверовал Фома, прежде отказавшийся верить без свидетельства собственных глаз.",
    "Неделя жён-мироносиц": "Второе воскресенье после Пасхи: память святых жён-мироносиц, которые первыми пришли ко гробу Спасителя и первыми узнали о Его воскресении.",
    "Навечерие Рождества Христова (сочельник)": "Строгий день подготовки к Рождеству: до первой звезды не вкушают пищи, затем вкушают сочиво (отсюда «сочельник»). Служатся Царские часы, вечером — праздничная Литургия.",
    "Навечерие Богоявления (Крещенский сочельник)": "Строгий день подготовки к Крещению: пост, Царские часы, вечером — Литургия и великое освящение воды на реках и источниках.",
    "Собор Пресвятой Богородицы": "На следующий день после Рождества Церковь собирает благодарение Богородице: «Собор» — общая память всех причастных к празднику, прежде всего Матери Спасителя.",
    "Собор Иоанна Предтечи": "Послерождественская память Предтечи и Крестителя Господня — величайшего из рождённых женами, первого проповедника покаяния.",
    "Обрезание Господне; свт. Василия Великого": "На восьмой день по рождении Христос принял обрезание по закону Моисееву. В этот же день Церковь чтит святителя Василия Великого — отца Церкви, автора литургии.",
    "По плоти обрезание Господа Бога и Спасителя нашего Иисуса Христа": "На восьмой день по рождении, по ветхозаветному закону, Богомладенец Христос принял обрезание, явив пример смиренного исполнения закона. В этот же день память свт. Василия Великого.",
    "Рождество Иоанна Предтечи": "Рождение Иоанна Крестителя у праведных Захарии и Елисаветы, обещанное Архангелом Гавриилом ещё до зачатия. Один из великих праздников Церкви.",
    "Усекновение главы Иоанна Предтечи": "Память о мученической кончине Крестителя: царь Ирод на пиру поклялся отдать дочери Иродиады «до половины царства», и по её просьбе Иоанну отсекли главу. День строгого поста.",
    "Перенесение мощей святителя и чудотворца Николая из Мир Ликийских в Бар": "В 1087 году мощи святителя Николая были перенесены из Мир Ликийских в итальянский город Бар, где почивают и ныне. Народное имя праздника — «Никола Вешний».",
    "Первое и второе (452) обретение главы Пророка, Предтечи и Крестителя Господня Иоанна": "Память обретения честной главы Крестителя Господня, сокрытой при гонениях и найденной в IV веке, а затем вторично — при архиепископе Иннокентии в 452 году.",
    "Поклонение честным веригам апостола Петра": "Память цепей, которыми апостол Пётр был скован в темнице и которые, по слову Ангела, спали с него сами. Из частиц вериг составлены цепи, облегчающие болящих.",
    "Собор трёх святителей": "Общая память великих учителей Церкви — Василия Великого, Григория Богослова и Иоанна Златоуста, объединивших Восток и Запад словом веры.",
    "Собор Архистратига Михаила и прочих Небесных Сил": "Праздник всех Ангелов во главе с Архистратигом Михаилом — предводителем небесного воинства, низложившим диавола. Народное имя — «Михайлов день».",
    "Происхождение честных древ Животворящего Креста Господня": "В первый день Успенского поста в Константинополе износили Крест для освящения воды и отвращения болезней. Народное имя — Медовый Спас: освящают мёд нового урожая.",
    "Перенесение из Едессы в Константинополь Нерукотворного Образа (Убруса) Господа Иисуса Христа": "Память перенесения Нерукотворного образа Спасителя — полотна, на котором отпечатлелось Его лицо. Народное имя — Ореховый Спас (Хлебный).",
    "Церковное новолетие (начало индикта)": "Церковный Новый год: 1 сентября по византийскому счёту начинался новый год (индикт), с которым связывали круг богослужений и счёт лет от сотворения мира.",
}

MONTHS = ["января", "февраля", "марта", "апреля", "мая", "июня",
          "июля", "августа", "сентября", "октября", "ноября", "декабря"]

ACUTE = "\u0301"

MONTH_RE = r"(?:января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)"

# литургические тексты (тропари/кондаки) — не описания
LIT_RE = re.compile(r"//|\w+ /\s|Мученик Твой|Апостол[иы] Твои|Святитель Твой|Преподобне отче|"
                    r"В тебе, мати|Днесь град|Яко приял|Яко приимши|Того молитвами|Его молитвами|"
                    r"моли\b|спаси души наша|умири живот", re.I)


def strip_noise(text: str) -> str:
    t = text.replace(ACUTE, "").strip()
    # сноски вида [6]
    t = re.sub(r"\[\d+\]\s*", "", t)
    # «(переходящая)» и скобочные повторения дат в начале
    t = re.sub(r"\((?:переходящая|переходящие)\)", "", t)
    # лидирующий список «дней памяти»: 1 марта 1 марта - Собор … 5 сентября - Собор … Свт. Макарий…
    DATE_TOK = r"\d{1,2}\s+" + MONTH_RE + r"\s*"
    TITLE_TOK = r"-\s+[А-ЯЁ][\wё\-]*(\s+[\wё\-]+){0,6}\s*"
    pat = re.compile(r"^(?:\s*(" + DATE_TOK + r"|\(\s*\))?\s*" + TITLE_TOK + r")+", re.U)
    m = pat.match(t)
    if m:
        rest = t[m.end():]
        # откусываем только если дальше идёт содержательный заголовок святого
        if re.match(r"^(Блж|Свт|Св|Прп|Прмч|Сщмч|Мч|Вмч|Вмц|Мц|Апостол|Ап\.\s|Иер|Еп|Свят|Род|Преподобн|Икон|Собор|Преставл|Обрет|Перенес|Прослав|Равноап|Блгв|Первомч|Великомуч)", rest):
            t = rest
    # любые оставшиеся внутри «4 июля - Собор Афонских преподобных»
    t = re.sub(r"\d{1,2}\s+" + MONTH_RE + r"\s+-\s+[^.]{2,60}\.", "", t)
    return re.sub(r"\s{2,}", " ", t).strip()


def is_liturgical(t: str) -> bool:
    return bool(LIT_RE.search(t))


def biographical(text: str) -> int:
    markers = ["родил", "пострад", "сконча", "подвиза", "епископ", "монастыр", "император",
               "память", "гонени", "прославлен", "канонизир", "мученик", "преподобн",
               "святитель", "монашеств", "постриг", "учил", "обители", "служил", "храм"]
    return sum(1 for m in markers if m in text.lower())


def esc(s: str) -> str:
    return s.replace("\\", "\\\\").replace('"', '\\"')


def clean_desc(text: str) -> str | None:
    t = strip_noise(text)
    if len(t) < 60 or is_liturgical(t):
        return None
    return trunc_desc(t)


def trunc_desc(text: str) -> str:
    text = text.replace(ACUTE, "").strip()
    # «т. ст.» и прочее не трогаем. Резать по предложениям.
    if len(text) <= MAX_DESC:
        return text
    parts = re.split(r"(?<=[.!?;])\s+", text)
    out = ""
    for p in parts:
        if len(out) + len(p) + 1 > MAX_DESC:
            break
        out = (out + " " + p).strip()
    if not out:
        out = text[: MAX_DESC - 1].rsplit(" ", 1)[0]
        out += "…"
    elif len(out) < len(text):
        # проверим финальную точку: если последняя часть не влезла — ставим …
        if not out.endswith((".", "!", "?")):
            out = out.rsplit(" ", 1)[0]
            if not out.endswith((".", "!", "?")):
                out += "…"
    return out


def short_name(name: str) -> str:
    """«Прмц. Евгении и с нею мчч. …» → аккуратная подпись. Убираем длинные
    скобочные пояснения и висячие запятые."""
    n = re.sub(r"\s+", " ", name).strip().strip(",").strip()
    # «Иконы … (празднество установлено …)» → без пояснения
    n = re.sub(r"\s*\(([^)]{40,})\)\s*", " ", n)
    return n


def sane_year(y: str) -> str:
    if not y:
        return ""
    y = re.sub(r"<[^>]+>", "", y)
    y = re.sub(r"\s+", " ", y).strip()
    if len(y) > 24 or not re.match(r"^[0-9IVX\s.,–-]|ок|около|до|X[I]?X|XX|нач|кон", y):
        return ""
    return y


def feast_desc_by_name(name: str) -> str:
    n = re.sub(r"\s+", " ", name).strip()
    if n in FEAST_DESCS:
        return FEAST_DESCS[n]
    low = n.lower()
    for k, v in FEAST_DESCS.items():
        if k.lower() in low or low in k.lower():
            return v
    return ""


def pick(day_key: str, entries, saints) -> list:
    seen, chosen = set(), []
    # главные (para 0) сначала; внутри уровня — сначала святые с полным житием
    ordered = sorted(entries, key=lambda e: (e["para"], 0 if e.get("slug") in LIFE_SLUGS else 1, e["ideo"]))
    for e in ordered:
        if len(chosen) >= 3:
            break
        slug = e["slug"]
        if not slug or slug in seen:
            continue
        info = saints.get(slug)
        if not isinstance(info, dict):
            continue
        seen.add(slug)
        name = short_name(e["name"])
        kind = e["kind"]
        life_id = None
        if slug in LIFE_SLUGS:
            life_id = LIFE_SLUGS[slug]
        else:
            for frag, lid in LIFE_FRAGMENTS:
                if frag in slug:
                    life_id = lid
                    break
        if kind in ("feast", "icon"):
            desc = feast_desc_by_name(name)
            if not desc:
                desc = clean_desc(info.get("short", "")) or ""
            if not desc:
                continue  # праздник без описания не включаем — останутся святые дня
            chosen.append({"key": day_key, "name": name, "year": sane_year(e.get("year", "")),
                       "kind": kind, "desc": desc, "lifeId": life_id})
            continue
        # святые — только с чистым описанием
        desc = clean_desc(info.get("short", ""))
        if not desc:
            seen.discard(slug)
            continue
        chosen.append({"key": day_key, "name": name, "year": sane_year(e.get("year", "")),
                       "kind": "saint", "desc": desc, "lifeId": life_id})
    # если остались непокрытые полные жития — заменим ими крайнюю запись без lifeId
    if len(chosen) >= 3:
        chosen_slugs = set()
        # собираем слаги уже выбранных (по порядку ordered)
        for e in ordered:
            if len(chosen_slugs) >= len(chosen):
                break
            slug = e["slug"]
            if slug and slug not in chosen_slugs:
                # эмуляция: найдём, выбран ли он в chosen по имени
                if any(short_name(e["name"]) == c["name"] for c in chosen):
                    chosen_slugs.add(slug)
        for e in ordered:
            slug = e["slug"]
            if not slug or slug in chosen_slugs:
                continue
            info = saints.get(slug)
            if not isinstance(info, dict):
                continue
            lid = LIFE_SLUGS.get(slug)
            if not lid:
                for frag, l in LIFE_FRAGMENTS:
                    if frag in slug:
                        lid = l; break
            if not lid:
                continue
            desc = clean_desc(info.get("short", "")) if e["kind"] not in ("feast", "icon") else feast_desc_by_name(short_name(e["name"])) or clean_desc(info.get("short", ""))
            if not desc:
                continue
            for idx in range(len(chosen) - 1, -1, -1):
                if not chosen[idx].get("lifeId"):
                    name = short_name(e["name"])
                    kind = "saint" if e["kind"] not in ("feast", "icon") else e["kind"]
                    chosen[idx] = {"key": day_key, "name": name, "year": sane_year(e.get("year", "")),
                                   "kind": kind, "desc": desc, "lifeId": lid}
                    break
            break
    return chosen


def ts_record(r: dict) -> str:
    parts = [f'key: "{r["key"]}"', f'name: "{esc(r["name"])}"']
    if r["year"]:
        parts.append(f'year: "{esc(r["year"])}"')
    parts.append(f'kind: "{r["kind"]}"')
    parts.append(f'desc: "{esc(r["desc"])}"')
    if r["lifeId"]:
        parts.append(f'lifeId: "{r["lifeId"]}"')
    return "  { " + ", ".join(parts) + " }"


def main():
    raw = json.load(open(RAW))
    days, saints = raw["days"], raw["saints"]

    by_month = {m: [] for m in range(1, 13)}
    used_names = {}
    total_chars = 0
    count = 0
    for date_key in sorted(days):
        mm = int(date_key[5:7])
        key = date_key[5:]
        chosen = pick(key, days[date_key], saints)
        # кураторские переопределения праздников/икон
        if key in GREAT_FEASTS and not any(r["kind"] == "feast" for r in chosen):
            chosen.insert(0, {"key": key, "name": GREAT_FEASTS[key], "year": "",
                              "kind": "feast", "desc": feast_desc_by_name(GREAT_FEASTS[key]),
                              "lifeId": None})
        if key in ICON_OVERRIDES and not any(r["kind"] == "icon" for r in chosen):
            chosen.insert(1 if chosen else 0, {"key": key, "name": ICON_OVERRIDES[key],
                                               "year": "", "kind": "icon",
                                               "desc": feast_desc_by_name(ICON_OVERRIDES[key]),
                                               "lifeId": None})
        # двунадесятые праздники — kind great
        for r in chosen:
            if r["key"] in GREAT_FEASTS and r["kind"] == "feast" and r["name"] == GREAT_FEASTS[r["key"]]:
                r["kind"] = "great"
        chosen.sort(key=lambda r: (0 if r["kind"] in ("great", "feast", "icon") else 1, r["key"]))
        for r in chosen:
            total_chars += len(r["desc"])
            count += 1
        by_month[mm].extend(chosen)
        for r in chosen:
            used_names.setdefault(r["name"], []).append(key)

    print("records:", count, "desc chars:", total_chars, "avg:", total_chars // max(count, 1))

    header = ('/* ═══════════════════════════════════════════════════════════\n'
              '   Месяцеслов «Православных» — {month}.\n'
              '   Святые и праздники каждого дня с кратким описанием;\n'
              '   данные выгружены с портала «Азбука веры» (azbyka.ru).\n'
              '   lifeId — ссылка на полное житие (src/lib/content/lives.ts).\n'
              '   ═══════════════════════════════════════════════════════════ */\n\n'
              'import type {{ SaintRec }} from "./types";\n\n'
              'export const M{n:02d}: SaintRec[] = [\n')

    for m in range(1, 13):
        body = header.format(month=MONTHS[m - 1], n=m)
        recs = "\n".join(ts_record(r) + "," for r in by_month[m])
        body += recs + "\n];\n"
        open(os.path.join(OUTDIR, f"m{m:02d}.ts"), "w", encoding="utf-8").write(body)
        print(f"m{m:02d}: {len(by_month[m])} записей")

    # ── именины: популярные имена → дата памяти покровителя (новый стиль).
    # Резолв по СЫРЫМ данным azbyka (все записи дня, не только отобранные);
    # каждый фрагмент — 1-2 стемма, которые должны быть в ОДНОЙ записи.
    NAME_PATRONS = {
        "Иван": ("07-07", ["предтеч", "крестител"]), "Иоанн": ("07-07", ["предтеч", "крестител"]),
        "Анна": ("09-22", ["иоаким", "анн"]), "Иоаким": ("09-22", ["иоаким", "анн"]),
        "Мария": ("08-04", ["магдалин"]),
        "Дмитрий": ("11-08", ["димитри солун"]), "Димитрий": ("11-08", ["димитри солун"]),
        "Николай": ("12-19", ["николай,николая,николаю", "мир ликийских"]),
        "Екатерина": ("12-07", ["екатерин"]),
        "Андрей": ("12-13", ["андре первозван"]),
        "Александр": ("12-06", ["александр невск"]),
        "Сергий": ("10-08", ["серг"]), "Сергей": ("10-08", ["серг"]),
        "Василий": ("01-14", ["васили велик", "васили"]),
        "Михаил": ("11-21", ["архистратига михаил"]),
        "Филипп": ("11-27", ["филипп"]),
        "Матвей": ("11-29", ["матфе"]), "Матфей": ("11-29", ["матфе"]),
        "Стефан": ("01-09", ["стефан"]), "Степан": ("01-09", ["стефан"]),
        "Спиридон": ("12-25", ["спиридон,спиридона"]),
        "Ксения": ("02-06", ["ксении петербургск"]), "Оксана": ("02-06", ["ксении петербургск"]),
        "Лука": ("06-11", ["луки (войно", "луки войно"]),
        "Георгий": ("05-06", ["георги победонос"]), "Егор": ("05-06", ["георги победонос"]), "Юрий": ("05-06", ["георги победонос"]),
        "Илья": ("08-02", ["илии"]),
        "Пётр": ("07-12", ["петр"]), "Павел": ("07-12", ["павл"]),
        "Кузьма": ("11-14", ["косм"]), "Косма": ("11-14", ["косм"]),
        "Анастасия": ("01-04", ["анастасии узорешитель"]),
        "Варвара": ("12-17", ["варвар"]),
        "Вера": ("09-30", ["веры,надежды,любов"]), "Надежда": ("09-30", ["веры,надежды,любов"]),
        "Любовь": ("09-30", ["веры,надежды,любов"]), "София": ("09-30", ["веры,надежды,любов"]),
        "Ольга": ("07-24", ["ольг"]), "Владимир": ("07-28", ["владимир"]),
        "Людмила": ("09-29", ["людмил"]), "Татьяна": ("01-25", ["татиан"]),
        "Алексей": ("02-25", ["алекси московск"]), "Антон": ("01-30", ["антони велик"]),
        "Ефрем": ("02-10", ["ефрем сирин"]),
        "Кирилл": ("05-24", ["мефоди,кирилл"]), "Мефодий": ("05-24", ["мефоди,кирилл"]),
        "Игнатий": ("05-13", ["игнатия (брянчанинова", "брянчанинов"]),
        "Феофан": ("01-19", ["феофан"]),
        "Амвросий": ("10-23", ["амвроси"]),
        "Елизавета": ("09-18", ["елисавет", "елисав"]),
        "Зинаида": ("10-24", ["зинаид"]), "Галина": ("03-23", ["галин"]),
        "Максим": ("02-03", ["максим исповедн"]), "Денис": ("10-16", ["диониси"]),
        "Евгений": ("12-26", ["евгени"]), "Семён": ("09-14", ["симеон столпник"]),
        "Симеон": ("09-14", ["симеон столпник"]), "Борис": ("08-06", ["борис"]),
        "Глеб": ("08-06", ["борис,глеб"]),
        "Вячеслав": ("10-11", ["вячеслав"]),
        "Нина": ("01-27", ["нин"]),
        "Тамара": ("05-14", ["тамар"]),
        "Никита": ("09-28", ["никит"]),
        "Марина": ("07-30", ["марин"]),
        "Дарья": ("04-01", ["дарии,дария"]),
        "Евдокия": ("03-14", ["евдоки"]),
        "Захар": ("09-18", ["захари"]), "Захария": ("09-18", ["захари"]),
        "Иннокентий": ("12-09", ["иннокентий,иннокентия,иннокенти"]),
        "Фёдор": ("02-21", ["феодор стратилат"]), "Феодор": ("02-21", ["феодор стратилат"]),
    }

    # сырые записи дня: {key: [name,...]}
    raw_flat = {}
    for date_key, entries in days.items():
        k = date_key[5:]
        raw_flat.setdefault(k, []).extend(e["name"].lower().replace("ё", "е") for e in entries)

    def match(name, stem):
        # запятая — альтернативы, пробел внутри стемма — обязательные слова
        for alt in stem.split(","):
            alt = alt.strip()
            if alt and all(w in name for w in alt.split()):
                return True
        return False

    def date_confirmed(key, stems):
        for name in raw_flat.get(key, []):
            if all(match(name, s) for s in stems):
                return True
        return False

    def search(stems):
        for k in sorted(raw_flat):
            if date_confirmed(k, stems):
                return k
        return None

    resolved = {}
    for nm, (key, stems) in NAME_PATRONS.items():
        if date_confirmed(key, stems):
            resolved[nm] = key
        else:
            alt = search(stems)
            if alt:
                print(f"именины: {nm}: {key} не подтверждена ({stems}), взяли {alt}")
                resolved[nm] = alt
            else:
                print(f"именины: {nm}: не нашли {stems} — пропускаем")

    lines = ["/* ═══════════════════════════════════════════════════════════",
             "   Именины: популярные имена → день памяти небесного покровителя.",
             "   Даты сверены с месяцесловом (новый стиль); полный список имён —",
             "   в святцах приложения (календарь дня).",
             "   ═══════════════════════════════════════════════════════════ */",
             "",
             'export const NAME_DAY_DATES: Record<string, string> = {']
    for nm, k in sorted(resolved.items()):
        lines.append(f'  "{nm}": "{k}",')
    lines.append("};")
    open(os.path.join(OUTDIR, "name-days.ts"), "w", encoding="utf-8").write("\n".join(lines) + "\n")
    print("name-days:", len(resolved), "имён")


if __name__ == "__main__":
    main()
