import type { Metadata } from "next";
import Link from "next/link";
import { archiveActivity, publishActivity } from "@/app/admin/activities/actions";
import { formatPrice } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Активности в админке"
};

export const dynamic = "force-dynamic";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(date);
}

export default async function AdminActivitiesPage() {
  const activities = await prisma.activity.findMany({
    include: {
      category: true,
      organizer: true,
      city: true
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-city-green">
            Админка
          </p>
          <h1 className="mt-3 text-3xl font-bold text-city-ink">Активности</h1>
        </div>
        <Link href="/admin" className="text-sm font-semibold text-city-green">
          К сводке
        </Link>
      </div>

      <section className="mt-8 overflow-x-auto rounded-3xl border border-city-line bg-white p-4 shadow-soft">
        <table className="w-full min-w-[1100px] text-left text-sm">
          <thead className="text-city-muted">
            <tr className="border-b border-city-line">
              <th className="py-3 pr-4 font-semibold">Название</th>
              <th className="py-3 pr-4 font-semibold">Категория</th>
              <th className="py-3 pr-4 font-semibold">Организатор</th>
              <th className="py-3 pr-4 font-semibold">Статус</th>
              <th className="py-3 pr-4 font-semibold">Город</th>
              <th className="py-3 pr-4 font-semibold">Цена</th>
              <th className="py-3 pr-4 font-semibold">Создано</th>
              <th className="py-3 pr-4 font-semibold">Действия</th>
            </tr>
          </thead>
          <tbody>
            {activities.map((activity) => (
              <tr key={activity.id} className="border-b border-city-line align-top last:border-0">
                <td className="py-3 pr-4 font-semibold text-city-ink">
                  {activity.title}
                  {activity.isVerified ? (
                    <span className="ml-2 rounded-full bg-city-soft px-2 py-0.5 text-xs text-city-green">
                      проверено
                    </span>
                  ) : null}
                </td>
                <td className="py-3 pr-4 text-city-muted">{activity.category.name}</td>
                <td className="py-3 pr-4 text-city-muted">{activity.organizer.name}</td>
                <td className="py-3 pr-4 text-city-muted">{activity.status}</td>
                <td className="py-3 pr-4 text-city-muted">{activity.city.name}</td>
                <td className="py-3 pr-4 text-city-muted">{formatPrice(activity)}</td>
                <td className="py-3 pr-4 text-city-muted">{formatDate(activity.createdAt)}</td>
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
