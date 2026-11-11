"use client";

/* ═══════════════════════════════════════════════════════════════
   Глобальный экран ошибки (сбои корневого layout) — вместо белого
   экрана браузера.  Рисует собственные <html>/<body> без глобальных
   стилей, поэтому все цвета — напрямую, без CSS-переменных.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect } from "react";

const ink = "#181d24";
const soft = "#777f86";
const line = "#e6e8ea";
const bg = "#f5f5f5";
const gold = "#a8821f";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[pravoslavnye] Глобальная ошибка:", error);
  }, [error]);

  return (
    <html lang="ru">
      <body
        style={{
          margin: 0,
          background: bg,
          fontFamily: "Golos Text, system-ui, -apple-system, sans-serif",
          color: ink,
        }}
      >
        <div
          style={{
            minHeight: "100dvh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
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
              Приложение не открылось
            </h1>
            <p style={{ fontSize: 14, lineHeight: 1.5, margin: "0 0 20px", color: soft }}>
              Произошла непредвиденная ошибка. Попробуйте перезагрузить страницу.
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
              }}
            >
              Перезагрузить
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
