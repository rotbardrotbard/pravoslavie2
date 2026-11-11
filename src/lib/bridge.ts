"use client";

/* ═══════════════════════════════════════════════════════════
   VK Bridge — интеграция с платформой VK Mini Apps / ОК.
   Все методы безопасны вне окружения соцсети: при отсутствии
   окружения возвращают fallback, приложение работает автономно.
   ═══════════════════════════════════════════════════════════ */

import bridge from "@vkontakte/vk-bridge";

export interface MiniAppUser {
  firstName: string;
  photo?: string;
  isDemo: boolean;
}

export interface GeoPoint {
  lat: number;
  lng: number;
  accurate: boolean;
}

let inited = false;

/* Обёртка с таймаутом: вне соцсети VK Bridge не отвечает на многие методы */
async function safeSend<T>(method: string, params?: Record<string, unknown>, ms = 2500): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), ms);
    try {
      bridge
        .send<T>(method, params)
        .then((v) => {
          clearTimeout(timer);
          resolve(v);
        })
        .catch((e) => {
          clearTimeout(timer);
          reject(e);
        });
    } catch (e) {
      clearTimeout(timer);
      reject(e);
    }
  });
}

export async function initBridge(): Promise<void> {
  if (inited) return;
  try {
    await safeSend("VKWebAppInit", undefined, 1500);
    inited = true;
  } catch {
    /* вне соцсети — работаем в standalone-режиме */
  }
}

/* Профиль: VKWebAppGetUserInfo (в ОК приходит, если платформа отдаёт) */
export async function getMiniAppUser(): Promise<MiniAppUser> {
  try {
    const u = await safeSend<{ first_name?: string; photo_100?: string; photo_200?: string }>(
      "VKWebAppGetUserInfo",
      undefined,
      2000
    );
    if (u && u.first_name) {
      return {
        firstName: u.first_name,
        photo: u.photo_200 ?? u.photo_100,
        isDemo: false,
      };
    }
  } catch {
    /* fallback ниже */
  }
  return { firstName: "гость", isDemo: true };
}

/* Геолокация: сначала VKWebAppGetGeodata, затем браузерная */
export async function getGeoPoint(): Promise<GeoPoint | null> {
  try {
    const g = await safeSend<{ available?: boolean; lat?: number; long?: number }>(
      "VKWebAppGetGeodata",
      undefined,
      2000
    );
    if (g && g.available && typeof g.lat === "number" && typeof g.long === "number") {
      return { lat: g.lat, lng: g.long, accurate: true };
    }
  } catch {
    /* fallback ниже */
  }
  if (typeof navigator !== "undefined" && navigator.geolocation) {
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 8000,
          maximumAge: 300_000,
        });
      });
      return { lat: pos.coords.latitude, lng: pos.coords.longitude, accurate: true };
    } catch {
      /* пользователь отказал или таймаут */
    }
  }
  return null;
}

/* Центр Москвы — стартовая точка карты */
export const MOSCOW_CENTER: GeoPoint = { lat: 55.7522, lng: 37.6156, accurate: false };

/* Поделиться (стих, открытка, ссылка на приложение) */
export async function shareApp(text: string, link?: string): Promise<"bridge" | "native" | "clipboard"> {
  try {
    await safeSend("VKWebAppShare", { link: link ?? APP_SHARE_URL }, 2500);
    return "bridge";
  } catch {
    /* попробуем нативный Web Share */
  }
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ title: "Православные", text, url: link ?? APP_SHARE_URL });
      return "native";
    } catch {
      /* пользователь отменил */
    }
  }
  try {
    await navigator.clipboard.writeText(`${text} ${link ?? APP_SHARE_URL}`);
    return "clipboard";
  } catch {
    return "clipboard";
  }
}

export const APP_SHARE_URL = "https://ok.ru/app/pravoslavnye";

/* ── Подарки ОК ──
   Отправка подарка возможна только штатными средствами ОК (публичного
   API-метода для подарков у платформы нет), поэтому ведём пользователя
   в раздел «Подарки» (ok.ru/gifts) — там выбор получателя, подписи
   и приватности. Тематический подбор живёт в приложении (GiftModal). */
export const OK_GIFTS_URL = "https://ok.ru/gifts";
/* Группа «Подарки — это ОК» — коллекции бесплатных подарков (официальная справка ОК) */
export const OK_GIFTS_FREE_URL = "https://ok.ru/group/52832661209219";

export function openExternal(url: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const w = window.open(url, "_blank");
    if (w) {
      /* рвём связь opener вручную — window.open с noopener вернул бы null */
      try {
        (w as Window).opener = null;
      } catch {
        /* не критично */
      }
      return true;
    }
    /* null — всплывающее окно заблокировано браузером */
    return false;
  } catch {
    return false;
  }
}

export function openOkGifts(): boolean {
  return openExternal(OK_GIFTS_URL);
}

/* Пригласить друзей (VK-метод; в ОК отработает либо сам, либо fallback) */
export async function inviteFriends(): Promise<boolean> {
  try {
    await safeSend("VKWebAppShowInviteBox", undefined, 2500);
    return true;
  } catch {
    try {
      await safeSend("VKWebAppShare", { link: APP_SHARE_URL }, 2500);
      return true;
    } catch {
      return false;
    }
  }
}

/* Разрешение на уведомления */
export async function requestNotifications(): Promise<boolean> {
  try {
    await safeSend("VKWebAppAllowNotifications", undefined, 2500);
    return true;
  } catch {
    return false;
  }
}

/* Определяем, запущено ли приложение внутри соцсети */
export function isInsideSocialApp(): boolean {
  if (typeof window === "undefined") return false;
  const p = new URLSearchParams(window.location.search);
  return p.has("vk_app_id") || p.has("api_url") || p.get("vk_client") === "ok";
}
