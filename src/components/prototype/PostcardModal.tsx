"use client";

import { useState } from "react";
import { Share2, X } from "lucide-react";
import { shareApp } from "@/lib/bridge";
import { OrthodoxCross, PhotoBanner } from "./bits";

/* Шаблоны открыток: фото-фон + подпись (9 сюжетов пакета «Открытки») */
const templates = [
  {
    id: "angel",
    title: "С днём ангела",
    caption: "Ангела вашего хранителя да хранит Господь",
    photo: "/images/card-angel.jpg",
    text: "С днём ангела! Ангела вашего хранителя да хранит Господь. Открытка из мини-приложения «Православные»",
  },
  {
    id: "peace",
    title: "Мир вашему дому",
    caption: "Мир вашему дому и благословение Божие",
    photo: "/images/candles.jpg",
    text: "Мир вашему дому и благословение Божие. Открытка из мини-приложения «Православные»",
  },
  {
    id: "feast",
    title: "С праздником",
    caption: "Праздник радости — икона и молитва дня",
    photo: "/images/domes.jpg",
    text: "С праздником! Молитвенного вам дня. Открытка из мини-приложения «Православные»",
  },
  {
    id: "easter",
    title: "Светлой Пасхи",
    caption: "Христос Воскресе! Воистину Воскресе!",
    photo: "/images/card-easter.jpg",
    text: "Христос Воскресе! Светлой Пасхи вам и вашим близким. Открытка из мини-приложения «Православные»",
  },
  {
    id: "icon",
    title: "Под покровом",
    caption: "Да хранит вас молитва перед иконой",
    photo: "/images/card-icon.jpg",
    text: "Под молитвенным покровом да хранит вас Господь. Открытка из мини-приложения «Православные»",
  },
  {
    id: "flowers",
    title: "Чистоты и света",
    caption: "Чистоты, света и тихой радости душе",
    photo: "/images/card-flowers.jpg",
    text: "Чистоты, света и тихой радости душе. Открытка из мини-приложения «Православные»",
  },
  {
    id: "candle",
    title: "Тёплой молитвы",
    caption: "Пусть горит свеча надежды и веры",
    photo: "/images/card-candle.jpg",
    text: "Тёплой молитвы вам — пусть горит свеча надежды и веры. Открытка из мини-приложения «Православные»",
  },
  {
    id: "thanks",
    title: "С благодарностью",
    caption: "С благодарностью за добро и любовь",
    photo: "/images/card-gift.jpg",
    text: "С благодарностью за добро и любовь. Открытка из мини-приложения «Православные»",
  },
  {
    id: "christmas",
    title: "С Рождеством",
    caption: "Светлых дней Рождества и Крещения",
    photo: "/images/temple-winter.jpg",
    text: "С Рождеством Христовым! Света, тепла и молитвенной радости. Открытка из мини-приложения «Православные»",
  },
] as const;

export default function PostcardModal({
  onClose,
  toast,
}: {
  onClose: () => void;
  toast: (m: string) => void;
}) {
  const [tpl, setTpl] = useState<string>("angel");
  const [sending, setSending] = useState(false);
  const active = templates.find((t) => t.id === tpl)!;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Отправить открытку">
      <button aria-label="Закрыть" onClick={onClose} className="absolute inset-0 bg-black/50" />
      {/* Панель прибита к низу ВЬЮПОРТА (не колонки), по центру приложения */}
      <div className="absolute inset-x-0 bottom-0 flex justify-center pointer-events-none">
      <div
        className="animate-slide-up relative w-full max-w-[480px] max-h-[92dvh] overflow-y-auto pr-scroll rounded-t-2xl p-4 pointer-events-auto"
        style={{
          background: "var(--an-card)",
          border: "1px solid var(--an-line)",
          boxShadow: "0 -10px 40px rgba(24,29,36,.18)",
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="pr-display text-[1rem]" style={{ color: "var(--an-ink)" }}>
            Открытка близкому
          </h2>
          <button
            aria-label="Закрыть"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-black/5"
            style={{ color: "var(--an-ink-soft)" }}
          >
            <X size={17} />
          </button>
        </div>

        {/* Шаблоны */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {templates.map((t) => (
            <button
              key={t.id}
              onClick={() => setTpl(t.id)}
              aria-pressed={tpl === t.id}
              className="rounded-xl p-1.5 flex flex-col items-center gap-1 transition-all"
              style={{
                border: tpl === t.id ? "2px solid var(--an-ink)" : "1px solid var(--an-line)",
                background: "var(--an-card)",
                boxShadow: tpl === t.id ? "0 2px 8px rgba(24,29,36,.12)" : "none",
              }}
            >
              <span className="relative w-full h-12 rounded-lg overflow-hidden">
                <img
                  src={t.photo}
                  alt=""
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <span
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(16,21,28,0) 45%, rgba(16,21,28,.35) 100%)",
                  }}
                />
              </span>
              <span
                className="pr-serif text-[0.6rem] leading-tight text-center"
                style={{ color: tpl === t.id ? "var(--an-ink)" : "var(--an-ink-soft)" }}
              >
                {t.title}
              </span>
            </button>
          ))}
        </div>

        {/* Превью */}
        <PhotoBanner
          src={active.photo}
          alt={`Фон открытки: ${active.title}`}
          strength="center"
          className="p-4 mb-3 text-center"
        >
          <div className="flex justify-center mb-1">
            <OrthodoxCross size={26} color="#ffffff" />
          </div>
          <div className="pr-display text-[1.05rem] text-white">
            {active.title}
          </div>
          <div className="pr-read italic text-[0.8rem] mt-1" style={{ color: "rgba(255,255,255,.88)" }}>
            «{active.caption}»
          </div>
          <div className="text-[0.58rem] mt-2 tracking-wide" style={{ color: "rgba(255,255,255,.65)" }}>
            «Православные» · мини-приложение ОК
          </div>
        </PhotoBanner>

        <button
          onClick={async () => {
            setSending(true);
            const how = await shareApp(active.text);
            setSending(false);
            toast(
              how === "clipboard"
                ? "Текст открытки скопирован — вставьте в пост или сообщение ОК"
                : "Открываем окно публикации ОК — выберите, кому отправить"
            );
          }}
          disabled={sending}
          className="pr-btn pr-btn-primary w-full"
        >
          <Share2 size={14} /> {sending ? "Открываем…" : "Отправить через ОК"}
        </button>

        <p className="pr-serif text-[0.64rem] mt-2.5 text-center" style={{ color: "var(--an-ink-soft)" }}>
          Отправка через стандартное окно ОК: пост в ленту, сообщение или история
        </p>
      </div>
      </div>
    </div>
  );
}
