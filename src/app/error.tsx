"use client";

/* ═══════════════════════════════════════════════════════════════
   Экран ошибки клиента — вместо белого экрана Next.js.
   Любой сбой рендера показывает эту страницу: «Попробовать снова»
   перезапускает отрисовку, «Очистить данные приложения» удаляет
   записи старых версий в localStorage, которые могли вызвать сбой
   (масштаб текста сохраняется — настройка не связана со сбоем).
   ═══════════════════════════════════════════════════════════════ */

import { useEffect } from "react";

const ink = "#181d24";
const soft = "#777f86";
const line = "#e6e8ea";
const bg = "#f5f5f5";
const gold = "#a8821f";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[pravoslavnye] Ошибка интерфейса:", error);
  }, [error]);

  const wipeAndReload = () => {
    try {
      const scale = window.localStorage.getItem("pr.textScale");
      Object.keys(window.localStorage)
        .filter((k) => k.startsWith("pr."))
        .forEach((k) => window.localStorage.removeItem(k));
      if (scale) window.localStorage.setItem("pr.textScale", scale);
    } catch {
      /* приватный режим — просто перезагружаемся */
    }
    window.location.reload();
  };

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        fontFamily: "Golos Text, system-ui, -apple-system, sans-serif",
        color: ink,
      }}
    >
      <div
        style={{
          maxWidth: 340,
          width: "100%",
          textAlign: "center" as const,
          background: "#ffffff",
          border: `1px solid ${line}`,
          borderRadius: 20,
          padding: "28px 24px",
          boxShadow: "0 10px 30px rgba(24,29,36,.06)",
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: ink,
            marginBottom: 16,
          }}
        >
          <svg width="22" height="30" viewBox="0 0 40 56" fill="none" aria-hidden="true">
            <rect x="18.5" y="2" width="3" height="52" rx="1.2" fill="#ffffff" />
            <rect x="11" y="14.2" width="18" height="2.6" rx="1" fill="#ffffff" />
            <rect x="6" y="20" width="28" height="3" rx="1.2" fill="#ffffff" />
            <rect x="9" y="41" width="22" height="3" rx="1.2" fill="#ffffff" transform="rotate(28 20 42.5)" />
          </svg>
        </span>

        <h1 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 8px", color: ink }}>
          Что-то пошло не так
        </h1>
        <p style={{ fontSize: 14, lineHeight: 1.5, margin: "0 0 20px", color: soft }}>
          Не удалось открыть эту страницу. Обычно помогает перезагрузка.
        </p>

        <button
          onClick={reset}
          style={{
            width: "100%",
            padding: "12px 16px",
            borderRadius: 12,
            border: "none",
            background: gold,
            color: "#ffffff",
            fontSize: 15,
            fontWeight: 600,
            cursor: "pointer",
            marginBottom: 10,
          }}
        >
          Попробовать снова
        </button>
        <button
          onClick={wipeAndReload}
          style={{
            width: "100%",
            padding: "11px 16px",
            borderRadius: 12,
            border: `1px solid ${line}`,
            background: "transparent",
            color: ink,
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Очистить данные приложения
        </button>
        <p style={{ fontSize: 12, lineHeight: 1.45, margin: "14px 0 0", color: soft }}>
          Очистка удалит настройки и отметки, сохранённые на этом устройстве, и перезагрузит приложение.
        </p>
      </div>
    </div>
  );
}
