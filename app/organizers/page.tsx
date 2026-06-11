import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Для организаторов активностей в Туле — Влюди",
  description:
    "Личный кабинет организатора во Влюди: доступ к карточке, правки описания, контактов, фото и добавление ближайших событий в Туле.",
  alternates: {
    canonical: "/organizers"
  }
};

const features = [
  {
    title: "Управлять карточкой",
    text: "Отправляйте правки описания, адреса, цены, телефона, ссылки для записи и фото. Перед публикацией изменения проходят проверку."
  },
  {
    title: "Добавлять события",
    text: "Можно прислать ближайшую встречу, занятие или набор группы, чтобы карточка была живой и актуальной."
  },
  {
    title: "Получить бесплатное размещение",
    text: "Базовое размещение в каталоге остается бесплатным. Платные возможности продвижения появятся позже."
  }
];

export default function OrganizersPage() {
  return (
    <main className="bg-gradient-to-br from-white via-city-soft/30 to-white">
      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-sm font-semibold uppercase tracking-wide text-city-green">
          Влюди · организаторам
        </p>
        <div className="mt-5 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-city-ink sm:text-5xl">
              Личный кабинет для организаторов активностей в Туле
            </h1>
            <p className="mt-5 text-lg leading-8 text-city-muted">
              Если вы проводите встречи, клубы, танцы, игры, мастер-классы, прогулки или другие офлайн-форматы, во Влюди можно получить доступ к своей карточке и поддерживать информацию актуальной.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/organizer/login"
                className="rounded-full bg-city-green px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-city-blue"
              >
                Войти в кабинет
              </Link>
              <Link
                href="/tula"
                className="rounded-full border border-city-line bg-white px-5 py-3 text-sm font-semibold text-city-ink transition hover:border-city-green hover:text-city-green"
              >
                Найти свою карточку
              </Link>
            </div>
          </div>

          <div className="rounded-[28px] border border-city-line bg-white p-6 shadow-soft">
            <h2 className="text-2xl font-bold text-city-ink">Как получить доступ</h2>
            <ol className="mt-5 grid gap-4 text-sm leading-6 text-city-muted">
              <li>
                <span className="font-semibold text-city-ink">1. Найдите карточку</span>
                <br />
                Откройте активность в каталоге и нажмите блок для организатора.
              </li>
              <li>
                <span className="font-semibold text-city-ink">2. Подтвердите связь</span>
                <br />
                Укажите email, контакт и ссылку, по которой понятно, что вы связаны с активностью.
              </li>
              <li>
                <span className="font-semibold text-city-ink">3. Дождитесь проверки</span>
                <br />
                После подтверждения карточка появится в вашем личном кабинете.
              </li>
            </ol>
          </div>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {features.map((feature) => (
            <article key={feature.title} className="rounded-3xl border border-city-line bg-white p-5 shadow-soft">
              <h2 className="text-xl font-bold text-city-ink">{feature.title}</h2>
              <p className="mt-3 text-sm leading-6 text-city-muted">{feature.text}</p>
            </article>
          ))}
        </div>

        <section className="mt-12 rounded-[28px] border border-city-line bg-white p-6 shadow-soft">
          <h2 className="text-2xl font-bold text-city-ink">Если вашей активности еще нет</h2>
          <p className="mt-3 max-w-3xl leading-7 text-city-muted">
            Добавьте ее через форму. Мы проверим информацию и, если формат подходит каталогу, опубликуем карточку. После этого можно будет запросить доступ в личный кабинет.
          </p>
          <Link
            href="/add"
            className="mt-5 inline-flex rounded-full bg-city-green px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-city-blue"
          >
            Добавить активность
          </Link>
        </section>
      </section>
    </main>
  );
}
