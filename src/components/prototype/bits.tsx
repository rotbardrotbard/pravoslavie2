"use client";

/* Общие элементы прототипа: крест-логотип, разделители, заголовки, фото-плашки.
   Стиль — референс ANTIПA LAVKA: монохром, тонкие линии, без орнамента.
   Вместо чёрных плашек — фотографии православных храмов с виньеткой и градиентом. */

export function PhotoBanner({
  src,
  alt,
  children,
  className = "",
  contentClassName = "",
  position = "center",
  strength = "soft",
}: {
  src: string;
  alt?: string;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  position?: string;
  /** soft — текст снизу; firm — яркая фото, текст плотнее перекрыт; center — равномерное затемнение */
  strength?: "soft" | "firm" | "center";
}) {
  const gradient =
    strength === "center"
      ? "linear-gradient(rgba(17,21,27,.55), rgba(17,21,27,.55)), linear-gradient(to top, rgba(17,21,27,.72) 0%, rgba(17,21,27,.18) 55%, rgba(17,21,27,.30) 100%)"
      : strength === "firm"
        ? "linear-gradient(to top, rgba(17,21,27,.90) 0%, rgba(17,21,27,.56) 55%, rgba(17,21,27,.26) 100%)"
        : "linear-gradient(to top, rgba(17,21,27,.86) 0%, rgba(17,21,27,.40) 55%, rgba(17,21,27,.12) 100%)";

  return (
    <div
      className={`relative overflow-hidden rounded-[14px] isolate ${className}`}
      style={{ boxShadow: "0 2px 10px rgba(24,29,36,.16)" }}
      role={alt ? "img" : undefined}
      aria-label={alt}
    >
      {/* Фотография храма */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${src})`,
          backgroundPosition: position,
          filter: "saturate(.88) contrast(1.03) brightness(.97)",
        }}
      />
      {/* Виньетка — мягкое затенение краёв */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(135% 105% at 50% 30%, transparent 40%, rgba(14,17,22,.52) 100%)",
        }}
      />
      {/* Градиент под текст */}
      <div aria-hidden="true" className="absolute inset-0" style={{ background: gradient }} />
      <div className={`relative ${contentClassName}`}>{children}</div>
    </div>
  );
}

export function OrthodoxCross({ size = 28, color = "#ffffff" }: { size?: number; color?: string }) {
  // Восьмиконечный православный крест (канонический):
  //  — табличка (верхняя малая) — сразу над средней перекладиной;
  //  — средняя перекладина — самая широкая;
  //  — подножие наклонено так, что приподнят конец слева (для зрителя):
  //    это сторона благоразумного разбойника, распятого по правую руку
  //    Спасителя (журнал «Фома»: правый относительно Христа конец поднят).
  return (
    <svg width={size} height={size} viewBox="0 0 40 56" fill="none" aria-hidden="true">
      {/* вертикаль */}
      <rect x="18.5" y="2" width="3" height="52" rx="1.2" fill={color} />
      {/* табличка — сразу над средней перекладиной */}
      <rect x="11" y="14.2" width="18" height="2.6" rx="1" fill={color} />
      {/* средняя перекладина */}
      <rect x="6" y="20" width="28" height="3" rx="1.2" fill={color} />
      {/* нижняя косая: приподнятый конец — слева (благоразумный разбойник) */}
      <rect x="9" y="41" width="22" height="3" rx="1.2" fill={color} transform="rotate(28 20 42.5)" />
    </svg>
  );
}

export function CrossInCircle({ size = 34 }: { size?: number }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-full shrink-0"
      style={{
        width: size,
        height: size,
        background: "var(--an-ink)",
        boxShadow: "0 1px 3px rgba(24,29,36,.25)",
      }}
    >
      <OrthodoxCross size={size * 0.52} />
    </span>
  );
}

export function OrnamentDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`an-divider ${className}`} aria-hidden="true">
      <svg width="26" height="10" viewBox="0 0 26 10" fill="none">
        <path d="M13 1 L16 5 L13 9 L10 5 Z" stroke="currentColor" strokeWidth="1" />
        <path d="M1 5 H8 M18 5 H25" stroke="currentColor" strokeWidth="1" />
      </svg>
    </div>
  );
}

export function SectionTitle({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span
        className="text-[0.68rem] tracking-[0.14em] uppercase"
        style={{ color: "var(--an-ink-soft)", fontWeight: 600 }}
      >
        {children}
      </span>
      <span className="h-px flex-1" style={{ background: "var(--an-line)" }} />
    </div>
  );
}

export function AdSlot({ onToast }: { onToast: (m: string) => void }) {
  return (
    <button
      onClick={() => onToast("Рекламный блок подключается платформой ОК после публикации приложения")}
      className="w-full text-left rounded-xl border border-dashed px-3 py-2 flex items-center gap-2 transition-colors hover:bg-[#ffffff]"
      style={{ borderColor: "var(--an-line-strong)", background: "rgba(255,255,255,.55)" }}
    >
      <span
        className="text-[0.62rem] tracking-wide uppercase px-1.5 py-0.5 rounded shrink-0"
        style={{ background: "var(--an-tile)", color: "var(--an-ink-soft)", fontWeight: 600 }}
      >
        Реклама
      </span>
      <span className="text-[0.72rem] leading-snug" style={{ color: "var(--an-ink-soft)" }}>
        Нативный блок платформы ОК — вне молитв и праздников
      </span>
    </button>
  );
}
