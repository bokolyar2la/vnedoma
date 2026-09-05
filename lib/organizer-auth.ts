import "server-only";

import { createHmac, pbkdf2Sync, randomBytes, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const cookieName = "vlyudi_organizer_session";
const maxAge = 60 * 60 * 24 * 30;

function getSecret() {
  const secret = process.env.ORGANIZER_AUTH_SECRET?.trim();
  if (process.env.NODE_ENV === "production" && (!secret || secret.length < 32 || secret.startsWith("change-me"))) {
    throw new Error("ORGANIZER_AUTH_SECRET must be a unique secret of at least 32 characters in production.");
  }
  return secret || "dev-organizer-secret";
}

function sign(value: string) {
  return createHmac("sha256", getSecret()).update(value).digest("base64url");
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);

  return left.length === right.length && timingSafeEqual(left, right);
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("base64url");
  const hash = pbkdf2Sync(password, salt, 120000, 32, "sha256").toString("base64url");

  return `${salt}.${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(".");

  if (!salt || !hash) {
    return false;
  }

  const candidate = pbkdf2Sync(password, salt, 120000, 32, "sha256").toString("base64url");
  return safeEqual(candidate, hash);
}

export async function setOrganizerSession(accountId: number) {
  const payload = `${accountId}.${Date.now()}`;
  const token = `${payload}.${sign(payload)}`;

  (await cookies()).set(cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge
  });
}

export async function clearOrganizerSession() {
  (await cookies()).delete(cookieName);
}

export async function getOrganizerAccount() {
  const token = (await cookies()).get(cookieName)?.value;

  if (!token) {
    return null;
  }

  const parts = token.split(".");

  if (parts.length !== 3) {
    return null;
  }

  const issuedAt = Number(parts[1]);
  const now = Date.now();
  if (!Number.isSafeInteger(issuedAt) || issuedAt <= 0 || issuedAt > now || now - issuedAt >= maxAge * 1000) {
    return null;
  }

  const payload = `${parts[0]}.${parts[1]}`;

  if (!safeEqual(parts[2], sign(payload))) {
    return null;
  }

  const accountId = Number(parts[0]);

  if (!Number.isInteger(accountId) || accountId <= 0) {
    return null;
  }

  return prisma.organizerAccount.findFirst({
    where: {
      id: accountId,
      isDisabled: false
    }
  });
}
