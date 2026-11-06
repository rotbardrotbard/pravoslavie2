"use client";

import { useEffect, useState } from "react";
import { ExternalLink, MapPin, Navigation, X } from "lucide-react";
import type { GeoPoint } from "@/lib/bridge";
import { fetchChurchInfo, type ChurchSpot, type PChurchInfo } from "@/lib/content/patriarchia";
import { fmtDistance, haversineKm, routeUrl } from "@/lib/content/temples";
import { OrthodoxCross, PhotoBanner } from "./bits";

/* Фото-иллюстрации для статических избранных храмов — все 10 снимков уникальны */
const staticPhotos: Record<number, string> = {
  1: "/images/domes.jpg",
  2: "/images/day-header.jpg",
  3: "/images/temple-white.jpg",
  4: "/images/interior.jpg",
  5: "/images/temple-belltower.jpg",
  6: "/images/monastery.jpg",
  7: "/images/temple-wooden.jpg",
  8: "/images/temple-night.jpg",
  9: "/images/temple-autumn.jpg",
  10: "/images/temple-winter.jpg",
};

/* Фото по типу объекта для живой базы (если у прихода нет своего снимка) */
function kindPhoto(spot: ChurchSpot): string {
  switch (spot.kind) {
    case "monastery":
      return "/images/monastery.jpg";
    case "cathedral":
      return "/images/hero-church.jpg";
    case "chapel":
      return "/images/temple-wooden.jpg";
    case "podvorie":
      return "/images/bell.jpg";
    default:
      return "/images/temple-white.jpg";
  }
}

export default function TempleSheet({
  spot,
  visited,
  geo,
  onClose,
  onVisit,
  toast,
}: {
  spot: ChurchSpot;
  visited: boolean;
  geo: GeoPoint;
  onClose: () => void;
  onVisit: () => void;
  toast: (m: string) => void;
}) {
  const km = haversineKm(geo.lat, geo.lng, spot.lat, spot.lng);
  const isLive = spot.source === "patriarchia";

  const [info, setInfo] = useState<PChurchInfo | null>(null);
  const [infoErr, setInfoErr] = useState(false);

  /* Лениво подтягиваем карточку прихода из базы Патриархии */
  useEffect(() => {
    if (!isLive || !spot.infoId) return;
    let cancelled = false;
    setInfo(null);
    setInfoErr(false);
    fetchChurchInfo(spot.infoId)
      .then((i) => {
        if (!cancelled) setInfo(i);
      })
      .catch(() => {
        if (!cancelled) setInfoErr(true);
      });
    return () => {
      cancelled = true;
    };
  }, [spot.key, spot.infoId, isLive]);

  const displayName =
    (isLive && info?.name) || spot.name || "Храм";
  const photo =
    (isLive && info?.photoUrl) ||
    (spot.source === "static" ? staticPhotos[spot.id] : undefined) ||
    kindPhoto(spot);

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={displayName}>
      <button aria-label="Закрыть" onClick={onClose} className="absolute inset-0 bg-black/45" />
      {/* Панель прибита к низу ВЬЮПОРТА (не колонки), по центру приложения */}
      <div className="absolute inset-x-0 bottom-0 flex justify-center pointer-events-none">
        <div
          className="animate-slide-up relative w-full max-w-[480px] max-h-[88dvh] overflow-y-auto pr-scroll rounded-t-2xl p-4 pointer-events-auto"
          style={{
            background: "var(--an-card)",
            borderTop: "1px solid var(--an-line)",
            boxShadow: "0 -10px 40px rgba(24,29,36,.18)",
          }}
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="min-w-0">
              <div
                className="flex items-center gap-1.5 text-[0.64rem] mb-0.5"
                style={{ color: "var(--an-ink-soft)" }}
              >
                <MapPin size={11} /> {fmtDistance(km)} · {spot.typeLabel}
              </div>
              <h2
                className="pr-display text-[1.02rem] leading-snug"
                style={{ color: "var(--an-ink)" }}
              >
                {displayName}
              </h2>
            </div>
            <button
              aria-label="Закрыть"
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-black/5 shrink-0"
              style={{ color: "var(--an-ink-soft)" }}
            >
              <X size={17} />
            </button>
          </div>

          <PhotoBanner
            src={photo}
            alt={displayName}
            strength="firm"
            className="h-32 mb-3"
            contentClassName="flex items-end justify-end"
          >
            <div className="flex items-center gap-1.5 px-2 pb-1.5">
              <OrthodoxCross size={13} color="rgba(255,255,255,.9)" />
              <span
                className="text-[0.6rem] tracking-wide"
                style={{ color: "rgba(255,255,255,.85)" }}
              >
                {isLive ? "Карта храмов РПЦ" : "Фото для иллюстрации"}
              </span>
            </div>
          </PhotoBanner>

          {/* Статический избранный храм: редакторское описание */}
          {spot.source === "static" && spot.desc && (
            <p
              className="pr-serif text-[0.8rem] leading-relaxed mb-2"
              style={{ color: "var(--an-ink)" }}
            >
              {spot.desc}
            </p>
          )}

          {/* Живой объект: данные прихода из базы map.patriarchia.ru */}
          {isLive && !info && !infoErr && (
            <div className="orn-card-soft px-3 py-2.5 mb-3 pr-serif text-[0.72rem]" style={{ color: "var(--an-ink-soft)" }}>
              Загружаем сведения о приходе…
            </div>
          )}
          {isLive && infoErr && (
            <div className="orn-card-soft px-3 py-2.5 mb-3 pr-serif text-[0.72rem]" style={{ color: "var(--an-ink-soft)" }}>
              Сведения о приходе сейчас недоступны — адрес виден на карте.
            </div>
          )}

          {isLive && info && (
            <>
              {info.address && (
                <div className="orn-card-soft px-3 py-2 mb-2 text-[0.78rem]" style={{ color: "var(--an-ink)" }}>
                  <span className="pr-serif font-bold">Адрес: </span>
                  <span className="pr-serif">{info.address}</span>
                </div>
              )}
              <div className="flex flex-col gap-1 mb-2">
                {info.affiliation && (
                  <p className="pr-serif text-[0.72rem] leading-snug" style={{ color: "var(--an-ink-soft)" }}>
                    {info.affiliation}
                  </p>
                )}
                {info.status && (
                  <p className="pr-serif text-[0.72rem]" style={{ color: "var(--an-ink-soft)" }}>
                    Статус: {info.status}
                    {info.language ? ` · богослужения: ${info.language}` : ""}
                  </p>
                )}
                {info.rector && (
                  <p className="pr-serif text-[0.72rem] leading-snug" style={{ color: "var(--an-ink-soft)" }}>
                    Настоятель: {info.rector}
                  </p>
                )}
                {info.phone && (
                  <p className="pr-serif text-[0.72rem]" style={{ color: "var(--an-ink-soft)" }}>
                    Телефон: {info.phone}
                  </p>
                )}
                {info.site && (
                  <a
                    href={info.site}
                    target="_blank"
                    rel="noreferrer"
                    className="pr-serif text-[0.72rem] underline truncate"
                    style={{ color: "var(--an-ink)" }}
                  >
                    Сайт прихода
                  </a>
                )}
              </div>
              {info.feasts && info.feasts.length > 0 && (
                <div className="orn-card-soft px-3 py-2 mb-3">
                  <div className="pr-serif font-bold text-[0.72rem] mb-1" style={{ color: "var(--an-ink)" }}>
                    Престольные праздники
                  </div>
                  {info.feasts.map((f, i) => (
                    <div key={i} className="pr-serif text-[0.7rem] leading-snug" style={{ color: "var(--an-ink)" }}>
                      · {f}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Статический: типовое расписание */}
          {spot.source === "static" && spot.service && (
            <div
              className="orn-card-soft px-3 py-2 mb-3 text-[0.76rem]"
              style={{ color: "var(--an-ink)" }}
            >
              <span className="pr-serif font-bold">Богослужения:</span>{" "}
              <span className="pr-serif">{spot.service}</span>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => {
                window.open(
                  routeUrl(
                    spot.lat,
                    spot.lng,
                    geo.accurate ? geo.lat : undefined,
                    geo.accurate ? geo.lng : undefined
                  ),
                  "_blank"
                );
                toast("Открываем маршрут в картах");
              }}
              className="pr-btn pr-btn-primary flex-1"
            >
              <Navigation size={14} /> Маршрут
            </button>
            <button
              onClick={() => {
                if (!visited) onVisit();
                else toast("Вы уже отметили визит здесь");
              }}
              className={`pr-btn flex-1 ${visited ? "pr-btn-accent" : "pr-btn-secondary"}`}
            >
              {visited ? "Вы были здесь" : "Я был(а)"}
            </button>
          </div>

          {isLive && info?.detailUrl && (
            <a
              href={info.detailUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-2.5 flex items-center justify-center gap-1.5 pr-serif text-[0.68rem] underline"
              style={{ color: "var(--an-ink-soft)" }}
            >
              <ExternalLink size={11} /> Страница прихода на карте Патриархии
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
