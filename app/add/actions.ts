"use server";

import { ActivityStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
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

function fail(message: string): never {
  redirect(`/add?error=${encodeURIComponent(message)}`);
}

export async function createActivity(formData: FormData) {
  const title = getValue(formData, "title");
  const description = getValue(formData, "description");
  const categoryId = Number(getValue(formData, "categoryId"));
  const address = getValue(formData, "address");
  const organizerName = getValue(formData, "organizerName") || "Не указан";
  const contactPhone = getValue(formData, "contactPhone");
  const contactUrl = getValue(formData, "contactUrl");
  const submittedByOrganizer = formData.get("submittedByOrganizer") === "on";
  const submitterContact = getValue(formData, "submitterContact");
  const isFree = formData.get("isFree") === "on";

  if (!title) {
    fail("Укажите название активности.");
  }

  if (!description) {
    fail("Добавьте описание активности.");
  }

  if (!Number.isInteger(categoryId) || categoryId <= 0) {
    fail("Выберите категорию.");
  }

  if (!contactPhone && !contactUrl) {
    fail("Укажите телефон или ссылку, чтобы люди могли связаться с организатором.");
  }

  if (submittedByOrganizer && !submitterContact) {
    fail("Укажите, как с вами связаться: Telegram, VK, телефон или email.");
  }

  const category = await prisma.category.findUnique({
    where: { id: categoryId }
  });

  if (!category) {
    fail("Выбранная категория не найдена.");
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

  await prisma.activity.create({
    data: {
      title,
      slug: await generateUniqueSlug(title),
      description,
      cityId: city.id,
      categoryId: category.id,
      organizerId: organizer.id,
      address: address || "Адрес уточняется",
      priceFrom: isFree ? null : getNumberValue(formData, "priceFrom"),
      priceTo: isFree ? null : getNumberValue(formData, "priceTo"),
      isFree,
      isForAdults: true,
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

  revalidatePath("/tula");
  redirect("/add?success=1");
}
