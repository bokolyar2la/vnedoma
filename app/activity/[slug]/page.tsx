import type { Metadata } from "next";
import Link from "next/link";
import { ActivityStatus } from "@prisma/client";
import { notFound } from "next/navigation";
import { ActivityCard } from "@/components/ActivityCard";
import { ActivityImage } from "@/components/ActivityImage";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { getSocialLevelLabel, isTripActivity } from "@/lib/activity-social";
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

  const similarActivities = await prisma.activity.findMany({
    where: {
      id: { not: activity.id },
      status: ActivityStatus.published,
      cityId: activity.cityId,
      categoryId: activity.categoryId
    },
    include: { category: true },
    orderBy: [{ isPromoted: "desc" }, { priority: "desc" }, { createdAt: "desc" }],
    take: 3
  });

  const price = formatPrice(activity);
  const contactHref = activity.contactUrl ?? `tel:${activity.contactPhone ?? ""}`;
  const hasContact = Boolean(activity.contactUrl || activity.contactPhone);
  const structuredData = buildStructuredData(activity);
  const socialLabel = getSocialLevelLabel(activity.socialLevel);
  const trip = isTripActivity(activity.activityType);

  const conditions = [
    activity.canComeAlone ? "Можно прийти одному" : null,
    activity.beginnerFriendly ? "Подходит новичкам" : null,
    activity.isFree ? "Бесплатно" : null,
    activity.socialLevel === "высокая" ? "Много общения" : null,
    trip ? "Выезд" : null
  ].filter((condition): condition is string => Boolean(condition));

  const infoCards = [
    { label: "Адрес", value: activity.address },
    { label: "Цена", value: price },
    { label: "Организатор", value: activity.organizer.name },
    { label: "Контакты", value: activity.contactPhone ?? activity.contactUrl ?? "Уточняются" },
    { label: "Тип", value: activity.activityType ?? "Уточняется" },
    { label: "Социальность", value: socialLabel ?? "Уточняется" }
  ];

  const reasons = [
    activity.canComeAlone ? "Можно прийти одному" : null,
    activity.beginnerFriendly ? "Подходит новичкам" : null,
    activity.socialLevel === "высокая" ? "Формат с общением" : null,
    trip ? "Выездная активность на выходные" : null
  ].filter((reason): reason is string => Boolean(reason));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
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

      <section className="mt-6 overflow-hidden rounded-[34px] border border-city-line bg-white shadow-soft">
        <div className="relative">
          <ActivityImage
            title={activity.title}
            categoryName={activity.category.name}
            imageUrl={activity.imageUrl}
            className="aspect-[16/10] rounded-none sm:aspect-[21/9]"
          />
          <div className="absolute inset-x-4 top-4 flex items-start justify-between gap-3 sm:inset-x-6 sm:top-6">
            <span className="rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-city-green shadow-sm backdrop-blur">
              {activity.category.name}
            </span>
            <span className="rounded-full bg-city-ink/90 px-4 py-2 text-sm font-semibold text-white shadow-sm backdrop-blur">
              {price}
            </span>
          </div>
        </div>

        <div className="grid gap-8 p-5 sm:p-8 lg:grid-cols-[1fr_340px]">
          <div>
            <div className="flex flex-wrap gap-2">
              {conditions.map((condition) => (
                <span
                  key={condition}
                  className="rounded-full bg-city-soft px-3 py-1 text-sm font-medium text-city-green"
                >
                  {condition}
                </span>
              ))}
            </div>
            <h1 className="mt-5 max-w-4xl text-3xl font-bold leading-tight text-city-ink sm:text-5xl">
              {activity.title}
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-city-muted">
              {activity.description}
            </p>
          </div>

          <aside className="h-fit rounded-[28px] bg-city-soft p-5">
            <p className="text-sm text-city-muted">Стоимость</p>
            <p className="mt-1 text-2xl font-bold text-city-ink">{price}</p>
            <p className="mt-4 text-sm leading-6 text-city-muted">
              {activity.organizer.description}
            </p>
            {hasContact ? (
              <a
                href={contactHref}
                className="mt-6 flex min-h-12 items-center justify-center rounded-full bg-city-green px-5 font-semibold text-white transition hover:bg-city-blue"
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
        </div>
      </section>

      <section className="mt-8 rounded-[30px] border border-city-line bg-white p-6 shadow-soft">
        <h2 className="text-2xl font-bold text-city-ink">Почему стоит пойти</h2>
        {reasons.length > 0 ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {reasons.map((reason) => (
              <div key={reason} className="rounded-2xl bg-city-soft p-4 font-semibold text-city-ink">
                {reason}
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-city-muted">
            Условия участия лучше уточнить у организатора.
          </p>
        )}
        {activity.socialLevel === "высокая" ? (
          <p className="mt-5 rounded-2xl bg-city-green/10 p-4 leading-7 text-city-ink">
            Формат хорошо подходит для знакомства с людьми: участники взаимодействуют, играют, обсуждают или делают что-то вместе.
          </p>
        ) : null}
        {trip ? (
          <p className="mt-4 rounded-2xl bg-city-soft p-4 leading-7 text-city-ink">
            Это выездной формат: уточните даты и место проведения у организатора.
          </p>
        ) : null}
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {infoCards.map((item) => (
          <div key={item.label} className="rounded-[26px] border border-city-line bg-white p-5 shadow-soft">
            <p className="text-sm text-city-muted">{item.label}</p>
            <p className="mt-2 font-bold leading-6 text-city-ink">{item.value}</p>
          </div>
        ))}
      </section>

      <section className="mt-8 rounded-[30px] border border-city-line bg-white p-6 shadow-soft">
        <h2 className="text-2xl font-bold text-city-ink">Ближайшие события</h2>
        {activity.events.length > 0 ? (
          <div className="mt-5 grid gap-3">
            {activity.events.map((event) => (
              <div key={event.id} className="rounded-2xl bg-city-soft p-4">
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
            Даты пока не добавлены. Свяжитесь с организатором, чтобы уточнить ближайшее занятие.
          </p>
        )}
      </section>

      {similarActivities.length > 0 ? (
        <section className="mt-12">
          <div>
            <h2 className="text-2xl font-bold text-city-ink sm:text-3xl">
              Похожие активности
            </h2>
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

      <Link
        href="/tula"
        className="mt-10 inline-flex text-sm font-semibold text-city-green transition hover:text-city-blue"
      >
        Вернуться в каталог
      </Link>
    </div>
  );
}
