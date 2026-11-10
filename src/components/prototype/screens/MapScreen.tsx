"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import type { Map as LeafletMap, LayerGroup } from "leaflet";
import { MapPin, Navigation, Search, X } from "lucide-react";
import type { GeoPoint } from "@/lib/bridge";
import {
  fetchChurches,
  featureToSpot,
  KIND_COLORS,
  P_FILTERS,
  staticTempleToSpot,
  PATRIARCHIA_SOURCE_URL,
  type ChurchSpot,
} from "@/lib/content/patriarchia";
import { fmtDistance, haversineKm, routeUrl, temples as staticTemples } from "@/lib/content/temples";
import { SectionTitle } from "../bits";

const LIST_LIMIT = 40;
const MARKER_LIMIT = 1500;

export default function MapScreen({
  geo,
  geoAsked,
  toast,
  onSelectSpot,
  setGeoAsked,
}: {
  geo: GeoPoint;
  geoAsked: boolean;
  toast: (m: string) => void;
  onSelectSpot: (spot: ChurchSpot) => void;
  setGeoAsked: (v: boolean) => void;
}) {
  const [filter, setFilter] = useState<number>(0);
  const [searchInput, setSearchInput] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [spots, setSpots] = useState<(ChurchSpot & { km: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [liveMode, setLiveMode] = useState(true); // true — официальная база РПЦ
  const [mapReady, setMapReady] = useState(false);

  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const groupRef = useRef<LayerGroup | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadFrameRef = useRef<(fit?: boolean) => void>(() => {});

  /* ── Инициализация карты ── */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!mapDivRef.current || mapRef.current) return;
      const L = (await import("leaflet")).default;
      if (cancelled || !mapDivRef.current) return;

      const map = L.map(mapDivRef.current, {
        center: [geo.lat, geo.lng],
        zoom: 12,
        minZoom: 8, // глубже — карта Патриархии показывает только епархии
        maxZoom: 19,
        zoomControl: false,
        attributionControl: true,
        scrollWheelZoom: false, // чтобы страница не скроллилась при прокрутке карты
      });
      L.control.zoom({ position: "bottomright" }).addTo(map);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a>',
      }).addTo(map);

      map.on("moveend zoomend", () => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => loadFrameRef.current(false), 450);
      });

      mapRef.current = map;
      setMapReady(true);
    })();
    return () => {
      cancelled = true;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      abortRef.current?.abort();
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        groupRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Отрисовка маркеров текущего набора точек ── */
  const renderMarkers = useCallback(
    async (list: ChurchSpot[]) => {
      const map = mapRef.current;
      if (!map) return;
      const L = (await import("leaflet")).default;

      if (groupRef.current) {
        groupRef.current.remove();
        groupRef.current = null;
      }
      const group = L.layerGroup();
      const renderer = L.canvas({ padding: 0.4 });

      const shown = list.slice(0, MARKER_LIMIT);
      shown.forEach((s) => {
        const marker = L.circleMarker([s.lat, s.lng], {
          renderer,
          radius: 5.5,
          color: "#ffffff",
          weight: 1.4,
          fillColor: KIND_COLORS[s.kind] ?? KIND_COLORS.temple,
          fillOpacity: 1,
        });
        marker.on("click", () => onSelectSpot(s));
        marker.addTo(group);
      });

      /* Позиция пользователя */
      const userIcon = L.divIcon({
        className: "pr-user-dot",
        html: `<span style="display:block;width:18px;height:18px;border-radius:50%;background:rgba(168,20,20,.16);box-shadow:0 0 0 3px rgba(168,20,20,.12);position:relative"><span style="position:absolute;inset:5px;border-radius:50%;background:#a81414;border:2px solid #fff"></span></span>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });
      L.marker([geo.lat, geo.lng], { icon: userIcon, interactive: false }).addTo(group);

      group.addTo(map);
      groupRef.current = group;
    },
    [geo.lat, geo.lng, onSelectSpot]
  );

  /* ── Загрузка объектов в текущем кадре карты ── */
  const loadFrame = useCallback(
    async (fit?: boolean) => {
      const map = mapRef.current;
      if (!map) return;
      const b = map.getBounds();
      const bounds = {
        south: b.getSouth(),
        west: b.getWest(),
        north: b.getNorth(),
        east: b.getEast(),
      };
      const z = Math.round(map.getZoom());

      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      setLoading(true);

      const withKm = (list: ChurchSpot[]) =>
        list
          .map((s) => ({ ...s, km: haversineKm(geo.lat, geo.lng, s.lat, s.lng) }))
          .sort((a, b2) => a.km - b2.km);

      try {
        const feats = await fetchChurches(bounds, {
          z,
          t: filter,
          s: activeSearch || undefined,
          signal: ac.signal,
        });
        const list = withKm(feats.map(featureToSpot));
        setSpots(list);
        setLiveMode(true);
        await renderMarkers(list);
      } catch (e) {
        if (ac.signal.aborted) return;
        /* Резервная подборка содержит только храмы Москвы.
           Не показываем её в других регионах как будто это местные храмы. */
        setLiveMode(false);
        const intersectsMoscow =
          bounds.south <= 56.2 &&
          bounds.north >= 55.0 &&
          bounds.west <= 38.5 &&
          bounds.east >= 36.0;
        const list = intersectsMoscow
          ? withKm(staticTemples.map(staticTempleToSpot))
          : [];
        setSpots(list);
        await renderMarkers(list);
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }

      if (fit && mapRef.current) {
        /* Подгоняем вид под пользователя; объекты уточнятся по кадру */
        mapRef.current.setView([geo.lat, geo.lng], 13);
      }
    },
    [activeSearch, filter, geo.lat, geo.lng, renderMarkers]
  );

  loadFrameRef.current = loadFrame;

  /* ── Первая загрузка и смена фильтра/поиска ── */
  useEffect(() => {
    if (!mapReady) return;
    loadFrame(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady, filter, activeSearch]);

  /* ── Смена геолокации: переносим центр и перезагружаем кадр ── */
  const lastGeoRef = useRef<{ lat: number; lng: number }>({ lat: geo.lat, lng: geo.lng });
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    if (lastGeoRef.current.lat === geo.lat && lastGeoRef.current.lng === geo.lng) return;
    lastGeoRef.current = { lat: geo.lat, lng: geo.lng };
    mapRef.current.setView([geo.lat, geo.lng], 13);
    loadFrame(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geo.lat, geo.lng, mapReady]);

  const askGeo = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGeoAsked(true);
          toast("Местоположение обновлено");
          const ev = new CustomEvent("pr-geo", {
            detail: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          });
          window.dispatchEvent(ev);
        },
        () => toast("Не удалось получить геопозицию — покажем центр города"),
        { timeout: 8000 }
      );
    } else {
      toast("Геолокация недоступна в этом браузере");
    }
  };

  const nearest = spots[0];
  const shown = useMemo(() => spots.slice(0, LIST_LIMIT), [spots]);

  return (
    <div className="animate-fade-up">
      {/* Поиск */}
      <div className="px-4 pt-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setActiveSearch(searchInput.trim());
          }}
          className="relative"
        >
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--an-ink-soft)" }}
          />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Поиск храма, часовни, монастыря…"
            className="orn-card-soft w-full pl-8 pr-9 py-2.5 pr-serif text-[0.78rem] outline-none"
            style={{ color: "var(--an-ink)" }}
          />
          {searchInput && (
            <button
              type="button"
              aria-label="Очистить"
              onClick={() => {
                setSearchInput("");
                setActiveSearch("");
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md flex items-center justify-center hover:bg-black/5"
              style={{ color: "var(--an-ink-soft)" }}
            >
              <X size={13} />
            </button>
          )}
        </form>
      </div>

      {/* Карта */}
      <div className="px-4 pt-2.5">
        <div
          className="rounded-xl overflow-hidden relative"
          style={{ border: "1px solid #d9dcde", height: 260, background: "#eef0f2" }}
        >
          <div ref={mapDivRef} style={{ height: "100%", width: "100%" }} aria-label="Карта храмов" />
          {!mapReady && (
            <div
              className="absolute inset-0 flex items-center justify-center pr-serif text-[0.72rem]"
              style={{ color: "var(--an-ink-soft)" }}
            >
              Загружаем карту…
            </div>
          )}
          {mapReady && loading && (
            <div
              className="absolute top-2 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-full text-[0.6rem] pr-serif pointer-events-none"
              style={{ background: "rgba(24,29,36,.82)", color: "#fff" }}
            >
              Загружаем храмы из базы РПЦ…
            </div>
          )}
          {mapReady && !liveMode && (
            <div
              className="absolute top-2 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-full text-[0.6rem] pr-serif pointer-events-none"
              style={{ background: "rgba(185,137,30,.92)", color: "#fff" }}
            >
              База РПЦ недоступна — резервная подборка храмов Москвы
            </div>
          )}
        </div>

        {/* Действия под картой */}
        <div className="flex gap-1.5 mt-2.5 overflow-x-auto no-scrollbar pb-1">
          <button onClick={askGeo} className="pr-chip shrink-0">
            <Navigation size={11} /> Где я
          </button>
          {nearest && (
            <button
              onClick={() =>
                window.open(
                  routeUrl(
                    nearest.lat,
                    nearest.lng,
                    geo.accurate ? geo.lat : undefined,
                    geo.accurate ? geo.lng : undefined
                  ),
                  "_blank"
                )
              }
              className="pr-chip shrink-0"
            >
              <Navigation size={11} /> Маршрут до ближайшего
            </button>
          )}
        </div>
      </div>

      {/* Фильтры */}
      <div className="px-4 pt-2 pb-2">
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar mb-3 pb-1">
          {P_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`pr-chip shrink-0 ${filter === f.id ? "pr-chip-active" : ""}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {!geoAsked && (
          <button
            onClick={askGeo}
            className="orn-card-soft px-3.5 py-2.5 mb-3 pr-serif text-[0.74rem] w-full text-left"
            style={{ color: "var(--an-ink)" }}
          >
            Чтобы найти храмы рядом с вами, нажмите «Где я» и разрешите доступ к местоположению.
          </button>
        )}

        <SectionTitle className="mb-2">
          {activeSearch
            ? `Найдено: ${spots.length}`
            : liveMode
              ? `В кадре — ${spots.length} объектов`
              : geo.accurate ? `Ближайшие ${spots.length}` : `Объекты в области карты: ${spots.length}`}
        </SectionTitle>

        <div className="flex flex-col gap-2">
          {shown.map((t) => (
            <button
              key={t.key}
              onClick={() => onSelectSpot(t)}
              className="orn-card w-full text-left px-3.5 py-3 transition-all hover:shadow-lg"
            >
              <div className="flex items-center gap-2 mb-0.5">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: KIND_COLORS[t.kind] ?? KIND_COLORS.temple }}
                />
                <span
                  className="pr-serif text-[0.64rem]"
                  style={{ color: "var(--an-ink-soft)" }}
                >
                  {fmtDistance(t.km)} · {t.typeLabel}
                </span>
              </div>
              <div
                className="pr-serif font-bold text-[0.84rem] leading-snug"
                style={{ color: "var(--an-ink)" }}
              >
                {t.name}
              </div>
              {t.service && (
                <div className="pr-serif text-[0.72rem] mt-0.5" style={{ color: "var(--an-ink)" }}>
                  {t.service}
                </div>
              )}
            </button>
          ))}
        </div>

        {spots.length > shown.length && (
          <p
            className="pr-serif text-[0.66rem] mt-2.5 text-center"
            style={{ color: "var(--an-ink-soft)" }}
          >
            …и ещё {spots.length - shown.length} в этом кадре — приблизьте карту или задайте поиск
          </p>
        )}
        {spots.length === 0 && !loading && (
          <p
            className="pr-serif text-[0.72rem] mt-2 text-center"
            style={{ color: "var(--an-ink-soft)" }}
          >
            {activeSearch
              ? "В этой области ничего не нашлось — измените запрос или передвиньте карту"
              : "В этом кадре объектов нет — передвиньте или приблизьте карту"}
          </p>
        )}

        <p
          className="pr-read italic text-[0.66rem] mt-4 text-center"
          style={{ color: "var(--an-ink-soft)" }}
        >
          {liveMode ? (
            <>
              База: официальная карта храмов РПЦ —{" "}
              <a
                href={PATRIARCHIA_SOURCE_URL}
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                map.patriarchia.ru
              </a>
            </>
          ) : (
            "Координаты — OpenStreetMap; расписание уточняйте у прихода"
          )}
        </p>
      </div>
    </div>
  );
}
