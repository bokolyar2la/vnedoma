import type { Metadata } from "next";
import Link from "next/link";
import { ActivityStatus } from "@prisma/client";
import { notFound } from "next/navigation";
import { ActivityCard } from "@/components/ActivityCard";
import { ActivityImage } from "@/components/ActivityImage";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ActivityStatOnMount, TrackedExternalLink } from "@/components/MetrikaGoals";
import { createActivityBookingRequest } from "@/app/activity/actions";
import { getSocialLevelLabel, isTripActivity } from "@/lib/activity-social";
import { isEffectivelyPromoted, resolveOrganizerBilling } from "@/lib/billing";
import { getUpcomingEventWhere } from "@/lib/events";
import { formatDateTime, formatPrice } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { getEventPromoText } from "@/lib/promo";

type ActivityPageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type BookingAccountForPage = {
  billingPlan: string;
  billingStatus: string;
  paidUntil: Date | null;
  trialUntil: Date | null;
  platformBookingDiscountText: string | null;
};

const baseUrl = "https://vlyudi.ru";

export const dynamic = "force-dynamic";

function getPublicOrganizerName(name: string) {
  const trimmed = name.trim();

  if (!trimmed || trimmed === "Не указан" || trimmed === "Не указано") {
    return null;
  }

  return trimmed;
}

function getAbsoluteImageUrl(imageUrl: string | null) {
  if (!imageUrl) {
    return null;
  }

  return imageUrl.startsWith("http") ? imageUrl : `${baseUrl}${imageUrl}`;
}

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
        where: getUpcomingEventWhere(new Date()),
        orderBy: {
          startsAt: "asc"
        }
      },
      media: {
        orderBy: {
          position: "asc"
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
  const organizerName = getPublicOrganizerName(activity.organizer.name) ?? "Влюди";
  const image = getAbsoluteImageUrl(activity.imageUrl);
  const address = {
    "@type": "PostalAddress",
    streetAddress: activity.address,
    addressLocality: "Тула",
    addressRegion: "Тульская область",
    addressCountry: "RU"
  };
  const sameAs = [
    activity.organizer.websiteUrl,
    activity.organizer.vkUrl,
    activity.organizer.telegramUrl,
    activity.contactUrl
  ].filter((url): url is string => Boolean(url));

  if (nextEvent) {
    return {
      "@context": "https://schema.org",
      "@type": "Event",
      name: nextEvent.title || activity.title,
      description: activity.description,
      image: image ? [image] : undefined,
      startDate: nextEvent.startsAt.toISOString(),
      endDate: nextEvent.endsAt?.toISOString(),
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      eventStatus: "https://schema.org/EventScheduled",
      url: pageUrl,
      location: {
        "@type": "Place",
        name: organizerName,
        address
      },
      organizer: {
        "@type": "Organization",
        name: organizerName,
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
    image: image ? [image] : undefined,
    url: pageUrl,
    address,
    telephone: activity.contactPhone ?? activity.organizer.phone,
    sameAs: sameAs.length > 0 ? sameAs : undefined,
    organizer: {
      "@type": "Organization",
      name: organizerName
    }
  };
}

function buildBreadcrumbStructuredData(activity: NonNullable<Awaited<ReturnType<typeof getActivity>>>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Главная",
        item: baseUrl
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Тула",
        item: `${baseUrl}/tula`
      },
      {
        "@type": "ListItem",
        position: 3,
        name: activity.title,
        item: `${baseUrl}/activity/${activity.slug}`
      }
    ]
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
  const image = getAbsoluteImageUrl(activity.imageUrl);

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
      siteName: "Влюди",
      locale: "ru_RU",
      type: "article",
      images: [
        {
          url: image ?? "/opengraph-image",
          width: 1200,
          height: 630,
          alt: activity.title
        }
      ]
    }
  };
}

export default async function ActivityPage({ params, searchParams }: ActivityPageProps) {
  const { slug } = await params;
  const query = searchParams ? await searchParams : {};
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
  const sortedSimilarActivities = [...similarActivities].sort((left, right) => {
    const promotedDiff =
      Number(isEffectivelyPromoted(right)) - Number(isEffectivelyPromoted(left));

    if (promotedDiff !== 0) {
      return promotedDiff;
    }

    const priorityDiff = right.priority - left.priority;

    if (priorityDiff !== 0) {
      return priorityDiff;
    }

    return right.createdAt.getTime() - left.createdAt.getTime();
  });

  const bookingAccounts = (await prisma.organizerAccount.findMany({
      where: {
        platformBookingEnabled: true,
        isDisabled: false,
        accesses: {
          some: {
            organizerId: activity.organizerId
          }
        }
      },
      select: {
        billingPlan: true,
        billingStatus: true,
        paidUntil: true,
        trialUntil: true,
        platformBookingDiscountText: true
      } as any
    })) as unknown as BookingAccountForPage[];
  const bookingAccount =
    bookingAccounts.find((account) => resolveOrganizerBilling(account).isActive) ?? null;

  const price = formatPrice(activity);
  const nextEvent = activity.events[0];
  const nextEventPromo = nextEvent ? getEventPromoText(nextEvent as any) : null;
  const contactHref = activity.contactUrl ?? `tel:${activity.contactPhone ?? ""}`;
  const platformBookingEnabled = Boolean(bookingAccount);
  const hasContact = Boolean(platformBookingEnabled || activity.contactUrl || activity.contactPhone || nextEvent?.signupUrl);
  const organizerName = getPublicOrganizerName(activity.organizer.name);
  const hasOrganizer = Boolean(organizerName);
  const yandexMapsUrl = `https://yandex.ru/maps/?text=${encodeURIComponent(
    activity.address.toLowerCase().includes("тула")
      ? activity.address
      : `Тула, ${activity.address}`
  )}`;
  const structuredData = [
    buildStructuredData(activity),
    buildBreadcrumbStructuredData(activity)
  ];
  const socialLabel = getSocialLevelLabel(activity.socialLevel);
  const trip = isTripActivity(activity.activityType);

  const conditions = [
    activity.canComeAlone ? "Можно прийти одному" : null,
    activity.beginnerFriendly ? "Подходит новичкам" : null,
    activity.isFree ? "Бесплатно" : null,
    activity.isAdultsOnly ? "18+" : null,
    activity.socialLevel === "высокая" ? "Много общения" : null,
    trip ? "Выезд" : null
  ].filter((condition): condition is string => Boolean(condition));

  const infoCards = [
    { label: "Адрес", value: activity.address },
    { label: "Цена", value: price },
    activity.isAdultsOnly ? { label: "Возраст", value: "18+" } : null,
    hasOrganizer ? { label: "Организатор", value: organizerName } : null,
    { label: "Телефон", value: activity.contactPhone ?? "Телефон не указан" },
    { label: "Тип", value: activity.activityType ?? "Уточняется" },
    { label: "Социальность", value: socialLabel ?? "Уточняется" }
  ].filter((item): item is { label: string; value: string } => Boolean(item));

  const reasons = [
    activity.canComeAlone ? "Можно прийти одному" : null,
    activity.beginnerFriendly ? "Подходит новичкам" : null,
    activity.socialLevel === "высокая" ? "Формат с общением" : null,
    trip ? "Выездная активность на выходные" : null
  ].filter((reason): reason is string => Boolean(reason));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <ActivityStatOnMount activityId={activity.id} />
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
        <div className="lg:grid lg:min-h-[560px] lg:grid-cols-[minmax(0,0.95fr)_minmax(390px,0.8fr)]">
          <div className="relative bg-city-soft">
            <ActivityImage
              title={activity.title}
              categoryName={activity.category.name}
              imageUrl={activity.imageUrl}
              className="aspect-[16/10] rounded-none sm:aspect-[21/9] lg:h-full lg:min-h-[560px] lg:aspect-auto"
              imageClassName="lg:object-contain lg:p-10 lg:group-hover:scale-100"
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

          <div className="grid gap-7 p-5 sm:p-8 lg:content-center lg:p-10">
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
              <h1 className="mt-5 max-w-4xl text-3xl font-bold leading-tight text-city-ink sm:text-5xl lg:text-4xl xl:text-5xl">
                {activity.title}
              </h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-city-muted lg:text-base xl:text-lg">
                {activity.description}
              </p>
            </div>

            <aside className="rounded-[28px] bg-city-soft p-5">
              <p className="text-sm text-city-muted">Стоимость</p>
              <p className="mt-1 text-2xl font-bold text-city-ink">{price}</p>
              {hasOrganizer ? (
                <div className="mt-4">
                  <p className="text-sm text-city-muted">Организатор</p>
                  <p className="mt-1 font-semibold text-city-ink">{organizerName}</p>
                </div>
              ) : null}
              {nextEvent ? (
                <div className="mt-5 rounded-2xl border border-city-green/20 bg-white p-4 shadow-sm">
                  <p className="text-sm font-bold uppercase text-city-green">Ближайшая дата</p>
                  <p className="mt-2 text-2xl font-black leading-7 text-city-ink">
                    {formatDateTime(nextEvent.startsAt)}
                  </p>
                  <p className="mt-2 text-sm leading-5 text-city-muted">{nextEvent.title}</p>
                  <p className="mt-3 text-lg font-black text-city-ink">
                    {nextEvent.price ? `${nextEvent.price.toLocaleString("ru-RU")} ₽` : price}
                    {nextEvent.seatsAvailable ? ` · мест: ${nextEvent.seatsAvailable}` : ""}
                  </p>
                  {nextEventPromo ? (
                    <div className="mt-4 rounded-2xl border border-city-green/20 bg-city-green/10 p-4">
                      <p className="text-xs font-bold uppercase text-city-green">Промокод</p>
                      <p className="mt-1 text-2xl font-black text-city-ink">
                        {nextEventPromo.promoCode}
                      </p>
                      <p className="mt-2 text-base font-bold leading-6 text-city-ink">
                        {nextEventPromo.discountText}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-city-muted">
                        {nextEventPromo.instruction}
                      </p>
                    </div>
                  ) : null}
                </div>
              ) : null}
              {platformBookingEnabled ? (
                <TrackedExternalLink
                  goal="organizer_contact_click"
                  activityStat={{
                    activityId: activity.id,
                    eventId: nextEvent?.id,
                    type: nextEvent ? "nearest_event_click" : "signup_click"
                  }}
                  href="#booking-form"
                  className="mt-6 flex min-h-12 items-center justify-center rounded-full bg-city-green px-5 font-semibold text-white transition hover:bg-city-blue"
                >
                  Записаться через Влюди
                </TrackedExternalLink>
              ) : hasContact ? (
                <TrackedExternalLink
                  goal="organizer_contact_click"
                  activityStat={{
                    activityId: activity.id,
                    eventId: nextEvent?.id,
                    type: nextEvent ? "nearest_event_click" : "signup_click"
                  }}
                  href={nextEvent?.signupUrl ?? contactHref}
                  target={nextEvent?.signupUrl || activity.contactUrl ? "_blank" : undefined}
                  rel={nextEvent?.signupUrl || activity.contactUrl ? "noopener noreferrer" : undefined}
                  className="mt-6 flex min-h-12 items-center justify-center rounded-full bg-city-green px-5 font-semibold text-white transition hover:bg-city-blue"
                >
                  {nextEventPromo ? "Записаться со скидкой" : nextEvent ? "Записаться на ближайшее событие" : "Записаться у организатора"}
                </TrackedExternalLink>
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
        </div>
      </section>

      <section className="mt-8 rounded-[30px] border border-city-line bg-white p-6 shadow-soft">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-city-green">
              Расписание
            </p>
            <h2 className="mt-2 text-2xl font-bold text-city-ink">Ближайшие события</h2>
          </div>
          {activity.events.length > 1 ? (
            <p className="text-sm text-city-muted">Выберите удобную дату</p>
          ) : null}
        </div>
        {activity.events.length > 0 ? (
          <div className="mt-5 grid gap-3">
            {activity.events.map((event) => {
              const promo = getEventPromoText(event as any);

              return (
                <div key={event.id} className="rounded-2xl border border-city-green/15 bg-city-soft p-4">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div>
                      <h3 className="font-semibold text-city-ink">{event.title}</h3>
                      <p className="mt-2 text-base font-bold text-city-ink">
                        {formatDateTime(event.startsAt)}
                        {event.price ? ` · ${event.price.toLocaleString("ru-RU")} ₽` : ""}
                        {event.seatsAvailable ? ` · мест: ${event.seatsAvailable}` : ""}
                      </p>
                      {promo ? (
                        <div className="mt-3 rounded-2xl border border-city-green/20 bg-white p-4">
                          <p className="text-xs font-bold uppercase text-city-green">Промокод</p>
                          <p className="mt-1 text-2xl font-black text-city-ink">{promo.promoCode}</p>
                          <p className="mt-2 text-base font-bold text-city-ink">{promo.discountText}</p>
                          <p className="mt-1 text-sm leading-6 text-city-muted">{promo.instruction}</p>
                        </div>
                      ) : null}
                    </div>
                    {(platformBookingEnabled || event.signupUrl || hasContact) ? (
                      <TrackedExternalLink
                        goal="organizer_contact_click"
                        activityStat={{
                          activityId: activity.id,
                          eventId: event.id,
                          type: event.id === nextEvent?.id ? "nearest_event_click" : "signup_click"
                        }}
                        href={platformBookingEnabled ? "#booking-form" : event.signupUrl ?? contactHref}
                        target={!platformBookingEnabled && (event.signupUrl || activity.contactUrl) ? "_blank" : undefined}
                        rel={!platformBookingEnabled && (event.signupUrl || activity.contactUrl) ? "noopener noreferrer" : undefined}
                        className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-full bg-white px-4 text-sm font-semibold text-city-green transition hover:bg-city-green hover:text-white"
                      >
                        {promo ? "Записаться со скидкой" : "Записаться"}
                      </TrackedExternalLink>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="mt-4 text-city-muted">
            Даты пока не добавлены. Свяжитесь с организатором, чтобы уточнить ближайшее занятие.
          </p>
        )}
      </section>

      {platformBookingEnabled ? (
        <section id="booking-form" className="mt-8 rounded-[30px] border border-city-line bg-white p-6 shadow-soft">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-city-green">
                Запись через Влюди
              </p>
              <h2 className="mt-2 text-2xl font-bold text-city-ink">Оставить заявку организатору</h2>
              <p className="mt-3 leading-7 text-city-muted">
                Мы передадим заявку организатору. Укажите удобный контакт для связи и, если нужно,
                короткий комментарий.
              </p>
              {nextEventPromo || bookingAccount?.platformBookingDiscountText ? (
                <p className="mt-4 rounded-2xl bg-city-green/10 p-4 text-sm font-semibold leading-6 text-city-green">
                  {nextEventPromo
                    ? `${nextEventPromo.discountText}. ${nextEventPromo.instruction}`
                    : bookingAccount?.platformBookingDiscountText}
                </p>
              ) : null}
              {query.booking === "sent" ? (
                <p className="mt-4 rounded-2xl border border-city-green/30 bg-city-green/10 p-4 text-sm font-semibold text-city-ink">
                  Заявка отправлена. Организатор свяжется с вами по указанному контакту.
                </p>
              ) : null}
              {typeof query.bookingError === "string" ? (
                <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                  {query.bookingError}
                </p>
              ) : null}
            </div>
            <form action={createActivityBookingRequest} className="rounded-[24px] bg-city-soft p-5">
              <input type="hidden" name="activityId" value={activity.id} />
              {nextEvent ? <input type="hidden" name="eventId" value={nextEvent.id} /> : null}
              <label className="block">
                <span className="text-sm font-semibold text-city-ink">Имя</span>
                <input
                  name="name"
                  required
                  className="mt-2 w-full rounded-2xl border border-city-line bg-white px-4 py-3 outline-none transition focus:border-city-green"
                  placeholder="Как к вам обращаться"
                />
              </label>
              <label className="mt-4 block">
                <span className="text-sm font-semibold text-city-ink">Контакт</span>
                <input
                  name="contact"
                  required
                  className="mt-2 w-full rounded-2xl border border-city-line bg-white px-4 py-3 outline-none transition focus:border-city-green"
                  placeholder="Телефон, Telegram или VK"
                />
              </label>
              <label className="mt-4 block">
                <span className="text-sm font-semibold text-city-ink">Комментарий</span>
                <textarea
                  name="message"
                  rows={4}
                  className="mt-2 w-full rounded-2xl border border-city-line bg-white px-4 py-3 outline-none transition focus:border-city-green"
                  placeholder="Например: хочу прийти на ближайшую дату"
                />
              </label>
              <button className="mt-5 min-h-12 w-full rounded-full bg-city-green px-5 font-semibold text-white transition hover:bg-city-blue">
                Отправить заявку
              </button>
            </form>
          </div>
        </section>
      ) : null}

      <section className="mt-8 rounded-[30px] border border-city-line bg-white p-6 shadow-soft">
        <h2 className="text-2xl font-bold text-city-ink">Куда написать / записаться</h2>
        <p className="mt-3 leading-7 text-city-muted">
          Информация носит справочный характер и не является публичной офертой.
          Расписание, цены и условия участия уточняйте у организатора.
        </p>
        {activity.contactPhone ? (
          <p className="mt-4 text-city-muted">
            Телефон: <span className="font-semibold text-city-ink">{activity.contactPhone}</span>
          </p>
        ) : null}
        {activity.contactUrl ? (
          <TrackedExternalLink
            goal="organizer_contact_click"
            activityStat={{ activityId: activity.id, type: "signup_click" }}
            href={activity.contactUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex min-h-12 items-center justify-center rounded-full bg-city-green px-6 font-semibold text-white transition hover:bg-city-blue"
          >
            Перейти к организатору
          </TrackedExternalLink>
        ) : null}
        {!activity.contactPhone && !activity.contactUrl ? (
          <p className="mt-4 text-city-muted">Контакты уточняются</p>
        ) : null}
        <div className="mt-6 rounded-2xl bg-city-soft p-4">
          <p className="text-sm font-semibold text-city-ink">Вы организатор этой активности?</p>
          <p className="mt-1 text-sm leading-6 text-city-muted">
            Можно запросить доступ к карточке и отправлять правки через кабинет.
          </p>
          <Link
            href={`/organizer/register?activityId=${activity.id}`}
            className="mt-3 inline-flex text-sm font-semibold text-city-green transition hover:text-city-blue"
          >
            Запросить доступ
          </Link>
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
        {activity.whyGoText ? (
          <p className="mt-4 rounded-2xl bg-city-soft p-4 leading-7 text-city-ink">
            {activity.whyGoText}
          </p>
        ) : null}
        {trip ? (
          <p className="mt-4 rounded-2xl bg-city-soft p-4 leading-7 text-city-ink">
            Это выездной формат: уточните даты и место проведения у организатора.
          </p>
        ) : null}
      </section>

      {activity.media.length > 0 ? (
        <section className="mt-8 rounded-[30px] border border-city-line bg-white p-6 shadow-soft">
          <h2 className="text-2xl font-bold text-city-ink">Как проходит активность</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {activity.media.map((media) => (
              <div key={media.id} className="overflow-hidden rounded-[24px] bg-city-soft">
                {media.type === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={media.url}
                    alt={media.caption ?? activity.title}
                    className="aspect-[4/3] w-full object-cover"
                  />
                ) : (
                  <a
                    href={media.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex aspect-[4/3] items-center justify-center p-5 text-center font-semibold text-city-green transition hover:text-city-blue"
                  >
                    Открыть видео
                  </a>
                )}
                {media.caption ? (
                  <p className="p-4 text-sm leading-6 text-city-muted">{media.caption}</p>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {infoCards.map((item) => (
          <div
            key={item.label}
            className="rounded-[24px] border border-city-line bg-white p-5 shadow-soft lg:p-6"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-city-muted">
              {item.label}
            </p>
            <p className="mt-3 text-lg font-extrabold leading-7 text-city-ink">
              {item.value}
            </p>
            {item.label === "Адрес" ? (
              <a
                href={yandexMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex min-h-10 items-center rounded-full border border-city-line px-4 py-2 text-sm font-semibold text-city-green transition hover:border-city-green hover:bg-city-soft"
              >
                Показать в Яндекс Картах
              </a>
            ) : null}
          </div>
        ))}
      </section>

      {sortedSimilarActivities.length > 0 ? (
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
            {sortedSimilarActivities.map((similar) => (
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
