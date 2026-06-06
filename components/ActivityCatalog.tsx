import Link from "next/link";
import { ActivityStatus, Prisma } from "@prisma/client";
import { ActivityCard } from "@/components/ActivityCard";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { currentCategorySlugs } from "@/lib/categories";
import { prisma } from "@/lib/prisma";

const baseUrl = "https://vlyudi.ru";

type SearchParams = Record<string, string | string[] | undefined>;

type ActivityCatalogProps = {
  searchParams?: SearchParams;
  heading: string;
  description: string;
  fixedFilters?: Prisma.ActivityWhereInput;
  showCategoryFilter?: boolean;
  basePath?: string;
  seoBlock?: {
    title: string;
    paragraphs: string[];
    links?: {
      label: string;
      href: string;
    }[];
  };
};

function getSingleParam(params: SearchParams, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

function buildHref(basePath: string, params: Record<string, string | undefined>) {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      search.set(key, value);
    }
  });

  const query = search.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export async function ActivityCatalog({
  searchParams = {},
  heading,
  description,
  fixedFilters = {},
  showCategoryFilter = true,
  basePath = "/tula",
  seoBlock
}: ActivityCatalogProps) {
  const category = showCategoryFilter ? getSingleParam(searchParams, "category") : undefined;
  const q = getSingleParam(searchParams, "q")?.trim();
  const searchTerms = q ? q.split(/\s+/).filter(Boolean).slice(0, 6) : [];
  const isFree = getSingleParam(searchParams, "free") === "1";
  const canComeAlone = getSingleParam(searchParams, "alone") === "1";
  const beginnerFriendly = getSingleParam(searchParams, "beginner") === "1";

  const where: Prisma.ActivityWhereInput = {
    status: ActivityStatus.published,
    city: { slug: "tula" },
    ...fixedFilters,
    ...(category ? { category: { slug: category } } : {}),
    ...(isFree ? { isFree: true } : {}),
    ...(canComeAlone ? { canComeAlone: true } : {}),
    ...(beginnerFriendly ? { beginnerFriendly: true } : {}),
    ...(searchTerms.length > 0
      ? {
          AND: searchTerms.map((term) => ({
            OR: [
              { title: { contains: term, mode: "insensitive" } },
              { description: { contains: term, mode: "insensitive" } },
              { category: { name: { contains: term, mode: "insensitive" } } },
              { organizer: { name: { contains: term, mode: "insensitive" } } },
              { tags: { some: { tag: { name: { contains: term, mode: "insensitive" } } } } }
            ]
          }))
        }
      : {})
  };

  const [activities, categories] = await Promise.all([
    prisma.activity.findMany({
      where,
      include: { category: true },
      orderBy: [{ isPromoted: "desc" }, { priority: "desc" }, { createdAt: "desc" }]
    }),
    showCategoryFilter
      ? prisma.category.findMany({ where: { slug: { in: [...currentCategorySlugs] } } })
      : Promise.resolve([])
  ]);
  categories.sort(
    (a, b) => currentCategorySlugs.indexOf(a.slug) - currentCategorySlugs.indexOf(b.slug)
  );

  const commonParams = {
    ...(q ? { q } : {}),
    ...(category ? { category } : {})
  };

  const chips = [
    {
      label: "Все",
      active: !isFree && !canComeAlone && !beginnerFriendly,
      href: buildHref(basePath, commonParams)
    },
    {
      label: "Бесплатно",
      active: isFree,
      href: buildHref(basePath, { ...commonParams, free: "1" })
    },
    {
      label: "Можно одному",
      active: canComeAlone,
      href: buildHref(basePath, { ...commonParams, alone: "1" })
    },
    {
      label: "Новичкам",
      active: beginnerFriendly,
      href: buildHref(basePath, { ...commonParams, beginner: "1" })
    }
  ];
  const pageUrl = `${baseUrl}${basePath}`;
  const breadcrumbItems = showCategoryFilter
    ? [
        { name: "Главная", item: baseUrl },
        { name: "Тула", item: `${baseUrl}/tula` }
      ]
    : [
        { name: "Главная", item: baseUrl },
        { name: "Тула", item: `${baseUrl}/tula` },
        { name: heading, item: pageUrl }
      ];
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: heading,
      description,
      url: pageUrl,
      isPartOf: {
        "@type": "WebSite",
        name: "Влюди",
        url: baseUrl
      },
      about: "Социальные активности, клубы, встречи и занятия в Туле",
      mainEntity: {
        "@type": "ItemList",
        itemListElement: activities.map((activity, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: `${baseUrl}/activity/${activity.slug}`,
          name: activity.title
        }))
      }
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: breadcrumbItems.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        item: item.item
      }))
    }
  ];

  return (
    <div id="catalog-top" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-8 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <Breadcrumbs
        items={[
          { label: "Главная", href: "/" },
          showCategoryFilter ? { label: "Тула" } : { label: "Тула", href: "/tula" },
          ...(showCategoryFilter ? [] : [{ label: heading }])
        ]}
      />

      <section className="mt-6 rounded-[32px] border border-city-line bg-white p-5 shadow-soft sm:p-7">
        <p className="text-sm font-semibold uppercase tracking-wide text-city-green">
          Влюди · Тула
        </p>
        <div className="mt-3 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div className="max-w-3xl">
            <h1 className="text-3xl font-bold leading-tight text-city-ink sm:text-5xl">
              {heading}
            </h1>
            <p className="mt-4 text-lg leading-8 text-city-muted">{description}</p>
          </div>
          <p className="rounded-full bg-city-soft px-4 py-2 text-sm font-semibold text-city-green">
            Найдено: {activities.length}
          </p>
        </div>

        <form action={basePath} className="mt-7 flex flex-col gap-3 rounded-[26px] bg-city-soft p-2 sm:flex-row">
          <input
            name="q"
            defaultValue={q}
            type="search"
            placeholder="Название, организатор, категория..."
            className="min-h-12 flex-1 rounded-full border-0 bg-white px-5 text-city-ink outline-none placeholder:text-city-muted/70"
          />
          {category ? <input type="hidden" name="category" value={category} /> : null}
          <button className="min-h-12 rounded-full bg-city-ink px-6 font-semibold text-white transition hover:bg-city-green">
            Найти
          </button>
        </form>

        <div className="mt-5 flex flex-wrap gap-2">
          {chips.map((chip) => (
            <Link
              key={chip.label}
              href={chip.href}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                chip.active
                  ? "bg-city-green text-white shadow-sm"
                  : "bg-city-soft text-city-muted hover:bg-white hover:text-city-green hover:shadow-sm"
              }`}
            >
              {chip.label}
            </Link>
          ))}
          {seoBlock ? (
            <a
              href="#how-to-choose"
              className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-city-green ring-1 ring-city-line transition hover:shadow-sm hover:ring-city-green/40"
            >
              Как выбрать активность
            </a>
          ) : null}
        </div>

        {showCategoryFilter ? (
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {categories.map((item) => (
              <Link
                key={item.slug}
                href={buildHref(basePath, {
                  ...(q ? { q } : {}),
                  category: item.slug,
                  ...(isFree ? { free: "1" } : {}),
                  ...(canComeAlone ? { alone: "1" } : {}),
                  ...(beginnerFriendly ? { beginner: "1" } : {})
                })}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  category === item.slug
                    ? "bg-city-ink text-white"
                    : "bg-white text-city-muted hover:text-city-green"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>
        ) : null}
      </section>

      {activities.length > 0 ? (
        <section className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {activities.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} />
          ))}
        </section>
      ) : (
        <section className="mt-7 rounded-[28px] border border-city-line bg-white p-8 text-city-muted shadow-soft">
          По этим фильтрам ничего не найдено. Попробуйте изменить запрос или убрать часть условий.
        </section>
      )}

      {seoBlock ? (
        <section
          id="how-to-choose"
          className="mt-10 scroll-mt-24 rounded-[30px] border border-city-line bg-white p-6 shadow-soft"
        >
          <h2 className="text-2xl font-bold text-city-ink">{seoBlock.title}</h2>
          <div className="mt-4 space-y-3 text-base leading-8 text-city-muted">
            {seoBlock.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          {seoBlock.links && seoBlock.links.length > 0 ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {seoBlock.links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-full bg-city-soft px-4 py-2 text-sm font-semibold text-city-green transition hover:bg-white hover:shadow-sm"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          ) : null}
          <a
            href="#catalog-top"
            className="mt-6 inline-flex min-h-11 items-center rounded-full bg-city-green px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-city-blue"
          >
            Вернуться к активностям
          </a>
        </section>
      ) : null}
    </div>
  );
}
