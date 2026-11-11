"use client";

import { useState } from "react";
import { Gift, X } from "lucide-react";
import { OK_GIFTS_FREE_URL, OK_GIFTS_URL, openExternal } from "@/lib/bridge";
import { OrthodoxCross, PhotoBanner } from "./bits";

/* Тематические коллекции: православный подбор живёт в приложении,
   сам выбор и отправка подарка — в штатном разделе «Подарки» ОК. */
const collections = [
  {
    id: "angel",
    title: "Ангел-хранитель",
    note: "К дню ангела и просто так",
    photo: "/images/card-angel.jpg",
  },
  {
    id: "icons",
    title: "Иконы и образа",
    note: "Образа Спасителя, Богородицы и святых",
    photo: "/images/card-icon.jpg",
  },
  {
    id: "candle",
    title: "Свеча и храм",
    note: "Пожелание мира и тепла",
    photo: "/images/card-candle.jpg",
  },
  {
    id: "feast",
    title: "С праздником",
    note: "Пасха, Рождество, Крещение",
    photo: "/images/card-easter.jpg",
  },
  {
    id: "peace",
    title: "Мир вашему дому",
    note: "Родным и близким — тёплые слова",
    photo: "/images/card-flowers.jpg",
  },
  {
    id: "free",
    title: "Бесплатные",
    note: "Коллекции группы «Подарки — это ОК»",
    photo: "/images/bell.jpg",
    url: OK_GIFTS_FREE_URL,
  },
] as const;

export default function GiftModal({
  onClose,
  toast,
}: {
  onClose: () => void;
  toast: (m: string) => void;
}) {
  const [opening, setOpening] = useState<string | null>(null);

  const openCatalog = (id: string, url?: string) => {
    setOpening(id);
    const target = url ?? OK_GIFTS_URL;
    const ok = openExternal(target);
    setOpening(null);
    toast(
      ok
        ? "Открываем раздел подарков ОК — выберите подарок, получателя и подпись"
        : "Раздел «Подарки» ОК: ok.ru/gifts — откройте и выберите подарок"
    );
  };

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Отправить подарок">
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
          <div className="flex items-center justify-between mb-1">
            <h2 className="pr-display text-[1rem]" style={{ color: "var(--an-ink)" }}>
              Отправить подарок
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
          <p className="pr-serif text-[0.7rem] leading-snug mb-3" style={{ color: "var(--an-ink-soft)" }}>
            Православные коллекции подобраны в приложении — сам подарок выбирается
            и отправляется в разделе «Подарки» ОК.
          </p>

          {/* Тематические коллекции */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            {collections.map((c) => (
              <button
                key={c.id}
                onClick={() => openCatalog(c.id, "url" in c ? c.url : undefined)}
                className="text-left transition-all hover:shadow-lg active:scale-[.99]"
                aria-label={`Подарки: ${c.title}`}
              >
                <PhotoBanner
                  src={c.photo}
                  alt={`Подарки: ${c.title}`}
                  strength="firm"
                  className="h-[104px] px-3 py-2.5"
                  contentClassName="flex flex-col justify-end h-full"
                >
                  <span className="flex items-center gap-1.5">
                    <OrthodoxCross size={11} color="rgba(255,255,255,.9)" />
                    <span className="pr-display text-[0.86rem] leading-tight text-white">
                      {c.title}
                    </span>
                  </span>
                  <span className="pr-serif text-[0.64rem] leading-snug" style={{ color: "rgba(255,255,255,.82)" }}>
                    {c.note}
                  </span>
                </PhotoBanner>
              </button>
            ))}
          </div>

          <button
            onClick={() => openCatalog("catalog")}
            disabled={opening !== null}
            className="pr-btn pr-btn-primary w-full"
          >
            <Gift size={14} /> Открыть каталог подарков ОК
          </button>

          <p className="pr-serif text-[0.64rem] mt-2.5 text-center leading-relaxed" style={{ color: "var(--an-ink-soft)" }}>
            Отправка — штатными средствами ОК: выберете подарок, получателя, подпись
            и приватность. Бесплатные подарки — в коллекциях каталога и группы «Подарки — это ОК».
          </p>
        </div>
      </div>
    </div>
  );
}
