import type { Metadata } from "next";
import Link from "next/link";
import { createActivity } from "@/app/add/actions";
import { MetrikaGoalOnMount } from "@/components/MetrikaGoals";
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

const mediaSlots = [1, 2, 3];

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
  const formStartedAt = Date.now();
  const defaults = {
    title: getSingleParam(params, "title") ?? "",
    categoryId: getSingleParam(params, "categoryId") ?? "",
    organizerName: getSingleParam(params, "organizerName") ?? "",
    description: getSingleParam(params, "description") ?? "",
    address: getSingleParam(params, "address") ?? "",
    priceNote: getSingleParam(params, "priceNote") ?? "",
    contactPhone: getSingleParam(params, "contactPhone") ?? "",
    contactUrl: getSingleParam(params, "contactUrl") ?? ""
  };
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
          <MetrikaGoalOnMount goal="add_activity_submit" />
          Спасибо! Мы проверим активность и добавим её в каталог.
        </div>
      ) : null}

      {error ? (
        <div className="mt-8 rounded-3xl border border-city-coral/30 bg-city-coral/10 p-6 text-city-ink">
          {error}
        </div>
      ) : null}

      <form
        action={createActivity}
        encType="multipart/form-data"
        className="mt-8 space-y-5 rounded-3xl border border-city-line bg-white p-5 shadow-soft sm:p-6"
      >
        <input type="hidden" name="formStartedAt" value={formStartedAt} />
        <div className="hidden" aria-hidden="true">
          <label htmlFor="website">Сайт</label>
          <input
            id="website"
            name="website"
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        <div>
          <label htmlFor="title" className="text-sm font-semibold text-city-ink">
            Название
          </label>
          <input
            id="title"
            name="title"
            required
            defaultValue={defaults.title}
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
              defaultValue={defaults.categoryId}
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
              defaultValue={defaults.organizerName}
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
            defaultValue={defaults.description}
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
            defaultValue={defaults.address}
            className="mt-2 min-h-12 w-full rounded-2xl border border-city-line px-4 outline-none transition focus:border-city-green focus:ring-4 focus:ring-city-green/10"
            placeholder="Тула, улица и дом"
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="priceNote" className="text-sm font-semibold text-city-ink">
              Текст стоимости
            </label>
            <input
              id="priceNote"
              name="priceNote"
              defaultValue={defaults.priceNote}
              className="mt-2 min-h-12 w-full rounded-2xl border border-city-line px-4 outline-none transition focus:border-city-green focus:ring-4 focus:ring-city-green/10"
              placeholder="Свободный взнос, донат, уточняется"
            />
          </div>
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

        <div className="grid gap-3 text-sm text-city-muted sm:grid-cols-4">
          <label className="flex items-center gap-2">
            <input name="isFree" type="checkbox" className="h-4 w-4 accent-city-green" />
            Бесплатно
          </label>
          <label className="flex items-center gap-2">
            <input name="isAdultsOnly" type="checkbox" className="h-4 w-4 accent-city-green" />
            18+
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
              defaultValue={defaults.contactPhone}
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
              type="text"
              defaultValue={defaults.contactUrl}
              className="mt-2 min-h-12 w-full rounded-2xl border border-city-line px-4 outline-none transition focus:border-city-green focus:ring-4 focus:ring-city-green/10"
              placeholder="vk.com/..., t.me/..., @telegram или сайт"
            />
            <p className="mt-2 text-xs leading-5 text-city-muted">
              Можно вставить ссылку без https:// — мы приведем ее в порядок перед публикацией.
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-city-line bg-city-soft p-4 sm:p-5">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-city-green">
                Фото и видео
              </p>
              <h2 className="mt-2 text-xl font-bold text-city-ink">Материалы для карточки</h2>
              <p className="mt-2 text-sm leading-6 text-city-muted">
                Это необязательно, но хорошие фото помогают быстрее понять атмосферу активности.
              </p>
            </div>
            <span className="w-fit rounded-full bg-white px-3 py-1 text-xs font-semibold text-city-green">
              до 3 материалов
            </span>
          </div>

          <div className="mt-4 grid gap-4">
            {mediaSlots.map((position) => (
              <div key={position} className="rounded-2xl border border-city-line bg-white p-4">
                <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                  <p className="text-sm font-semibold text-city-ink">Материал {position}</p>
                  <span className="w-fit rounded-full bg-city-soft px-3 py-1 text-xs font-semibold text-city-green">
                    фото или видео
                  </span>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-[150px_1fr]">
                  <select
                    name={`media${position}Type`}
                    defaultValue="image"
                    className="min-h-12 rounded-2xl border border-city-line bg-white px-4 outline-none transition focus:border-city-green focus:ring-4 focus:ring-city-green/10"
                  >
                    <option value="image">Фото</option>
                    <option value="video">Видео</option>
                  </select>
                  <input
                    name={`media${position}Url`}
                    className="min-h-12 rounded-2xl border border-city-line px-4 outline-none transition focus:border-city-green focus:ring-4 focus:ring-city-green/10"
                    placeholder="Ссылка на фото или видео"
                  />
                </div>
                <label
                  htmlFor={`media${position}File`}
                  className="mt-3 flex min-h-12 cursor-pointer items-center justify-center rounded-2xl border border-dashed border-city-green/50 bg-city-green/5 px-4 text-sm font-semibold text-city-green transition hover:border-city-green hover:bg-white"
                >
                  Добавить изображение
                </label>
                <input
                  id={`media${position}File`}
                  name={`media${position}File`}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                />
                <p className="mt-2 text-xs leading-5 text-city-muted">
                  Фото можно загрузить файлом. Для видео вставьте ссылку на VK, YouTube, Rutube или сайт.
                </p>
                <input
                  name={`media${position}Caption`}
                  className="mt-3 min-h-12 w-full rounded-2xl border border-city-line px-4 outline-none transition focus:border-city-green focus:ring-4 focus:ring-city-green/10"
                  placeholder="Подпись, если нужна"
                />
              </div>
            ))}
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
