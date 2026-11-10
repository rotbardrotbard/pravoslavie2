import assert from "node:assert/strict";
import {
  azbykaDayUrl,
  formatSaintsDate,
  getDayInfo,
  nameDaysForName,
  orthodoxPaschaDate,
  saintsForDate,
} from "../src/lib/content/calendar";

function localDateKey(date: Date | null): string | null {
  if (!date) return null;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function day(value: string) {
  return getDayInfo(new Date(`${value}T12:00:00`));
}

const paschaCases: [number, string][] = [
  [2024, "2024-05-05"],
  [2025, "2025-04-20"],
  [2026, "2026-04-12"],
  [2027, "2027-05-02"],
  [2028, "2028-04-16"],
];
for (const [year, expected] of paschaCases) {
  assert.equal(localDateKey(orthodoxPaschaDate(year)), expected, `Pascha ${year}`);
}

const fastCases: [string, string][] = [
  ["2026-02-23", "Великий пост"],
  ["2026-04-11", "Великий пост"],
  ["2026-06-08", "Петров (Апостольский) пост"],
  ["2026-07-11", "Петров (Апостольский) пост"],
  ["2026-07-12", "Поста нет"],
  ["2026-08-14", "Успенский пост"],
  ["2026-08-27", "Успенский пост"],
  ["2026-11-28", "Рождественский пост"],
  ["2026-01-18", "Однодневный строгий пост"],
  ["2026-09-11", "Однодневный строгий пост"],
  ["2026-09-27", "Однодневный строгий пост"],
  ["2026-02-04", "Сплошная седмица"],
  ["2026-04-15", "Сплошная седмица"],
  ["2026-06-03", "Сплошная седмица"],
  ["2026-01-14", "Сплошная седмица"],
  ["2026-11-11", "Постный день (среда/пятница)"],
];
for (const [date, expected] of fastCases) {
  assert.equal(day(date).fastLabel, expected, `Fast label ${date}`);
}

const memorialSaturdays = [
  "2026-02-14",
  "2026-03-07",
  "2026-03-14",
  "2026-03-21",
  "2026-05-30",
  "2026-11-07",
];
for (const date of memorialSaturdays) {
  assert.equal(day(date).parentSaturday, true, `Memorial Saturday ${date}`);
}

assert.equal(day("2026-11-10").weekLabel, "Седмица 24-я по Пятидесятнице");
assert.equal(day("2026-11-10").glas, "Глас 6-й");
assert.equal(day("2026-04-05").feast?.label, "Вход Господень в Иерусалим (Вербное воскресенье)");
assert.equal(day("2026-04-12").feast?.label, "Светлое Христово Воскресение (Пасха)");
assert.equal(day("2026-05-21").feast?.label, "Вознесение Господне");
assert.equal(day("2026-05-31").feast?.label, "День Святой Троицы (Пятидесятница)");

assert.equal(azbykaDayUrl(new Date(2026, 10, 10, 12)), "https://azbyka.ru/days/2026-11-10");
assert.equal(formatSaintsDate("11-10"), "10 ноября");
assert.ok(nameDaysForName("Александр").length > 0, "Alexander name days should be found");
assert.ok(
  saintsForDate(new Date(2026, 10, 10, 12)).saints.some((name) => name.includes("Терентия и Неониллы")),
  "Nov 10 menology should include Terentius and Neonilla",
);
assert.ok(day("2100-03-01").dateOld.startsWith("15 февраля"), "Julian offset changes to 14 days in March 2100");

console.log(`Calendar checks passed: ${paschaCases.length} Pascha dates, ${fastCases.length} fast days, ${memorialSaturdays.length} memorial Saturdays.`);
