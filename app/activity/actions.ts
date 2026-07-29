"use server";

import { ActivityStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { notifyOrganizerAboutBooking } from "@/lib/booking-notifications";
import { prisma } from "@/lib/prisma";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function fail(slug: string, message: string): never {
  redirect(`/activity/${slug}?bookingError=${encodeURIComponent(message)}#booking-form`);
}

function sendNotificationInBackground(promise: Promise<void>, label: string) {
  promise.catch((error) => {
    console.error(`Failed to send ${label}`, error);
  });
}

export async function createActivityBookingRequest(formData: FormData) {
  const activityId = Number(getString(formData, "activityId"));
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

  const organizerAccount = await prisma.organizerAccount.findFirst({
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
      notificationEmail: true,
      notificationTelegram: true,
      platformBookingDiscountText: true
    }
  });

  if (!organizerAccount) {
    fail(activity.slug, "Запись через Влюди сейчас недоступна для этой активности.");
  }

  await prisma.activityBookingRequest.create({
    data: {
      activityId: activity.id,
      organizerAccountId: organizerAccount.id,
      name,
      contact,
      message,
      promoCode: "ВЛЮДИ",
      discountText: organizerAccount.platformBookingDiscountText
    }
  });

  sendNotificationInBackground(
    notifyOrganizerAboutBooking({
      activityTitle: activity.title,
      customerName: name,
      customerContact: contact,
      message,
      notificationEmail: organizerAccount.notificationEmail,
      notificationTelegram: organizerAccount.notificationTelegram,
      discountText: organizerAccount.platformBookingDiscountText
    }),
    "booking request email"
  );

  revalidatePath("/organizer");
  redirect(`/activity/${activity.slug}?booking=sent#booking-form`);
}
