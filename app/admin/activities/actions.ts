"use server";

import { ActivityStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
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
  const organizerName = getString(formData, "organizerName") || "Не указан";
  const address = getString(formData, "address") || "Адрес уточняется";

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
      websiteUrl: getOptionalString(formData, "contactUrl")
    },
    create: {
      name: organizerName,
      description: "Организатор добавлен через админку.",
      address,
      cityId,
      phone: getOptionalString(formData, "contactPhone"),
      websiteUrl: getOptionalString(formData, "contactUrl")
    }
  });
}

async function revalidateAdmin() {
  revalidatePath("/admin");
  revalidatePath("/admin/activities");
  revalidatePath("/admin/organizers");
  revalidatePath("/tula");
}

export async function createAdminActivity(formData: FormData) {
  const { title, description, categoryId } = validateActivityForm(formData);
  const city = await getTulaCity();
  const organizer = await getOrCreateOrganizer(formData, city.id);
  const isFree = formData.get("isFree") === "on";

  await prisma.activity.create({
    data: {
      title,
      slug: await generateUniqueSlug(title),
      description,
      cityId: city.id,
      categoryId,
      organizerId: organizer.id,
      address: getString(formData, "address") || "Адрес уточняется",
      priceFrom: isFree ? null : getNumber(formData, "priceFrom"),
      priceTo: isFree ? null : getNumber(formData, "priceTo"),
      isFree,
      isForAdults: true,
      beginnerFriendly: formData.get("beginnerFriendly") === "on",
      canComeAlone: formData.get("canComeAlone") === "on",
      contactPhone: getOptionalString(formData, "contactPhone"),
      contactUrl: getOptionalString(formData, "contactUrl"),
      sourceUrl: getOptionalString(formData, "sourceUrl"),
      imageUrl: getOptionalString(formData, "imageUrl"),
      isVerified: formData.get("isVerified") === "on",
      status: getStatus(formData, ActivityStatus.published)
    }
  });

  await revalidateAdmin();
  redirect("/admin/activities");
}

export async function publishActivity(formData: FormData) {
  const id = getRequiredId(formData);

  await prisma.activity.update({
    where: { id },
    data: { status: ActivityStatus.published }
  });

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

  await prisma.activity.delete({
    where: { id }
  });

  await revalidateAdmin();
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

  await prisma.activity.update({
    where: { id },
    data: {
      title,
      slug,
      description,
      categoryId,
      organizerId: organizer.id,
      address: getString(formData, "address") || "Адрес уточняется",
      priceFrom: isFree ? null : getNumber(formData, "priceFrom"),
      priceTo: isFree ? null : getNumber(formData, "priceTo"),
      isFree,
      beginnerFriendly: formData.get("beginnerFriendly") === "on",
      canComeAlone: formData.get("canComeAlone") === "on",
      contactPhone: getOptionalString(formData, "contactPhone"),
      contactUrl: getOptionalString(formData, "contactUrl"),
      sourceUrl: getOptionalString(formData, "sourceUrl"),
      isVerified: formData.get("isVerified") === "on",
      imageUrl: getOptionalString(formData, "imageUrl"),
      status: getStatus(formData, ActivityStatus.draft)
    }
  });

  await revalidateAdmin();
  revalidatePath(`/activity/${slug}`);
  redirect("/admin/activities");
}
