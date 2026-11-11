/* Проверка календарного движка: сверка с известными данными «Азбуки веры» */
const DAY = 86_400_000;

const PASCHA = { 2026: "2026-04-12", 2027: "2027-05-02" };

function lastSundayOnOrBefore(d) {
  const copy = new Date(d.getTime());
  copy.setHours(12, 0, 0, 0);
  return new Date(copy.getTime() - copy.getDay() * DAY);
}

function check(dateStr) {
  const d = new Date(dateStr + "T12:00:00");
  const year = d.getFullYear();
  const pascha = new Date(PASCHA[year] + "T12:00:00");
  const pentecost = new Date(pascha.getTime() + 49 * DAY);
  const antipascha = new Date(pascha.getTime() + 7 * DAY);

  let weekLabel;
  if (d.getDay() === 0) {
    const n = Math.round((d.getTime() - pentecost.getTime()) / (7 * DAY));
    weekLabel = `Неделя ${n}-я по Пятидесятнице`;
  } else {
    const dukhovDen = pentecost.getTime() + DAY;
    const n = Math.floor((d.getTime() - dukhovDen) / (7 * DAY)) + 1;
    weekLabel = `Седмица ${n}-я по Пятидесятнице`;
  }
  const lastSun = lastSundayOnOrBefore(d);
  const weeks = Math.round((lastSun.getTime() - antipascha.getTime()) / (7 * DAY));
  const glas = `Глас ${(weeks % 8) + 1}-й`;

  // Димитриевская суббота: суббота перед 8 ноября
  let dimit = new Date(year, 10, 8, 12);
  while (dimit.getDay() !== 6) dimit = new Date(dimit.getTime() - DAY);
  const isDimitriev = d.toDateString() === dimit.toDateString();

  // Рождественский пост
  const month = d.getMonth(), dom = d.getDate();
  const nativity = (month === 10 && dom >= 28) || month === 11 || (month === 0 && dom <= 6);

  console.log(
    dateStr,
    "|",
    weekLabel + ",",
    glas,
    "| Димитриевская сб.:", isDimitriev ? "ДА" : "нет",
    "| Рожд. пост:", nativity ? "ДА" : "нет",
    "| Ср/Пт:", [3, 5].includes(d.getDay()) ? "да" : "нет"
  );
}

[
  "2026-11-01", // ожидаем: Неделя 22-я, Глас 5-й (сверка с Азбукой веры)
  "2026-11-02", // Седмица 23-я
  "2026-11-07", // Димитриевская родительская суббота
  "2026-11-08", // Неделя 23-я
  "2026-11-21", // Михайлов день (вс)
  "2026-11-27", // пятница, постный день
  "2026-11-28", // начало Рождественского поста (сб)
  "2026-12-04", // Введение (пт)
  "2027-01-07", // Рождество
].forEach(check);
