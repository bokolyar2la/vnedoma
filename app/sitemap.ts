import type { MetadataRoute } from "next";
import { ActivityStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { minIndexableActivities, tulaSeoPages } from "@/lib/seo-pages";

const baseUrl = "https://vlyudi.ru";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [activities, seoPageCounts] = await Promise.all([
    prisma.activity.findMany({
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
    }),
    Promise.all(
      tulaSeoPages.map((page) =>
        prisma.activity.count({
          where: {
            AND: [
              { status: ActivityStatus.published },
              { city: { slug: "tula" } },
              page.filters
            ]
          }
        })
      )
    )
  ]);
  const catalogLastModified = activities[0]?.updatedAt;
  const indexableSeoPages = tulaSeoPages.filter(
    (_, index) => seoPageCounts[index] >= minIndexableActivities
  );

  return [
    {
      url: baseUrl,
      lastModified: catalogLastModified,
      changeFrequency: "daily",
      priority: 1
    },
    {
      url: `${baseUrl}/tula`,
      lastModified: catalogLastModified,
      changeFrequency: "daily",
      priority: 0.9
    },
    {
      url: `${baseUrl}/contacts`,
      changeFrequency: "monthly",
      priority: 0.4
    },
    {
      url: `${baseUrl}/organizers`,
      changeFrequency: "monthly",
      priority: 0.5
    },
    ...indexableSeoPages.map((page) => ({
      url: `${baseUrl}/tula/${page.slug}`,
      lastModified: catalogLastModified,
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
