"use server";

import { OrganizerRequestStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  clearOrganizerSession,
  getOrganizerAccount,
  hashPassword,
  setOrganizerSession,
  verifyPassword
} from "@/lib/organizer-auth";
import { normalizeContactUrlInput } from "@/lib/contact-url";
import { prisma } from "@/lib/prisma";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getNumber(formData: FormData, key: string) {
  const value = getString(formData, key);
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

function getActivityId(formData: FormData) {
  const activityId = Number(getString(formData, "activityId"));

  if (!Number.isInteger(activityId) || activityId <= 0) {
    throw new Error("Некорректная активность.");
  }

  return activityId;
}

async function ensureAccess(activityId: number) {
  const account = await getOrganizerAccount();

  if (!account) {
    redirect("/organizer/login");
  }

  const activity = await prisma.activity.findUniqueOrThrow({
    where: { id: activityId },
    select: { id: true, slug: true, organizerId: true }
  });

  const access = await prisma.organizerAccess.findUnique({
    where: {
      accountId_organizerId: {
        accountId: account.id,
        organizerId: activity.organizerId
      }
    }
  });

  if (!access) {
    redirect("/organizer");
  }

  return { account, activity };
}

export async function registerOrganizer(formData: FormData) {
  const email = getString(formData, "email").toLowerCase();
  const name = getString(formData, "name");
  const contact = getString(formData, "contact");
  const password = getString(formData, "password");
  const proofUrl = normalizeContactUrlInput(getString(formData, "proofUrl"));
  const message = getString(formData, "message");
  const activityId = getActivityId(formData);
  const returnPath = `/organizer/register?activityId=${activityId}`;

  if (!email || !email.includes("@")) {
    fail(returnPath, "Укажите email для входа.");
  }

  if (!name) {
    fail(returnPath, "Укажите имя или название организации.");
  }

  if (password.length < 8) {
    fail(returnPath, "Пароль должен быть не короче 8 символов.");
  }

  if (!contact) {
    fail(returnPath, "Укажите Telegram, VK, телефон или email для связи.");
  }

  const activity = await prisma.activity.findUnique({
    where: { id: activityId },
    select: { organizerId: true }
  });

  if (!activity) {
    fail("/organizer/register", "Активность не найдена.");
  }

  const existingAccount = await prisma.organizerAccount.findUnique({
    where: { email }
  });

  if (existingAccount && !verifyPassword(password, existingAccount.passwordHash)) {
    fail(returnPath, "Этот email уже зарегистрирован. Войдите или укажите текущий пароль.");
  }

  const account = existingAccount
    ? await prisma.organizerAccount.update({
        where: { id: existingAccount.id },
        data: { name, contact }
      })
    : await prisma.organizerAccount.create({
        data: {
          email,
          name,
          contact,
          passwordHash: hashPassword(password)
        }
      });

  await prisma.organizerClaimRequest.create({
    data: {
      accountId: account.id,
      organizerId: activity.organizerId,
      activityId,
      proofUrl,
      message: message || null
    }
  });

  await setOrganizerSession(account.id);
  revalidatePath("/admin/organizer-requests");
  redirect("/organizer?registered=1");
}

export async function loginOrganizer(formData: FormData) {
  const email = getString(formData, "email").toLowerCase();
  const password = getString(formData, "password");
  const account = await prisma.organizerAccount.findUnique({
    where: { email }
  });

  if (!account || !verifyPassword(password, account.passwordHash)) {
    fail("/organizer/login", "Неверный email или пароль.");
  }

  await setOrganizerSession(account.id);
  redirect("/organizer");
}

export async function logoutOrganizer() {
  await clearOrganizerSession();
  redirect("/organizer/login");
}

export async function createOrganizerEditRequest(formData: FormData) {
  const activityId = getActivityId(formData);
  const { account, activity } = await ensureAccess(activityId);
  const isFree = formData.get("isFree") === "on";

  await prisma.organizerEditRequest.create({
    data: {
      accountId: account.id,
      activityId,
      title: getString(formData, "title") || null,
      description: getString(formData, "description") || null,
      address: getString(formData, "address") || null,
      priceFrom: isFree ? null : getNumber(formData, "priceFrom"),
      priceTo: isFree ? null : getNumber(formData, "priceTo"),
      isFree,
      beginnerFriendly: formData.get("beginnerFriendly") === "on",
      canComeAlone: formData.get("canComeAlone") === "on",
      contactPhone: getString(formData, "contactPhone") || null,
      contactUrl: normalizeContactUrlInput(getString(formData, "contactUrl")),
      imageUrl: normalizeContactUrlInput(getString(formData, "imageUrl")),
      note: getString(formData, "note") || null
    }
  });

  revalidatePath("/admin/organizer-requests");
  redirect(`/organizer/activities/${activity.slug}?edit=sent`);
}

export async function createOrganizerEventRequest(formData: FormData) {
  const activityId = getActivityId(formData);
  const { account, activity } = await ensureAccess(activityId);
  const title = getString(formData, "eventTitle");
  const startsAtValue = getString(formData, "startsAt");

  if (!title || !startsAtValue) {
    fail(`/organizer/activities/${activity.slug}`, "Укажите название и дату события.");
  }

  const startsAt = new Date(startsAtValue);
  const endsAtValue = getString(formData, "endsAt");
  const endsAt = endsAtValue ? new Date(endsAtValue) : null;

  if (Number.isNaN(startsAt.getTime()) || (endsAt && Number.isNaN(endsAt.getTime()))) {
    fail(`/organizer/activities/${activity.slug}`, "Проверьте дату и время события.");
  }

  await prisma.organizerEventRequest.create({
    data: {
      accountId: account.id,
      activityId,
      title,
      startsAt,
      endsAt,
      price: getNumber(formData, "eventPrice"),
      seatsAvailable: getNumber(formData, "seatsAvailable"),
      signupUrl: normalizeContactUrlInput(getString(formData, "signupUrl")),
      note: getString(formData, "eventNote") || null
    }
  });

  revalidatePath("/admin/organizer-requests");
  redirect(`/organizer/activities/${activity.slug}?event=sent`);
}

async function markClaimRequestWithStatus(formData: FormData, status: OrganizerRequestStatus) {
  const id = Number(getString(formData, "id"));

  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("Некорректная заявка.");
  }

  if (
    status !== OrganizerRequestStatus.approved &&
    status !== OrganizerRequestStatus.rejected
  ) {
    throw new Error("Некорректный статус.");
  }

  const claim = await prisma.organizerClaimRequest.update({
    where: { id },
    data: {
      status,
      adminComment: getString(formData, "adminComment") || null
    }
  });

  if (status === OrganizerRequestStatus.approved) {
    await prisma.organizerAccess.upsert({
      where: {
        accountId_organizerId: {
          accountId: claim.accountId,
          organizerId: claim.organizerId
        }
      },
      update: {},
      create: {
        accountId: claim.accountId,
        organizerId: claim.organizerId
      }
    });
  }

  revalidatePath("/admin/organizer-requests");
}

export async function approveClaimRequest(formData: FormData) {
  await markClaimRequestWithStatus(formData, OrganizerRequestStatus.approved);
}

export async function rejectClaimRequest(formData: FormData) {
  await markClaimRequestWithStatus(formData, OrganizerRequestStatus.rejected);
}

async function markEditRequestWithStatus(formData: FormData, status: OrganizerRequestStatus) {
  const id = Number(getString(formData, "id"));

  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("Некорректная заявка.");
  }

  if (
    status !== OrganizerRequestStatus.done &&
    status !== OrganizerRequestStatus.rejected
  ) {
    throw new Error("Некорректный статус.");
  }

  const request = await prisma.organizerEditRequest.findUniqueOrThrow({
    where: { id },
    include: { activity: true }
  });

  if (status === OrganizerRequestStatus.done) {
    await prisma.activity.update({
      where: { id: request.activityId },
      data: {
        title: request.title ?? request.activity.title,
        description: request.description ?? request.activity.description,
        address: request.address ?? request.activity.address,
        priceFrom: request.isFree ? null : request.priceFrom,
        priceTo: request.isFree ? null : request.priceTo,
        isFree: request.isFree ?? request.activity.isFree,
        beginnerFriendly: request.beginnerFriendly ?? request.activity.beginnerFriendly,
        canComeAlone: request.canComeAlone ?? request.activity.canComeAlone,
        contactPhone: request.contactPhone ?? request.activity.contactPhone,
        contactUrl: request.contactUrl ?? request.activity.contactUrl,
        imageUrl: request.imageUrl ?? request.activity.imageUrl,
        isVerified: true
      }
    });
  }

  await prisma.organizerEditRequest.update({
    where: { id },
    data: {
      status,
      adminComment: getString(formData, "adminComment") || null
    }
  });

  revalidatePath("/admin/organizer-requests");
  revalidatePath("/tula");
  revalidatePath(`/activity/${request.activity.slug}`);
}

export async function approveEditRequest(formData: FormData) {
  await markEditRequestWithStatus(formData, OrganizerRequestStatus.done);
}

export async function rejectEditRequest(formData: FormData) {
  await markEditRequestWithStatus(formData, OrganizerRequestStatus.rejected);
}

async function markEventRequestWithStatus(formData: FormData, status: OrganizerRequestStatus) {
  const id = Number(getString(formData, "id"));

  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("Некорректная заявка.");
  }

  if (
    status !== OrganizerRequestStatus.done &&
    status !== OrganizerRequestStatus.rejected
  ) {
    throw new Error("Некорректный статус.");
  }

  const request = await prisma.organizerEventRequest.findUniqueOrThrow({
    where: { id },
    include: { activity: true }
  });

  if (status === OrganizerRequestStatus.done) {
    await prisma.event.create({
      data: {
        activityId: request.activityId,
        title: request.title,
        startsAt: request.startsAt,
        endsAt: request.endsAt,
        price: request.price,
        seatsAvailable: request.seatsAvailable,
        signupUrl: request.signupUrl
      }
    });
  }

  await prisma.organizerEventRequest.update({
    where: { id },
    data: {
      status,
      adminComment: getString(formData, "adminComment") || null
    }
  });

  revalidatePath("/admin/organizer-requests");
  revalidatePath(`/activity/${request.activity.slug}`);
}

export async function approveEventRequest(formData: FormData) {
  await markEventRequestWithStatus(formData, OrganizerRequestStatus.done);
}

export async function rejectEventRequest(formData: FormData) {
  await markEventRequestWithStatus(formData, OrganizerRequestStatus.rejected);
}
