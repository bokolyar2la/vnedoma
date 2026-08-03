import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Для организаторов активностей в Туле — заявки, события и продвижение | Влюди",
  description:
    "Влюди помогает организаторам в Туле получать заявки, вести карточку активности, добавлять ближайшие события и попадать в подборки каталога.",
  alternates: {
    canonical: "/organizers"
  }
};

const features = [
  {
    title: "Заявки через Влюди",
    text: "На карточке появляется форма заявки. Контакты участника сохраняются в кабинете и приходят на почту организатора."
  },
  {
    title: "Ближайшие события",
    text: "Организатор добавляет даты занятий, встреч или наборов. Если даты есть, они попадают в афишу и на карточку."
  },
  {
    title: "Статистика",
    text: "В кабинете видно просмотры карточек, клики по записи и новые заявки за последние 30 дней."
  },
  {
    title: "Приоритет в подборках",
    text: "Для платного размещения карточки можно поднимать выше в каталоге, на главной и в тематических разделах."
  }
];

const plans = [
  {
    name: "Бесплатно",
    price: "0 ₽",
    text: "Базовая карточка в каталоге, если активность подходит Влюди.",
    items: ["Публикация карточки", "Контакт организатора", "Базовое описание"]
  },
  {
    name: "Активное размещение",
    price: "990 ₽ / месяц",
    text: "Для организаторов, которые хотят получать заявки и регулярно добавлять даты.",
    items: [
      "Заявки через Влюди",
      "Уведомления на почту",
      "Ближайшие события",
      "Статистика в кабинете"
    ]
  },
  {
    name: "Продвижение",
    price: "1990 ₽ / месяц",
    text: "Для карточек, которым нужен приоритет и помощь с упаковкой.",
    items: [
      "Все из активного размещения",
      "Приоритет в подборках",
      "Выше в каталоге",
      "Помощь с оформлением карточки"
    ]
  }
];

export default function OrganizersPage() {
  return (
    <main>
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
        <p className="text-sm font-semibold uppercase tracking-wide text-city-green">
          Влюди · организаторам
        </p>
        <div className="mt-5 grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
          <div>
            <h1 className="max-w-4xl text-4xl font-black tracking-tight text-city-ink sm:text-5xl">
              Получайте заявки на активности в Туле
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-city-muted">
              Влюди помогает людям находить занятия, встречи, клубы и события, а организаторам
              дает карточку, заявки, уведомления, статистику и место в городских подборках.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/organizer/claim"
                className="rounded-full bg-city-green px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-city-blue"
              >
                Получить доступ
              </Link>
              <Link
                href="/add"
                className="rounded-full border border-city-line bg-white px-5 py-3 text-sm font-semibold text-city-ink transition hover:border-city-green hover:text-city-green"
              >
                Добавить активность
              </Link>
              <Link
                href="/organizer/login"
                className="rounded-full border border-city-line bg-white px-5 py-3 text-sm font-semibold text-city-ink transition hover:border-city-green hover:text-city-green"
              >
                Войти в кабинет
              </Link>
            </div>
          </div>

          <div className="rounded-[28px] border border-city-line bg-city-soft p-6">
            <h2 className="text-2xl font-bold text-city-ink">Как это работает</h2>
            <ol className="mt-5 grid gap-4 text-sm leading-6 text-city-muted">
              <li>
                <span className="font-semibold text-city-ink">1. Карточка активности</span>
                <br />
                Мы публикуем или находим вашу карточку в каталоге Влюди.
              </li>
              <li>
                <span className="font-semibold text-city-ink">2. Доступ в кабинет</span>
                <br />
                После проверки вы можете обновлять описание, контакты, даты и фото.
              </li>
              <li>
                <span className="font-semibold text-city-ink">3. Заявки и события</span>
                <br />
                Люди оставляют контакты, а ближайшие даты помогают карточке быть актуальной.
              </li>
            </ol>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <article key={feature.title} className="rounded-[24px] border border-city-line bg-white p-5 shadow-sm">
              <h2 className="text-xl font-bold text-city-ink">{feature.title}</h2>
              <p className="mt-3 text-sm leading-6 text-city-muted">{feature.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6">
        <div className="max-w-3xl">
          <h2 className="text-3xl font-bold text-city-ink">Тарифы для запуска</h2>
          <p className="mt-3 leading-7 text-city-muted">
            Базовое размещение остается бесплатным. Платные тарифы нужны для заявок,
            событий, статистики и приоритетного показа. Подключение сейчас можно оформить
            вручную через администратора.
          </p>
        </div>
        <div className="mt-6 grid gap-5 lg:grid-cols-3">
          {plans.map((plan) => (
            <article key={plan.name} className="rounded-[24px] border border-city-line bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-wide text-city-green">{plan.name}</p>
              <h3 className="mt-3 text-3xl font-bold text-city-ink">{plan.price}</h3>
              <p className="mt-3 text-sm leading-6 text-city-muted">{plan.text}</p>
              <ul className="mt-5 grid gap-2 text-sm text-city-ink">
                {plan.items.map((item) => (
                  <li key={item} className="rounded-2xl bg-city-soft px-4 py-3">
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-5 rounded-[28px] bg-city-ink p-6 text-white shadow-soft sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-bold">Хотите проверить, как это сработает для вашей активности?</h2>
            <p className="mt-2 max-w-2xl text-white/75">
              Получите доступ к карточке или добавьте активность. После проверки можно подключить заявки и ближайшие события.
            </p>
          </div>
          <Link
            href="/organizer/claim"
            className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-city-ink transition hover:bg-city-soft"
          >
            Получить доступ
          </Link>
        </div>
      </section>
    </main>
  );
}
