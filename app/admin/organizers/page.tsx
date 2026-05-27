import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Организаторы в админке"
};

export const dynamic = "force-dynamic";

export default async function AdminOrganizersPage() {
  const organizers = await prisma.organizer.findMany({
    include: {
      city: true,
      _count: {
        select: {
          activities: true
        }
      }
    },
    orderBy: { name: "asc" }
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-city-green">
            Админка
          </p>
          <h1 className="mt-3 text-3xl font-bold text-city-ink">Организаторы</h1>
        </div>
        <Link href="/admin" className="text-sm font-semibold text-city-green">
          К сводке
        </Link>
      </div>

      <section className="mt-8 overflow-x-auto rounded-3xl border border-city-line bg-white p-4 shadow-soft">
        <table className="w-full min-w-[840px] text-left text-sm">
          <thead className="text-city-muted">
            <tr className="border-b border-city-line">
              <th className="py-3 pr-4 font-semibold">Название</th>
              <th className="py-3 pr-4 font-semibold">Город</th>
              <th className="py-3 pr-4 font-semibold">Телефон</th>
              <th className="py-3 pr-4 font-semibold">Сайт</th>
              <th className="py-3 pr-4 font-semibold">Telegram</th>
              <th className="py-3 pr-4 font-semibold">Активностей</th>
            </tr>
          </thead>
          <tbody>
            {organizers.map((organizer) => (
              <tr key={organizer.id} className="border-b border-city-line last:border-0">
                <td className="py-3 pr-4 font-semibold text-city-ink">{organizer.name}</td>
                <td className="py-3 pr-4 text-city-muted">{organizer.city.name}</td>
                <td className="py-3 pr-4 text-city-muted">{organizer.phone ?? "—"}</td>
                <td className="py-3 pr-4 text-city-muted">
                  {organizer.websiteUrl ? (
                    <a href={organizer.websiteUrl} className="text-city-green hover:text-city-blue">
                      сайт
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="py-3 pr-4 text-city-muted">
                  {organizer.telegramUrl ? (
                    <a href={organizer.telegramUrl} className="text-city-green hover:text-city-blue">
                      Telegram
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="py-3 pr-4 text-city-muted">{organizer._count.activities}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
