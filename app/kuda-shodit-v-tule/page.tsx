import type { Metadata } from "next";
import Link from "next/link";
import { ActivityStatus } from "@prisma/client";
import { ActivityCard } from "@/components/ActivityCard";
import { TrackedLink } from "@/components/MetrikaGoals";
import { isEffectivelyPromoted } from "@/lib/billing";
import { getUpcomingEventWhere } from "@/lib/events";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Куда сходить в Туле: ближайшие события и активности | Влюди",
  description:
    "Ближайшие события, встречи, клубы, игры, прогулки и занятия в Туле. Выберите, куда сходить сегодня, на выходных или в свободный вечер.",
  alternates: {
    canonical: "/kuda-shodit-v-tule"
  }
};

function formatEventDate(date: Date) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    weekday: "long"
  }).format(date);
}

function formatEventTime(date: Date) {
  return new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

export default async function WhereToGoTulaPage() {
  const now = new Date();
  const [events, activities] = await Promise.all([
    prisma.event.findMany({
      where: {
        ...getUpcomingEventWhere(now),
        activity: {
          status: ActivityStatus.published,
          city: { slug: "tula" }
        }
      },
      include: {
        activity: {
          include: {
            category: true
          }
        }
      },
      orderBy: { startsAt: "asc" },
      take: 18
    }),
    prisma.activity.findMany({
      where: {
        status: ActivityStatus.published,
        city: { slug: "tula" }
      },
      include: { category: true },
      orderBy: [{ isPromoted: "desc" }, { priority: "desc" }, { updatedAt: "desc" }],
      take: 12
    })
  ]);
  const sortedActivities = [...activities].sort((left, right) => {
    const promotedDiff =
      Number(isEffectivelyPromoted(right, now)) - Number(isEffectivelyPromoted(left, now));

    if (promotedDiff !== 0) {
      return promotedDiff;
    }

    const priorityDiff = right.priority - left.priority;

    if (priorityDiff !== 0) {
      return priorityDiff;
    }

    return right.updatedAt.getTime() - left.updatedAt.getTime();
  });

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Куда сходить в Туле",
    url: "https://vlyudi.ru/kuda-shodit-v-tule",
    description:
      "Ближайшие события и активности в Туле: встречи, клубы, игры, прогулки и занятия.",
    mainEntity: {
      "@type": "ItemList",
      itemListElement: events.map((event, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `https://vlyudi.ru/activity/${event.activity.slug}`,
        name: event.title
      }))
    }
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
        <p className="text-sm font-semibold uppercase tracking-wide text-city-green">
          Влюди · Тула
        </p>
        <div className="mt-4 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <h1 className="max-w-4xl text-4xl font-bold leading-tight text-city-ink sm:text-5xl">
              Куда сходить в Туле
            </h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-city-muted">
              Ближайшие события, регулярные занятия и места, куда можно прийти одному,
              с друзьями или чтобы познакомиться с новыми людьми.
            </p>
          </div>
          <Link
            href="/add"
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-city-green px-5 text-sm font-semibold text-white transition hover:bg-city-blue"
          >
            Добавить событие
          </Link>
        </div>
      </section>

      {events.length ? (
        <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-city-ink sm:text-3xl">
                Ближайшие события
              </h2>
              <p className="mt-2 text-city-muted">
                Даты добавляют организаторы. Откройте карточку, чтобы посмотреть детали и записаться.
              </p>
            </div>
            <TrackedLink
              href="/tula"
              goal="view_all_activities_click"
              className="hidden text-sm font-semibold text-city-green sm:inline"
            >
              Все активности
            </TrackedLink>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {events.map((event) => (
              <TrackedLink
                key={event.id}
                href={`/activity/${event.activity.slug}`}
                goal="view_all_activities_click"
                className="rounded-[24px] border border-city-line bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-city-green hover:shadow-soft"
              >
                <p className="text-sm font-semibold text-city-green">
                  {formatEventDate(event.startsAt)} · {formatEventTime(event.startsAt)}
                </p>
                <h2 className="mt-3 text-xl font-bold text-city-ink">{event.title}</h2>
                <p className="mt-2 text-sm leading-6 text-city-muted">
                  {event.activity.title} · {event.activity.category.name}
                </p>
                <p className="mt-2 text-sm text-city-muted">{event.activity.address}</p>
                <span className="mt-4 inline-flex rounded-full bg-city-soft px-3 py-1 text-xs font-semibold text-city-green">
                  {event.price ? `от ${event.price} ₽` : "цена уточняется"}
                </span>
              </TrackedLink>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-city-ink sm:text-3xl">
              Активности в Туле
            </h2>
            <p className="mt-2 text-city-muted">
              Если ближайших дат пока мало, можно выбрать регулярный формат и связаться с организатором.
            </p>
          </div>
          <TrackedLink
            href="/tula"
            goal="view_all_activities_click"
            className="hidden text-sm font-semibold text-city-green sm:inline"
          >
            Полный каталог
          </TrackedLink>
        </div>
        <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {sortedActivities.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} />
          ))}
        </div>
      </section>
    </main>
  );
}
