import type { Metadata } from "next";
import Link from "next/link";
import { ActivityStatus, Prisma } from "@prisma/client";
import { archiveActivity, publishActivity } from "@/app/admin/activities/actions";
import { DeleteActivityButton } from "@/components/DeleteActivityButton";
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
  const q = getSingleParam(params, "q")?.trim() ?? "";
  const selectedStatus = parseStatus(status);

  const where: Prisma.ActivityWhereInput = {
    ...(selectedStatus ? { status: selectedStatus } : {}),
    ...(category ? { category: { slug: category } } : {}),
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
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/activities/new"
            className="rounded-full bg-city-green px-4 py-2 text-sm font-semibold text-white transition hover:bg-city-blue"
          >
            Добавить активность
          </Link>
          <Link href="/admin" className="rounded-full border border-city-line bg-white px-4 py-2 text-sm font-semibold text-city-ink transition hover:border-city-green">
            К сводке
          </Link>
        </div>
      </div>

      <section className="mt-8 rounded-3xl border border-city-line bg-white p-4 shadow-soft">
        <form className="grid gap-3 lg:grid-cols-[1fr_180px_220px_auto]">
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
          <button className="min-h-12 rounded-2xl bg-city-ink px-5 font-semibold text-white transition hover:bg-city-green">
            Применить
          </button>
        </form>
      </section>

      <section className="mt-5 overflow-x-auto rounded-3xl border border-city-line bg-white p-4 shadow-soft">
        <table className="w-full min-w-[1320px] text-left text-sm">
          <thead className="text-city-muted">
            <tr className="border-b border-city-line">
              <th className="py-3 pr-4 font-semibold">Превью</th>
              <th className="py-3 pr-4 font-semibold">Название</th>
              <th className="py-3 pr-4 font-semibold">Категория</th>
              <th className="py-3 pr-4 font-semibold">Организатор</th>
              <th className="py-3 pr-4 font-semibold">Статус</th>
              <th className="py-3 pr-4 font-semibold">Город</th>
              <th className="py-3 pr-4 font-semibold">Создано</th>
              <th className="py-3 pr-4 font-semibold">Проверено</th>
              <th className="py-3 pr-4 font-semibold">Источник</th>
              <th className="py-3 pr-4 font-semibold">Индикаторы</th>
              <th className="py-3 pr-4 font-semibold">Действия</th>
            </tr>
          </thead>
          <tbody>
            {activities.map((activity) => (
              <tr key={activity.id} className="border-b border-city-line align-top last:border-0">
                <td className="py-3 pr-4">
                  {activity.imageUrl ? (
                    <img
                      src={activity.imageUrl}
                      alt={activity.title}
                      className="h-14 w-20 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-20 items-center justify-center rounded-xl bg-city-soft px-2 text-center text-[11px] font-semibold text-city-green">
                      {activity.category.name}
                    </div>
                  )}
                </td>
                <td className="py-3 pr-4">
                  <p className="max-w-[260px] font-semibold leading-5 text-city-ink">
                    {activity.title}
                  </p>
                  <p className="mt-1 text-xs text-city-muted">{formatPrice(activity)}</p>
                </td>
                <td className="py-3 pr-4 text-city-muted">{activity.category.name}</td>
                <td className="py-3 pr-4 text-city-muted">{activity.organizer.name}</td>
                <td className="py-3 pr-4">
                  <span className="rounded-full bg-city-soft px-3 py-1 text-xs font-semibold text-city-green">
                    {statusLabel(activity.status)}
                  </span>
                </td>
                <td className="py-3 pr-4 text-city-muted">{activity.city.name}</td>
                <td className="py-3 pr-4 text-city-muted">{formatDate(activity.createdAt)}</td>
                <td className="py-3 pr-4 text-city-muted">
                  {activity.isVerified ? "Да" : "Нет"}
                </td>
                <td className="py-3 pr-4">
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
                    <span className="text-city-muted">—</span>
                  )}
                </td>
                <td className="py-3 pr-4">
                  <div className="flex flex-wrap gap-2">
                    <span className={`rounded-full px-2 py-1 text-xs ${activity.imageUrl ? "bg-city-soft text-city-green" : "bg-city-line text-city-muted"}`}>
                      {activity.imageUrl ? "есть изображение" : "нет изображения"}
                    </span>
                    {activity.canComeAlone ? (
                      <span className="rounded-full bg-city-soft px-2 py-1 text-xs text-city-green">
                        можно одному
                      </span>
                    ) : null}
                    {activity.isFree ? (
                      <span className="rounded-full bg-city-soft px-2 py-1 text-xs text-city-green">
                        бесплатно
                      </span>
                    ) : null}
                  </div>
                </td>
                <td className="py-3 pr-4">
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/admin/activities/${activity.id}/edit`}
                      className="rounded-full border border-city-line px-3 py-1.5 font-semibold text-city-ink transition hover:border-city-green"
                    >
                      Редактировать
                    </Link>
                    <form action={publishActivity}>
                      <input type="hidden" name="id" value={activity.id} />
                      <button className="rounded-full bg-city-green px-3 py-1.5 font-semibold text-white transition hover:bg-city-blue">
                        Опубликовать
                      </button>
                    </form>
                    <form action={archiveActivity}>
                      <input type="hidden" name="id" value={activity.id} />
                      <button className="rounded-full bg-city-ink px-3 py-1.5 font-semibold text-white transition hover:bg-city-coral">
                        Архивировать
                      </button>
                    </form>
                    <DeleteActivityButton id={activity.id} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
