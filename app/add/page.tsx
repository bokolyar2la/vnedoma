import type { Metadata } from "next";
import Link from "next/link";
import { createActivity } from "@/app/add/actions";
import { SubmitterContactFields } from "@/components/SubmitterContactFields";
import { currentCategorySlugs } from "@/lib/categories";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Добавить активность",
  description:
    "Знаете классную активность в Туле? Добавьте её, мы проверим и опубликуем в каталоге Влюди.",
  robots: {
    index: false,
    follow: false
  }
};

type AddPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getSingleParam(
  params: Record<string, string | string[] | undefined>,
  key: string
) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

export default async function AddPage({ searchParams }: AddPageProps) {
  const params = searchParams ? await searchParams : {};
  const success = getSingleParam(params, "success") === "1";
  const error = getSingleParam(params, "error");
  const categories = await prisma.category.findMany({
    where: { slug: { in: [...currentCategorySlugs] } }
  });
  categories.sort(
    (a, b) => currentCategorySlugs.indexOf(a.slug) - currentCategorySlugs.indexOf(b.slug)
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-city-green">
        Влюди · Тула
      </p>
      <h1 className="mt-3 text-3xl font-bold text-city-ink sm:text-4xl">
        Добавить активность
      </h1>
      <p className="mt-4 text-lg leading-8 text-city-muted">
        Знаете классную активность в Туле? Добавьте её, мы проверим информацию и опубликуем карточку в каталоге.
      </p>

      {success ? (
        <div className="mt-8 rounded-3xl border border-city-green/30 bg-city-green/10 p-6 text-city-ink">
          Спасибо! Мы проверим активность и добавим её в каталог.
        </div>
      ) : null}

      {error ? (
        <div className="mt-8 rounded-3xl border border-city-coral/30 bg-city-coral/10 p-6 text-city-ink">
          {error}
        </div>
      ) : null}

      <form action={createActivity} className="mt-8 space-y-5 rounded-3xl border border-city-line bg-white p-5 shadow-soft sm:p-6">
        <div>
          <label htmlFor="title" className="text-sm font-semibold text-city-ink">
            Название
          </label>
          <input
            id="title"
            name="title"
            required
            className="mt-2 min-h-12 w-full rounded-2xl border border-city-line px-4 outline-none transition focus:border-city-green focus:ring-4 focus:ring-city-green/10"
            placeholder="Например, вечер настольных игр"
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="categoryId" className="text-sm font-semibold text-city-ink">
              Категория
            </label>
            <select
              id="categoryId"
              name="categoryId"
              required
              className="mt-2 min-h-12 w-full rounded-2xl border border-city-line bg-white px-4 outline-none transition focus:border-city-green focus:ring-4 focus:ring-city-green/10"
            >
              <option value="">Выберите категорию</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="organizerName" className="text-sm font-semibold text-city-ink">
              Организатор
            </label>
            <input
              id="organizerName"
              name="organizerName"
              className="mt-2 min-h-12 w-full rounded-2xl border border-city-line px-4 outline-none transition focus:border-city-green focus:ring-4 focus:ring-city-green/10"
              placeholder="Название или имя"
            />
          </div>
        </div>

        <div>
          <label htmlFor="description" className="text-sm font-semibold text-city-ink">
            Описание
          </label>
          <textarea
            id="description"
            name="description"
            required
            rows={5}
            className="mt-2 w-full rounded-2xl border border-city-line px-4 py-3 outline-none transition focus:border-city-green focus:ring-4 focus:ring-city-green/10"
            placeholder="Что это за активность, как проходит встреча, можно ли прийти одному"
          />
        </div>

        <div>
          <label htmlFor="address" className="text-sm font-semibold text-city-ink">
            Адрес
          </label>
          <input
            id="address"
            name="address"
            className="mt-2 min-h-12 w-full rounded-2xl border border-city-line px-4 outline-none transition focus:border-city-green focus:ring-4 focus:ring-city-green/10"
            placeholder="Тула, улица и дом"
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="priceFrom" className="text-sm font-semibold text-city-ink">
              Цена от
            </label>
            <input
              id="priceFrom"
              name="priceFrom"
              type="number"
              min="0"
              className="mt-2 min-h-12 w-full rounded-2xl border border-city-line px-4 outline-none transition focus:border-city-green focus:ring-4 focus:ring-city-green/10"
              placeholder="500"
            />
          </div>
          <div>
            <label htmlFor="priceTo" className="text-sm font-semibold text-city-ink">
              Цена до
            </label>
            <input
              id="priceTo"
              name="priceTo"
              type="number"
              min="0"
              className="mt-2 min-h-12 w-full rounded-2xl border border-city-line px-4 outline-none transition focus:border-city-green focus:ring-4 focus:ring-city-green/10"
              placeholder="1500"
            />
          </div>
        </div>

        <div className="grid gap-3 text-sm text-city-muted sm:grid-cols-3">
          <label className="flex items-center gap-2">
            <input name="isFree" type="checkbox" className="h-4 w-4 accent-city-green" />
            Бесплатно
          </label>
          <label className="flex items-center gap-2">
            <input name="beginnerFriendly" type="checkbox" className="h-4 w-4 accent-city-green" />
            Подходит новичкам
          </label>
          <label className="flex items-center gap-2">
            <input name="canComeAlone" type="checkbox" className="h-4 w-4 accent-city-green" />
            Можно прийти одному
          </label>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="contactPhone" className="text-sm font-semibold text-city-ink">
              Телефон
            </label>
            <input
              id="contactPhone"
              name="contactPhone"
              className="mt-2 min-h-12 w-full rounded-2xl border border-city-line px-4 outline-none transition focus:border-city-green focus:ring-4 focus:ring-city-green/10"
              placeholder="+7..."
            />
          </div>
          <div>
            <label htmlFor="contactUrl" className="text-sm font-semibold text-city-ink">
              Ссылка для связи / записи
            </label>
            <input
              id="contactUrl"
              name="contactUrl"
              type="url"
              className="mt-2 min-h-12 w-full rounded-2xl border border-city-line px-4 outline-none transition focus:border-city-green focus:ring-4 focus:ring-city-green/10"
              placeholder="VK, Telegram, сайт, Timepad или страница записи"
            />
          </div>
        </div>

        <SubmitterContactFields />

        <label className="flex items-start gap-3 rounded-2xl bg-city-soft p-4 text-sm leading-6 text-city-muted">
          <input
            name="rightsConfirmation"
            type="checkbox"
            required
            className="mt-1 h-4 w-4 shrink-0 accent-city-green"
          />
          <span>Я понимаю, что информация пройдет проверку перед публикацией.</span>
        </label>

        <label className="flex items-start gap-3 rounded-2xl bg-city-soft p-4 text-sm leading-6 text-city-muted">
          <input
            name="privacyConsent"
            type="checkbox"
            required
            className="mt-1 h-4 w-4 shrink-0 accent-city-green"
          />
          <span>
            Я согласен с{" "}
            <Link href="/privacy" className="font-semibold text-city-green hover:text-city-blue">
              политикой обработки персональных данных
            </Link>{" "}
            и{" "}
            <Link
              href="/personal-data-consent"
              className="font-semibold text-city-green hover:text-city-blue"
            >
              согласием на обработку персональных данных
            </Link>
            . Я понимаю, что информация об активности будет проверена перед публикацией.
          </span>
        </label>

        <button className="min-h-12 w-full rounded-full bg-city-green px-6 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-city-blue sm:w-auto">
          Отправить на проверку
        </button>
      </form>
    </div>
  );
}
