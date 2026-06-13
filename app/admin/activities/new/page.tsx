import type { Metadata } from "next";
import Link from "next/link";
import { ActivityStatus } from "@prisma/client";
import { createAdminActivity } from "@/app/admin/activities/actions";
import { activityTypeOptions, socialLevelOptions } from "@/lib/activity-social";
import { currentCategorySlugs } from "@/lib/categories";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Добавить активность"
};

export const dynamic = "force-dynamic";

export default async function NewActivityPage() {
  const categories = await prisma.category.findMany({
    where: { slug: { in: [...currentCategorySlugs] } }
  });
  categories.sort(
    (a, b) => currentCategorySlugs.indexOf(a.slug) - currentCategorySlugs.indexOf(b.slug)
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-city-green">
            Админка · ручное наполнение
          </p>
          <h1 className="mt-3 text-3xl font-bold text-city-ink">
            Добавить активность
          </h1>
        </div>
        <Link href="/admin/activities" className="text-sm font-semibold text-city-green">
          К списку
        </Link>
      </div>

      <form action={createAdminActivity} className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="space-y-5 rounded-3xl border border-city-line bg-white p-5 shadow-soft sm:p-6">
          <div>
            <label htmlFor="title" className="text-sm font-semibold text-city-ink">
              Название
            </label>
            <input
              id="title"
              name="title"
              required
              className="mt-2 min-h-12 w-full rounded-2xl border border-city-line px-4 outline-none transition focus:border-city-green focus:ring-4 focus:ring-city-green/10"
              placeholder="Вечер настольных игр"
            />
          </div>

          <div>
            <label htmlFor="description" className="text-sm font-semibold text-city-ink">
              Описание
            </label>
            <textarea
              id="description"
              name="description"
              required
              rows={7}
              className="mt-2 w-full rounded-2xl border border-city-line px-4 py-3 outline-none transition focus:border-city-green focus:ring-4 focus:ring-city-green/10"
              placeholder="Что это за активность, как проходит встреча, можно ли прийти одному, кому подойдет."
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
                placeholder="Название организатора или площадки"
              />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="activityType" className="text-sm font-semibold text-city-ink">
                Тип активности
              </label>
              <select
                id="activityType"
                name="activityType"
                className="mt-2 min-h-12 w-full rounded-2xl border border-city-line bg-white px-4 outline-none transition focus:border-city-green focus:ring-4 focus:ring-city-green/10"
              >
                <option value="">Не указан</option>
                {activityTypeOptions.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="socialLevel" className="text-sm font-semibold text-city-ink">
                Социальность
              </label>
              <select
                id="socialLevel"
                name="socialLevel"
                className="mt-2 min-h-12 w-full rounded-2xl border border-city-line bg-white px-4 outline-none transition focus:border-city-green focus:ring-4 focus:ring-city-green/10"
              >
                <option value="">Не указана</option>
                {socialLevelOptions.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>
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
                className="mt-2 min-h-12 w-full rounded-2xl border border-city-line px-4 outline-none transition focus:border-city-green focus:ring-4 focus:ring-city-green/10"
                placeholder="VK, Telegram, сайт, Timepad или страница записи"
              />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="sourceUrl" className="text-sm font-semibold text-city-ink">
                Source URL
              </label>
              <input
                id="sourceUrl"
                name="sourceUrl"
                className="mt-2 min-h-12 w-full rounded-2xl border border-city-line px-4 outline-none transition focus:border-city-green focus:ring-4 focus:ring-city-green/10"
                placeholder="Откуда взяли информацию"
              />
            </div>
            <div>
              <label htmlFor="imageUrl" className="text-sm font-semibold text-city-ink">
                Image URL
              </label>
              <input
                id="imageUrl"
                name="imageUrl"
                type="url"
                className="mt-2 min-h-12 w-full rounded-2xl border border-city-line px-4 outline-none transition focus:border-city-green focus:ring-4 focus:ring-city-green/10"
                placeholder="https://..."
              />
            </div>
          </div>

          <div>
            <label htmlFor="editorComment" className="text-sm font-semibold text-city-ink">
              Комментарий для проверки
            </label>
            <textarea
              id="editorComment"
              name="editorComment"
              rows={4}
              className="mt-2 w-full rounded-2xl border border-city-line px-4 py-3 outline-none transition focus:border-city-green focus:ring-4 focus:ring-city-green/10"
              placeholder="Что нужно проверить: дата, цена, источник, условия участия."
            />
          </div>

          <div className="rounded-3xl bg-city-soft p-4">
            <label className="flex items-start gap-3 text-sm font-semibold text-city-ink">
              <input name="submittedByOrganizer" type="checkbox" className="mt-1 h-4 w-4 accent-city-green" />
              <span>
                Заявка от организатора
                <span className="mt-1 block font-normal leading-6 text-city-muted">
                  Внутреннее поле: публично не показывается.
                </span>
              </span>
            </label>
            <div className="mt-4">
              <label htmlFor="submitterContact" className="text-sm font-semibold text-city-ink">
                Контакт отправителя
              </label>
              <input
                id="submitterContact"
                name="submitterContact"
                className="mt-2 min-h-12 w-full rounded-2xl border border-city-line bg-white px-4 outline-none transition focus:border-city-green focus:ring-4 focus:ring-city-green/10"
                placeholder="Telegram, VK, телефон или email"
              />
            </div>
          </div>
        </section>

        <aside className="h-fit space-y-5 rounded-3xl border border-city-line bg-white p-5 shadow-soft">
          <div>
            <label htmlFor="status" className="text-sm font-semibold text-city-ink">
              Статус
            </label>
            <select
              id="status"
              name="status"
              defaultValue={ActivityStatus.published}
              className="mt-2 min-h-12 w-full rounded-2xl border border-city-line bg-white px-4 outline-none transition focus:border-city-green focus:ring-4 focus:ring-city-green/10"
            >
              <option value={ActivityStatus.published}>published</option>
              <option value={ActivityStatus.draft}>draft</option>
              <option value={ActivityStatus.archived}>archived</option>
            </select>
          </div>

          <div className="grid gap-4">
            <label className="flex items-center gap-2 text-sm text-city-muted">
              <input name="isFree" type="checkbox" className="h-4 w-4 accent-city-green" />
              Бесплатно
            </label>
            <label className="flex items-center gap-2 text-sm text-city-muted">
              <input name="beginnerFriendly" type="checkbox" className="h-4 w-4 accent-city-green" />
              Подходит новичкам
            </label>
            <label className="flex items-center gap-2 text-sm text-city-muted">
              <input name="canComeAlone" type="checkbox" className="h-4 w-4 accent-city-green" />
              Можно прийти одному
            </label>
            <label className="flex items-center gap-2 text-sm text-city-muted">
              <input name="isVerified" type="checkbox" className="h-4 w-4 accent-city-green" />
              Проверено вручную
            </label>
            <label className="flex items-center gap-2 text-sm text-city-muted">
              <input name="needsCheck" type="checkbox" className="h-4 w-4 accent-city-green" />
              Требует проверки
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
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
              />
            </div>
          </div>

          <button className="min-h-12 w-full rounded-full bg-city-green px-6 font-semibold text-white transition hover:bg-city-blue">
            Сохранить активность
          </button>
        </aside>
      </form>
    </div>
  );
}
