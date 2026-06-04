import { ActivityStatus, PrismaClient } from "@prisma/client";
import cards from "./ready-cards.json";

const prisma = new PrismaClient();

type ReadyCard = {
  title: string;
  description: string;
  category: string;
  price: string;
  address: string;
  organizer: string;
  contactUrl: string;
  canComeAlone: string;
  beginnerFriendly: string;
  isFree: string;
  imageUrl: string;
  sourceLabel: string;
  activityType: string;
  socialLevel: string;
  status: string;
  editorComment: string;
};

const categorySlugByName: Record<string, string> = {
  "Игры и клубы": "igry-i-kluby",
  Танцы: "tancy",
  "Спорт и прогулки": "sport-i-progulki",
  Творчество: "tvorchestvo",
  Кулинария: "kulinariya",
  "Практики и здоровье": "praktiki-i-zdorove",
  "Книги и общение": "knigi-i-obshchenie",
  Волонтёрство: "volonterstvo",
  "Театр и сцена": "teatr-i-scena",
  "Выезды и приключения": "vyezdy-i-priklyucheniya"
};

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

async function generateUniqueSlug(title: string) {
  const base = slugify(title);
  let slug = base;
  let counter = 2;

  while (await prisma.activity.findUnique({ where: { slug } })) {
    slug = `${base}-${counter}`;
    counter += 1;
  }

  return slug;
}

function isYes(value: string) {
  return value.trim().toLowerCase() === "да";
}

function normalizeText(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed.toLowerCase();
}

function normalizeStatus(value: string): ActivityStatus {
  const status = value.trim().toLowerCase();

  if (status === "published") {
    return ActivityStatus.published;
  }

  if (status === "archived") {
    return ActivityStatus.archived;
  }

  return ActivityStatus.draft;
}

function parsePrice(price: string) {
  const normalized = price.trim().toLowerCase();

  if (!normalized || normalized.includes("узнавать")) {
    return { priceFrom: null, priceTo: null, isFree: false };
  }

  if (normalized.includes("бесплат")) {
    return { priceFrom: null, priceTo: null, isFree: true };
  }

  const values = normalized.match(/\d[\d\s]*/g)?.map((value) => Number(value.replace(/\s/g, "")));

  if (!values || values.length === 0) {
    return { priceFrom: null, priceTo: null, isFree: false };
  }

  return {
    priceFrom: values[0] ?? null,
    priceTo: values[1] ?? null,
    isFree: false
  };
}

function validUrl(value: string) {
  const trimmed = value.trim();

  if (!trimmed || trimmed.includes("...")) {
    return null;
  }

  try {
    const url = new URL(trimmed);
    return url.protocol === "http:" || url.protocol === "https:" ? trimmed : null;
  } catch {
    return null;
  }
}

function organizerLinks(url: string | null) {
  if (!url) {
    return {
      websiteUrl: null,
      vkUrl: null,
      telegramUrl: null
    };
  }

  if (url.includes("vk.com")) {
    return { websiteUrl: null, vkUrl: url, telegramUrl: null };
  }

  if (url.includes("t.me") || url.includes("telegram")) {
    return { websiteUrl: null, vkUrl: null, telegramUrl: url };
  }

  return { websiteUrl: url, vkUrl: null, telegramUrl: null };
}

async function main() {
  const city = await prisma.city.upsert({
    where: { slug: "tula" },
    update: { name: "Тула" },
    create: { name: "Тула", slug: "tula" }
  });

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const card of cards as ReadyCard[]) {
    const categorySlug = categorySlugByName[card.category.trim()];

    if (!categorySlug) {
      console.warn(`Skipped "${card.title}": unknown category "${card.category}"`);
      skipped += 1;
      continue;
    }

    const category = await prisma.category.findUnique({
      where: { slug: categorySlug }
    });

    if (!category) {
      console.warn(`Skipped "${card.title}": category "${categorySlug}" is missing`);
      skipped += 1;
      continue;
    }

    const contactUrl = validUrl(card.contactUrl);
    const imageUrl = validUrl(card.imageUrl);
    const price = parsePrice(card.price);
    const status = normalizeStatus(card.status);
    const needsCheck = card.status.trim().toLowerCase() === "check";
    const organizerName = card.organizer.trim() || "Не указан";
    const links = organizerLinks(contactUrl);

    const organizer = await prisma.organizer.upsert({
      where: {
        name_cityId: {
          name: organizerName,
          cityId: city.id
        }
      },
      update: {
        address: card.address || "Тула",
        ...links
      },
      create: {
        name: organizerName,
        description: "Организатор добавлен из подготовленной таблицы.",
        address: card.address || "Тула",
        cityId: city.id,
        ...links
      }
    });

    const existing = await prisma.activity.findFirst({
      where: {
        title: card.title,
        cityId: city.id
      }
    });

    const data = {
      title: card.title,
      description: card.description,
      cityId: city.id,
      categoryId: category.id,
      organizerId: organizer.id,
      address: card.address || "Тула",
      priceFrom: price.priceFrom,
      priceTo: price.priceTo,
      isFree: isYes(card.isFree) || price.isFree,
      isForAdults: true,
      beginnerFriendly: isYes(card.beginnerFriendly),
      canComeAlone: isYes(card.canComeAlone),
      contactUrl,
      sourceUrl: contactUrl,
      imageUrl,
      activityType: normalizeText(card.activityType),
      socialLevel: normalizeText(card.socialLevel),
      status,
      needsCheck,
      isVerified: status === ActivityStatus.published && !needsCheck,
      editorComment: card.editorComment || null,
      priority: status === ActivityStatus.published ? 10 : 0
    };

    if (existing) {
      await prisma.activity.update({
        where: { id: existing.id },
        data
      });
      updated += 1;
    } else {
      await prisma.activity.create({
        data: {
          ...data,
          slug: await generateUniqueSlug(card.title)
        }
      });
      created += 1;
    }
  }

  console.log(`Imported ready cards: ${created} created, ${updated} updated, ${skipped} skipped.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
