/* ═══════════════════════════════════════════════════════════
   Календарный движок «Православных».
   Непереходящие праздники (новый стиль), старый стиль (−13 дней),
   недели по Пятидесятнице и гласы (цикл от Антипасхи),
   Рождественский пост, постные среды/пятницы, родительские субботы.

   Сверка формул:
   1 ноября 2026 = Неделя 22-я по Пятидесятнице, Глас 5-й. ✓
   Дни поминовения усопших (Мясопустная, Троицкая, Димитриевская) —
   вычисляются от Пасхи; Пасха задана таблицей на 2024–2028 гг.

   Святцы: полный годовой месяцеслов с описаниями — menology/;
   каждый святой имеет описание,
   у известных святых есть полное житие в библиотеке (lifeId).
   ═══════════════════════════════════════════════════════════ */

import { saintsOfDay, type SaintRec } from "../../../menology/types";

export type FeastKind = "great" | "feast" | "icon" | "saint" | "post";

export interface DayInfo {
  date: Date;
  weekday: string;
  weekdayShort: string;
  dateNew: string;   // «3 ноября 2026»
  dateOld: string;   // «21 октября по старому стилю»
  weekLabel: string; // «Неделя 22-я…» или «Седмица 23-я…»
  glas: string;      // «Глас 5-й»
  feast: { label: string; kind: FeastKind } | null;
  saints: string[];        // краткие имена (для шапок и именин)
  saintRecs: SaintRec[];   // полные записи: имя + год + описание (+ lifeId)
  notices: string[];       // родительские субботы и пр. (без имени святого)
  fastLabel: string; // «Поста нет» / «Постный день» / «Рождественский пост»
  meal: string;      // рекомендация трапезы (упрощённо)
  parentSaturday: boolean;
  isToday: boolean;
}

const WEEKDAYS = ["Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"];
const WEEKDAYS_SHORT = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
const MONTHS_NOM = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];

const DAY = 86_400_000;

/* Православная Пасхалия: вычисление Пасхи по юлианскому календарю
   с переводом в григорианский. Поддерживается диапазон 1900–2199 гг. */
export function orthodoxPaschaDate(year: number): Date | null {
  if (!Number.isInteger(year) || year < 1900 || year > 2199) return null;

  const a = year % 4;
  const b = year % 7;
  const c = year % 19;
  const d = (19 * c + 15) % 30;
  const e = (2 * a + 4 * b - d + 34) % 7;
  const julianMonth = Math.floor((d + e + 114) / 31);
  const julianDay = ((d + e + 114) % 31) + 1;
  const gregorianOffset = Math.floor(year / 100) - Math.floor(year / 400) - 2;

  return new Date(year, julianMonth - 1, julianDay + gregorianOffset, 12);
}

function paschaDate(year: number): Date | null {
  return orthodoxPaschaDate(year);
}

/* ── Непереходящие праздники и памяти (новый стиль) ── */
interface FeastEntry {
  label: string;
  kind: FeastKind;
}

const FIXED_FEASTS: Record<string, FeastEntry> = {
  "01-06": { label: "Навечерие Рождества Христова (сочельник)", kind: "feast" },
  "01-07": { label: "Рождество Христово", kind: "great" },
  "01-14": { label: "Обрезание Господне; свт. Василия Великого", kind: "feast" },
  "01-19": { label: "Крещение Господне (Богоявление)", kind: "great" },
  "02-15": { label: "Сретение Господне", kind: "great" },
  "04-07": { label: "Благовещение Пресвятой Богородицы", kind: "great" },
  "08-28": { label: "Успение Пресвятой Богородицы", kind: "great" },
  "09-21": { label: "Рождество Пресвятой Богородицы", kind: "great" },
  "09-27": { label: "Воздвижение Креста Господня", kind: "great" },
  "10-14": { label: "Покров Пресвятой Богородицы", kind: "great" },
  "11-04": { label: "Иконы Божией Матери «Казанская»", kind: "icon" },
  "11-06": { label: "Иконы Божией Матери «Всех скорбящих Радость»", kind: "icon" },
  "11-08": { label: "Вмч. Димитрия Солунского", kind: "saint" },
  "11-13": { label: "Свт. Иоанна Златоуста", kind: "saint" },
  "11-14": { label: "Бессребреников Космы и Дамиана", kind: "saint" },
  "11-15": { label: "Мчч. Гурия, Самона и Авива", kind: "saint" },
  "11-16": { label: "Обновление храма вмч. Георгия Победоносца", kind: "feast" },
  "11-17": { label: "Прп. Иоанникия Великого", kind: "saint" },
  "11-18": { label: "Мчч. Галактиона и Епистимы", kind: "saint" },
  "11-19": { label: "Прп. Варлаама Хутынского", kind: "saint" },
  "11-20": { label: "Прп. Лазаря Галесийского", kind: "saint" },
  "11-21": { label: "Собор Архистратига Михаила и прочих Небесных Сил", kind: "feast" },
  "11-22": { label: "Свт. Павла исповедника, архиеп. Константинопольского", kind: "saint" },
  "11-23": { label: "Апп. от 70-ти Олимпа, Ераста, Родиона, Сосипатра и других", kind: "saint" },
  "12-07": { label: "Вмц. Екатерины", kind: "saint" },
  "11-25": { label: "Свт. Иоанна Милостивого; прп. Нила Постника", kind: "saint" },
  "11-27": { label: "Св. ап. Филиппа", kind: "saint" },
  "11-28": { label: "Начало Рождественского поста", kind: "post" },
  "11-29": { label: "Ап. и евангелиста Матфея", kind: "saint" },
  "11-30": { label: "Св. ап. Андрея Первозванного", kind: "saint" },
  "12-04": { label: "Введение во храм Пресвятой Богородицы", kind: "great" },
  "12-06": { label: "Блгв. вел. кн. Александра Невского", kind: "saint" },
  "12-13": { label: "Свт. Спиридона, еп. Тримифунтского", kind: "saint" },
  "12-19": { label: "Свт. Николая, архиеп. Мир Ликийских, Чудотворца", kind: "saint" },
  "12-27": { label: "Первомч. и архидиакона Стефана", kind: "saint" },
};

/* Дополнительные святые дня (кроме главного праздника) */
const EXTRA_SAINTS: Record<string, string[]> = {
  "11-01": [
    "Прор. Иоиля (IX в. до Р. Х.)",
    "Мч. Уара Египетского и с ним семи учителей христианских (ок. 307)",
    "Блаженной Клеопатры и сына её св. Иоанна",
    "Перенесение мощей прп. Иоанна Рыльского",
  ],
  "11-02": [
    "Вмч. Артемия Антиохийского (362)",
    "Прав. отрока Артемия Веркольского (XVI)",
    "Прп. Гавриила Самтаврийского (1995)",
  ],
  "11-03": [
    "Прп. Илариона Великого (371)",
    "Мчч. Дасия, Гаия и Зотика (303)",
    "Прп. Илариона Псковоезерского (Гдовского)",
  ],
  "11-04": [
    "Равноап. Аверкия, еп. Иерапольского (ок. 167)",
    "Семи отроков Ефесских (ок. 250)",
  ],
  "11-05": [
    "Ап. Иакова, брата Господня (ок. 63)",
    "Свт. Игнатия, патриарха Константинопольского (877)",
    "Прп. Елисея Лавришевского (ок. 1250)",
  ],
  "11-06": [
    "Мч. Арефы и с ним 4299 мучеников (523)",
    "Прп. Зосимы Верховского (1833)",
  ],
  "11-07": [
    "Мчч. Маркиана, чтеца, и Мартирия (ок. 355)",
    "Прав. Тавифы Иоппийской (I)",
  ],
  "11-08": ["Вмч. Димитрия Солунского (ок. 306)", "Мч. Луппа Солунского (ок. 306)", "Прп. Афанасия Мидикийского (ок. 814)"],
  "11-09": ["Вмц. Параскевы, нареченной Пятницей (III)", "Прп. Димитрия Басарбовского"],
  "11-10": ["Мч. Ореста врача (304)"],
  "11-11": ["Прп. Авраамия Затворника и блж. Марии, племянницы его (ок. 360)"],
  "11-12": ["Прор. Осии (820 г. до Р. Х.)", "Мч. Андрея Калистратова (VIII)"],
  "11-26": ["Мчч. Антонина и Никифора (ок. 287)"],
  "12-09": ["Свт. Иннокентия Иркутского (1731)"],
  "12-26": ["Мчч. Евстратия, Авксентия, Евгения, Мардария и Ореста (284–305)"],
  "12-31": ["Сщмч. Зотика, пресвитера (ок. 320)"],
};

/* ── Именины: имя → даты памяти святых покровителей ── */
export const NAME_DAYS: Record<string, Record<string, string>> = {
  "Иван": { "11-01": "блаженный Иоанн, сын Клеопаты", "11-13": "свт. Иоанн Златоуст" },
    "Дмитрий": { "11-08": "вмч. Димитрий Солунский" },
  "Димитрий": { "11-08": "вмч. Димитрий Солунский" },
  "Иоанн": { "11-01": "блаженный Иоанн", "11-13": "свт. Иоанн Златоуст" },
  "Кузьма": { "11-14": "бссрр. Косма" },
  "Михаил": { "11-21": "Собор Архистратига Михаила" },
  "Екатерина": { "12-07": "вмц. Екатерина" },
  "Филипп": { "11-27": "св. ап. Филипп" },
  "Матвей": { "11-29": "ап. и еванг. Матфей" },
  "Матфей": { "11-29": "ап. и еванг. Матфей" },
  "Андрей": { "11-30": "св. ап. Андрей Первозванный" },
  "Александр": { "12-06": "блгв. вел. кн. Александр Невский" },
  "Спиридон": { "12-13": "свт. Спиридон Тримифунтский" },
  "Николай": { "12-19": "свт. Николай Чудотворец" },
  "Степан": { "12-27": "первомч. Стефан" },
  "Стефан": { "12-27": "первомч. Стефан" },
  "Василий": { "01-14": "свт. Василий Великий" },
};

export function getNameDay(name: string | null, date: Date): string | null {
  if (!name) return null;
  const map = NAME_DAYS[name.trim()];
  if (!map) return null;
  const key = mmdd(date);
  return map[key] ?? null;
}

/* ── Святцы для произвольной даты (напр., дата крещения) ── */
export function saintsForDate(d: Date): { feast: string | null; saints: string[] } {
  const key = mmdd(new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12));
  const recs = saintsOfDay(key);
  const feast = recs.find((r) => r.kind === "great" || r.kind === "feast" || r.kind === "icon");
  const saints = recs.map((r) => (r.year ? `${r.name} (${r.year})` : r.name));
  return { feast: feast ? feast.name : null, saints };
}

/* Все памяти святых покровителей по имени (для анкеты) */
export function nameDaysForName(name: string): { dateKey: string; saint: string }[] {
  const map = NAME_DAYS[name.trim()];
  if (!map) return [];
  return Object.entries(map).map(([dateKey, saint]) => ({ dateKey, saint }));
}

/* «12-19» или «2010-12-19» → «19 декабря» */
export function formatSaintsDate(dateKey: string): string {
  const parts = dateKey.split("-");
  const mm = Number(parts[parts.length - 2]);
  const dd = Number(parts[parts.length - 1]);
  if (!mm || !dd) return "";
  return `${dd} ${MONTHS_NOM[mm - 1]}`;
}

/* ── Вспомогательные ── */
function mmdd(d: Date): string {
  return `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const OLD_STYLE_MONTHS = MONTHS_NOM;

function fmtDate(d: Date): string {
  return `${d.getDate()} ${MONTHS_NOM[d.getMonth()]} ${d.getFullYear()}`;
}

function oldStyle(d: Date): Date {
  return new Date(d.getTime() - 13 * DAY);
}

function fmtOld(d: Date): string {
  return `${d.getDate()} ${OLD_STYLE_MONTHS[d.getMonth()]} по старому стилю`;
}

function lastSundayOnOrBefore(d: Date): Date {
  const copy = new Date(d.getTime());
  const shift = copy.getDay(); // 0 = воскресенье
  copy.setHours(12, 0, 0, 0);
  return new Date(copy.getTime() - shift * DAY);
}

/* ── Основная функция: сведения о дне ── */
export function getDayInfo(date: Date, today = new Date()): DayInfo {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
  const key = mmdd(d);
  const weekdayIdx = d.getDay();

  const year = d.getFullYear();
  /* Пасхальный цикл: ближайшая Пасха к дате (для января–апреля — прошлогодняя) */
  let pascha = paschaDate(year);
  if (pascha && d.getTime() < pascha.getTime()) {
    pascha = paschaDate(year - 1) ?? paschaDate(year + 1);
  }
  const pentecost = pascha ? new Date(pascha.getTime() + 49 * DAY) : null;
  const antipascha = pascha ? new Date(pascha.getTime() + 7 * DAY) : null;

  /* Недели и гласы */
  let weekLabel = "";
  let glas = "";
  if (pascha && pentecost && antipascha) {
    if (d.getTime() >= pentecost.getTime()) {
      if (weekdayIdx === 0) {
        const n = Math.round((d.getTime() - pentecost.getTime()) / (7 * DAY));
        weekLabel = n > 0 ? `Неделя ${ordinal(n)}-я по Пятидесятнице` : "";
      } else {
        const dukhovDen = pentecost.getTime() + DAY;
        const n = Math.floor((d.getTime() - dukhovDen) / (7 * DAY)) + 1;
        weekLabel = n > 0 ? `Седмица ${ordinal(n)}-я по Пятидесятнице` : "";
      }
      const lastSun = lastSundayOnOrBefore(d);
      const weeks = Math.round((lastSun.getTime() - antipascha.getTime()) / (7 * DAY));
      if (weeks >= 0) glas = `Глас ${ordinal((weeks % 8) + 1)}-й`;
    } else if (d.getTime() >= pascha.getTime()) {
      /* Светлая седмица и период до Пятидесятницы */
      weekLabel = "От Пасхи до Пятидесятницы";
    }
  }

  /* Святые дня — полный месяцеслов (menology/): у каждого описание */
  const saintRecs = saintsOfDay(key);
  const saints: string[] = saintRecs.map((r) => (r.year ? `${r.name} (${r.year})` : r.name));
  const notices: string[] = [];
  if (!saints.length) notices.push("Богослужение по уставу дня");

  /* Переходящие праздники: Пасха, Вербное воскресенье,
     Вознесение Господне и Пятидесятница. */
  const movableFeast: FeastEntry | null = pascha
    ? sameDay(d, pascha)
      ? { label: "Светлое Христово Воскресение (Пасха)", kind: "great" }
      : sameDay(d, new Date(pascha.getTime() - 7 * DAY))
        ? { label: "Вход Господень в Иерусалим (Вербное воскресенье)", kind: "great" }
        : sameDay(d, new Date(pascha.getTime() + 39 * DAY))
          ? { label: "Вознесение Господне", kind: "great" }
          : sameDay(d, new Date(pascha.getTime() + 49 * DAY))
            ? { label: "День Святой Троицы (Пятидесятница)", kind: "great" }
            : null
    : null;

  /* Праздник дня: сначала переходящий, затем неподвижный и месяцеслов. */
  const fixed = FIXED_FEASTS[key] ?? null;
  const feast =
    movableFeast ??
    fixed ??
    (() => {
      const r = saintRecs.find((x) => x.kind === "great" || x.kind === "feast" || x.kind === "icon");
      return r ? { label: r.name, kind: r.kind } : null;
    })();

  /* Постные периоды. Приложение показывает период, но не назначает
     меру воздержания: уставные послабления зависят от дня, праздника,
     здоровья и благословения духовника. */
  const isWedFri = weekdayIdx === 3 || weekdayIdx === 5;
  const month = d.getMonth();
  const dayOfMonth = d.getDate();
  const inRange = (value: Date, start: Date, end: Date) =>
    value.getTime() >= start.getTime() && value.getTime() <= end.getTime();
  const dateAt = (y: number, m: number, day: number) => new Date(y, m, day, 12);

  const nativityFast = inRange(d, dateAt(year - (month === 0 ? 1 : 0), 10, 28), dateAt(year, 0, 6));
  const dormitionFast = inRange(d, dateAt(year, 7, 14), dateAt(year, 7, 27));
  const greatLentStart = pascha ? new Date(pascha.getTime() - 48 * DAY) : null;
  const greatLentEnd = pascha ? new Date(pascha.getTime() - DAY) : null;
  const inGreatLent = !!greatLentStart && !!greatLentEnd && inRange(d, greatLentStart, greatLentEnd);
  const pentecostDate = pascha ? new Date(pascha.getTime() + 49 * DAY) : null;
  const apostlesStart = pentecostDate ? new Date(pentecostDate.getTime() + 8 * DAY) : null;
  const apostlesEnd = dateAt(year, 5, 28);
  const inApostlesFast =
    !!pascha &&
    pascha.getFullYear() === year &&
    !!apostlesStart &&
    apostlesStart.getTime() <= apostlesEnd.getTime() &&
    inRange(d, apostlesStart, apostlesEnd);

  /* Сплошные седмицы, когда обычный пост среды и пятницы отменяется. */
  const publicanSunday = pascha ? new Date(pascha.getTime() - 70 * DAY) : null;
  const publicanWeek = !!publicanSunday &&
    inRange(d, new Date(publicanSunday.getTime() + DAY), new Date(publicanSunday.getTime() + 7 * DAY));
  const brightWeek = !!pascha && inRange(d, pascha, new Date(pascha.getTime() + 6 * DAY));
  const trinityWeek = !!pentecostDate &&
    inRange(d, new Date(pentecostDate.getTime() + DAY), new Date(pentecostDate.getTime() + 7 * DAY));
  const christmasWeek = inRange(d, dateAt(year, 0, 7), dateAt(year, 0, 17));
  const cheeseWeek = !!greatLentStart &&
    inRange(d, new Date(greatLentStart.getTime() - 7 * DAY), new Date(greatLentStart.getTime() - DAY));
  const fastFreeWeek = publicanWeek || brightWeek || trinityWeek || christmasWeek;

  let fastLabel: string;
  let meal: string;
  if (inGreatLent) {
    fastLabel = "Великий пост";
    meal = "Мера поста и устав трапезы зависят от дня и личных обстоятельств";
  } else if (inApostlesFast) {
    fastLabel = "Петров (Апостольский) пост";
    meal = "Мера поста зависит от дня и церковного устава";
  } else if (dormitionFast) {
    fastLabel = "Успенский пост";
    meal = "Мера поста зависит от дня и церковного устава";
  } else if (nativityFast) {
    fastLabel = "Рождественский пост";
    meal = "Мера поста зависит от дня и церковного устава";
  } else if (cheeseWeek) {
    fastLabel = "Сырная седмица (без мяса)";
    meal = "Особенности трапезы уточняйте по церковному календарю";
  } else if (isWedFri && !fastFreeWeek) {
    fastLabel = "Постный день (среда/пятница)";
    meal = "Мера поста зависит от дня и церковного устава";
  } else {
    fastLabel = fastFreeWeek ? "Сплошная седмица" : "Поста нет";
    meal = fastFreeWeek
      ? "В эту седмицу обычный пост в среду и пятницу отменяется"
      : "Поста нет";
  }

  /* Родительские субботы */
  let parentSaturday = false;
  if (pascha && pentecost) {
    let dimitrievskaya = new Date(year, 10, 8, 12);
    while (dimitrievskaya.getDay() !== 6) dimitrievskaya = new Date(dimitrievskaya.getTime() - DAY);
    const troitskaya = new Date(pentecost.getTime() - DAY);
    const myasopustnaya = new Date(pascha.getTime() - 57 * DAY);
    parentSaturday =
      sameDay(d, dimitrievskaya) || sameDay(d, troitskaya) || sameDay(d, myasopustnaya);
    if (sameDay(d, dimitrievskaya)) notices.unshift("Димитриевская родительская суббота — поминовение усопших");
    if (sameDay(d, troitskaya)) notices.unshift("Троицкая родительская суббота — поминовение усопших");
    if (sameDay(d, myasopustnaya)) notices.unshift("Вселенская мясопустная родительская суббота");
  }

  const isToday = sameDay(d, today);

  return {
    date: d,
    weekday: WEEKDAYS[weekdayIdx],
    weekdayShort: WEEKDAYS_SHORT[weekdayIdx],
    dateNew: fmtDate(d),
    dateOld: fmtOld(oldStyle(d)),
    weekLabel: weekLabel || "Седмица по Пятидесятнице",
    glas: glas || "Глас —",
    feast,
    saints: [...notices, ...saints],
    saintRecs,
    notices,
    fastLabel,
    meal,
    parentSaturday,
    isToday,
  };
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function ordinal(n: number): string {
  return String(n);
}

/* ── Сетка месяца: 7×6 дат, начиная с понедельника ── */
export function monthGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1, 12);
  const shift = (first.getDay() + 6) % 7; // Пн = 0
  const start = new Date(first.getTime() - shift * DAY);
  return Array.from({ length: 42 }, (_, i) => new Date(start.getTime() + i * DAY));
}

export function monthTitle(year: number, month: number): string {
  const NOM_CAP = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
  return `${NOM_CAP[month]} ${year}`;
}

/* Ключ дня для идентификации в сетке (свои дни соседних месяцев серые) */
export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}
