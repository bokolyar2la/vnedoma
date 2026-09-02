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
    title: "Анонсы с промокодом",
    text: "Публикуем ближайшее событие и показываем участнику промокод ВЛЮДИ, который нужно назвать при записи или оплате."
  },
  {
    title: "Сайт и соцсети",
    text: "Событие можно показывать на сайте, в афише, во ВКонтакте и Instagram, чтобы один анонс работал сразу в нескольких местах."
  },
  {
    title: "Заявки и клики",
    text: "В кабинете видно заявки через Влюди, просмотры карточки и клики по записи, чтобы понимать, что дает отклик."
  },
  {
    title: "Оплата у организатора",
    text: "Участник покупает билет или записывается у вас. Влюди помогает привести человека и закрепить источник через промокод."
  }
];

const plans = [
  {
    name: "Базовая карточка",
    price: "0 ₽",
    text: "Карточка активности в каталоге, если формат подходит Влюди.",
    items: ["Публикация карточки", "Контакт организатора", "Описание и фото"]
  },
  {
    name: "Партнерский анонс",
    price: "по договоренности",
    text: "Для ближайших событий, где участник получает скидку по промокоду ВЛЮДИ.",
    items: [
      "Событие в афише",
      "Промокод ВЛЮДИ",
      "Переход на вашу запись",
      "Отметки публикаций"
    ]
  },
  {
    name: "Продвижение события",
    price: "индивидуально",
    text: "Для мероприятий, которым нужна дополнительная упаковка и публикации в нескольких каналах.",
    items: [
      "Все из партнерского анонса",
      "Помощь с текстом",
      "Подборка на главной",
      "Контент для соцсетей"
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
              Приводите людей на события через промокод ВЛЮДИ
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-city-muted">
              Влюди помогает людям находить занятия, встречи, клубы и события, а организаторам
              дает карточку, анонсы ближайших дат, заявки и понятный промокод для отслеживания.
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
                Вы присылаете ближайшее событие, ссылку на запись и условие скидки.
              </li>
              <li>
                <span className="font-semibold text-city-ink">3. Заявки и события</span>
                <br />
                Пользователь видит промокод ВЛЮДИ и записывается или покупает билет у вас.
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
          <h2 className="text-3xl font-bold text-city-ink">Форматы сотрудничества</h2>
          <p className="mt-3 leading-7 text-city-muted">
            Сейчас Влюди тестирует партнерские анонсы: событие публикуется с промокодом,
            а запись и оплата остаются на стороне организатора. Условия можно согласовать
            вручную под конкретное мероприятие.
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
              Получите доступ к карточке или добавьте активность. После проверки можно добавить ближайшее событие с промокодом ВЛЮДИ.
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
