"use client";

import { useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Clock,
  MessageCircleQuestion,
  Search,
  Send,
  ShieldCheck,
} from "lucide-react";
import { askTopics, faqQuestions } from "@/lib/content/faq";
import { getAnonId } from "@/lib/storage";
import { SectionTitle } from "../bits";

interface MyQuestion {
  id: string;
  text: string;
  topic: string | null;
  status: string;
  answer: string | null;
  createdAt: string;
}

const statusLabel: Record<string, string> = {
  moderation: "На модерации",
  answered: "Есть ответ",
  published: "Опубликовано",
};

export default function QuestionScreen({ toast }: { toast: (m: string) => void }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<number | null>(0);
  const [mode, setMode] = useState<"list" | "form" | "done">("list");
  const [text, setText] = useState("");
  const [topic, setTopic] = useState<string>("О вере");
  const [agree, setAgree] = useState(false);
  const [sending, setSending] = useState(false);
  const [mine, setMine] = useState<MyQuestion[]>([]);

  const shown = faqQuestions.filter((q) =>
    (q.q + q.a).toLowerCase().includes(query.trim().toLowerCase())
  );

  /* Мои вопросы */
  const loadMine = async () => {
    const anonId = getAnonId();
    try {
      const res = await fetch(`/api/questions?anonId=${encodeURIComponent(anonId)}`);
      const data = (await res.json()) as { questions?: MyQuestion[] };
      setMine(data.questions ?? []);
    } catch {
      /* без сети просто не показываем */
    }
  };

  useEffect(() => {
    const t = setTimeout(() => void loadMine(), 0);
    return () => clearTimeout(t);
  }, []);

  if (mode === "done") {
    return (
      <div className="px-4 py-6 pb-8 animate-fade-up text-center">
        <div
          className="w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center"
          style={{ background: "var(--an-slate)", color: "#ffffff" }}
        >
          <ShieldCheck size={30} />
        </div>
        <h2 className="pr-display text-[1.05rem] mb-2" style={{ color: "var(--an-ink)" }}>
          Вопрос отправлен
        </h2>
        <p className="pr-serif text-[0.78rem] leading-relaxed mb-1" style={{ color: "var(--an-ink)" }}>
          Он сохранён и ждёт модерации. Ответ придёт уведомлением в ОК, а также появится в списке
          «Мои вопросы».
        </p>
        <p className="pr-serif text-[0.68rem] mb-5" style={{ color: "var(--an-ink-soft)" }}>
          Обычно ответ публикуется в течение нескольких дней.
        </p>
        <button onClick={() => setMode("list")} className="pr-btn pr-btn-secondary w-full">
          Вернуться к вопросам
        </button>
      </div>
    );
  }

  if (mode === "form") {
    return (
      <div className="px-4 py-4 pb-8 animate-fade-up">
        <SectionTitle className="mb-2">Ваш вопрос</SectionTitle>

        <div className="flex gap-1.5 overflow-x-auto no-scrollbar mb-2 pb-1">
          {askTopics.map((t) => (
            <button
              key={t}
              onClick={() => setTopic(t)}
              className={`pr-chip shrink-0 ${topic === t ? "pr-chip-active" : ""}`}
            >
              {t}
            </button>
          ))}
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          maxLength={2000}
          placeholder="Опишите вопрос. Пожалуйста, без имён третьих лиц и деталей, которые вы не хотели бы делать публичными."
          className="w-full rounded-xl p-3 pr-serif text-[0.8rem] leading-relaxed mb-2 outline-none"
          style={{
            background: "#ffffff",
            border: "1px solid #d9dcde",
            color: "var(--an-ink)",
            resize: "vertical",
          }}
        />
        <div className="text-[0.62rem] text-right mb-3" style={{ color: "var(--an-ink-soft)" }}>
          {text.length} / 2000
        </div>

        <button
          onClick={() => setAgree(!agree)}
          className="flex items-start gap-2 mb-4 text-left"
          role="checkbox"
          aria-checked={agree}
        >
          <span
            className="w-5 h-5 rounded-md shrink-0 flex items-center justify-center mt-0.5"
            style={{
              border: agree ? "none" : "1.5px solid #b9bec3",
              background: agree ? "var(--an-ink)" : "transparent",
              color: "#ffffff",
            }}
          >
            {agree && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M5 13 L10 18 L19 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </span>
          <span className="pr-serif text-[0.7rem] leading-snug" style={{ color: "var(--an-ink-soft)" }}>
            Я согласен с правилами: вопрос может быть опубликован в анонимной форме.
          </span>
        </button>

        <div className="flex gap-2">
          <button onClick={() => setMode("list")} className="pr-btn pr-btn-secondary flex-1">
            Отмена
          </button>
          <button
            onClick={async () => {
              if (!agree || text.trim().length < 10) {
                toast("Опишите вопрос (от 10 символов) и согласитесь с правилами");
                return;
              }
              setSending(true);
              try {
                const res = await fetch("/api/questions", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ anonId: getAnonId(), text: text.trim(), topic }),
                });
                const data = (await res.json()) as { ok?: boolean; error?: string };
                if (!res.ok || !data.ok) {
                  toast(data.error ?? "Не удалось отправить вопрос");
                  setSending(false);
                  return;
                }
                await loadMine();
                setMode("done");
                setText("");
              } catch {
                toast("Сеть недоступна. Попробуйте позже.");
              }
              setSending(false);
            }}
            disabled={sending}
            className="pr-btn pr-btn-primary flex-1"
          >
            <Send size={14} /> {sending ? "Отправляем…" : "Отправить"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 pb-8 animate-fade-up">
      {/* Поиск */}
      <div className="relative mb-4">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2"
          style={{ color: "var(--an-ink-soft)" }}
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск по вопросам: «свечи», «пост», «исповедь»…"
          className="w-full rounded-xl pl-9 pr-3 py-2.5 pr-serif text-[0.78rem] outline-none"
          style={{ background: "#ffffff", border: "1px solid #d9dcde", color: "var(--an-ink)" }}
        />
      </div>

      <SectionTitle className="mb-2">
        {query ? `Найдено: ${shown.length}` : "Вопросы священнику"}
      </SectionTitle>

      <div className="flex flex-col gap-2 mb-4">
        {shown.map((q, i) => {
          const isOpen = open === i;
          return (
            <div key={i} className="orn-card px-3.5 py-3">
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                className="w-full flex items-start gap-2 text-left"
                aria-expanded={isOpen}
              >
                <MessageCircleQuestion size={15} className="mt-0.5 shrink-0" style={{ color: "var(--an-ink)" }} />
                <span className="flex-1 pr-serif font-bold text-[0.8rem] leading-snug" style={{ color: "var(--an-ink)" }}>
                  {q.q}
                </span>
                {isOpen ? (
                  <ChevronUp size={15} style={{ color: "var(--an-ink-soft)" }} />
                ) : (
                  <ChevronDown size={15} style={{ color: "var(--an-ink-soft)" }} />
                )}
              </button>
              {isOpen && (
                <div className="mt-2 pt-2 animate-fade-up" style={{ borderTop: "1px solid #e2e4e6" }}>
                  <p className="pr-serif text-[0.76rem] leading-relaxed mb-2" style={{ color: "var(--an-ink)" }}>
                    {q.a}
                  </p>
                  <p className="pr-serif text-[0.62rem]" style={{ color: "var(--an-ink-soft)" }}>
                    Тема: {q.topic}
                  </p>
                </div>
              )}
            </div>
          );
        })}
        {shown.length === 0 && (
          <div className="orn-card-soft px-3.5 py-3 pr-serif text-[0.76rem]" style={{ color: "var(--an-ink)" }}>
            Такого вопроса в базе ещё нет — задайте его первым.
          </div>
        )}
      </div>

      {/* Мои вопросы */}
      {mine.length > 0 && (
        <>
          <SectionTitle className="mb-2">Мои вопросы</SectionTitle>
          <div className="flex flex-col gap-2 mb-4">
            {mine.map((m) => (
              <div key={m.id} className="orn-card-soft px-3.5 py-2.5">
                <div className="flex items-center gap-2 mb-1">
                  <Clock size={11} style={{ color: "var(--an-ink-soft)" }} />
                  <span className="pr-serif text-[0.64rem]" style={{ color: "var(--an-ink-soft)" }}>
                    {new Date(m.createdAt).toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}
                    {" · "}
                    {statusLabel[m.status] ?? m.status}
                  </span>
                </div>
                <p className="pr-serif text-[0.76rem] leading-snug" style={{ color: "var(--an-ink)" }}>
                  {m.text}
                </p>
                {m.answer && (
                  <p className="pr-serif text-[0.72rem] leading-relaxed mt-1.5" style={{ color: "var(--an-ink-soft)" }}>
                    Ответ: {m.answer}
                  </p>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      <button onClick={() => setMode("form")} className="pr-btn pr-btn-primary w-full">
        Задать свой вопрос
      </button>
      <p className="pr-read italic text-[0.64rem] mt-3 text-center" style={{ color: "var(--an-ink-soft)" }}>
        Сначала ищем в готовых ответах — на большинство вопросов уже ответили
      </p>
    </div>
  );
}
