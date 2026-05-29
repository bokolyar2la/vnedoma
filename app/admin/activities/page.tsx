import type { Metadata } from "next";
import Link from "next/link";
import { ActivityStatus, Prisma } from "@prisma/client";
import { archiveActivity, publishActivity } from "@/app/admin/activities/actions";
import { ActivityImage } from "@/components/ActivityImage";
import { DeleteActivityButton } from "@/components/DeleteActivityButton";
import {
  getSocialLevelLabel,
  isTripActivity,
  socialLevelOptions
} from "@/lib/activity-social";
import { formatPrice } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Активности в админке"
};

export const dynamic = "force-dynamic";

type AdminActivitiesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(date);
}

function getSingleParam(
  params: Record<string, string | string[] | undefined>,
  key: string
) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

function statusLabel(status: ActivityStatus) {
  const labels: Record<ActivityStatus, string> = {
    draft: "Черновик",
    published: "Опубликовано",
    archived: "Архив"
  };

  return labels[status];
}

function parseStatus(value: string) {
  if (
    value === ActivityStatus.published ||
    value === ActivityStatus.draft ||
    value === ActivityStatus.archived
  ) {
    return value;
  }

  return null;
}

export default async function AdminActivitiesPage({
  searchParams
}: AdminActivitiesPageProps) {
  const params = searchParams ? await searchParams : {};
  const status = getSingleParam(params, "status") ?? "all";
  const category = getSingleParam(params, "category") ?? "";
  const socialLevel = getSingleParam(params, "socialLevel") ?? "";
  const needsCheck = getSingleParam(params, "needsCheck") ?? "all";
  const q = getSingleParam(params, "q")?.trim() ?? "";
  const selectedStatus = parseStatus(status);

  const where: Prisma.ActivityWhereInput = {
    ...(selectedStatus ? { status: selectedStatus } : {}),
    ...(category ? { category: { slug: category } } : {}),
    ...(socialLevel ? { socialLevel } : {}),
    ...(needsCheck === "yes" ? { needsCheck: true } : {}),
    ...(needsCheck === "no" ? { needsCheck: false } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { organizer: { name: { contains: q, mode: "insensitive" } } }
          ]
        }
      : {})
  };

  const [activities, categories] = await Promise.all([
    prisma.activity.findMany({
      where,
      include: {
        category: true,
        organizer: true,
        city: true
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } })
  ]);

  const statusFilters = [
    { label: "Все", value: "all" },
    { label: "Published", value: ActivityStatus.published },
    { label: "Draft", value: ActivityStatus.draft },
    { label: "Archived", value: ActivityStatus.archived }
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-city-green">
            Админка
          </p>
          <h1 className="mt-3 text-3xl font-bold text-city-ink">Активности</h1>
          <p className="mt-2 text-sm text-city-muted">
            Найдено: {activities.length}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/activities/new"
            className="rounded-full bg-city-green px-4 py-2 text-sm font-semibold text-white transition hover:bg-city-blue"
          >
            Добавить активность
          </Link>
          <Link
            href="/admin"
            className="rounded-full border border-city-line bg-white px-4 py-2 text-sm font-semibold text-city-ink transition hover:border-city-green"
          >
            К сводке
          </Link>
        </div>
      </div>

      <section className="mt-8 rounded-3xl border border-city-line bg-white p-4 shadow-soft">
        <form className="grid gap-3 lg:grid-cols-[1fr_150px_210px_170px_170px_auto]">
          <input
            name="q"
            defaultValue={q}
            placeholder="Поиск по названию или организатору"
            className="min-h-12 rounded-2xl border border-city-line px-4 outline-none transition focus:border-city-green focus:ring-4 focus:ring-city-green/10"
          />
          <select
            name="status"
            defaultValue={status}
            className="min-h-12 rounded-2xl border border-city-line bg-white px-4 outline-none transition focus:border-city-green focus:ring-4 focus:ring-city-green/10"
          >
            {statusFilters.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <select
            name="category"
            defaultValue={category}
            className="min-h-12 rounded-2xl border border-city-line bg-white px-4 outline-none transition focus:border-city-green focus:ring-4 focus:ring-city-green/10"
          >
            <option value="">Все категории</option>
            {categories.map((item) => (
              <option key={item.id} value={item.slug}>
                {item.name}
              </option>
            ))}
          </select>
          <select
            name="socialLevel"
            defaultValue={socialLevel}
            className="min-h-12 rounded-2xl border border-city-line bg-white px-4 outline-none transition focus:border-city-green focus:ring-4 focus:ring-city-green/10"
          >
            <option value="">Социальность</option>
            {socialLevelOptions.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
          <select
            name="needsCheck"
            defaultValue={needsCheck}
            className="min-h-12 rounded-2xl border border-city-line bg-white px-4 outline-none transition focus:border-city-green focus:ring-4 focus:ring-city-green/10"
          >
            <option value="all">Проверка: все</option>
            <option value="yes">Требует проверки</option>
            <option value="no">Проверено</option>
          </select>
          <button className="min-h-12 rounded-2xl bg-city-ink px-5 font-semibold text-white transition hover:bg-city-green">
            Применить
          </button>
        </form>
      </section>

      <section className="mt-6 grid gap-5">
        {activities.map((activity) => {
          const socialLabel = getSocialLevelLabel(activity.socialLevel);
          const indicators = [
            activity.imageUrl ? "есть изображение" : "нет изображения",
            activity.canComeAlone ? "можно одному" : null,
            activity.isFree ? "бесплатно" : null,
            activity.beginnerFriendly ? "новичкам" : null,
            isTripActivity(activity.activityType) ? "выезд" : null
          ].filter((item): item is string => Boolean(item));

          return (
            <article
              key={activity.id}
              className="rounded-3xl border border-city-line bg-white p-4 shadow-soft transition hover:border-city-green/50 sm:p-5"
            >
              <div className="grid gap-5 lg:grid-cols-[170px_1fr_260px]">
                <ActivityImage
                  title={activity.title}
                  categoryName={activity.category.name}
                  imageUrl={activity.imageUrl}
                  className="aspect-[16/10] lg:aspect-square"
                />

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-city-soft px-3 py-1 text-xs font-semibold text-city-green">
                      {statusLabel(activity.status)}
                    </span>
                    {activity.needsCheck ? (
                      <span className="rounded-full bg-city-coral/10 px-3 py-1 text-xs font-semibold text-city-coral">
                        Проверить
                      </span>
                    ) : null}
                    <span className="rounded-full border border-city-line px-3 py-1 text-xs text-city-muted">
                      {activity.category.name}
                    </span>
                    {activity.activityType ? (
                      <span className="rounded-full border border-city-line px-3 py-1 text-xs text-city-muted">
                        {activity.activityType}
                      </span>
                    ) : null}
                    {socialLabel ? (
                      <span className="rounded-full border border-city-line px-3 py-1 text-xs text-city-muted">
                        {socialLabel}
                      </span>
                    ) : null}
                    <span className="rounded-full border border-city-line px-3 py-1 text-xs font-semibold text-city-ink">
                      {formatPrice(activity)}
                    </span>
                  </div>

                  <h2 className="mt-4 text-xl font-bold leading-snug text-city-ink">
                    {activity.title}
                  </h2>

                  <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-3">
                    <div>
                      <dt className="text-city-muted">Организатор</dt>
                      <dd className="mt-1 font-semibold text-city-ink">
                        {activity.organizer.name}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-city-muted">Город</dt>
                      <dd className="mt-1 font-semibold text-city-ink">
                        {activity.city.name}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-city-muted">Создано</dt>
                      <dd className="mt-1 font-semibold text-city-ink">
                        {formatDate(activity.createdAt)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-city-muted">Проверено</dt>
                      <dd className="mt-1 font-semibold text-city-ink">
                        {activity.isVerified ? "Да" : "Нет"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-city-muted">Источник</dt>
                      <dd className="mt-1 font-semibold">
                        {activity.sourceUrl ? (
                          <a
                            href={activity.sourceUrl}
                            className="text-city-green transition hover:text-city-blue"
                            target="_blank"
                            rel="noreferrer"
                          >
                            открыть
                          </a>
                        ) : (
                          <span className="text-city-ink">—</span>
                        )}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {indicators.map((indicator) => (
                      <span
                        key={indicator}
                        className="rounded-full bg-city-soft px-3 py-1 text-xs font-medium text-city-green"
                      >
                        {indicator}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid h-fit grid-cols-2 gap-2 lg:grid-cols-1">
                  <Link
                    href={`/admin/activities/${activity.id}/edit`}
                    className="rounded-full border border-city-line px-3 py-2 text-center text-sm font-semibold text-city-ink transition hover:border-city-green"
                  >
                    Редактировать
                  </Link>
                  <form action={publishActivity}>
                    <input type="hidden" name="id" value={activity.id} />
                    <button className="w-full rounded-full bg-city-green px-3 py-2 text-sm font-semibold text-white transition hover:bg-city-blue">
                      Опубликовать
                    </button>
                  </form>
                  <form action={archiveActivity}>
                    <input type="hidden" name="id" value={activity.id} />
                    <button className="w-full rounded-full bg-city-ink px-3 py-2 text-sm font-semibold text-white transition hover:bg-city-coral">
                      Архивировать
                    </button>
                  </form>
                  <DeleteActivityButton id={activity.id} />
                </div>
              </div>
            </article>
          );
        })}

        {activities.length === 0 ? (
          <div className="rounded-3xl border border-city-line bg-white p-8 text-city-muted shadow-soft">
            По этим фильтрам ничего не найдено.
          </div>
        ) : null}
      </section>
    </div>
  );
}
