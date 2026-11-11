"use client";

/* ═══════════════════════════════════════════════════════════════════
   Клиент официальной карты храмов Русской Православной Церкви
   (map.patriarchia.ru — проект Патриархия.ru / АНО «Приводим людей
   к Богу»). База содержит десятки тысяч храмов, монастырей, часовен
   и подворий РПЦ по всему миру, включая зарубежные приходы.

   Механика (как у самой карты):
   • GET /api/index.php с токеном публичной карты, границы кадра
     (geo) и типом объектов (t) → GeoJSON FeatureCollection;
   • GET /api/index.php?m=info&id=<id> → HTML-карточка объекта,
     из которой разбираем адрес, принадлежность, сайт, телефон,
     настоятеля, престольные праздники и статус.
   • CORS открыт (Access-Control-Allow-Origin: *) — запросы идут
     прямо из мини-приложения, без собственного бэкенда.

   Токен — публичный, зашит в страницу map.patriarchia.ru; он не
   является секретом и используется только для чтения демо-данных.
   Для промышленной публикации стоит запросить официальный доступ
   к API у правообладателя и кешировать ответы на своём сервере.
   ═══════════════════════════════════════════════════════════════════ */

import type { Temple } from "./temples";

const P_API = "https://map.patriarchia.ru/api/index.php";
const P_TOKEN = "c2cbe8cd873f8e4751a7f7bb5292e68a";
const SOURCE_URL = "https://map.patriarchia.ru";

/* ── Типы объектов карты (параметр t) ── */
export const P_FILTERS = [
  { id: 0, label: "Все" },
  { id: 3, label: "Храмы и часовни" },
  { id: 4, label: "Монастыри" },
  { id: 19, label: "Соборы" },
  { id: 42, label: "Подворья" },
] as const;

/* Подтипы «Храмов и часовен» — номер совпадает с иконкой church-XX.png */
const SUBTYPE_BY_ICON: Record<string, string> = {
  "40": "Храм",
  "44": "Храмовый комплекс",
  "15": "Монастырский храм",
  "11": "Приписной храм",
  "14": "Домовый храм",
  "30": "Крестильный храм",
  "12": "Часовня",
  "22": "Скит",
  "37": "Молитвенный дом",
  "27": "Подворье",
  "19": "Кафедральный собор",
  "4": "Монастырь",
};

export type PKind = "temple" | "chapel" | "monastery" | "cathedral" | "podvorie" | "service";

/* Цвет маркера по типу объекта (палитра Antipa: чернила, золото, шалфей) */
export const KIND_COLORS: Record<PKind, string> = {
  temple: "#181d24",
  chapel: "#4a5462",
  monastery: "#3f5c50",
  cathedral: "#b9891e",
  podvorie: "#7a6a52",
  service: "#9aa1a8",
};

export interface PFeature {
  id: number;
  infoId: string;
  name: string; // подсказка с карты; у части храмов пуста — берём подтип
  type: string; // "3" | "4" | "5" | "7" | "8" | "10" | "19" | "42"
  icon: string; // /images/map/church-XX.png
  lat: number;
  lng: number;
}

export interface PBounds {
  south: number;
  west: number;
  north: number;
  east: number;
}

export interface PChurchInfo {
  name: string;
  affiliation?: string;
  address?: string;
  language?: string;
  phone?: string;
  site?: string;
  rector?: string;
  status?: string;
  feasts?: string[];
  detailUrl?: string;
  photoUrl?: string;
}

/* Унифицированная точка на карте — общая валюта для MapScreen,
   TempleSheet и OrthodoxApp (живые объекты и статический фолбэк) */
export interface ChurchSpot {
  key: string; // "p<id>" — живой объект, "s<id>" — статический
  id: number;
  name: string;
  typeLabel: string;
  kind: PKind;
  lat: number;
  lng: number;
  source: "patriarchia" | "static";
  infoId?: string;
  icon?: string;
  /* только для статических */
  service?: string;
  desc?: string;
}

/* ── Разбор типа/иконки ── */
function subtypeFromIcon(icon: string): string | undefined {
  const m = /church-(\d+)\.png/.exec(icon);
  return m ? SUBTYPE_BY_ICON[m[1]] : undefined;
}

export function typeLabelFor(f: PFeature): string {
  switch (f.type) {
    case "3":
      return subtypeFromIcon(f.icon) ?? "Храм";
    case "4":
      return "Монастырь";
    case "19":
      return "Кафедральный собор";
    case "42":
      return "Подворье";
    case "5":
      return "Благочиние";
    case "7":
      return "Епархия";
    case "10":
      return "Приходы МП";
    case "8":
      return "Учреждение РПЦ";
    default:
      return "Объект РПЦ";
  }
}

export function kindFor(f: PFeature): PKind {
  switch (f.type) {
    case "19":
      return "cathedral";
    case "4":
      return "monastery";
    case "42":
      return "podvorie";
    case "3": {
      const sub = subtypeFromIcon(f.icon);
      return sub === "Часовня" || sub === "Скит" || sub === "Молитвенный дом"
        ? "chapel"
        : "temple";
    }
    default:
      return "service";
  }
}

/* Живой объект карты → унифицированная точка */
export function featureToSpot(f: PFeature): ChurchSpot {
  const typeLabel = typeLabelFor(f);
  return {
    key: `p${f.id}`,
    id: f.id,
    name: f.name || typeLabel,
    typeLabel,
    kind: kindFor(f),
    lat: f.lat,
    lng: f.lng,
    source: "patriarchia",
    infoId: f.infoId,
    icon: f.icon,
  };
}

/* Статический фолбэк (избранные храмы Москвы) → та же структура */
export function staticTempleToSpot(t: Temple): ChurchSpot {
  return {
    key: `s${t.id}`,
    id: t.id,
    name: t.name,
    typeLabel: t.type === "monastery" ? "Монастырь" : t.type === "chapel" ? "Часовня" : "Храм",
    kind: t.type === "monastery" ? "monastery" : t.type === "chapel" ? "chapel" : "temple",
    lat: t.lat,
    lng: t.lng,
    source: "static",
    service: t.service,
    desc: t.desc,
  };
}

/* ═══════════════ HTTP: таймаут + внешняя отмена ═══════════════ */

async function fetchText(url: string, opts: { signal?: AbortSignal; timeoutMs?: number } = {}) {
  const { signal, timeoutMs = 15_000 } = opts;
  const ctrl = new AbortController();
  const onAbort = () => ctrl.abort();
  signal?.addEventListener("abort", onAbort);
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { Accept: "application/json, text/html" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onAbort);
  }
}

/* ═══════════════ Кеш ответов (в памяти) ═══════════════ */

interface CacheEntry {
  ts: number;
  data: PFeature[];
}
const frameCache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<PFeature[]>>();
const FRAME_TTL = 8 * 60 * 1000;
const CACHE_MAX = 60;

function cacheKey(b: PBounds, z: number, t: number, s: string): string {
  const r = (v: number) => v.toFixed(2);
  return `${t}|${s}|z${z}|${r(b.south)},${r(b.west)},${r(b.north)},${r(b.east)}`;
}

function cachePut(key: string, data: PFeature[]) {
  if (frameCache.size >= CACHE_MAX) {
    const oldest = frameCache.keys().next().value;
    if (oldest) frameCache.delete(oldest);
  }
  frameCache.set(key, { ts: Date.now(), data });
}

/* ═══════════════ Загрузка объектов в кадре ═══════════════ */

export async function fetchChurches(
  b: PBounds,
  opts: { z: number; t?: number; s?: string; signal?: AbortSignal } = { z: 12 }
): Promise<PFeature[]> {
  const t = opts.t ?? 0;
  const s = (opts.s ?? "").trim();
  const key = cacheKey(b, opts.z, t, s);

  const hit = frameCache.get(key);
  if (hit && Date.now() - hit.ts < FRAME_TTL) return hit.data;

  const running = inflight.get(key);
  if (running) return running;

  const url =
    `${P_API}?token=${P_TOKEN}&country=0&church=0&ctype=0&t=${t}` +
    `&s=${encodeURIComponent(s)}&params=${encodeURIComponent("[]")}` +
    `&zf=8&z=${opts.z}` +
    `&geo=${encodeURIComponent(JSON.stringify([[b.south, b.west], [b.north, b.east]]))}`;

  const job = (async () => {
    const raw = await fetchText(url, { signal: opts.signal, timeoutMs: 15_000 });
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error("bad-json");
    }
    if (typeof parsed === "string" || !parsed || typeof parsed !== "object") {
      throw new Error("api-error");
    }
    const fc = parsed as {
      features?: {
        id: number;
        geometry?: { coordinates?: [number, number] };
        properties?: { infoId?: string; hintContent?: string; type?: string; iconURL?: string };
      }[];
    };
    const feats: PFeature[] = (fc.features ?? [])
      .filter((f) => f.geometry?.coordinates && f.properties)
      .map((f) => ({
        id: f.id,
        infoId: String(f.properties?.infoId ?? f.id),
        name: (f.properties?.hintContent ?? "").trim(),
        type: String(f.properties?.type ?? "3"),
        icon: f.properties?.iconURL ?? "",
        /* координаты в ответе Яндекса: [широта, долгота] */
        lat: f.geometry!.coordinates![0],
        lng: f.geometry!.coordinates![1],
      }));
    cachePut(key, feats);
    return feats;
  })();

  inflight.set(key, job);
  try {
    return await job;
  } finally {
    inflight.delete(key);
  }
}

/* ═══════════════ Карточка объекта (m=info) ═══════════════ */

const infoCache = new Map<string, { ts: number; data: PChurchInfo }>();
const INFO_TTL = 24 * 60 * 60 * 1000;

export async function fetchChurchInfo(
  infoId: string,
  opts: { signal?: AbortSignal } = {}
): Promise<PChurchInfo> {
  const hit = infoCache.get(infoId);
  if (hit && Date.now() - hit.ts < INFO_TTL) return hit.data;

  const url =
    `${P_API}?token=${P_TOKEN}&m=info&msg=1&id=${encodeURIComponent(infoId)}` +
    `&urlmode=1&lang=ru`;
  const html = await fetchText(url, { signal: opts.signal, timeoutMs: 12_000 });

  const doc = new DOMParser().parseFromString(html, "text/html");
  const root = doc.querySelector(".marker-info-content");
  if (!root) throw new Error("no-info");

  const titleA = root.querySelector("h1 a");
  const name = (titleA?.textContent ?? "").replace(/\s+/g, " ").trim();

  /* Фото прихода (загружается с сайта прихода, а не иконка типа) */
  let photoUrl: string | undefined;
  root.querySelectorAll("img").forEach((img) => {
    const src = img.getAttribute("src") ?? "";
    if (!photoUrl && src.includes("wp-content")) {
      photoUrl = src.startsWith("http:") ? src.replace(/^http:/, "https:") : src;
    }
  });

  const info: PChurchInfo = { name, photoUrl };
  if (titleA) {
    const href = titleA.getAttribute("href");
    if (href) info.detailUrl = href;
  }

  root.querySelectorAll("ul li").forEach((li) => {
    const rawLabel = li.querySelector("span.ch")?.textContent ?? li.querySelector("span.ttl")?.textContent ?? "";
    const label = rawLabel.replace(/:$/, "").trim();
    if (!label || label === "Подробнее" || label === "Назад") return;

    if (label === "Престольные праздники") {
      const altars = Array.from(li.querySelectorAll("li.altar"))
        .map((a) => (a.textContent ?? "").replace(/\s+/g, " ").trim())
        .filter(Boolean);
      if (altars.length) info.feasts = altars;
      return;
    }

    const cnt = li.querySelector("span.cnt");
    if (!cnt) return;
    const value = (cnt.textContent ?? "").replace(/\s+/g, " ").trim();
    if (!value) return;

    switch (label) {
      case "Принадлежность":
        info.affiliation = value;
        break;
      case "Адрес":
        info.address = value;
        break;
      case "Язык богослужений":
        info.language = value;
        break;
      case "Телефон":
        info.phone = value;
        break;
      case "Сайт": {
        const a = cnt.querySelector("a[href]");
        info.site = a?.getAttribute("href") ?? value;
        break;
      }
      case "Настоятель":
        info.rector = value;
        break;
      case "Статус":
        info.status = value;
        break;
    }
  });

  infoCache.set(infoId, { ts: Date.now(), data: info });
  return info;
}

/* ═══════════════ Ближайший объект (карточка на Главной) ═══════════════ */

export interface NearestChurch {
  name: string;
  km: number;
  infoId?: string;
}

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function fetchNearestChurch(
  lat: number,
  lng: number,
  opts: { signal?: AbortSignal; radiusDeg?: number } = {}
): Promise<NearestChurch | null> {
  const d = opts.radiusDeg ?? 0.07; // ≈ 7–8 км в каждую сторону
  const feats = await fetchChurches(
    { south: lat - d, west: lng - d, north: lat + d, east: lng + d },
    { z: 12, t: 0, signal: opts.signal }
  );
  const real = feats.filter((f) => ["3", "4", "19", "42"].includes(f.type));
  const named = real.filter((f) => f.name) .concat(real.filter((f) => !f.name));
  const pool = named.length ? named : feats;
  if (!pool.length) return null;

  let best: PFeature | null = null;
  let bestKm = Infinity;
  for (const f of pool) {
    const km = haversineKm(lat, lng, f.lat, f.lng);
    if (km < bestKm) {
      bestKm = km;
      best = f;
    }
  }
  if (!best) return null;
  const label = best.name || subtypeFromIcon(best.icon) || typeLabelFor(best);
  return { name: label, km: bestKm, infoId: best.infoId };
}

export const PATRIARCHIA_SOURCE_URL = SOURCE_URL;
