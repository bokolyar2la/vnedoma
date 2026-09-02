"use server";

import { ActivityStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { resolveOrganizerBilling } from "@/lib/billing";
import { notifyOrganizerAboutBooking } from "@/lib/booking-notifications";
import { prisma } from "@/lib/prisma";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function fail(slug: string, message: string): never {
  redirect(`/activity/${slug}?bookingError=${encodeURIComponent(message)}#booking-form`);
}

type BookingAccountForRequest = {
  id: number;
  email: string;
  billingPlan: string;
  billingStatus: string;
  paidUntil: Date | null;
  trialUntil: Date | null;
  notificationEmail: string | null;
  notificationTelegram: string | null;
  platformBookingDiscountText: string | null;
};

async function sendNotificationSafely(promise: Promise<void>, label: string) {
  try {
    await promise;
  } catch (error) {
    console.error(`Failed to send ${label}`, error);
  }
}

export async function createActivityBookingRequest(formData: FormData) {
  const activityId = Number(getString(formData, "activityId"));
  const rawEventId = Number(getString(formData, "eventId"));
  const name = getString(formData, "name");
  const contact = getString(formData, "contact");
  const message = getString(formData, "message") || null;

  if (!Number.isInteger(activityId) || activityId <= 0) {
    redirect("/tula");
  }

  const activity = await prisma.activity.findFirst({
    where: {
      id: activityId,
      status: ActivityStatus.published
    },
    select: {
      id: true,
      slug: true,
      title: true,
      organizerId: true
    }
  });

  if (!activity) {
    redirect("/tula");
  }

  if (!name) {
    fail(activity.slug, "Укажите имя.");
  }

  if (!contact) {
    fail(activity.slug, "Укажите телефон, Telegram или другой контакт.");
  }

  const organizerAccounts = (await prisma.organizerAccount.findMany({
      where: {
        platformBookingEnabled: true,
        isDisabled: false,
        accesses: {
          some: {
            organizerId: activity.organizerId
          }
        }
      },
      select: {
        id: true,
        email: true,
        billingPlan: true,
        billingStatus: true,
        paidUntil: true,
        trialUntil: true,
        notificationEmail: true,
        notificationTelegram: true,
        platformBookingDiscountText: true
      } as any
    })) as unknown as BookingAccountForRequest[];
  const organizerAccount =
    organizerAccounts.find((account) => resolveOrganizerBilling(account).isActive) ?? null;

  if (!organizerAccount) {
    fail(activity.slug, "Запись через Влюди сейчас недоступна для этой активности.");
  }

  const event =
    Number.isInteger(rawEventId) && rawEventId > 0
      ? await prisma.event.findFirst({
          where: {
            id: rawEventId,
            activityId: activity.id
          },
          select: {
            id: true,
            title: true,
            discountText: true
          } as any
        })
      : null;
  const discountText =
    (event as { discountText?: string | null } | null)?.discountText ||
    organizerAccount.platformBookingDiscountText;

  await prisma.activityBookingRequest.create({
    data: {
      activityId: activity.id,
      ...((event ? { eventId: event.id } : {}) as any),
      organizerAccountId: organizerAccount.id,
      name,
      contact,
      message,
      promoCode: "ВЛЮДИ",
      discountText
    } as any
  });

  await sendNotificationSafely(
    notifyOrganizerAboutBooking({
      activityTitle: event ? `${activity.title}: ${event.title}` : activity.title,
      customerName: name,
      customerContact: contact,
      message,
      notificationEmail: organizerAccount.notificationEmail || organizerAccount.email,
      notificationTelegram: organizerAccount.notificationTelegram,
      discountText
    }),
    "booking request email"
  );

  revalidatePath("/organizer");
  redirect(`/activity/${activity.slug}?booking=sent#booking-form`);
}
