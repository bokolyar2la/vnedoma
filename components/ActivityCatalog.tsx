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
};

function getSingleParam(params: SearchParams, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

export async function ActivityCatalog({
  searchParams = {},
  heading,
  description,
  fixedFilters = {},
  showCategoryFilter = true
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

  const [categories, activities] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.activity.findMany({
      where,
      include: { category: true },
      orderBy: [{ isPromoted: "desc" }, { priority: "desc" }, { createdAt: "desc" }]
    })
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Breadcrumbs
        items={[
          { label: "Главная", href: "/" },
          showCategoryFilter
            ? { label: "Тула" }
            : { label: "Тула", href: "/tula" },
          ...(showCategoryFilter ? [] : [{ label: heading }])
        ]}
      />
      <div className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-city-green">
          Вне дома · Тула
        </p>
        <h1 className="mt-3 text-3xl font-bold leading-tight text-city-ink sm:text-4xl">
          {heading}
        </h1>
        <p className="mt-4 text-lg leading-8 text-city-muted">{description}</p>
      </div>

      <form className="mt-8 rounded-3xl border border-city-line bg-white p-4 shadow-soft">
        <div className={showCategoryFilter ? "grid gap-3 lg:grid-cols-[1fr_220px_auto]" : "grid gap-3 sm:grid-cols-[1fr_auto]"}>
          <input
            name="q"
            defaultValue={q}
            type="search"
            placeholder="Поиск по занятиям"
            className="min-h-12 rounded-2xl border border-city-line px-4 outline-none transition focus:border-city-green focus:ring-4 focus:ring-city-green/10"
          />
          {showCategoryFilter ? (
            <select
              name="category"
              defaultValue={category ?? ""}
              className="min-h-12 rounded-2xl border border-city-line bg-white px-4 outline-none transition focus:border-city-green focus:ring-4 focus:ring-city-green/10"
            >
              <option value="">Все категории</option>
              {categories.map((item) => (
                <option key={item.id} value={item.slug}>
                  {item.name}
                </option>
              ))}
            </select>
          ) : null}
          <button className="min-h-12 rounded-2xl bg-city-green px-6 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-city-blue">
            Показать
          </button>
        </div>
        <div className="mt-4 flex flex-col gap-3 text-sm text-city-muted sm:flex-row sm:flex-wrap">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="free"
              value="1"
              defaultChecked={isFree}
              className="h-4 w-4 accent-city-green"
            />
            Бесплатно
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="alone"
              value="1"
              defaultChecked={canComeAlone}
              className="h-4 w-4 accent-city-green"
            />
            Можно прийти одному
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="beginner"
              value="1"
              defaultChecked={beginnerFriendly}
              className="h-4 w-4 accent-city-green"
            />
            Подходит новичкам
          </label>
        </div>
      </form>

      <div className="mt-8 flex items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-city-ink">Найдено: {activities.length}</h2>
      </div>

      {activities.length > 0 ? (
        <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {activities.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} />
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-3xl border border-city-line bg-white p-8 text-city-muted">
          По этим фильтрам ничего не найдено. Попробуйте изменить запрос или убрать часть условий.
        </div>
      )}
    </div>
  );
}
