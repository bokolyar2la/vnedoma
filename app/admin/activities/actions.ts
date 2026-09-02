"use server";

import { ActivityMediaType, ActivityStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { notifySubmitterActivityPublished } from "@/lib/booking-notifications";
import { normalizeContactUrlInput } from "@/lib/contact-url";
import { prisma } from "@/lib/prisma";
import { normalizeDiscountText, normalizePromoCode } from "@/lib/promo";
import { uploadActivityImage, uploadActivityImageField } from "@/lib/s3-upload";
import { generateUniqueSlug } from "@/lib/slug";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getOptionalString(formData: FormData, key: string) {
  const value = getString(formData, key);
  return value || null;
}

function getNumber(formData: FormData, key: string) {
  const value = getString(formData, key);
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function getOptionalDateTime(formData: FormData, key: string) {
  const value = getString(formData, key);
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Проверьте дату и время события.");
  }

  return date;
}

function getRequiredActivityEventInput(formData: FormData) {
  const activityId = Number(getString(formData, "activityId"));
  const title = getString(formData, "eventTitle");
  const startsAt = getOptionalDateTime(formData, "startsAt");
  const endsAt = getOptionalDateTime(formData, "endsAt");

  if (!Number.isInteger(activityId) || activityId <= 0) {
    throw new Error("Некорректная активность.");
  }

  if (!title) {
    throw new Error("Укажите название события.");
  }

  if (!startsAt) {
    throw new Error("Укажите дату начала события.");
  }

  if (endsAt && endsAt <= startsAt) {
    throw new Error("Окончание события должно быть позже начала.");
  }

  return {
    activityId,
    title,
    startsAt,
    endsAt,
    price: getNumber(formData, "eventPrice"),
    seatsAvailable: getNumber(formData, "seatsAvailable"),
    signupUrl: normalizeContactUrlInput(getString(formData, "signupUrl")),
    promoCode: normalizePromoCode(getString(formData, "promoCode")),
    discountText: normalizeDiscountText(getString(formData, "discountText")),
    isPromoEnabled: formData.getAll("isPromoEnabled").includes("on"),
    publishedToVk: formData.get("publishedToVk") === "on",
    publishedToInstagram: formData.get("publishedToInstagram") === "on",
    adminNote: getOptionalString(formData, "adminNote")
  };
}

async function getActivityMediaInput(formData: FormData) {
  const media = await Promise.all(
    [1, 2, 3].map(async (position) => {
      const uploadedUrl = await uploadActivityImageField(formData, `media${position}File`);
      const url = uploadedUrl ?? getOptionalString(formData, `media${position}Url`);
      const rawType = getString(formData, `media${position}Type`);

      if (!url) {
        return null;
      }

      return {
        type:
          rawType === ActivityMediaType.video
            ? ActivityMediaType.video
            : ActivityMediaType.image,
        url,
        caption: getOptionalString(formData, `media${position}Caption`),
        position
      };
    })
  );

  return media.filter(
    (
      media
    ): media is {
      type: ActivityMediaType;
      url: string;
      caption: string | null;
      position: number;
    } => Boolean(media)
  );
}

function getRequiredId(formData: FormData) {
  const id = Number(getString(formData, "id"));
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("Некорректный id активности.");
  }

  return id;
}

function getStatus(
  formData: FormData,
  fallback: ActivityStatus = ActivityStatus.published
): ActivityStatus {
  const status = getString(formData, "status");
  if (
    status === ActivityStatus.draft ||
    status === ActivityStatus.published ||
    status === ActivityStatus.archived
  ) {
    return status;
  }

  return fallback;
}

function validateActivityForm(formData: FormData) {
  const title = getString(formData, "title");
  const description = getString(formData, "description");
  const categoryId = Number(getString(formData, "categoryId"));

  if (!title) {
    throw new Error("Укажите название активности.");
  }

  if (!description) {
    throw new Error("Добавьте описание активности.");
  }

  if (!Number.isInteger(categoryId) || categoryId <= 0) {
    throw new Error("Выберите категорию.");
  }

  return { title, description, categoryId };
}

async function getTulaCity() {
  return prisma.city.upsert({
    where: { slug: "tula" },
    update: { name: "Тула" },
    create: { name: "Тула", slug: "tula" }
  });
}

async function getOrCreateOrganizer(formData: FormData, cityId: number) {
  const organizerId = Number(getString(formData, "organizerId"));
  const organizerName = getString(formData, "organizerName") || "Не указан";
  const address = getString(formData, "address") || "Адрес уточняется";
  const contactUrl = normalizeContactUrlInput(getString(formData, "contactUrl"));

  if (Number.isInteger(organizerId) && organizerId > 0) {
    const existingOrganizer = await prisma.organizer.findUnique({
      where: { id: organizerId },
      select: { id: true }
    });

    if (existingOrganizer) {
      return prisma.organizer.update({
        where: { id: organizerId },
        data: {
          address,
          phone: getOptionalString(formData, "contactPhone"),
          websiteUrl: contactUrl
        }
      });
    }
  }

  return prisma.organizer.upsert({
    where: {
      name_cityId: {
        name: organizerName,
        cityId
      }
    },
    update: {
      address,
      phone: getOptionalString(formData, "contactPhone"),
      websiteUrl: contactUrl
    },
    create: {
      name: organizerName,
      description: "Организатор добавлен через админку.",
      address,
      cityId,
      phone: getOptionalString(formData, "contactPhone"),
      websiteUrl: contactUrl
    }
  });
}

async function revalidateAdmin() {
  revalidatePath("/admin");
  revalidatePath("/admin/activities");
  revalidatePath("/admin/organizers");
  revalidatePath("/tula");
  revalidatePath("/kuda-shodit-v-tule");
  revalidatePath("/");
}

function revalidateActivityPublicPages(slug: string) {
  revalidatePath(`/activity/${slug}`);
  revalidatePath("/tula");
  revalidatePath("/kuda-shodit-v-tule");
  revalidatePath("/");
}

export async function createAdminActivity(formData: FormData) {
  const { title, description, categoryId } = validateActivityForm(formData);
  const city = await getTulaCity();
  const organizer = await getOrCreateOrganizer(formData, city.id);
  const isFree = formData.get("isFree") === "on";
  const priceNote = getOptionalString(formData, "priceNote");
  const imageUrl = (await uploadActivityImage(formData)) ?? getOptionalString(formData, "imageUrl");
  const media = await getActivityMediaInput(formData);

  const activity = await prisma.activity.create({
    data: {
      title,
      slug: await generateUniqueSlug(title),
      description,
      whyGoText: getOptionalString(formData, "whyGoText"),
      cityId: city.id,
      categoryId,
      organizerId: organizer.id,
      address: getString(formData, "address") || "Адрес уточняется",
      priceFrom: isFree || priceNote ? null : getNumber(formData, "priceFrom"),
      priceTo: isFree || priceNote ? null : getNumber(formData, "priceTo"),
      priceNote,
      isFree,
      isForAdults: true,
      isAdultsOnly: formData.get("isAdultsOnly") === "on",
      beginnerFriendly: formData.get("beginnerFriendly") === "on",
      canComeAlone: formData.get("canComeAlone") === "on",
      contactPhone: getOptionalString(formData, "contactPhone"),
      contactUrl: normalizeContactUrlInput(getString(formData, "contactUrl")),
      sourceUrl: normalizeContactUrlInput(getString(formData, "sourceUrl")),
      imageUrl,
      isVerified: formData.get("isVerified") === "on",
      activityType: getOptionalString(formData, "activityType"),
      socialLevel: getOptionalString(formData, "socialLevel"),
      needsCheck: formData.get("needsCheck") === "on",
      editorComment: getOptionalString(formData, "editorComment"),
      submittedByOrganizer: formData.get("submittedByOrganizer") === "on",
      submitterContact: getOptionalString(formData, "submitterContact"),
      status: getStatus(formData, ActivityStatus.published)
    }
  });

  if (media.length > 0) {
    await prisma.activityMedia.createMany({
      data: media.map((item) => ({
        ...item,
        activityId: activity.id
      }))
    });
  }

  await revalidateAdmin();
  redirect("/admin/activities");
}

export async function publishActivity(formData: FormData) {
  const id = getRequiredId(formData);
  const previousActivity = await prisma.activity.findUniqueOrThrow({
    where: { id },
    select: { status: true }
  });

  const activity = await prisma.activity.update({
    where: { id },
    data: {
      status: ActivityStatus.published,
      isVerified: true,
      needsCheck: false
    },
    include: {
      organizer: true
    }
  });

  if (
    previousActivity.status !== ActivityStatus.published &&
    activity.submittedByOrganizer
  ) {
    await notifySubmitterActivityPublished({
      activityId: activity.id,
      activityTitle: activity.title,
      activitySlug: activity.slug,
      organizerName: activity.organizer.name,
      submitterContact: activity.submitterContact,
      contactPhone: activity.contactPhone,
      contactUrl: activity.contactUrl,
      description: activity.description
    });
  }

  await revalidateAdmin();
}

export async function archiveActivity(formData: FormData) {
  const id = getRequiredId(formData);

  await prisma.activity.update({
    where: { id },
    data: { status: ActivityStatus.archived }
  });

  await revalidateAdmin();
}

export async function deleteActivity(formData: FormData) {
  const id = getRequiredId(formData);
  const activity = await prisma.activity.findUniqueOrThrow({
    where: { id },
    select: { slug: true }
  });

  await prisma.activity.delete({
    where: { id }
  });

  await revalidateAdmin();
  revalidatePath(`/activity/${activity.slug}`);
}

export async function updateActivity(formData: FormData) {
  const id = getRequiredId(formData);
  const { title, description, categoryId } = validateActivityForm(formData);
  const slug = getString(formData, "slug");

  if (!slug) {
    throw new Error("Slug не найден.");
  }

  const activity = await prisma.activity.findUniqueOrThrow({
    where: { id },
    select: { cityId: true }
  });

  const organizer = await getOrCreateOrganizer(formData, activity.cityId);
  const isFree = formData.get("isFree") === "on";
  const priceNote = getOptionalString(formData, "priceNote");
  const imageUrl = (await uploadActivityImage(formData)) ?? getOptionalString(formData, "imageUrl");
  const media = await getActivityMediaInput(formData);

  await prisma.activity.update({
    where: { id },
    data: {
      title,
      slug,
      description,
      whyGoText: getOptionalString(formData, "whyGoText"),
      categoryId,
      organizerId: organizer.id,
      address: getString(formData, "address") || "Адрес уточняется",
      priceFrom: isFree || priceNote ? null : getNumber(formData, "priceFrom"),
      priceTo: isFree || priceNote ? null : getNumber(formData, "priceTo"),
      priceNote,
      isFree,
      isAdultsOnly: formData.get("isAdultsOnly") === "on",
      beginnerFriendly: formData.get("beginnerFriendly") === "on",
      canComeAlone: formData.get("canComeAlone") === "on",
      contactPhone: getOptionalString(formData, "contactPhone"),
      contactUrl: normalizeContactUrlInput(getString(formData, "contactUrl")),
      sourceUrl: normalizeContactUrlInput(getString(formData, "sourceUrl")),
      isVerified: formData.get("isVerified") === "on",
      imageUrl,
      activityType: getOptionalString(formData, "activityType"),
      socialLevel: getOptionalString(formData, "socialLevel"),
      needsCheck: formData.get("needsCheck") === "on",
      editorComment: getOptionalString(formData, "editorComment"),
      submittedByOrganizer: formData.get("submittedByOrganizer") === "on",
      submitterContact: getOptionalString(formData, "submitterContact"),
      status: getStatus(formData, ActivityStatus.draft)
    }
  });

  await prisma.activityMedia.deleteMany({
    where: { activityId: id }
  });

  if (media.length > 0) {
    await prisma.activityMedia.createMany({
      data: media.map((item) => ({
        ...item,
        activityId: id
      }))
    });
  }

  await revalidateAdmin();
  revalidatePath(`/activity/${slug}`);
  redirect("/admin/activities");
}

export async function createAdminActivityEvent(formData: FormData) {
  const data = getRequiredActivityEventInput(formData);
  const activity = await prisma.activity.findUniqueOrThrow({
    where: { id: data.activityId },
    select: { slug: true }
  });

  await prisma.event.create({
    data: data as any
  });

  await revalidateAdmin();
  revalidateActivityPublicPages(activity.slug);
  redirect(`/admin/activities/${data.activityId}/edit?event=created`);
}

export async function deleteAdminActivityEvent(formData: FormData) {
  const activityId = Number(getString(formData, "activityId"));
  const eventId = Number(getString(formData, "eventId"));

  if (!Number.isInteger(activityId) || activityId <= 0) {
    throw new Error("Некорректная активность.");
  }

  if (!Number.isInteger(eventId) || eventId <= 0) {
    throw new Error("Некорректное событие.");
  }

  const activity = await prisma.activity.findUniqueOrThrow({
    where: { id: activityId },
    select: { slug: true }
  });

  await prisma.event.delete({
    where: { id: eventId }
  });

  await revalidateAdmin();
  revalidateActivityPublicPages(activity.slug);
  redirect(`/admin/activities/${activityId}/edit?event=deleted`);
}
