import type { Metadata } from "next";
import { ActivityStatus } from "@prisma/client";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Получить доступ к карточке",
  robots: {
    index: false,
    follow: false
  }
};

export const dynamic = "force-dynamic";

type ClaimPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getSingleParam(
  params: Record<string, string | string[] | undefined>,
  key: string
) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

export default async function OrganizerClaimPage({ searchParams }: ClaimPageProps) {
  const params = searchParams ? await searchParams : {};
  const query = (getSingleParam(params, "q") ?? "").trim();
  const activities = await prisma.activity.findMany({
    where: {
      status: ActivityStatus.published,
      ...(query
        ? {
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { organizer: { name: { contains: query, mode: "insensitive" } } }
            ]
          }
        : {})
    },
    include: {
      category: true,
      organizer: true
    },
    orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
    take: query ? 30 : 12
  });

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-city-green">
        Влюди · организаторам
      </p>
      <div className="mt-3 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-bold text-city-ink sm:text-4xl">
            Получить доступ к своей карточке
          </h1>
          <p className="mt-4 max-w-2xl leading-7 text-city-muted">
            Найдите активность по названию или организатору. После заявки мы вручную
            проверим связь с карточкой и откроем управление в кабинете.
          </p>
        </div>
        <Link
          href="/organizer/login"
          className="w-fit rounded-full border border-city-line bg-white px-5 py-3 text-sm font-semibold text-city-ink transition hover:border-city-green hover:text-city-green"
        >
          Уже есть кабинет
        </Link>
      </div>

      <form className="mt-8 rounded-3xl border border-city-line bg-white p-5 shadow-soft sm:p-6">
        <label htmlFor="q" className="text-sm font-semibold text-city-ink">
          Найти карточку
        </label>
        <div className="mt-2 grid gap-3 sm:grid-cols-[1fr_auto]">
          <input
            id="q"
            name="q"
            defaultValue={query}
            className="min-h-12 w-full rounded-2xl border border-city-line px-4 outline-none transition focus:border-city-green focus:ring-4 focus:ring-city-green/10"
            placeholder="Название активности или организации"
          />
          <button className="min-h-12 rounded-full bg-city-green px-6 font-semibold text-white transition hover:bg-city-blue">
            Найти
          </button>
        </div>
      </form>

      <section className="mt-8">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-city-ink">
            {query ? "Найденные карточки" : "Недавно обновленные карточки"}
          </h2>
          {query ? (
            <Link href="/organizer/claim" className="text-sm font-semibold text-city-green">
              Сбросить поиск
            </Link>
          ) : null}
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {activities.length ? (
            activities.map((activity) => (
              <article
                key={activity.id}
                className="rounded-3xl border border-city-line bg-white p-5 shadow-soft"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-city-green">
                  {activity.category.name}
                </p>
                <h3 className="mt-2 text-xl font-bold text-city-ink">{activity.title}</h3>
                <p className="mt-2 text-sm text-city-muted">{activity.organizer.name}</p>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-city-muted">
                  {activity.description}
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Link
                    href={`/organizer/register?activityId=${activity.id}`}
                    className="rounded-full bg-city-green px-4 py-2 text-sm font-semibold text-white transition hover:bg-city-blue"
                  >
                    Получить доступ
                  </Link>
                  <Link
                    href={`/activity/${activity.slug}`}
                    className="rounded-full border border-city-line bg-white px-4 py-2 text-sm font-semibold text-city-ink transition hover:border-city-green hover:text-city-green"
                  >
                    Открыть карточку
                  </Link>
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-3xl border border-city-line bg-white p-6 text-city-muted">
              Карточка не найдена. Попробуйте другое название или добавьте активность через форму.
              <div className="mt-4">
                <Link href="/add" className="font-semibold text-city-green hover:text-city-blue">
                  Добавить активность
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
