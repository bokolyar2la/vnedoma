import type { Metadata } from "next";
import Link from "next/link";
import { ActivityStatus } from "@prisma/client";
import { ActivityCard } from "@/components/ActivityCard";
import { prisma } from "@/lib/prisma";

const categoryLinks: Record<string, string> = {
  sport: "/tula/sport",
  creativity: "/tula/tvorchestvo",
  dance: "/tula/tancy",
  lectures: "/tula/lekcii"
};

const quickLinks = [
  { label: "Мастер-классы", href: "/tula/master-klassy" },
  { label: "Спорт", href: "/tula/sport" },
  { label: "Танцы", href: "/tula/tancy" },
  { label: "Лекции", href: "/tula/lekcii" },
  { label: "Бесплатно", href: "/tula/besplatno" },
  { label: "Можно одному", href: "/tula/mozhno-odnomu" }
];

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

export default async function HomePage() {
  const [categories, popularActivities] = await Promise.all([
    prisma.category.findMany({
      orderBy: { name: "asc" }
    }),
    prisma.activity.findMany({
      where: {
        status: ActivityStatus.published,
        city: { slug: "tula" }
      },
      include: { category: true },
      orderBy: [{ isPromoted: "desc" }, { priority: "desc" }, { createdAt: "desc" }],
      take: 6
    })
  ]);

  return (
    <div>
      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.08fr_0.92fr] lg:py-16">
        <div className="flex flex-col justify-center">
          <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-city-green">
            Офлайн-активности для всех
          </p>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight text-city-ink sm:text-5xl">
            Найдите занятие по душе в Туле
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-city-muted">
            Кружки, секции, мастер-классы, лекции и клубы — в одном месте
          </p>
          <form action="/tula" className="mt-8 flex flex-col gap-3 sm:flex-row">
            <input
              name="q"
              type="search"
              placeholder="Йога, керамика, английский..."
              className="min-h-12 flex-1 rounded-full border border-city-line bg-white px-5 text-city-ink outline-none transition placeholder:text-city-muted/70 focus:border-city-green focus:ring-4 focus:ring-city-green/10"
            />
            <button className="min-h-12 rounded-full bg-city-green px-6 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-city-blue">
              Найти
            </button>
          </form>
        </div>

        <div className="rounded-3xl border border-city-line bg-white p-5 shadow-soft">
          <div className="rounded-2xl bg-city-soft p-5">
            <p className="text-sm font-semibold text-city-green">Быстрый выбор</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {quickLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-2xl bg-white px-4 py-4 text-center text-sm font-semibold text-city-ink shadow-sm transition hover:-translate-y-0.5 hover:text-city-green hover:shadow-soft"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-city-ink">Категории</h2>
            <p className="mt-2 text-city-muted">
              Выберите направление и посмотрите занятия.
            </p>
          </div>
          <Link href="/tula" className="hidden text-sm font-semibold text-city-green sm:inline">
            Смотреть все
          </Link>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={categoryLinks[category.slug] ?? `/tula?category=${category.slug}`}
              className="rounded-2xl border border-city-line bg-white p-5 transition hover:-translate-y-0.5 hover:border-city-green hover:shadow-soft"
            >
              <h3 className="font-semibold text-city-ink">{category.name}</h3>
              <p className="mt-2 text-sm leading-6 text-city-muted">{category.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div>
          <h2 className="text-2xl font-bold text-city-ink">Популярные активности</h2>
          <p className="mt-2 text-city-muted">Несколько хороших вариантов для старта.</p>
        </div>
        <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {popularActivities.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 pt-4 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-5 rounded-3xl bg-city-ink p-6 text-white sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-bold">Добавить свою активность</h2>
            <p className="mt-2 max-w-2xl text-white/75">
              Расскажите о секции, клубе, лекции или мастер-классе в Туле.
            </p>
          </div>
          <Link
            href="/add"
            className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-city-ink transition hover:-translate-y-0.5 hover:bg-city-soft"
          >
            Добавить активность
          </Link>
        </div>
      </section>
    </div>
  );
}
