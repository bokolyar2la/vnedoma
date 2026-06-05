import type { Metadata } from "next";
import Link from "next/link";
import { ActivityStatus } from "@prisma/client";
import { ActivityCard } from "@/components/ActivityCard";
import { prisma } from "@/lib/prisma";

const quickLinks = [
  {
    label: "Игры и клубы",
    href: "/tula/igry-i-kluby",
    text: "Настолки, квизы, клубные встречи",
    mark: "play"
  },
  { label: "Танцы", href: "/tula/tancy", text: "Можно без пары и опыта", mark: "dance" },
  {
    label: "Спорт и прогулки",
    href: "/tula/sport-i-progulki",
    text: "Движение, маршруты, город",
    mark: "move"
  },
  {
    label: "Можно одному",
    href: "/tula/mozhno-odnomu",
    text: "Форматы, где не нужна компания",
    mark: "solo"
  },
  {
    label: "На выходные",
    href: "/tula/chem-zanyatsya-v-vyhodnye",
    text: "Выезды и планы на пару дней",
    mark: "weekend"
  },
  {
    label: "Где познакомиться",
    href: "/tula/gde-poznakomitsya",
    text: "Больше общения и совместных дел",
    mark: "meet"
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
        <Link href={href} className="hidden text-sm font-semibold text-city-green sm:inline">
          Смотреть все
        </Link>
      </div>
      <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {activities.map((activity) => (
          <ActivityCard key={activity.id} activity={activity} />
        ))}
      </div>
    </section>
  );
}

export default async function HomePage() {
  const [
    meetPeopleActivities,
    soloActivities,
    activeRestActivities,
    creativeActivities,
    weekendActivities
  ] = await Promise.all([
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
      take: 6
    }),
    prisma.activity.findMany({
      where: {
        status: ActivityStatus.published,
        city: { slug: "tula" },
        canComeAlone: true
      },
      include: { category: true },
      orderBy: [{ isPromoted: "desc" }, { priority: "desc" }, { createdAt: "desc" }],
      take: 6
    }),
    prisma.activity.findMany({
      where: {
        status: ActivityStatus.published,
        city: { slug: "tula" },
        category: { slug: { in: ["sport-i-progulki", "vyezdy-i-priklyucheniya"] } }
      },
      include: { category: true },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      take: 6
    }),
    prisma.activity.findMany({
      where: {
        status: ActivityStatus.published,
        city: { slug: "tula" },
        category: { slug: { in: ["tvorchestvo", "kulinariya"] } }
      },
      include: { category: true },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      take: 6
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
      take: 6
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
          <form action="/tula" className="mt-8 flex flex-col gap-3 rounded-[28px] bg-white p-2 shadow-soft ring-1 ring-city-line sm:flex-row">
            <input
              name="q"
              type="search"
              placeholder="Название, организатор, игры, танцы..."
              className="min-h-12 flex-1 rounded-full border-0 bg-transparent px-4 text-city-ink outline-none placeholder:text-city-muted/70"
            />
            <button className="min-h-12 rounded-full bg-city-green px-6 font-semibold text-white transition hover:bg-city-blue">
              Найти
            </button>
          </form>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Link
              href="/tula"
              className="inline-flex min-h-11 items-center rounded-full border border-city-line bg-white px-5 text-sm font-semibold text-city-ink shadow-sm transition hover:border-city-green hover:text-city-green"
            >
              Смотреть все активности
            </Link>
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
                <Link
                  key={item.href}
                  href={item.href}
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
                </Link>
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

      <ActivitySection
        title="Где познакомиться с новыми людьми"
        description="Игры, танцы, волонтёрство и другие форматы, где люди взаимодействуют друг с другом."
        activities={meetPeopleActivities}
        href="/tula/gde-poznakomitsya"
      />

      <ActivitySection
        title="Можно прийти без компании"
        description="Форматы, где нормально появиться одному и быстро включиться в общий процесс."
        activities={soloActivities}
        href="/tula/mozhno-odnomu"
      />

      <ActivitySection
        title="Движение и активный отдых"
        description="Прогулки, спорт, выезды и маршруты для тех, кто хочет выбраться из дома."
        activities={activeRestActivities}
        href="/tula/sport-i-progulki"
      />

      <ActivitySection
        title="Творческие занятия"
        description="Мастер-классы, кулинарные вечера и практики, где проще общаться через общее дело."
        activities={creativeActivities}
        href="/tula/tvorchestvo"
      />

      <ActivitySection
        title="Идеи на выходные"
        description="Выездные форматы и активности, которые удобно запланировать на свободный день."
        activities={weekendActivities}
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
          <Link
            href="/add"
            className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-city-ink transition hover:bg-city-soft"
          >
            Добавить активность
          </Link>
        </div>
      </section>
    </div>
  );
}
