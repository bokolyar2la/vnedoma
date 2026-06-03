import { PrismaClient } from "@prisma/client";
import { currentCategories, legacyCategorySlugMap } from "../lib/categories";

const prisma = new PrismaClient();

async function main() {
  let createdCount = 0;
  let reassignedActivities = 0;
  const deletedLegacyCategories: string[] = [];

  for (const category of currentCategories) {
    const existing = await prisma.category.findUnique({
      where: { slug: category.slug }
    });

    if (existing) {
      await prisma.category.update({
        where: { slug: category.slug },
        data: {
          name: category.name,
          description: category.description
        }
      });
    } else {
      await prisma.category.create({ data: category });
      createdCount += 1;
    }
  }

  for (const [legacySlug, currentSlug] of Object.entries(legacyCategorySlugMap)) {
    const legacyCategory = await prisma.category.findUnique({
      where: { slug: legacySlug }
    });

    if (!legacyCategory) {
      continue;
    }

    const currentCategory = await prisma.category.findUniqueOrThrow({
      where: { slug: currentSlug }
    });

    const updateResult = await prisma.activity.updateMany({
      where: { categoryId: legacyCategory.id },
      data: { categoryId: currentCategory.id }
    });

    reassignedActivities += updateResult.count;

    const remainingActivities = await prisma.activity.count({
      where: { categoryId: legacyCategory.id }
    });

    if (remainingActivities === 0) {
      await prisma.category.delete({
        where: { id: legacyCategory.id }
      });
      deletedLegacyCategories.push(`${legacyCategory.name} (${legacyCategory.slug})`);
    }
  }

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { activities: true }
      }
    }
  });

  console.log(`Created categories: ${createdCount}`);
  console.log(`Reassigned activities: ${reassignedActivities}`);
  console.log(
    `Deleted legacy categories: ${
      deletedLegacyCategories.length > 0 ? deletedLegacyCategories.join(", ") : "none"
    }`
  );
  console.log("Remaining categories:");

  for (const category of categories) {
    console.log(`- ${category.name} (${category.slug}): ${category._count.activities}`);
  }
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
