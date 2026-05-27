import type { Metadata } from "next";
import Link from "next/link";
import { ActivityStatus } from "@prisma/client";
import { notFound } from "next/navigation";
import { ActivityCard } from "@/components/ActivityCard";
import { ActivityImage } from "@/components/ActivityImage";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { formatDateTime, formatPrice } from "@/lib/format";
import { prisma } from "@/lib/prisma";

type ActivityPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

const baseUrl = "https://vnedoma.com";

async function getActivity(slug: string) {
  return prisma.activity.findFirst({
    where: {
      slug,
      status: ActivityStatus.published,
      city: { slug: "tula" }
    },
    include: {
      city: true,
      category: true,
      organizer: true,
      events: {
        where: {
          startsAt: {
            gte: new Date()
          }
        },
        orderBy: {
          startsAt: "asc"
        }
      },
      tags: {
        include: {
          tag: true
        }
      }
    }
  });
}

function buildStructuredData(activity: NonNullable<Awaited<ReturnType<typeof getActivity>>>) {
  const pageUrl = `${baseUrl}/activity/${activity.slug}`;
  const nextEvent = activity.events[0];

  if (nextEvent) {
    return {
      "@context": "https://schema.org",
      "@type": "Event",
      name: nextEvent.title || activity.title,
      description: activity.description,
      startDate: nextEvent.startsAt.toISOString(),
      endDate: nextEvent.endsAt?.toISOString(),
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      eventStatus: "https://schema.org/EventScheduled",
      url: pageUrl,
      location: {
        "@type": "Place",
        name: activity.organizer.name,
        address: activity.address
      },
      organizer: {
        "@type": "Organization",
        name: activity.organizer.name,
        url: activity.organizer.websiteUrl ?? pageUrl
      },
      offers: {
        "@type": "Offer",
        price: nextEvent.price ?? activity.priceFrom ?? 0,
        priceCurrency: "RUB",
        availability: "https://schema.org/InStock",
        url: activity.contactUrl ?? pageUrl
      }
    };
  }

  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: activity.title,
    description: activity.description,
    url: pageUrl,
    address: activity.address,
    telephone: activity.contactPhone ?? activity.organizer.phone,
    organizer: {
      "@type": "Organization",
      name: activity.organizer.name
    }
  };
}

export async function generateMetadata({
  params
}: ActivityPageProps): Promise<Metadata> {
  const { slug } = await params;
  const activity = await getActivity(slug);

  if (!activity) {
    return {
      title: "Активность не найдена"
    };
  }

  const title = `${activity.title} в Туле`;
  const url = `${baseUrl}/activity/${activity.slug}`;

  return {
    title: {
      absolute: title
    },
    description: activity.description,
    alternates: {
      canonical: url
    },
    openGraph: {
      title,
      description: activity.description,
      url,
      siteName: "Вне дома",
      locale: "ru_RU",
      type: "article"
    }
  };
}

export default async function ActivityPage({ params }: ActivityPageProps) {
  const { slug } = await params;
  const activity = await getActivity(slug);

  if (!activity) {
    notFound();
  }

  const [similarActivities] = await Promise.all([
    prisma.activity.findMany({
      where: {
        id: { not: activity.id },
        status: ActivityStatus.published,
        cityId: activity.cityId,
        categoryId: activity.categoryId
      },
      include: { category: true },
      orderBy: [{ isPromoted: "desc" }, { priority: "desc" }, { createdAt: "desc" }],
      take: 3
    })
  ]);

  const price = formatPrice(activity);
  const contactHref = activity.contactUrl ?? `tel:${activity.contactPhone ?? ""}`;
  const hasContact = Boolean(activity.contactUrl || activity.contactPhone);
  const structuredData = buildStructuredData(activity);
  const conditions = [
    activity.beginnerFriendly ? "Подходит новичкам" : null,
    activity.canComeAlone ? "Можно прийти одному" : null,
    activity.isFree ? "Бесплатно" : null
  ].filter((condition): condition is string => Boolean(condition));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <Breadcrumbs
        items={[
          { label: "Главная", href: "/" },
          { label: "Тула", href: "/tula" },
          { label: activity.title }
        ]}
      />

      <section className="mt-6 grid gap-8 rounded-3xl border border-city-line bg-white p-6 shadow-soft lg:grid-cols-[1fr_340px] lg:p-8">
        <div>
          <ActivityImage
            title={activity.title}
            categoryName={activity.category.name}
            imageUrl={activity.imageUrl}
            className="mb-6 aspect-[16/9]"
          />
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-city-soft px-3 py-1 text-sm font-semibold text-city-green">
              {activity.category.name}
            </span>
            {conditions.map((condition) => (
              <span
                key={condition}
                className="rounded-full border border-city-line bg-white px-3 py-1 text-sm text-city-muted"
              >
                {condition}
              </span>
            ))}
          </div>

          <h1 className="mt-5 max-w-3xl text-3xl font-bold leading-tight text-city-ink sm:text-5xl">
            {activity.title}
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-city-muted">
            {activity.description}
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-city-soft p-4">
              <p className="text-sm text-city-muted">Цена</p>
              <p className="mt-1 font-bold text-city-ink">{price}</p>
            </div>
            <div className="rounded-2xl bg-city-soft p-4 sm:col-span-2">
              <p className="text-sm text-city-muted">Адрес</p>
              <p className="mt-1 font-bold text-city-ink">{activity.address}</p>
            </div>
          </div>
        </div>

        <aside className="h-fit rounded-3xl border border-city-line bg-city-soft p-5">
          <p className="text-sm text-city-muted">Организатор</p>
          <p className="mt-1 text-xl font-bold text-city-ink">{activity.organizer.name}</p>
          <p className="mt-4 text-sm leading-6 text-city-muted">
            {activity.organizer.description}
          </p>
          <div className="mt-5 space-y-2 text-sm text-city-muted">
            <p>{activity.organizer.address}</p>
            <p>{activity.contactPhone ?? activity.contactUrl ?? "Контакты уточняются"}</p>
          </div>
          {hasContact ? (
            <a
              href={contactHref}
              className="mt-6 flex min-h-12 items-center justify-center rounded-full bg-city-green px-5 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-city-blue"
            >
              Записаться
            </a>
          ) : (
            <button
              disabled
              className="mt-6 flex min-h-12 w-full items-center justify-center rounded-full bg-city-line px-5 font-semibold text-city-muted"
            >
              Контакты уточняются
            </button>
          )}
        </aside>
      </section>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
        <article className="space-y-8">
          <section className="rounded-3xl border border-city-line bg-white p-6 shadow-soft">
            <h2 className="text-xl font-bold text-city-ink">Условия</h2>
            {conditions.length > 0 ? (
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {conditions.map((condition) => (
                  <div key={condition} className="rounded-2xl border border-city-line p-4">
                    <p className="font-semibold text-city-ink">{condition}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-city-muted">
                Условия участия лучше уточнить у организатора.
              </p>
            )}
          </section>

          <section className="rounded-3xl border border-city-line bg-white p-6 shadow-soft">
            <h2 className="text-xl font-bold text-city-ink">Ближайшие события</h2>
            {activity.events.length > 0 ? (
              <div className="mt-5 grid gap-3">
                {activity.events.map((event) => (
                  <div key={event.id} className="rounded-2xl border border-city-line p-4">
                    <h3 className="font-semibold text-city-ink">{event.title}</h3>
                    <p className="mt-2 text-sm text-city-muted">
                      {formatDateTime(event.startsAt)}
                      {event.price ? ` · ${event.price.toLocaleString("ru-RU")} ₽` : ""}
                      {event.seatsAvailable ? ` · мест: ${event.seatsAvailable}` : ""}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-city-muted">
                Даты пока не добавлены. Свяжитесь с организатором, чтобы уточнить
                ближайшее занятие.
              </p>
            )}
          </section>
        </article>

        <aside className="rounded-3xl border border-city-line bg-white p-6 shadow-soft">
          <h2 className="text-xl font-bold text-city-ink">Контакты</h2>
          <dl className="mt-5 space-y-4">
            <div>
              <dt className="text-sm text-city-muted">Адрес</dt>
              <dd className="mt-1 font-semibold text-city-ink">{activity.address}</dd>
            </div>
            <div>
              <dt className="text-sm text-city-muted">Цена</dt>
              <dd className="mt-1 font-semibold text-city-ink">{price}</dd>
            </div>
            <div>
              <dt className="text-sm text-city-muted">Связь</dt>
              <dd className="mt-1 font-semibold text-city-ink">
                {activity.contactPhone ?? activity.contactUrl ?? "Уточняется"}
              </dd>
            </div>
          </dl>
          <Link
            href="/tula"
            className="mt-6 inline-flex text-sm font-semibold text-city-green transition hover:text-city-blue"
          >
            Вернуться в каталог
          </Link>
        </aside>
      </div>

      {similarActivities.length > 0 ? (
        <section className="mt-12">
          <div>
            <h2 className="text-2xl font-bold text-city-ink">Похожие активности</h2>
            <p className="mt-2 text-city-muted">
              Еще несколько вариантов в категории “{activity.category.name}”.
            </p>
          </div>
          <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {similarActivities.map((similar) => (
              <ActivityCard key={similar.id} activity={similar} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
