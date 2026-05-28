import Link from "next/link";
import { ActivityStatus, Prisma } from "@prisma/client";
import { ActivityCard } from "@/components/ActivityCard";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { prisma } from "@/lib/prisma";

type SearchParams = Record<string, string | string[] | undefined>;

type ActivityCatalogProps = {
  searchParams?: SearchParams;
  heading: string;
  description: string;
  fixedFilters?: Prisma.ActivityWhereInput;
  showCategoryFilter?: boolean;
  basePath?: string;
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
  basePath = "/tula"
}: ActivityCatalogProps) {
  const category = showCategoryFilter ? getSingleParam(searchParams, "category") : undefined;
  const q = getSingleParam(searchParams, "q")?.trim();
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
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
            { category: { name: { contains: q, mode: "insensitive" } } },
            { organizer: { name: { contains: q, mode: "insensitive" } } },
            { tags: { some: { tag: { name: { contains: q, mode: "insensitive" } } } } }
          ]
        }
      : {})
  };

  const activities = await prisma.activity.findMany({
    where,
    include: { category: true },
    orderBy: [{ isPromoted: "desc" }, { priority: "desc" }, { createdAt: "desc" }]
  });

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

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Breadcrumbs
        items={[
          { label: "Главная", href: "/" },
          showCategoryFilter ? { label: "Тула" } : { label: "Тула", href: "/tula" },
          ...(showCategoryFilter ? [] : [{ label: heading }])
        ]}
      />

      <section className="mt-6 rounded-[32px] border border-city-line bg-white p-5 shadow-soft sm:p-7">
        <p className="text-sm font-semibold uppercase tracking-wide text-city-green">
          Вне дома · Тула
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
            placeholder="Поиск: йога, керамика, лекции..."
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
        </div>
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
    </div>
  );
}
