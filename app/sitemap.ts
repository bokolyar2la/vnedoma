import type { MetadataRoute } from "next";
import { ActivityStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { tulaSeoPages } from "@/lib/seo-pages";

const baseUrl = "https://vlyudi.ru";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const activities = await prisma.activity.findMany({
    where: {
      status: ActivityStatus.published,
      city: { slug: "tula" }
    },
    select: {
      slug: true,
      updatedAt: true
    },
    orderBy: {
      updatedAt: "desc"
    }
  });

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1
    },
    {
      url: `${baseUrl}/tula`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9
    },
    ...tulaSeoPages.map((page) => ({
      url: `${baseUrl}/tula/${page.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8
    })),
    ...activities.map((activity) => ({
      url: `${baseUrl}/activity/${activity.slug}`,
      lastModified: activity.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7
    }))
  ];
}
