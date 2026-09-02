import { ActivityStatType } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const allowedTypes = new Set<string>([
  ActivityStatType.view,
  ActivityStatType.signup_click,
  ActivityStatType.nearest_event_click
]);

function cut(value: unknown) {
  return typeof value === "string" && value.trim()
    ? value.trim().slice(0, 500)
    : null;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const activityId = Number(body?.activityId);
  const eventId = Number(body?.eventId);
  const type = typeof body?.type === "string" ? body.type : "";

  if (!Number.isInteger(activityId) || activityId <= 0 || !allowedTypes.has(type)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  await prisma.activityStatEvent.create({
    data: {
      activityId,
      ...((Number.isInteger(eventId) && eventId > 0 ? { eventId } : {}) as any),
      type: type as ActivityStatType,
      path: cut(body?.path),
      referrer: cut(body?.referrer) ?? cut(request.headers.get("referer"))
    } as any
  });

  return NextResponse.json({ ok: true });
}
