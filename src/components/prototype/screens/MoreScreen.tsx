"use client";

import { useState } from "react";
import {
  Bell,
  ChevronRight,
  Gift,
  Info,
  MapPin,
  Moon,
  Settings,
  Share2,
  Sun,
} from "lucide-react";
import type { BaptismProfile, Level, Screen } from "@/lib/app-data";
import { APP_VERSION, levelLabels } from "@/lib/app-data";
import { formatSaintsDate, nameDaysForName, saintsForDate } from "@/lib/content/calendar";
import { PhotoBanner, SectionTitle } from "../bits";
import { requestNotifications, shareApp } from "@/lib/bridge";

export default function MoreScreen({
  level,
  userName,
  userPhoto,
  profile,
  go,
  reRunSurvey,
  openGifts,
  dark,
  setDark,
  textScale,
  setTextScale,
  toast,
  inside,
}: {
  level: Level | null;
  userName: string;
  userPhoto?: string;
  profile: BaptismProfile | null;
  go: (s: Screen) => void;
  reRunSurvey: () => void;
  openGifts: () => void;
  dark: boolean;
  setDark: (v: boolean) => void;
  textScale: number;
  setTextScale: (v: number) => void;
  toast: (m: string) => void;
  inside: boolean;
}) {
  const [about, setAbout] = useState(false);
  const [notifSwitch, setNotifSwitch] = useState(true);

  /* Святой покровитель и именины по данным крещения из анкеты */
  const patron = (() => {
    if (!profile?.baptismDate) return null;
    const d = new Date(profile.baptismDate + "T12:00:00");
    if (isNaN(d.getTime())) return null;
    const s = saintsForDate(d);
    return s.saints[0] ?? null;
  })();
  const nameDays = profile?.baptismName ? nameDaysForName(profile.baptismName) : [];

  const rows: { icon: React.ReactNode; label: string; note: string; action: () => void }[] = [
    {
      icon: <Gift size={16} />,
      label: "Отправить подарок",
      note: "Православные коллекции — в разделе подарков ОК",
      action: openGifts,
    },
  ];

  return (
    <div className="px-4 py-4 pb-8 animate-fade-up">
      {/* Профиль */}
      <PhotoBanner
        src="/images/monastery.jpg"
        alt="Монастырь на закате"
        strength="firm"
        className="px-3.5 py-3 mb-4"
        contentClassName="flex items-center gap-3"
      >
        {userPhoto ? (
          <img
            src={userPhoto}
            alt={userName}
            className="w-11 h-11 rounded-full object-cover shrink-0"
            style={{ border: "1.5px solid rgba(255,255,255,.4)" }}
          />
        ) : (
          <span
            className="w-11 h-11 rounded-full flex items-center justify-center pr-display text-[1.1rem] shrink-0"
            style={{ background: "rgba(255,255,255,.14)", color: "#ffffff", border: "1.5px solid rgba(255,255,255,.32)" }}
          >
            {userName[0]?.toUpperCase() ?? "?"}
          </span>
        )}
        <div className="flex-1 min-w-0">
          <div className="pr-display text-[1.02rem] text-white truncate">
            {profile?.baptismName ? `${userName} · ${profile.baptismName}` : userName}
          </div>
          <div className="text-[0.66rem] text-[rgba(255,255,255,.75)] leading-snug">
            Уровень: {level ? `«${levelLabels[level]}»` : "не выбран"} · анкета
            {profile?.baptismDate && patron ? ` · покровитель: ${patron}` : ""}
          </div>
        </div>
        <button
          onClick={reRunSurvey}
          className="pr-btn pr-btn-accent !min-h-[36px] !px-3 !text-[0.7rem] shrink-0"
        >
          Анкета
        </button>
      </PhotoBanner>

      {/* Крещение и святцы — если заполнено в анкете */}
      {(profile?.baptismName || profile?.baptismDate) && (
        <div className="orn-card px-3.5 py-3 mb-4">
          <SectionTitle className="mb-2">Крещение</SectionTitle>
          {profile?.baptismName && (
            <div className="pr-serif text-[0.78rem] mb-1" style={{ color: "var(--an-ink)" }}>
              Имя при крещении: <b>{profile.baptismName}</b>
            </div>
          )}
          {profile?.baptismDate && (
            <div className="pr-serif text-[0.78rem] mb-1" style={{ color: "var(--an-ink)" }}>
              Дата крещения:{" "}
              <b>
                {new Date(profile.baptismDate + "T12:00:00").toLocaleDateString("ru-RU", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </b>
            </div>
          )}
          {patron && (
            <div className="pr-serif text-[0.72rem]" style={{ color: "var(--an-ink-soft)" }}>
              Святой покровитель по святцам: {patron}
            </div>
          )}
          {nameDays.length > 0 && (
            <div className="pr-serif text-[0.72rem] mt-0.5" style={{ color: "var(--an-ink-soft)" }}>
              Именины: {nameDays.map((n) => formatSaintsDate(n.dateKey)).join(", ")}
            </div>
          )}
        </div>
      )}

      {/* Поделиться приложением */}
      <button
        onClick={async () => {
          const how = await shareApp(
            "«Православные» — православный ежедневник внутри ОК: святцы, молитвослов и храмы рядом"
          );
          toast(
            how === "clipboard"
              ? "Ссылка скопирована — вставьте в пост или сообщение"
              : "Открываем окно публикации ОК"
          );
        }}
        className="orn-card-soft w-full flex items-center gap-3 px-3.5 py-3 text-left transition-all hover:shadow-md mb-4"
      >
        <span
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: "var(--an-ink)", color: "#ffffff" }}
        >
          <Share2 size={15} />
        </span>
        <span className="flex-1">
          <span className="pr-serif font-bold text-[0.82rem] block" style={{ color: "var(--an-ink)" }}>
            Рассказать друзьям
          </span>
          <span className="pr-serif text-[0.68rem] block" style={{ color: "var(--an-ink-soft)" }}>
            Отправить ссылку на приложение в ОК
          </span>
        </span>
        <ChevronRight size={15} style={{ color: "var(--an-ink)" }} />
      </button>

      {/* Разделы */}
      <SectionTitle className="mb-2">Разделы</SectionTitle>
      <div className="flex flex-col gap-2 mb-4">
        {rows.map((r) => (
          <button
            key={r.label}
            onClick={r.action}
            className="orn-card-soft flex items-center gap-3 px-3.5 py-3 text-left transition-all hover:shadow-md"
          >
            <span
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "var(--an-tile)", color: "var(--an-ink)" }}
            >
              {r.icon}
            </span>
            <span className="flex-1 min-w-0">
              <span className="pr-serif font-bold text-[0.82rem] block" style={{ color: "var(--an-ink)" }}>
                {r.label}
              </span>
              <span className="pr-serif text-[0.68rem] block truncate" style={{ color: "var(--an-ink-soft)" }}>
                {r.note}
              </span>
            </span>
            <ChevronRight size={15} style={{ color: "var(--an-ink)" }} />
          </button>
        ))}
      </div>

      {/* Настройки */}
      <SectionTitle className="mb-2">Настройки</SectionTitle>
      <div className="orn-card px-3.5 py-1 mb-4">
        <SwitchRow
          icon={<Bell size={15} />}
          label="Уведомления ОК"
          note="Правило, праздники и именины"
          checked={notifSwitch}
          onChange={async (v) => {
            if (v) {
              const ok = await requestNotifications();
              setNotifSwitch(true);
              toast(ok ? "Уведомления включены" : "Уведомления подключатся после публикации в ОК");
            } else {
              setNotifSwitch(false);
              toast("Уведомления выключены — включить можно и в настройках ОК");
            }
          }}
        />
        <Divider />
        <div className="flex items-center gap-3 py-2.5">
          <span style={{ color: "var(--an-ink)" }}>
            <Settings size={15} />
          </span>
          <span className="flex-1 pr-serif text-[0.78rem]" style={{ color: "var(--an-ink)" }}>
            Размер шрифта
          </span>
          <div className="flex gap-1">
            {([100, 115, 130] as const).map((v, i) => (
              <button
                key={v}
                onClick={() => {
                  setTextScale(v);
                  toast(["Обычный шрифт", "Крупный шрифт", "Очень крупный шрифт"][i]);
                }}
                className={`pr-chip ${textScale === v ? "pr-chip-active" : ""}`}
                aria-label={["Обычный шрифт", "Крупный шрифт", "Очень крупный шрифт"][i]}
                aria-pressed={textScale === v}
              >
                {["A", "A+", "A++"][i]}
              </button>
            ))}
          </div>
        </div>
        <Divider />
        <div className="flex items-center gap-3 py-2.5">
          <span style={{ color: "var(--an-ink)" }}>{dark ? <Moon size={15} /> : <Sun size={15} />}</span>
          <span className="flex-1">
            <span className="pr-serif text-[0.78rem] block" style={{ color: "var(--an-ink)" }}>
              Оформление интерфейса
            </span>
            <span className="pr-serif text-[0.64rem]" style={{ color: "var(--an-ink-soft)" }}>
              Светлая или тёмная тема
            </span>
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setDark(false)}
              className={`pr-chip ${!dark ? "pr-chip-active" : ""}`}
              aria-pressed={!dark}
            >
              Светлая
            </button>
            <button
              onClick={() => setDark(true)}
              className={`pr-chip ${dark ? "pr-chip-active" : ""}`}
              aria-pressed={dark}
            >
              Тёмная
            </button>
          </div>
        </div>
        <Divider />
        <div className="flex items-center gap-3 py-2.5">
          <span style={{ color: "var(--an-ink)" }}>
            <MapPin size={15} />
          </span>
          <span className="flex-1">
            <span className="pr-serif text-[0.78rem] block" style={{ color: "var(--an-ink)" }}>
              Геолокация
            </span>
            <span className="pr-serif text-[0.64rem]" style={{ color: "var(--an-ink-soft)" }}>
              Управляется настройками телефона и ОК
            </span>
          </span>
        </div>
      </div>

      {/* О приложении */}
      <button
        onClick={() => setAbout(!about)}
        className="orn-card-soft w-full flex items-center gap-3 px-3.5 py-3 text-left"
        aria-expanded={about}
      >
        <Info size={15} style={{ color: "var(--an-ink)" }} />
        <span className="flex-1 pr-serif text-[0.78rem]" style={{ color: "var(--an-ink)" }}>
          О приложении
        </span>
        <ChevronRight
          size={15}
          style={{ color: "var(--an-ink)", transform: about ? "rotate(90deg)" : "none", transition: "transform .15s" }}
        />
      </button>
      {about && (
        <div className="orn-card px-3.5 py-3 mt-2 animate-fade-up">
          <p className="pr-serif text-[0.72rem] leading-relaxed mb-2" style={{ color: "var(--an-ink)" }}>
            «Православные» v1.0 — мини-приложение для Одноклассников на платформе VK Mini Apps
            (VK Bridge, <code>vk_client=ok</code>).{" "}
            {inside ? "Сейчас запущено внутри ОК." : "Сейчас открыт предпросмотр вне соцсети."}
          </p>
          <ul className="pr-serif text-[0.7rem] leading-relaxed list-disc pl-4" style={{ color: "var(--an-ink-soft)" }}>
            <li>Святцы, месяцеслов и посты — по календарю РПЦ (непереходящие праздники, Пасха 2024–2028)</li>
            <li>Молитвослов — полные тексты церковнославянских молитв, счётчик сохраняется на устройстве</li>
            <li>Библиотека — все тексты внутри приложения: Библия (Новый Завет и Псалтирь, Синодальный перевод), жития, святые отцы, ответы на вопросы; закладки и место чтения сохраняются</li>
            <li>Карта — официальная база храмов РПЦ (map.patriarchia.ru); маршрут — Яндекс.Карты</li>
            <li>Профиль: имя при крещении, дата крещения и святцы — покровитель и именины</li>
            <li>Профиль и «Поделиться» — через VK Bridge (аватар и имя из ОК)</li>
          </ul>
          <p className="pr-serif text-[0.64rem] mt-2" style={{ color: "var(--an-ink-soft)" }}>
            Дизайн-система по мотивам фирменного стиля ANTIПA (antipa-lavka.ru).
          </p>
        </div>
      )}
      <div
        className="pt-5 pb-1 text-center text-[0.62rem]"
        style={{ color: "var(--an-ink-faint)" }}
      >
        Православные · версия {APP_VERSION}
      </div>
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: "var(--an-line)" }} />;
}

function SwitchRow({
  icon,
  label,
  note,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  note: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <span style={{ color: "var(--an-ink)" }}>{icon}</span>
      <span className="flex-1">
        <span className="pr-serif text-[0.78rem] block" style={{ color: "var(--an-ink)" }}>
          {label}
        </span>
        <span className="pr-serif text-[0.64rem]" style={{ color: "var(--an-ink-soft)" }}>
          {note}
        </span>
      </span>
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
    </div>
  );
}
