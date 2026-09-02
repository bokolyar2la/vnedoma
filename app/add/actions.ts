"use server";

import { ActivityMediaType, ActivityStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  extractEmailAddress,
  notifySubmitterActivityReceived
} from "@/lib/booking-notifications";
import { normalizeContactUrlInput } from "@/lib/contact-url";
import { prisma } from "@/lib/prisma";
import { uploadActivityImageField } from "@/lib/s3-upload";
import { generateUniqueSlug } from "@/lib/slug";

function getValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getNumberValue(formData: FormData, key: string) {
  const value = getValue(formData, key);
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

async function getActivityMediaInput(formData: FormData) {
  const media = await Promise.all(
    [1, 2, 3].map(async (position) => {
      const uploadedUrl = await uploadActivityImageField(formData, `media${position}File`);
      const url = uploadedUrl ?? getValue(formData, `media${position}Url`);
      const rawType = getValue(formData, `media${position}Type`);

      if (!url) {
        return null;
      }

      return {
        type:
          uploadedUrl || rawType !== ActivityMediaType.video
            ? ActivityMediaType.image
            : ActivityMediaType.video,
        url,
        caption: getValue(formData, `media${position}Caption`) || null,
        position
      };
    })
  );

  return media.filter(
    (
      item
    ): item is {
      type: ActivityMediaType;
      url: string;
      caption: string | null;
      position: number;
    } => Boolean(item)
  );
}

function fail(message: string): never {
  redirect(`/add?error=${encodeURIComponent(message)}`);
}

function countMatches(value: string, pattern: RegExp) {
  return value.match(pattern)?.length ?? 0;
}

function hasSuspiciousContent(values: string[]) {
  const text = values.join("\n").toLowerCase();
  const urlCount = countMatches(text, /(https?:\/\/|www\.|\.ru\b|\.com\b|\.net\b|\.org\b)/gi);
  const htmlTagCount = countMatches(text, /<\/?[a-z][^>]*>/gi);
  const suspiciousPatterns = [
    /xrumer/i,
    /strongai/i,
    /avito/i,
    /продвижени[ея]\s+сайт/i,
    /оптимизаци[яию]\s+сайт/i,
    /seo/i,
    /backlink/i,
    /href\s*=/i,
    /\[url=/i,
    /viagra/i,
    /casino/i,
    /crypto/i
  ];

  return (
    htmlTagCount > 0 ||
    urlCount > 2 ||
    suspiciousPatterns.some((pattern) => pattern.test(text))
  );
}

function isLikelySpam(formData: FormData, values: string[]) {
  const honeypot = getValue(formData, "website");
  const startedAt = Number(getValue(formData, "formStartedAt"));
  const suspiciousContent = hasSuspiciousContent(values);

  return Boolean(
    honeypot ||
      !Number.isFinite(startedAt) ||
      suspiciousContent
  );
}

function silentlySkipSpam(): never {
  redirect("/add?success=1");
}

export async function createActivity(formData: FormData) {
  const title = getValue(formData, "title");
  const description = getValue(formData, "description");
  const categoryId = Number(getValue(formData, "categoryId"));
  const address = getValue(formData, "address");
  const organizerName = getValue(formData, "organizerName") || "Не указан";
  const contactPhone = getValue(formData, "contactPhone");
  const contactUrl = normalizeContactUrlInput(getValue(formData, "contactUrl"));
  const submittedByOrganizer = formData.get("submittedByOrganizer") === "on";
  const submitterContact = getValue(formData, "submitterContact");
  const isFree = formData.get("isFree") === "on";
  const priceNote = getValue(formData, "priceNote") || null;
  const privacyConsent = formData.get("privacyConsent") === "on";
  const rightsConfirmation = formData.get("rightsConfirmation") === "on";
  let media: Awaited<ReturnType<typeof getActivityMediaInput>> = [];

  if (
    isLikelySpam(formData, [
      title,
      description,
      address,
      organizerName,
      contactPhone,
      getValue(formData, "contactUrl"),
      submitterContact,
      priceNote ?? ""
    ])
  ) {
    console.warn("Skipped likely spam activity submission", {
      title,
      organizerName
    });
    silentlySkipSpam();
  }

  if (!title) {
    fail("Укажите название активности.");
  }

  if (!description) {
    fail("Добавьте описание активности.");
  }

  if (!Number.isInteger(categoryId) || categoryId <= 0) {
    fail("Выберите категорию.");
  }

  if (!privacyConsent) {
    fail("Подтвердите согласие с политикой обработки персональных данных.");
  }

  if (!rightsConfirmation) {
    fail("Подтвердите, что вы имеете право передать информацию об активности.");
  }

  if (!contactPhone && !contactUrl) {
    fail("Укажите телефон или ссылку, чтобы люди могли связаться с организатором.");
  }

  if (submittedByOrganizer && !submitterContact) {
    fail("Укажите email, чтобы мы могли прислать статус заявки.");
  }

  if (submittedByOrganizer && !extractEmailAddress(submitterContact)) {
    fail("Укажите корректный email для уведомлений по заявке.");
  }

  const category = await prisma.category.findUnique({
    where: { id: categoryId }
  });

  if (!category) {
    fail("Выбранная категория не найдена.");
  }

  try {
    media = await getActivityMediaInput(formData);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Не удалось загрузить изображение в галерею.";
    fail(message);
  }

  const city = await prisma.city.upsert({
    where: { slug: "tula" },
    update: { name: "Тула" },
    create: { name: "Тула", slug: "tula" }
  });

  const organizer = await prisma.organizer.upsert({
    where: {
      name_cityId: {
        name: organizerName,
        cityId: city.id
      }
    },
    update: {
      address: address || "Адрес уточняется",
      phone: contactPhone || null,
      websiteUrl: contactUrl || null
    },
    create: {
      name: organizerName,
      description: "Организатор добавлен через публичную форму.",
      address: address || "Адрес уточняется",
      cityId: city.id,
      phone: contactPhone || null,
      websiteUrl: contactUrl || null
    }
  });

  const activity = await prisma.activity.create({
    data: {
      title,
      slug: await generateUniqueSlug(title),
      description,
      cityId: city.id,
      categoryId: category.id,
      organizerId: organizer.id,
      address: address || "Адрес уточняется",
      priceFrom: isFree || priceNote ? null : getNumberValue(formData, "priceFrom"),
      priceTo: isFree || priceNote ? null : getNumberValue(formData, "priceTo"),
      priceNote,
      isFree,
      isForAdults: true,
      isAdultsOnly: formData.get("isAdultsOnly") === "on",
      beginnerFriendly: formData.get("beginnerFriendly") === "on",
      canComeAlone: formData.get("canComeAlone") === "on",
      contactPhone: contactPhone || null,
      contactUrl: contactUrl || null,
      sourceUrl: null,
      imageUrl: null,
      isVerified: false,
      needsCheck: true,
      submittedByOrganizer,
      submitterContact: submitterContact || null,
      status: ActivityStatus.draft
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

  await notifySubmitterActivityReceived({
    activityId: activity.id,
    activityTitle: activity.title,
    activitySlug: activity.slug,
    organizerName,
    submitterContact,
    contactPhone,
    contactUrl,
    description
  });

  revalidatePath("/tula");
  redirect("/add?success=1");
}
