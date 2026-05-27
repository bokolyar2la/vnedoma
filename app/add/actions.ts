"use server";

import { ActivityStatus } from "@prisma/client";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

const translitMap: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "e",
  ж: "zh",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "h",
  ц: "c",
  ч: "ch",
  ш: "sh",
  щ: "sch",
  ы: "y",
  э: "e",
  ю: "yu",
  я: "ya",
  ь: "",
  ъ: ""
};

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

function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .split("")
    .map((char) => translitMap[char] ?? char)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || `activity-${Date.now()}`;
}

async function createUniqueSlug(title: string) {
  const base = slugify(title);
  let slug = base;
  let counter = 2;

  while (await prisma.activity.findUnique({ where: { slug } })) {
    slug = `${base}-${counter}`;
    counter += 1;
  }

  return slug;
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
    fail("Укажите телефон или ссылку для связи.");
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
      slug: await createUniqueSlug(title),
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
      status: ActivityStatus.draft
    }
  });

  revalidatePath("/tula");
  redirect("/add?success=1");
}
