import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/* ═══════════════════════════════════════════════════════════
   /api/questions — вопросы священнику.
   POST: сохранить новый вопрос (анонимно, по anonId из localStorage)
   GET ?anonId=…: вернуть вопросы пользователя с их статусами
   ═══════════════════════════════════════════════════════════ */

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { anonId?: string; text?: string; topic?: string };
    const anonId = (body.anonId ?? "").trim();
    const text = (body.text ?? "").trim();
    const topic = (body.topic ?? "").trim().slice(0, 60) || null;

    if (!anonId || anonId.length < 4) {
      return NextResponse.json({ error: "Некорректный идентификатор пользователя" }, { status: 400 });
    }
    if (text.length < 10) {
      return NextResponse.json({ error: "Опишите вопрос подробнее (минимум 10 символов)" }, { status: 400 });
    }
    if (text.length > 2000) {
      return NextResponse.json({ error: "Вопрос слишком длинный (максимум 2000 символов)" }, { status: 400 });
    }

    const created = await db.question.create({
      data: { anonId, text, topic, status: "moderation" },
    });

    return NextResponse.json({
      ok: true,
      id: created.id,
      createdAt: created.createdAt,
      status: created.status,
    });
  } catch {
    return NextResponse.json({ error: "Не удалось сохранить вопрос. Попробуйте позже." }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const anonId = req.nextUrl.searchParams.get("anonId") ?? "";
    if (!anonId) {
      return NextResponse.json({ questions: [] });
    }
    const rows = await db.question.findMany({
      where: { anonId },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, text: true, topic: true, status: true, answer: true, createdAt: true },
    });
    return NextResponse.json({ questions: rows });
  } catch {
    return NextResponse.json({ error: "Не удалось загрузить вопросы" }, { status: 500 });
  }
}
