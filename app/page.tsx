import type { Metadata } from "next";
import Link from "next/link";
import { ActivityStatus } from "@prisma/client";
import { ActivityCard } from "@/components/ActivityCard";
import { prisma } from "@/lib/prisma";

const quickLinks = [
  {
    label: "Мастер-классы",
    href: "/tula/master-klassy",
    text: "Керамика, рисование, ремесла",
    mark: "✦"
  },
  { label: "Спорт", href: "/tula/sport", text: "Тренировки и мягкий старт", mark: "↗" },
  { label: "Танцы", href: "/tula/tancy", text: "Бачата, сальса и новые движения", mark: "♪" },
  { label: "Лекции", href: "/tula/lekcii", text: "История, культура, навыки", mark: "§" },
  { label: "Бесплатно", href: "/tula/besplatno", text: "Открытые встречи и события", mark: "0" },
  { label: "Можно одному", href: "/tula/mozhno-odnomu", text: "Без компании тоже комфортно", mark: "•" }
];

type ActivityPreview = Parameters<typeof ActivityCard>[0]["activity"] & {
  id: number;
};

export const metadata: Metadata = {
  title: {
    absolute: "Вне дома — занятия, кружки и события в Туле"
  },
  description:
    "Кружки, секции, мастер-классы, лекции и клубы в Туле — в одном месте.",
  openGraph: {
    title: "Вне дома — занятия, кружки и события в Туле",
    description:
      "Кружки, секции, мастер-классы, лекции и клубы в Туле — в одном месте.",
    url: "https://vnedoma.com",
    siteName: "Вне дома",
    locale: "ru_RU",
    type: "website"
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
  const [popularActivities, soloActivities, freeActivities] = await Promise.all([
    prisma.activity.findMany({
      where: {
        status: ActivityStatus.published,
        city: { slug: "tula" }
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
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      take: 6
    }),
    prisma.activity.findMany({
      where: {
        status: ActivityStatus.published,
        city: { slug: "tula" },
        isFree: true
      },
      include: { category: true },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      take: 6
    })
  ]);

  return (
    <div>
      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:py-16">
        <div className="flex flex-col justify-center">
          <p className="mb-4 w-fit rounded-full bg-city-soft px-4 py-2 text-sm font-semibold text-city-green">
            Офлайн-активности для города
          </p>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight text-city-ink sm:text-6xl">
            Найдите занятие по душе в Туле
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-city-muted">
            Кружки, секции, мастер-классы, лекции и клубы — в одном месте.
          </p>
          <p className="mt-3 max-w-2xl text-base leading-7 text-city-ink">
            Выберите, чем заняться сегодня, на выходных или после работы.
          </p>
          <form action="/tula" className="mt-8 flex flex-col gap-3 rounded-[28px] bg-white p-2 shadow-soft ring-1 ring-city-line sm:flex-row">
            <input
              name="q"
              type="search"
              placeholder="Йога, керамика, английский..."
              className="min-h-12 flex-1 rounded-full border-0 bg-transparent px-4 text-city-ink outline-none placeholder:text-city-muted/70"
            />
            <button className="min-h-12 rounded-full bg-city-green px-6 font-semibold text-white transition hover:bg-city-blue">
              Найти
            </button>
          </form>
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
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-city-soft text-lg font-bold text-city-green">
                      {item.mark}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <ActivitySection
        title="Популярное в Туле"
        description="Подборка занятий, с которых удобно начать."
        activities={popularActivities}
        href="/tula"
      />

      <ActivitySection
        title="Можно прийти одному"
        description="Варианты, где комфортно появиться без компании."
        activities={soloActivities}
        href="/tula/mozhno-odnomu"
      />

      <ActivitySection
        title="Бесплатные занятия"
        description="Открытые встречи, лекции и прогулки без оплаты."
        activities={freeActivities}
        href="/tula/besplatno"
      />

      <section className="mx-auto max-w-7xl px-4 pb-14 pt-6 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-5 rounded-[32px] bg-city-ink p-6 text-white shadow-soft sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-bold">Знаете хорошее место или клуб?</h2>
            <p className="mt-2 max-w-2xl text-white/75">
              Добавьте активность, а мы проверим ее и покажем людям в каталоге.
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
