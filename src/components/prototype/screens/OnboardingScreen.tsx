"use client";

import { useMemo, useState } from "react";
import {
  Bell,
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Church,
  Flame,
  HelpCircle,
  Library,
  MapPin,
  Sparkles,
  Cross,
  Check,
} from "lucide-react";
import type { BaptismProfile, Interest, Level } from "@/lib/app-data";
import { formatSaintsDate, nameDaysForName, saintsForDate } from "@/lib/content/calendar";
import { OrthodoxCross, PhotoBanner } from "../bits";

const levels: { id: Level; label: string; hint: string; icon: React.ReactNode }[] = [
  { id: "beginner", label: "Только начинаю", hint: "Подскажем с чего начать", icon: <Sparkles size={17} /> },
  { id: "occasional", label: "Верю, хожу в храм редко", hint: "Поможем выстроить правило", icon: <Church size={17} /> },
  { id: "churched", label: "Воцерковлён(а)", hint: "Настроим под вашу практику", icon: <Flame size={17} /> },
];

const interests: { id: Interest; label: string; icon: React.ReactNode }[] = [
  { id: "prayer", label: "Утренняя и вечерняя молитва", icon: <Flame size={16} /> },
  { id: "scripture", label: "Чтение Писания", icon: <BookOpen size={16} /> },
  { id: "traditions", label: "История, традиции, праздники", icon: <CalendarDays size={16} /> },
  { id: "questions", label: "Вопросы о вере", icon: <HelpCircle size={16} /> },
];

export default function OnboardingScreen({
  onFinish,
  toast,
}: {
  onFinish: (lv: Level, interests: Interest[], geo: boolean, notif: boolean, profile: BaptismProfile) => void;
  toast: (m: string) => void;
}) {
  const [step, setStep] = useState(0); // 0 — заставка, 1..3 — анкета
  const [level, setLevel] = useState<Level | null>(null);
  const [interestsSel, setInterestsSel] = useState<Interest[]>([]);
  const [geo, setGeo] = useState(true);
  const [notif, setNotif] = useState(true);

  /* Профиль крещения */
  const [baptName, setBaptName] = useState("");
  const [baptDate, setBaptDate] = useState("");

  /* Святцы: покровитель по дате крещения + именины по имени */
  const saintsOfDate = useMemo(() => {
    if (!baptDate) return null;
    const d = new Date(baptDate + "T12:00:00");
    if (isNaN(d.getTime())) return null;
    return saintsForDate(d);
  }, [baptDate]);

  const nameDays = useMemo(() => (baptName.trim() ? nameDaysForName(baptName) : []), [baptName]);

  const toggleInterest = (id: Interest) => {
    setInterestsSel((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  return (
    <div className="px-4 py-4 pb-8 animate-fade-up">
      {/* Прогресс анкеты */}
      {step > 0 && (
        <div className="flex items-center gap-2 mb-4">
          {step > 1 && (
            <button
              aria-label="Предыдущий шаг"
              onClick={() => setStep((s) => s - 1)}
              className="w-7 h-7 rounded-full flex items-center justify-center"
              style={{ border: "1px solid var(--an-line-strong)", color: "var(--an-ink)" }}
            >
              <ChevronLeft size={14} />
            </button>
          )}
          {[1, 2, 3].map((n) => (
            <span
              key={n}
              className="h-1.5 rounded-full transition-all"
              style={{
                width: n === step ? 26 : 10,
                background: n <= step ? "var(--an-accent)" : "var(--an-line)",
              }}
            />
          ))}
          <span className="pr-serif text-[0.66rem] ml-1" style={{ color: "var(--an-ink-soft)" }}>
            шаг {step} из 3
          </span>
        </div>
      )}

      {/* Заставка */}
      {step === 0 && (
        <div className="text-center animate-fade-up">
          <PhotoBanner
            src="/images/hero-church.jpg"
            alt="Белый храм с золотыми куполами в утреннем свете"
            strength="firm"
            position="center 62%"
            className="mb-4"
          >
            <div className="px-6 py-7">
              <div className="flex justify-center mb-2">
                <OrthodoxCross size={44} />
              </div>
              <div className="pr-display text-[1.5rem] text-[#ffffff] tracking-wide">Православные</div>
              <div className="pr-read italic text-[0.8rem] text-[rgba(255,255,255,.82)] mt-1">
                Ваш православный ежедневник внутри Одноклассников
              </div>
            </div>
          </PhotoBanner>

          <div className="text-left flex flex-col gap-2 mb-5">
            {[
              { icon: <CalendarDays size={15} />, t: "Календарь и святцы — что сегодня в Церкви" },
              { icon: <Flame size={15} />, t: "Молитвослов с правилом и напоминаниями" },
              { icon: <BookOpen size={15} />, t: "Библии и жития — полностью внутри приложения" },
              { icon: <MapPin size={15} />, t: "Карта храмов и святынь рядом" },
              { icon: <Library size={15} />, t: "Библиотека с закладками и памятью чтения" },
            ].map((r, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <span
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: "var(--an-tile)", color: "var(--an-ink)" }}
                >
                  {r.icon}
                </span>
                <span className="pr-serif text-[0.8rem] leading-snug">{r.t}</span>
              </div>
            ))}
          </div>

          <button onClick={() => setStep(1)} className="pr-btn pr-btn-primary w-full">
            Начать <ChevronRight size={15} />
          </button>
          <p className="pr-serif text-[0.64rem] mt-2.5" style={{ color: "var(--an-ink-soft)" }}>
            Вход через аккаунт ОК — без отдельной регистрации
          </p>
        </div>
      )}

      {/* Шаг 1: уровень */}
      {step === 1 && (
        <div className="animate-fade-up">
          <h2 className="pr-display text-[1.08rem] mb-1" style={{ color: "var(--an-ink)" }}>
            Как давно вы в вере?
          </h2>
          <p className="pr-serif text-[0.72rem] mb-4" style={{ color: "var(--an-ink-soft)" }}>
            Ответ определит сложность контента — изменить можно в любой момент.
          </p>
          <div className="flex flex-col gap-2 mb-5">
            {levels.map((l) => (
              <button
                key={l.id}
                onClick={() => {
                  setLevel(l.id);
                  setStep(2);
                }}
                className="orn-card-soft flex items-center gap-3 px-3.5 py-3 text-left transition-all hover:shadow-md"
                style={{
                  border: level === l.id ? "2px solid var(--an-accent)" : "1px solid var(--an-line)",
                }}
              >
                <span
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: "var(--an-tile)", color: "var(--an-ink)" }}
                >
                  {l.icon}
                </span>
                <span>
                  <span className="pr-serif font-bold text-[0.84rem] block" style={{ color: "var(--an-ink)" }}>
                    {l.label}
                  </span>
                  <span className="pr-serif text-[0.68rem]" style={{ color: "var(--an-ink-soft)" }}>
                    {l.hint}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Шаг 2: интересы — множественный выбор */}
      {step === 2 && (
        <div className="animate-fade-up">
          <h2 className="pr-display text-[1.08rem] mb-1" style={{ color: "var(--an-ink)" }}>
            Что вам ближе всего?
          </h2>
          <p className="pr-serif text-[0.72rem] mb-4" style={{ color: "var(--an-ink-soft)" }}>
            Выберите один или несколько вариантов — отмеченное поставим на Дом первыми карточками.
          </p>
          <div className="flex flex-col gap-2 mb-4">
            {interests.map((it) => {
              const selected = interestsSel.includes(it.id);
              return (
                <button
                  key={it.id}
                  onClick={() => toggleInterest(it.id)}
                  aria-pressed={selected}
                  className="orn-card-soft flex items-center gap-3 px-3.5 py-3 text-left transition-all hover:shadow-md"
                  style={{
                    border: selected ? "2px solid var(--an-accent)" : "1px solid var(--an-line)",
                  }}
                >
                  <span
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      background: selected ? "var(--an-ink)" : "var(--an-tile)",
                      color: selected ? "#ffffff" : "var(--an-ink)",
                    }}
                  >
                    {selected ? <Check size={15} /> : it.icon}
                  </span>
                  <span className="pr-serif text-[0.8rem]" style={{ color: "var(--an-ink)" }}>
                    {it.label}
                  </span>
                </button>
              );
            })}
          </div>
          <button
            onClick={() => {
              if (interestsSel.length === 0) {
                toast("Выберите хотя бы один вариант");
                return;
              }
              setStep(3);
            }}
            className="pr-btn pr-btn-primary w-full"
          >
            {interestsSel.length > 1 ? `Выбрано: ${interestsSel.length} — далее` : "Далее"}{" "}
            <ChevronRight size={15} />
          </button>
        </div>
      )}

      {/* Шаг 3: крещение, святцы и разрешения */}
      {step === 3 && (
        <div className="animate-fade-up">
          <h2 className="pr-display text-[1.08rem] mb-1" style={{ color: "var(--an-ink)" }}>
            Крещение и святцы
          </h2>
          <p className="pr-serif text-[0.72rem] mb-4" style={{ color: "var(--an-ink-soft)" }}>
            Необязательно — но с этими данными приложение напомнит именины и покажет святого покровителя.
          </p>

          <div className="orn-card px-3.5 py-3 mb-4">
            <label className="block mb-3">
              <span className="pr-serif text-[0.72rem] font-bold block mb-1" style={{ color: "var(--an-ink)" }}>
                Имя при крещении
              </span>
              <input
                value={baptName}
                onChange={(e) => setBaptName(e.target.value)}
                placeholder="Например: Иоанн"
                className="w-full rounded-lg px-3 py-2.5 pr-serif text-[0.82rem] outline-none"
                style={{ background: "var(--an-tile)", color: "var(--an-ink)", border: "1px solid var(--an-line)" }}
                aria-label="Имя при крещении"
              />
            </label>

            <label className="block mb-1">
              <span className="pr-serif text-[0.72rem] font-bold block mb-1" style={{ color: "var(--an-ink)" }}>
                Дата крещения
              </span>
              <input
                type="date"
                value={baptDate}
                onChange={(e) => setBaptDate(e.target.value)}
                className="w-full rounded-lg px-3 py-2.5 pr-serif text-[0.82rem] outline-none"
                style={{ background: "var(--an-tile)", color: "var(--an-ink)", border: "1px solid var(--an-line)" }}
                aria-label="Дата крещения"
              />
            </label>

            {/* Святцы по дате крещения */}
            <div
              className="mt-3 rounded-lg px-3 py-2.5 flex gap-2.5 items-start"
              style={{ background: "var(--an-soft)", border: "1px dashed var(--an-line-strong)" }}
            >
              <Cross size={15} className="mt-0.5 shrink-0" style={{ color: "var(--an-accent)" }} />
              <div className="min-w-0">
                {baptDate && saintsOfDate ? (
                  saintsOfDate.saints.length > 0 ? (
                    <>
                      <div className="pr-serif text-[0.72rem] font-bold" style={{ color: "var(--an-ink)" }}>
                        По святцам на {formatSaintsDate(baptDate.slice(5))}
                      </div>
                      {saintsOfDate.saints.slice(0, 3).map((s, i) => (
                        <div key={i} className="pr-serif text-[0.68rem] leading-snug" style={{ color: "var(--an-ink-soft)" }}>
                          • {s}
                        </div>
                      ))}
                      {nameDays.length > 0 && (
                        <div className="pr-serif text-[0.68rem] leading-snug mt-1.5" style={{ color: "var(--an-ink)" }}>
                          Именины «{baptName.trim()}»:{" "}
                          {nameDays.map((n) => `${formatSaintsDate(n.dateKey)} — ${n.saint}`).join("; ")}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="pr-serif text-[0.68rem]" style={{ color: "var(--an-ink-soft)" }}>
                      В этот день нет крупного праздника — святого покровителя уточним по полному
                      месяцеслову при синхронизации календаря
                    </div>
                  )
                ) : (
                  <div className="pr-serif text-[0.68rem]" style={{ color: "var(--an-ink-soft)" }}>
                    Укажите дату крещения — покажем по святцам, какой святой покровительствует этому дню
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 mb-5">
            <div className="orn-card-soft flex items-center gap-3 px-3.5 py-3">
              <span
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "var(--an-tile)", color: "var(--an-ink)" }}
              >
                <MapPin size={17} />
              </span>
              <span className="flex-1">
                <span className="pr-serif font-bold text-[0.82rem] block">Геолокация</span>
                <span className="pr-serif text-[0.66rem]" style={{ color: "var(--an-ink-soft)" }}>
                  Показывать храмы и святыни рядом
                </span>
              </span>
              <Switch checked={geo} onChange={setGeo} label="Геолокация" />
            </div>

            <div className="orn-card-soft flex items-center gap-3 px-3.5 py-3">
              <span
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "var(--an-tile)", color: "var(--an-ink)" }}
              >
                <Bell size={17} />
              </span>
              <span className="flex-1">
                <span className="pr-serif font-bold text-[0.82rem] block">Уведомления ОК</span>
                <span className="pr-serif text-[0.66rem]" style={{ color: "var(--an-ink-soft)" }}>
                  Напоминание о правиле и большие праздники
                </span>
              </span>
              <Switch checked={notif} onChange={setNotif} label="Уведомления" />
            </div>
          </div>

          <button
            onClick={() => {
              if (!level || interestsSel.length === 0) {
                toast("Заполните предыдущие шаги");
                return;
              }
              const profile: BaptismProfile = {
                baptismName: baptName.trim() || null,
                baptismDate: baptDate || null,
              };
              onFinish(level, interestsSel, geo, notif, profile);
            }}
            className="pr-btn pr-btn-accent w-full"
          >
            Всё готово
          </button>
        </div>
      )}
    </div>
  );
}

function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="w-[42px] h-[24px] rounded-full relative transition-colors shrink-0"
      style={{ background: checked ? "var(--an-ink)" : "var(--an-line-strong)" }}
    >
      <span
        className="absolute top-[3px] w-[18px] h-[18px] rounded-full bg-white transition-all"
        style={{ left: checked ? 21 : 3, boxShadow: "0 1px 3px rgba(0,0,0,.3)" }}
      />
    </button>
  );
}
