import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./fonts.css"; // самохостинг шрифтов — внешние запросы к Google убраны
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "Православные — мини-приложение для ОК",
  description:
    "Православный ежедневник внутри Одноклассников: святцы и посты, молитвослов, стих дня и Евангелие, православная библиотека — жития, святые отцы, ответы на вопросы, храмы рядом на карте. Платформа VK Mini Apps (vk_client=ok).",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#f5f5f5",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var s=localStorage.getItem("pr.textScale");var v=s!=null?JSON.parse(s):null;if(v==null){var f=localStorage.getItem("pr.fontBig");v=f!=null&&JSON.parse(f)?115:100}if(v&&v!==100){document.documentElement.style.fontSize=(Math.round(16*v)/100)+"px"}}catch(e){}`,
          }}
        />
      </head>
      <body className="antialiased bg-background text-foreground">
        {children}
        <Toaster />

        {/* Экран «не загрузилось» — появляется ТОЛЬКО если JS-чанки не стартовали
            за 5 с (битые чанки, старый webview, зависшая сеть). В норме React
            ставит window.__PR_BOOTED и экран так и не показывается. Кнопка —
            обычная ссылка: работает даже если JS недоступен вовсе. */}
        <div
          id="pr-boot"
          style={{
            display: "none",
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "#f5f5f5",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <div
            style={{
              maxWidth: 300,
              textAlign: "center",
              fontFamily: "Golos Text, system-ui, sans-serif",
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
                background: "#181d24",
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
            <div style={{ fontSize: 16, fontWeight: 600, color: "#181d24", marginBottom: 6 }}>
              Приложение не загрузилось
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.5, color: "#777f86", margin: "0 0 18px" }}>
              Проверьте подключение к интернету и обновите страницу. Если не помогает —
              закройте приложение и откройте заново.
            </p>
            <a
              href=""
              style={{
                display: "inline-block",
                padding: "11px 22px",
                borderRadius: 12,
                background: "#a8821f",
                color: "#ffffff",
                fontSize: 14,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Обновить
            </a>
          </div>
        </div>
        <script
          dangerouslySetInnerHTML={{
            __html: `setTimeout(function(){try{if(!window.__PR_BOOTED){var el=document.getElementById("pr-boot");if(el)el.style.display="flex"}}catch(e){}},5000)`,
          }}
        />
      </body>
    </html>
  );
}
