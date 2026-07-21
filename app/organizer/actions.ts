"use server";

import { OrganizerRequestStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { normalizeContactUrlInput } from "@/lib/contact-url";
import { getEventExpiresAt } from "@/lib/events";
import {
  clearOrganizerSession,
  getOrganizerAccount,
  hashPassword,
  setOrganizerSession,
  verifyPassword
} from "@/lib/organizer-auth";
import { prisma } from "@/lib/prisma";
import { uploadActivityImage } from "@/lib/s3-upload";

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
  const separator = path.includes("?") ? "&" : "?";
  redirect(`${path}${separator}error=${encodeURIComponent(message)}`);
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
    select: { id: true, slug: true, title: true, organizerId: true }
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
    fail(
      returnPath,
      "Этот email уже зарегистрирован. Войдите или укажите текущий пароль."
    );
  }

  if (existingAccount?.isDisabled) {
    fail(returnPath, "Аккаунт организатора отключен.");
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

  if (!account || account.isDisabled || !verifyPassword(password, account.passwordHash)) {
    fail("/organizer/login", "Неверный email или пароль.");
  }

  await setOrganizerSession(account.id);
  redirect("/organizer");
}

export async function logoutOrganizer() {
  await clearOrganizerSession();
  redirect("/organizer/login");
}

export async function updateOrganizerPassword(formData: FormData) {
  const account = await getOrganizerAccount();

  if (!account) {
    redirect("/organizer/login");
  }

  const currentPassword = getString(formData, "currentPassword");
  const newPassword = getString(formData, "newPassword");
  const repeatPassword = getString(formData, "repeatPassword");
  const returnPath = "/organizer?tab=settings";

  if (!verifyPassword(currentPassword, account.passwordHash)) {
    fail(returnPath, "Текущий пароль указан неверно.");
  }

  if (newPassword.length < 8) {
    fail(returnPath, "Новый пароль должен быть не короче 8 символов.");
  }

  if (newPassword !== repeatPassword) {
    fail(returnPath, "Новый пароль и повтор не совпадают.");
  }

  await prisma.organizerAccount.update({
    where: { id: account.id },
    data: {
      passwordHash: hashPassword(newPassword)
    }
  });

  redirect("/organizer?tab=settings&password=changed");
}

export async function updateOrganizerBookingSettings(formData: FormData) {
  const account = await getOrganizerAccount();

  if (!account) {
    redirect("/organizer/login");
  }

  const enabled = formData.get("platformBookingEnabled") === "on";
  const notificationEmail = getString(formData, "notificationEmail") || account.email;
  const notificationTelegram = getString(formData, "notificationTelegram") || null;
  const discountText =
    getString(formData, "platformBookingDiscountText") || "Промокод ВЛЮДИ: 10% скидка";
  const returnPath = "/organizer?tab=settings";

  if (notificationEmail && !notificationEmail.includes("@")) {
    fail(returnPath, "Проверьте email для уведомлений.");
  }

  if (enabled && !notificationEmail && !notificationTelegram) {
    fail(returnPath, "Укажите email или Telegram, чтобы получать заявки.");
  }

  await prisma.organizerAccount.update({
    where: { id: account.id },
    data: {
      notificationEmail,
      notificationTelegram,
      platformBookingEnabled: enabled,
      platformBookingDiscountText: discountText
    }
  });

  revalidatePath("/organizer");
  redirect("/organizer?tab=settings&booking=saved");
}

export async function createOrganizerEditRequest(formData: FormData) {
  const activityId = getActivityId(formData);
  const { account, activity } = await ensureAccess(activityId);
  const isFree = formData.get("isFree") === "on";
  const priceNote = getString(formData, "priceNote") || null;
  const title = getString(formData, "title");
  const description = getString(formData, "description");
  const address = getString(formData, "address");
  let imageUrl: string | null = null;

  if (!title || !description || !address) {
    fail(
      `/organizer/activities/${activity.slug}`,
      "Заполните название, описание и адрес."
    );
  }

  try {
    imageUrl =
      (await uploadActivityImage(formData)) ??
      normalizeContactUrlInput(getString(formData, "imageUrl"));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Не удалось загрузить изображение.";
    fail(`/organizer/activities/${activity.slug}`, message);
  }

  const updateData = {
    title,
    description,
    whyGoText: getString(formData, "whyGoText") || null,
    address,
    priceFrom: isFree || priceNote ? null : getNumber(formData, "priceFrom"),
    priceTo: isFree || priceNote ? null : getNumber(formData, "priceTo"),
    priceNote,
    isFree,
    isAdultsOnly: formData.get("isAdultsOnly") === "on",
    beginnerFriendly: formData.get("beginnerFriendly") === "on",
    canComeAlone: formData.get("canComeAlone") === "on",
    contactPhone: getString(formData, "contactPhone") || null,
    contactUrl: normalizeContactUrlInput(getString(formData, "contactUrl")),
    imageUrl
  };

  await prisma.$transaction([
    prisma.activity.update({
      where: { id: activityId },
      data: {
        ...updateData,
        isVerified: true
      }
    }),
    prisma.organizerEditRequest.create({
      data: {
        accountId: account.id,
        activityId,
        status: OrganizerRequestStatus.done,
        ...updateData,
        note: getString(formData, "note") || null,
        adminComment: "Изменение опубликовано организатором без модерации."
      }
    })
  ]);

  revalidatePath("/admin/organizer-requests");
  revalidatePath("/organizer");
  revalidatePath(`/organizer/activities/${activity.slug}`);
  revalidatePath("/tula");
  revalidatePath(`/activity/${activity.slug}`);
  redirect(`/organizer/activities/${activity.slug}?edit=published`);
}

export async function createOrganizerEventRequest(formData: FormData) {
  const activityId = getActivityId(formData);
  const { account, activity } = await ensureAccess(activityId);
  const title = getString(formData, "eventTitle") || activity.title;
  const startsAtValue = getString(formData, "startsAt");

  if (!startsAtValue) {
    fail(`/organizer/activities/${activity.slug}`, "Укажите дату события.");
  }

  const startsAt = new Date(startsAtValue);
  const endsAtValue = getString(formData, "endsAt");
  const endsAt = endsAtValue ? new Date(endsAtValue) : null;

  if (Number.isNaN(startsAt.getTime()) || (endsAt && Number.isNaN(endsAt.getTime()))) {
    fail(`/organizer/activities/${activity.slug}`, "Проверьте дату и время события.");
  }

  if (endsAt && endsAt <= startsAt) {
    fail(
      `/organizer/activities/${activity.slug}`,
      "Окончание события должно быть позже начала."
    );
  }

  if (getEventExpiresAt({ startsAt, endsAt }) < new Date()) {
    fail(
      `/organizer/activities/${activity.slug}`,
      "Нельзя опубликовать уже прошедшее событие."
    );
  }

  const eventData = {
    activityId,
    title,
    startsAt,
    endsAt,
    price: getNumber(formData, "eventPrice"),
    seatsAvailable: getNumber(formData, "seatsAvailable"),
    signupUrl: normalizeContactUrlInput(getString(formData, "signupUrl"))
  };

  await prisma.$transaction([
    prisma.event.create({
      data: eventData
    }),
    prisma.organizerEventRequest.create({
      data: {
        accountId: account.id,
        status: OrganizerRequestStatus.done,
        ...eventData,
        note: getString(formData, "eventNote") || null,
        adminComment: "Событие опубликовано организатором без модерации."
      }
    })
  ]);

  revalidatePath("/admin/organizer-requests");
  revalidatePath("/organizer");
  revalidatePath(`/organizer/activities/${activity.slug}`);
  revalidatePath(`/activity/${activity.slug}`);
  redirect(`/organizer/activities/${activity.slug}?event=published`);
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
        whyGoText: request.whyGoText ?? request.activity.whyGoText,
        address: request.address ?? request.activity.address,
        priceFrom: request.isFree || request.priceNote ? null : request.priceFrom,
        priceTo: request.isFree || request.priceNote ? null : request.priceTo,
        priceNote: request.priceNote ?? (request.isFree === true ? null : request.activity.priceNote),
        isFree: request.isFree ?? request.activity.isFree,
        isAdultsOnly: request.isAdultsOnly ?? request.activity.isAdultsOnly,
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

export async function updateEditRequestComment(formData: FormData) {
  const id = Number(getString(formData, "id"));

  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("Некорректная заявка.");
  }

  await prisma.organizerEditRequest.update({
    where: { id },
    data: {
      adminComment: getString(formData, "adminComment") || null
    }
  });

  revalidatePath("/admin/organizer-requests");
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
    if (getEventExpiresAt(request) < new Date()) {
      throw new Error("Нельзя опубликовать уже прошедшее событие.");
    }

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

export async function updateEventRequestComment(formData: FormData) {
  const id = Number(getString(formData, "id"));

  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("Некорректная заявка.");
  }

  await prisma.organizerEventRequest.update({
    where: { id },
    data: {
      adminComment: getString(formData, "adminComment") || null
    }
  });

  revalidatePath("/admin/organizer-requests");
}
