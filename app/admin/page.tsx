import type { Metadata } from "next";
import Link from "next/link";
import { ActivityStatus } from "@prisma/client";
import { formatPrice } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Админка"
};

export const dynamic = "force-dynamic";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

export default async function AdminPage() {
  const [total, published, draft, archived, latestActivities] = await Promise.all([
    prisma.activity.count(),
    prisma.activity.count({ where: { status: ActivityStatus.published } }),
    prisma.activity.count({ where: { status: ActivityStatus.draft } }),
    prisma.activity.count({ where: { status: ActivityStatus.archived } }),
    prisma.activity.findMany({
      include: {
        category: true,
        organizer: true,
        city: true
      },
      orderBy: { createdAt: "desc" },
      take: 8
    })
  ]);

  const stats = [
    { label: "Всего активностей", value: total },
    { label: "Опубликовано", value: published },
    { label: "Черновики", value: draft },
    { label: "В архиве", value: archived }
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-city-green">
            Временная MVP-админка
          </p>
          <h1 className="mt-3 text-3xl font-bold text-city-ink">Админка</h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/activities"
            className="rounded-full bg-city-green px-4 py-2 text-sm font-semibold text-white transition hover:bg-city-blue"
          >
            Активности
          </Link>
          <Link
            href="/admin/organizers"
            className="rounded-full border border-city-line bg-white px-4 py-2 text-sm font-semibold text-city-ink transition hover:border-city-green"
          >
            Организаторы
          </Link>
          <Link
            href="/admin/organizer-requests"
            className="rounded-full border border-city-line bg-white px-4 py-2 text-sm font-semibold text-city-ink transition hover:border-city-green"
          >
            Заявки организаторов
          </Link>
        </div>
      </div>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <div key={item.label} className="rounded-2xl border border-city-line bg-white p-5 shadow-soft">
            <p className="text-sm text-city-muted">{item.label}</p>
            <p className="mt-2 text-3xl font-bold text-city-ink">{item.value}</p>
          </div>
        ))}
      </section>

      <section className="mt-8 rounded-3xl border border-city-line bg-white p-5 shadow-soft">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-city-ink">Последние добавленные</h2>
          <Link href="/admin/activities" className="text-sm font-semibold text-city-green">
            Смотреть все
          </Link>
        </div>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-city-muted">
              <tr className="border-b border-city-line">
                <th className="py-3 pr-4 font-semibold">Название</th>
                <th className="py-3 pr-4 font-semibold">Категория</th>
                <th className="py-3 pr-4 font-semibold">Статус</th>
                <th className="py-3 pr-4 font-semibold">Цена</th>
                <th className="py-3 pr-4 font-semibold">Создано</th>
              </tr>
            </thead>
            <tbody>
              {latestActivities.map((activity) => (
                <tr key={activity.id} className="border-b border-city-line last:border-0">
                  <td className="py-3 pr-4 font-semibold text-city-ink">
                    <Link href={`/admin/activities/${activity.id}/edit`} className="hover:text-city-green">
                      {activity.title}
                    </Link>
                    <p className="mt-1 text-xs font-normal text-city-muted">
                      {activity.organizer.name} · {activity.city.name}
                    </p>
                  </td>
                  <td className="py-3 pr-4 text-city-muted">{activity.category.name}</td>
                  <td className="py-3 pr-4 text-city-muted">{activity.status}</td>
                  <td className="py-3 pr-4 text-city-muted">{formatPrice(activity)}</td>
                  <td className="py-3 pr-4 text-city-muted">{formatDate(activity.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
