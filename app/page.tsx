import type { Metadata } from "next";
import Link from "next/link";
import { ActivityStatus } from "@prisma/client";
import { ActivityCard } from "@/components/ActivityCard";
import { TrackedForm, TrackedLink } from "@/components/MetrikaGoals";
import { getUpcomingEventWhere } from "@/lib/events";
import { prisma } from "@/lib/prisma";

const quickLinks = [
  {
    label: "Бесплатно",
    href: "/tula/besplatno",
    text: "Встречи и занятия без оплаты",
    mark: "0 ₽"
  },
  {
    label: "Можно одному",
    href: "/tula/mozhno-odnomu",
    text: "Форматы, где не нужна компания",
    mark: "solo"
  },
  {
    label: "Новичкам",
    href: "/tula/dlya-novichkov",
    text: "Без опыта и подготовки",
    mark: "start"
  },
  {
    label: "На выходные",
    href: "/tula/chem-zanyatsya-v-vyhodnye",
    text: "Идеи на свободный день",
    mark: "сб/вс"
  },
  {
    label: "Где познакомиться",
    href: "/tula/gde-poznakomitsya",
    text: "Больше общения и совместных дел",
    mark: "люди"
  },
  {
    label: "Все активности",
    href: "/tula",
    text: "Полный каталог по Туле",
    mark: "все"
  }
];

const directionLinks = [
  { label: "Игры и клубы", href: "/tula/igry-i-kluby" },
  { label: "Танцы", href: "/tula/tancy" },
  { label: "Спорт и прогулки", href: "/tula/sport-i-progulki" },
  { label: "Творчество", href: "/tula/tvorchestvo" },
  { label: "Кулинария", href: "/tula/kulinariya" },
  { label: "Практики и здоровье", href: "/tula/praktiki-i-zdorove" },
  { label: "Книги и общение", href: "/tula/knigi-i-obshchenie" },
  { label: "Волонтёрство", href: "/tula/volonterstvo" },
  { label: "Театр и сцена", href: "/tula/teatr-i-scena" },
  { label: "Выезды и приключения", href: "/tula/vyezdy-i-priklyucheniya" }
];

type ActivityPreview = Parameters<typeof ActivityCard>[0]["activity"] & {
  id: number;
};

type UpcomingEventPreview = {
  id: number;
  title: string;
  startsAt: Date;
  price: number | null;
  activity: {
    title: string;
    slug: string;
    address: string;
    category: {
      name: string;
    };
  };
};

const homeSectionTake = 24;

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    absolute: "Влюди — куда сходить и чем заняться в Туле"
  },
  description:
    "Найдите, куда сходить в Туле, чтобы не сидеть дома: игры, танцы, прогулки, мастер-классы, клубы и встречи.",
  alternates: {
    canonical: "/"
  },
  openGraph: {
    title: "Влюди — куда сходить и чем заняться в Туле",
    description:
      "Игры, танцы, прогулки, мастер-классы, клубы и встречи в Туле, куда можно прийти одному и оказаться среди людей.",
    url: "https://vlyudi.ru",
    siteName: "Влюди",
    locale: "ru_RU",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Влюди — социальные активности в Туле"
      }
    ]
  }
};

function ActivitySection({
  title,
  description,
  activities,
  href
}: {
  title: string;
  description: string;
  activities: ActivityPreview[];
  href: string;
}) {
  if (activities.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-city-ink sm:text-3xl">{title}</h2>
          <p className="mt-2 text-city-muted">{description}</p>
        </div>
        <TrackedLink
          href={href}
          goal="view_all_activities_click"
          className="hidden text-sm font-semibold text-city-green sm:inline"
        >
          Смотреть все
        </TrackedLink>
      </div>
      <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {activities.map((activity) => (
          <ActivityCard key={activity.id} activity={activity} />
        ))}
      </div>
    </section>
  );
}

function formatEventDate(date: Date) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    weekday: "short"
  }).format(date);
}

function formatEventTime(date: Date) {
  return new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function UpcomingEventsSection({ events }: { events: UpcomingEventPreview[] }) {
  if (events.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-city-ink sm:text-3xl">
            Ближайшие события в Туле
          </h2>
          <p className="mt-2 text-city-muted">
            Актуальные даты от организаторов. Если дат мало, раздел просто не занимает место.
          </p>
        </div>
        <TrackedLink
          href="/kuda-shodit-v-tule"
          goal="view_all_activities_click"
          className="hidden text-sm font-semibold text-city-green sm:inline"
        >
          Смотреть афишу
        </TrackedLink>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
            <h3 className="mt-3 text-xl font-bold text-city-ink">{event.title}</h3>
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
  );
}

function getDailySeed() {
  return new Date().toISOString().slice(0, 10);
}

function hashForRotation(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
}

function rotateActivities<T extends { id: number; isPromoted?: boolean | null }>(
  activities: T[],
  sectionKey: string,
  take = 6
) {
  const seed = getDailySeed();

  return [...activities]
    .sort((left, right) => {
      const leftPromoted = Number(Boolean(left.isPromoted));
      const rightPromoted = Number(Boolean(right.isPromoted));

      if (leftPromoted !== rightPromoted) {
        return rightPromoted - leftPromoted;
      }

      return (
        hashForRotation(`${seed}:${sectionKey}:${left.id}`) -
        hashForRotation(`${seed}:${sectionKey}:${right.id}`)
      );
    })
    .slice(0, take);
}

export default async function HomePage() {
  const now = new Date();
  const [
    upcomingEvents,
    meetPeopleActivities,
    soloActivities,
    activeRestActivities,
    creativeActivities,
    weekendActivities
  ] = await Promise.all([
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
          select: {
            title: true,
            slug: true,
            address: true,
            category: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: { startsAt: "asc" },
      take: 6
    }),
    prisma.activity.findMany({
      where: {
        status: ActivityStatus.published,
        city: { slug: "tula" },
        OR: [
          { socialLevel: "высокая" },
          { category: { slug: { in: ["igry-i-kluby", "tancy", "volonterstvo"] } } }
        ]
      },
      include: { category: true },
      orderBy: [{ isPromoted: "desc" }, { priority: "desc" }, { createdAt: "desc" }],
      take: homeSectionTake
    }),
    prisma.activity.findMany({
      where: {
        status: ActivityStatus.published,
        city: { slug: "tula" },
        canComeAlone: true
      },
      include: { category: true },
      orderBy: [{ isPromoted: "desc" }, { priority: "desc" }, { createdAt: "desc" }],
      take: homeSectionTake
    }),
    prisma.activity.findMany({
      where: {
        status: ActivityStatus.published,
        city: { slug: "tula" },
        category: { slug: { in: ["sport-i-progulki", "vyezdy-i-priklyucheniya"] } }
      },
      include: { category: true },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      take: homeSectionTake
    }),
    prisma.activity.findMany({
      where: {
        status: ActivityStatus.published,
        city: { slug: "tula" },
        category: { slug: { in: ["tvorchestvo", "kulinariya"] } }
      },
      include: { category: true },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      take: homeSectionTake
    }),
    prisma.activity.findMany({
      where: {
        status: ActivityStatus.published,
        city: { slug: "tula" },
        OR: [
          { activityType: "выездная активность" },
          { category: { slug: "vyezdy-i-priklyucheniya" } }
        ]
      },
      include: { category: true },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      take: homeSectionTake
    })
  ]);
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Влюди",
    url: "https://vlyudi.ru",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://vlyudi.ru/tula?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:py-16">
        <div className="flex flex-col justify-center">
          <p className="mb-4 w-fit rounded-full bg-city-soft px-4 py-2 text-sm font-semibold text-city-green">
            Социальные активности в Туле
          </p>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight text-city-ink sm:text-6xl">
            Найдите, чем заняться в Туле
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-city-muted">
            Игры, танцы, прогулки, мастер-классы, клубы и встречи — места, куда можно прийти одному и оказаться среди людей.
          </p>
          <p className="mt-3 max-w-2xl text-base leading-7 text-city-ink">
            Выберите активность на вечер, выходные или новый круг общения.
          </p>
          <TrackedForm
            action="/tula"
            goal="search_submit"
            className="mt-8 flex flex-col gap-3 rounded-[28px] bg-white p-2 shadow-soft ring-1 ring-city-line sm:flex-row"
          >
            <input
              name="q"
              type="search"
              placeholder="Название, организатор, игры, танцы..."
              className="min-h-12 flex-1 rounded-full border-0 bg-transparent px-4 text-city-ink outline-none placeholder:text-city-muted/70"
            />
            <button className="min-h-12 rounded-full bg-city-green px-6 font-semibold text-white transition hover:bg-city-blue">
              Найти
            </button>
          </TrackedForm>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <TrackedLink
              href="/tula"
              goal="view_all_activities_click"
              className="inline-flex min-h-11 items-center rounded-full border border-city-line bg-white px-5 text-sm font-semibold text-city-ink shadow-sm transition hover:border-city-green hover:text-city-green"
            >
              Смотреть все активности
            </TrackedLink>
            <TrackedLink
              href="/add"
              goal="add_activity_click"
              className="inline-flex min-h-11 items-center rounded-full bg-city-soft px-5 text-sm font-semibold text-city-green ring-1 ring-city-green/15 transition hover:bg-white hover:shadow-sm hover:ring-city-green/40"
            >
              Добавить свою
            </TrackedLink>
          </div>
        </div>

        <div className="rounded-[32px] border border-city-line bg-white p-4 shadow-soft">
          <div className="rounded-[26px] bg-city-soft p-5">
            <div className="flex items-center justify-between gap-4">
              <p className="text-lg font-bold text-city-ink">Быстрый выбор</p>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-city-green">
                Тула
              </span>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {quickLinks.map((item) => (
                <TrackedLink
                  key={item.href}
                  href={item.href}
                  goal="quick_choice_click"
                  className="group rounded-[22px] bg-white p-4 shadow-sm ring-1 ring-city-line/70 transition hover:-translate-y-0.5 hover:shadow-soft hover:ring-city-green/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-bold text-city-ink group-hover:text-city-green">
                        {item.label}
                      </h2>
                      <p className="mt-1 text-sm leading-5 text-city-muted">{item.text}</p>
                    </div>
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-city-soft text-xs font-bold uppercase text-city-green">
                      {item.mark}
                    </span>
                  </div>
                </TrackedLink>
              ))}
            </div>
            <div className="mt-5 border-t border-city-line/80 pt-5">
              <p className="text-sm font-semibold text-city-muted">Все направления</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {directionLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-full bg-white px-3 py-2 text-sm font-semibold text-city-muted ring-1 ring-city-line/70 transition hover:text-city-green hover:shadow-sm hover:ring-city-green/40"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6">
        <div className="border-y border-city-line py-8">
          <div className="max-w-3xl">
            <h2 className="text-2xl font-bold text-city-ink sm:text-3xl">
              Как выбрать, куда сходить в Туле
            </h2>
            <p className="mt-3 leading-7 text-city-muted">
              Влюди помогает искать не только по названию места, но и по ситуации: когда хочется
              выбраться одному, найти бесплатную встречу, попробовать новый формат или провести
              выходной среди людей.
            </p>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-3">
            <div>
              <h3 className="font-bold text-city-ink">По настроению</h3>
              <p className="mt-2 leading-7 text-city-muted">
                Для спокойного вечера подойдут книжные клубы и практики, для движения — прогулки,
                танцы и выезды.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-city-ink">По ситуации</h3>
              <p className="mt-2 leading-7 text-city-muted">
                Можно быстро открыть подборки{" "}
                <TrackedLink goal="quick_choice_click" href="/tula/besplatno" className="font-semibold text-city-green">
                  бесплатно
                </TrackedLink>
                ,{" "}
                <TrackedLink goal="quick_choice_click" href="/tula/mozhno-odnomu" className="font-semibold text-city-green">
                  можно одному
                </TrackedLink>{" "}
                или{" "}
                <TrackedLink goal="quick_choice_click" href="/tula/dlya-novichkov" className="font-semibold text-city-green">
                  новичкам
                </TrackedLink>
                .
              </p>
            </div>
            <div>
              <h3 className="font-bold text-city-ink">По цели</h3>
              <p className="mt-2 leading-7 text-city-muted">
                Если хочется общения, начните со страницы{" "}
                <TrackedLink goal="quick_choice_click" href="/tula/gde-poznakomitsya" className="font-semibold text-city-green">
                  где познакомиться в Туле
                </TrackedLink>
                . Для свободного дня есть подборка{" "}
                <TrackedLink goal="quick_choice_click" href="/tula/chem-zanyatsya-v-vyhodnye" className="font-semibold text-city-green">
                  на выходные
                </TrackedLink>
                .
              </p>
            </div>
          </div>
        </div>
      </section>

      <UpcomingEventsSection events={upcomingEvents} />

      <ActivitySection
        title="Где познакомиться с новыми людьми"
        description="Игры, танцы, волонтёрство и другие форматы, где люди взаимодействуют друг с другом."
        activities={rotateActivities(meetPeopleActivities, "meet-people")}
        href="/tula/gde-poznakomitsya"
      />

      <ActivitySection
        title="Можно прийти без компании"
        description="Форматы, где нормально появиться одному и быстро включиться в общий процесс."
        activities={rotateActivities(soloActivities, "solo")}
        href="/tula/mozhno-odnomu"
      />

      <ActivitySection
        title="Движение и активный отдых"
        description="Прогулки, спорт, выезды и маршруты для тех, кто хочет выбраться из дома."
        activities={rotateActivities(activeRestActivities, "active-rest")}
        href="/tula/sport-i-progulki"
      />

      <ActivitySection
        title="Творческие занятия"
        description="Мастер-классы, кулинарные вечера и практики, где проще общаться через общее дело."
        activities={rotateActivities(creativeActivities, "creative")}
        href="/tula/tvorchestvo"
      />

      <ActivitySection
        title="Идеи на выходные"
        description="Выездные форматы и активности, которые удобно запланировать на свободный день."
        activities={rotateActivities(weekendActivities, "weekend")}
        href="/tula/chem-zanyatsya-v-vyhodnye"
      />

      <section className="mx-auto max-w-7xl px-4 pb-14 pt-6 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-5 rounded-[32px] bg-city-ink p-6 text-white shadow-soft sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-bold">Знаете классную активность в Туле?</h2>
            <p className="mt-2 max-w-2xl text-white/75">
              Добавьте её, мы проверим информацию и опубликуем карточку в каталоге.
            </p>
          </div>
          <TrackedLink
            href="/add"
            goal="add_activity_click"
            className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-city-ink transition hover:bg-city-soft"
          >
            Добавить активность
          </TrackedLink>
        </div>
      </section>
    </div>
  );
}
