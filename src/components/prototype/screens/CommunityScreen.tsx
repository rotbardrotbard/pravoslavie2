"use client";

import { Gift, Heart, Share2, Users } from "lucide-react";
import { verseOfDay } from "@/lib/content/word";
import { SectionTitle } from "../bits";

export default function CommunityScreen({
  openGifts,
  share,
  toast,
}: {
  openGifts: () => void;
  share: (text: string) => Promise<void>;
  toast: (m: string) => void;
}) {
  const verse = verseOfDay();

  return (
    <div className="px-4 py-4 pb-8 animate-fade-up">
      {/* Правила */}
      <div className="orn-card-soft flex items-start gap-2.5 px-3.5 py-3 mb-4">
        <Heart size={16} className="mt-0.5 shrink-0" style={{ color: "var(--an-accent)" }} />
        <p className="pr-serif text-[0.7rem] leading-relaxed" style={{ color: "var(--an-ink-soft)" }}>
          <span className="font-bold" style={{ color: "var(--an-ink)" }}>
            Делимся добрым:{" "}
          </span>
          отправьте близким стих дня или подарок, пригласите друзей в приложение. Публикация —
          через окно ОК, от вашего имени.
        </p>
      </div>

      <SectionTitle className="mb-2">Чем поделиться</SectionTitle>
      <div className="flex flex-col gap-2 mb-4">
        <button
          onClick={() => share(`«${verse.text}» — ${verse.ref}. Стих дня из мини-приложения «Православные»`)}
          className="orn-card w-full flex items-center gap-3 px-3.5 py-3 text-left transition-all hover:shadow-lg"
        >
          <span
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "var(--an-ink)", color: "#ffffff" }}
          >
            <Share2 size={15} />
          </span>
          <span className="flex-1 min-w-0">
            <span className="pr-serif font-bold text-[0.82rem] block" style={{ color: "var(--an-ink)" }}>
              Стих дня
            </span>
            <span className="pr-serif text-[0.68rem] block" style={{ color: "var(--an-ink-soft)" }}>
              «{verse.text.slice(0, 46)}…» · {verse.ref}
            </span>
          </span>
        </button>

        <button
          onClick={openGifts}
          className="orn-card w-full flex items-center gap-3 px-3.5 py-3 text-left transition-all hover:shadow-lg"
        >
          <span
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "#f1f2f3", color: "var(--an-ink)" }}
          >
            <Gift size={15} />
          </span>
          <span className="flex-1 min-w-0">
            <span className="pr-serif font-bold text-[0.82rem] block" style={{ color: "var(--an-ink)" }}>
              Отправить подарок
            </span>
            <span className="pr-serif text-[0.68rem] block" style={{ color: "var(--an-ink-soft)" }}>
              Православные коллекции — в разделе подарков ОК
            </span>
          </span>
        </button>

        <button
          onClick={async () => {
            const { inviteFriends } = await import("@/lib/bridge");
            const ok = await inviteFriends();
            toast(
              ok
                ? "Открываем окно приглашения друзей"
                : "Приглашение скопировано — вставьте в сообщение ОК"
            );
            if (!ok) {
              await share("Присоединяйтесь к мини-приложению «Православные» в ОК");
            }
          }}
          className="orn-card w-full flex items-center gap-3 px-3.5 py-3 text-left transition-all hover:shadow-lg"
        >
          <span
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "#f1f2f3", color: "var(--an-ink)" }}
          >
            <Users size={15} />
          </span>
          <span className="flex-1 min-w-0">
            <span className="pr-serif font-bold text-[0.82rem] block" style={{ color: "var(--an-ink)" }}>
              Пригласить друзей
            </span>
            <span className="pr-serif text-[0.68rem] block" style={{ color: "var(--an-ink-soft)" }}>
              Выбор друзей из ОК — стандартное окно платформы
            </span>
          </span>
        </button>
      </div>

      <p className="pr-read italic text-[0.64rem] text-center" style={{ color: "var(--an-ink-soft)" }}>
        Всё, чем вы делитесь, публикуется от вашего имени — приложение ничего не постит без нажатия
      </p>
    </div>
  );
}
