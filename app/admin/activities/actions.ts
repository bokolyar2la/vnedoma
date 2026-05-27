"use server";

import { ActivityStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

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

function getStatus(formData: FormData) {
  const status = getString(formData, "status");
  if (
    status === ActivityStatus.draft ||
    status === ActivityStatus.published ||
    status === ActivityStatus.archived
  ) {
    return status;
  }

  return ActivityStatus.draft;
}

async function revalidateAdmin() {
  revalidatePath("/admin");
  revalidatePath("/admin/activities");
  revalidatePath("/tula");
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

export async function updateActivity(formData: FormData) {
  const id = getRequiredId(formData);
  const title = getString(formData, "title");
  const slug = getString(formData, "slug");
  const description = getString(formData, "description");
  const categoryId = Number(getString(formData, "categoryId"));
  const organizerName = getString(formData, "organizerName") || "Не указан";

  if (!title || !slug || !description) {
    throw new Error("Название, slug и описание обязательны.");
  }

  if (!Number.isInteger(categoryId) || categoryId <= 0) {
    throw new Error("Выберите категорию.");
  }

  const activity = await prisma.activity.findUniqueOrThrow({
    where: { id },
    include: { city: true }
  });

  const organizer = await prisma.organizer.upsert({
    where: {
      name_cityId: {
        name: organizerName,
        cityId: activity.cityId
      }
    },
    update: {
      phone: getOptionalString(formData, "contactPhone"),
      websiteUrl: getOptionalString(formData, "contactUrl")
    },
    create: {
      name: organizerName,
      description: "Организатор добавлен через админку.",
      address: getString(formData, "address") || "Адрес уточняется",
      cityId: activity.cityId,
      phone: getOptionalString(formData, "contactPhone"),
      websiteUrl: getOptionalString(formData, "contactUrl")
    }
  });

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
      status: getStatus(formData)
    }
  });

  await revalidateAdmin();
  revalidatePath(`/activity/${slug}`);
  redirect("/admin/activities");
}
