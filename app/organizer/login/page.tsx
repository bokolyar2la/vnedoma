import type { Metadata } from "next";
import Link from "next/link";
import { loginOrganizer } from "@/app/organizer/actions";

export const metadata: Metadata = {
  title: "Вход организатора",
  robots: {
    index: false,
    follow: false
  }
};

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getError(params: Record<string, string | string[] | undefined>) {
  const value = params.error;
  return Array.isArray(value) ? value[0] : value;
}

export default async function OrganizerLoginPage({ searchParams }: LoginPageProps) {
  const params = searchParams ? await searchParams : {};
  const error = getError(params);

  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-city-green">
        Влюди · организаторам
      </p>
      <h1 className="mt-3 text-3xl font-bold text-city-ink">Вход в кабинет</h1>
      <p className="mt-4 text-city-muted">
        Войдите, чтобы отправлять правки по своим карточкам и добавлять ближайшие события.
      </p>

      {error ? (
        <div className="mt-6 rounded-2xl border border-city-coral/30 bg-city-coral/10 p-4 text-sm text-city-ink">
          {error}
        </div>
      ) : null}

      <form action={loginOrganizer} className="mt-8 space-y-5 rounded-3xl border border-city-line bg-white p-5 shadow-soft sm:p-6">
        <div>
          <label htmlFor="email" className="text-sm font-semibold text-city-ink">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="mt-2 min-h-12 w-full rounded-2xl border border-city-line px-4 outline-none transition focus:border-city-green focus:ring-4 focus:ring-city-green/10"
            placeholder="name@example.ru"
          />
        </div>

        <div>
          <label htmlFor="password" className="text-sm font-semibold text-city-ink">
            Пароль
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="mt-2 min-h-12 w-full rounded-2xl border border-city-line px-4 outline-none transition focus:border-city-green focus:ring-4 focus:ring-city-green/10"
          />
        </div>

        <button className="min-h-12 rounded-full bg-city-green px-6 font-semibold text-white transition hover:bg-city-blue">
          Войти
        </button>
      </form>

      <p className="mt-6 text-sm text-city-muted">
        Нет доступа? Откройте свою карточку активности и нажмите{" "}
        <span className="font-semibold text-city-ink">“Я организатор”</span>, чтобы отправить заявку.
      </p>
      <Link href="/tula" className="mt-3 inline-flex text-sm font-semibold text-city-green hover:text-city-blue">
        Перейти в каталог
      </Link>
    </div>
  );
}
