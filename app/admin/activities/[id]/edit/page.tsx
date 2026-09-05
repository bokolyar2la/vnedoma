import type { Metadata } from "next";
import Link from "next/link";
import { ActivityStatus } from "@prisma/client";
import { notFound } from "next/navigation";
import {
  createAdminActivityEvent,
  deleteAdminActivityEvent,
  updateActivity
} from "@/app/admin/activities/actions";
import { ActivityImage } from "@/components/ActivityImage";
import { OrganizerEventDateTimeFields } from "@/components/OrganizerEventDateTimeFields";
import { activityTypeOptions, socialLevelOptions } from "@/lib/activity-social";
import { currentCategorySlugs } from "@/lib/categories";
import { prisma } from "@/lib/prisma";
import { DEFAULT_EVENT_DISCOUNT_TEXT, DEFAULT_PROMO_CODE, getEventPromoText } from "@/lib/promo";

export const metadata: Metadata = {
  title: "Редактировать активность"
};

export const dynamic = "force-dynamic";

type EditActivityPageProps = {
  params: Promise<{
    id: string;
  }>;
};

const mediaSlots = [1, 2, 3];

function formatAdminEventDate(date: Date) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "Europe/Moscow"
  }).format(date);
}

export default async function EditActivityPage({ params }: EditActivityPageProps) {
  const { id } = await params;
  const activityId = Number(id);

  if (!Number.isInteger(activityId) || activityId <= 0) {
    notFound();
  }

  const [activity, categories] = await Promise.all([
    prisma.activity.findUnique({
      where: { id: activityId },
      include: {
        category: true,
        organizer: true,
        city: true,
        media: {
          orderBy: { position: "asc" }
        },
        events: {
          orderBy: { startsAt: "asc" }
        }
      }
    }),
    prisma.category.findMany({ where: { slug: { in: [...currentCategorySlugs] } } })
  ]);

  if (!activity) {
    notFound();
  }

  categories.sort(
    (a, b) => currentCategorySlugs.indexOf(a.slug) - currentCategorySlugs.indexOf(b.slug)
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-city-green">
            Админка · {activity.city.name}
          </p>
          <h1 className="mt-3 text-3xl font-bold text-city-ink">
            Редактировать активность
          </h1>
          <p className="mt-2 text-sm text-city-muted">
            URL не меняется автоматически: текущий slug сохранится после правки.
          </p>
        </div>
        <Link href="/admin/activities" className="text-sm font-semibold text-city-green">
          К списку
        </Link>
      </div>

      <form
        action={updateActivity}
        encType="multipart/form-data"
        className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]"
      >
        <input type="hidden" name="id" value={activity.id} />
        <input type="hidden" name="slug" value={activity.slug} />

        <section className="space-y-5 rounded-3xl border border-city-line bg-white p-5 shadow-soft sm:p-6">
          <div>
            <label htmlFor="title" className="text-sm font-semibold text-city-ink">
              Название
            </label>
            <input
              id="title"
              name="title"
              required
              defaultValue={activity.title}
              className="mt-2 min-h-12 w-full rounded-2xl border border-city-line px-4 outline-none transition focus:border-city-green focus:ring-4 focus:ring-city-green/10"
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
              rows={8}
              defaultValue={activity.description}
              className="mt-2 w-full rounded-2xl border border-city-line px-4 py-3 outline-none transition focus:border-city-green focus:ring-4 focus:ring-city-green/10"
            />
          </div>

          <div>
            <label htmlFor="whyGoText" className="text-sm font-semibold text-city-ink">
              Почему стоит пойти
            </label>
            <textarea
              id="whyGoText"
              name="whyGoText"
              rows={4}
              defaultValue={activity.whyGoText ?? ""}
              className="mt-2 w-full rounded-2xl border border-city-line px-4 py-3 outline-none transition focus:border-city-green focus:ring-4 focus:ring-city-green/10"
              placeholder="Коротко: что человек получит, какая атмосфера, кому подойдет."
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
                defaultValue={activity.categoryId}
                className="mt-2 min-h-12 w-full rounded-2xl border border-city-line bg-white px-4 outline-none transition focus:border-city-green focus:ring-4 focus:ring-city-green/10"
              >
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
                defaultValue={activity.organizer.name}
                className="mt-2 min-h-12 w-full rounded-2xl border border-city-line px-4 outline-none transition focus:border-city-green focus:ring-4 focus:ring-city-green/10"
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
                defaultValue={activity.activityType ?? ""}
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
                defaultValue={activity.socialLevel ?? ""}
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
              defaultValue={activity.address}
              className="mt-2 min-h-12 w-full rounded-2xl border border-city-line px-4 outline-none transition focus:border-city-green focus:ring-4 focus:ring-city-green/10"
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
                defaultValue={activity.contactPhone ?? ""}
                className="mt-2 min-h-12 w-full rounded-2xl border border-city-line px-4 outline-none transition focus:border-city-green focus:ring-4 focus:ring-city-green/10"
              />
            </div>
            <div>
              <label htmlFor="contactUrl" className="text-sm font-semibold text-city-ink">
                Ссылка для связи / записи
              </label>
              <input
                id="contactUrl"
                name="contactUrl"
                defaultValue={activity.contactUrl ?? ""}
                className="mt-2 min-h-12 w-full rounded-2xl border border-city-line px-4 outline-none transition focus:border-city-green focus:ring-4 focus:ring-city-green/10"
                placeholder="VK, Telegram, сайт, Timepad или страница записи"
              />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="sourceUrl" className="text-sm font-semibold text-city-ink">
                Ссылка на источник
              </label>
              <input
                id="sourceUrl"
                name="sourceUrl"
                defaultValue={activity.sourceUrl ?? ""}
                className="mt-2 min-h-12 w-full rounded-2xl border border-city-line px-4 outline-none transition focus:border-city-green focus:ring-4 focus:ring-city-green/10"
              />
            </div>
            <div>
              <label htmlFor="imageUrl" className="text-sm font-semibold text-city-ink">
                Ссылка на обложку
              </label>
              <input
                id="imageUrl"
                name="imageUrl"
                type="url"
                defaultValue={activity.imageUrl ?? ""}
                className="mt-2 min-h-12 w-full rounded-2xl border border-city-line px-4 outline-none transition focus:border-city-green focus:ring-4 focus:ring-city-green/10"
              />
              <label htmlFor="imageFile" className="mt-4 block text-sm font-semibold text-city-ink">
                Загрузить новую обложку
              </label>
              <input
                id="imageFile"
                name="imageFile"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="mt-2 w-full rounded-2xl border border-city-line px-4 py-3 text-sm text-city-muted outline-none transition file:mr-4 file:rounded-full file:border-0 file:bg-city-green file:px-4 file:py-2 file:font-semibold file:text-white focus:border-city-green focus:ring-4 focus:ring-city-green/10"
              />
              <p className="mt-2 text-xs leading-5 text-city-muted">
                JPG, PNG или WEBP до 5 МБ. Если файл не выбран, сохранится ссылка выше.
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-city-line bg-city-soft p-4">
            <h2 className="text-lg font-bold text-city-ink">Галерея и видео</h2>
            <p className="mt-1 text-sm leading-6 text-city-muted">
              Можно добавить до 3 материалов: фото процесса, результат или ссылку на видео.
            </p>
            <div className="mt-4 grid gap-4">
              {mediaSlots.map((position) => {
                const media = activity.media[position - 1];

                return (
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
                        defaultValue={media?.type ?? "image"}
                        className="min-h-12 rounded-2xl border border-city-line bg-white px-4 outline-none transition focus:border-city-green focus:ring-4 focus:ring-city-green/10"
                      >
                        <option value="image">Фото</option>
                        <option value="video">Видео</option>
                      </select>
                      <input
                        name={`media${position}Url`}
                        defaultValue={media?.url ?? ""}
                        className="min-h-12 rounded-2xl border border-city-line px-4 outline-none transition focus:border-city-green focus:ring-4 focus:ring-city-green/10"
                        placeholder="Ссылка на фото или видео"
                      />
                    </div>
                    <label
                      htmlFor={`media${position}File`}
                      className="mt-3 flex min-h-12 cursor-pointer items-center justify-center rounded-2xl border border-dashed border-city-green/50 bg-city-green/5 px-4 text-sm font-semibold text-city-green transition hover:border-city-green hover:bg-white"
                    >
                      Загрузить новое фото
                    </label>
                    <input
                      id={`media${position}File`}
                      name={`media${position}File`}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="sr-only"
                    />
                    <p className="mt-2 text-xs leading-5 text-city-muted">
                      Если выбрать файл, он заменит ссылку в этом слоте. Видео пока добавляется ссылкой.
                    </p>
                    <input
                      name={`media${position}Caption`}
                      defaultValue={media?.caption ?? ""}
                      className="mt-3 min-h-12 w-full rounded-2xl border border-city-line px-4 outline-none transition focus:border-city-green focus:ring-4 focus:ring-city-green/10"
                      placeholder="Подпись к фото или видео"
                    />
                  </div>
                );
              })}
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
              defaultValue={activity.editorComment ?? ""}
              className="mt-2 w-full rounded-2xl border border-city-line px-4 py-3 outline-none transition focus:border-city-green focus:ring-4 focus:ring-city-green/10"
            />
          </div>

          <div className="rounded-3xl bg-city-soft p-4">
            <label className="flex items-start gap-3 text-sm font-semibold text-city-ink">
              <input
                name="submittedByOrganizer"
                type="checkbox"
                defaultChecked={activity.submittedByOrganizer}
                className="mt-1 h-4 w-4 accent-city-green"
              />
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
                defaultValue={activity.submitterContact ?? ""}
                className="mt-2 min-h-12 w-full rounded-2xl border border-city-line bg-white px-4 outline-none transition focus:border-city-green focus:ring-4 focus:ring-city-green/10"
                placeholder="Telegram, VK, телефон или email"
              />
            </div>
          </div>
        </section>

        <aside className="h-fit space-y-5 rounded-3xl border border-city-line bg-white p-5 shadow-soft">
          <ActivityImage
            title={activity.title}
            categoryName={activity.category.name}
            imageUrl={activity.imageUrl}
            className="aspect-[16/10]"
          />

          <div>
            <label htmlFor="status" className="text-sm font-semibold text-city-ink">
              Статус
            </label>
            <select
              id="status"
              name="status"
              defaultValue={activity.status}
              className="mt-2 min-h-12 w-full rounded-2xl border border-city-line bg-white px-4 outline-none transition focus:border-city-green focus:ring-4 focus:ring-city-green/10"
            >
              <option value={ActivityStatus.draft}>draft</option>
              <option value={ActivityStatus.published}>published</option>
              <option value={ActivityStatus.archived}>archived</option>
            </select>
          </div>

          <div className="grid gap-4">
            <label className="flex items-center gap-2 text-sm text-city-muted">
              <input name="isFree" type="checkbox" defaultChecked={activity.isFree} className="h-4 w-4 accent-city-green" />
              Бесплатно
            </label>
            <label className="flex items-center gap-2 text-sm text-city-muted">
              <input name="isAdultsOnly" type="checkbox" defaultChecked={activity.isAdultsOnly} className="h-4 w-4 accent-city-green" />
              18+ / только для взрослых
            </label>
            <label className="flex items-center gap-2 text-sm text-city-muted">
              <input name="beginnerFriendly" type="checkbox" defaultChecked={activity.beginnerFriendly} className="h-4 w-4 accent-city-green" />
              Подходит новичкам
            </label>
            <label className="flex items-center gap-2 text-sm text-city-muted">
              <input name="canComeAlone" type="checkbox" defaultChecked={activity.canComeAlone} className="h-4 w-4 accent-city-green" />
              Можно прийти одному
            </label>
            <label className="flex items-center gap-2 text-sm text-city-muted">
              <input name="isVerified" type="checkbox" defaultChecked={activity.isVerified} className="h-4 w-4 accent-city-green" />
              Проверено вручную
            </label>
            <label className="flex items-center gap-2 text-sm text-city-muted">
              <input name="needsCheck" type="checkbox" defaultChecked={activity.needsCheck} className="h-4 w-4 accent-city-green" />
              Требует проверки
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <div>
              <label htmlFor="priceNote" className="text-sm font-semibold text-city-ink">
                Текст стоимости
              </label>
              <input
                id="priceNote"
                name="priceNote"
                defaultValue={activity.priceNote ?? ""}
                className="mt-2 min-h-12 w-full rounded-2xl border border-city-line px-4 outline-none transition focus:border-city-green focus:ring-4 focus:ring-city-green/10"
                placeholder="Свободный взнос, донат, уточняется"
              />
              <p className="mt-2 text-xs leading-5 text-city-muted">
                Если заполнено, на сайте покажется этот текст вместо цифр.
              </p>
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
                defaultValue={activity.priceFrom ?? ""}
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
                defaultValue={activity.priceTo ?? ""}
                className="mt-2 min-h-12 w-full rounded-2xl border border-city-line px-4 outline-none transition focus:border-city-green focus:ring-4 focus:ring-city-green/10"
              />
            </div>
          </div>

          <button className="min-h-12 w-full rounded-full bg-city-green px-6 font-semibold text-white transition hover:bg-city-blue">
            Сохранить изменения
          </button>
        </aside>
      </form>

      <section className="mt-8 rounded-3xl border border-city-line bg-white p-5 shadow-soft sm:p-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-city-green">
              Анонсы · промокод ВЛЮДИ
            </p>
            <h2 className="mt-2 text-2xl font-bold text-city-ink">
              Ближайшие события
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-city-muted">
              Добавляйте конкретные даты, которые будете публиковать на сайте, во ВКонтакте
              или Instagram. Пользователь увидит скидку и инструкцию назвать промокод ВЛЮДИ
              при записи у организатора.
            </p>
          </div>
          <Link
            href={`/activity/${activity.slug}`}
            className="text-sm font-semibold text-city-green transition hover:text-city-blue"
          >
            Открыть карточку
          </Link>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(320px,0.7fr)]">
          <form action={createAdminActivityEvent} className="rounded-3xl bg-city-soft p-4 sm:p-5">
            <input type="hidden" name="activityId" value={activity.id} />
            <div className="grid gap-4">
              <label htmlFor="eventTitle" className="grid gap-2">
                <span className="text-sm font-semibold text-city-ink">Название события</span>
                <input
                  id="eventTitle"
                  name="eventTitle"
                  required
                  defaultValue={activity.title}
                  className="min-h-12 rounded-2xl border border-city-line bg-white px-4 outline-none transition focus:border-city-green focus:ring-4 focus:ring-city-green/10"
                />
              </label>

              <OrganizerEventDateTimeFields />

              <div className="grid gap-4 sm:grid-cols-2">
                <label htmlFor="eventPrice" className="grid gap-2">
                  <span className="text-sm font-semibold text-city-ink">Цена</span>
                  <input
                    id="eventPrice"
                    name="eventPrice"
                    type="number"
                    min="0"
                    placeholder="Например: 600"
                    className="min-h-12 rounded-2xl border border-city-line bg-white px-4 outline-none transition focus:border-city-green focus:ring-4 focus:ring-city-green/10"
                  />
                </label>
                <label htmlFor="seatsAvailable" className="grid gap-2">
                  <span className="text-sm font-semibold text-city-ink">Свободные места</span>
                  <input
                    id="seatsAvailable"
                    name="seatsAvailable"
                    type="number"
                    min="0"
                    placeholder="Если есть лимит"
                    className="min-h-12 rounded-2xl border border-city-line bg-white px-4 outline-none transition focus:border-city-green focus:ring-4 focus:ring-city-green/10"
                  />
                </label>
              </div>

              <label htmlFor="signupUrl" className="grid gap-2">
                <span className="text-sm font-semibold text-city-ink">Ссылка на запись у организатора</span>
                <input
                  id="signupUrl"
                  name="signupUrl"
                  defaultValue={activity.contactUrl ?? ""}
                  placeholder="VK, Telegram, Timepad, сайт или форма записи"
                  className="min-h-12 rounded-2xl border border-city-line bg-white px-4 outline-none transition focus:border-city-green focus:ring-4 focus:ring-city-green/10"
                />
              </label>

              <div className="rounded-2xl border border-city-green/20 bg-white p-4">
                <label className="flex items-start gap-3 text-sm font-semibold text-city-ink">
                  <input
                    name="isPromoEnabled"
                    type="checkbox"
                    value="on"
                    defaultChecked={false}
                    className="mt-1 h-4 w-4 accent-city-green"
                  />
                  <span>
                    Скидка согласована — показывать промокод
                    <span className="mt-1 block font-normal leading-6 text-city-muted">
                      Это основной смысл анонса: человек переходит к организатору и называет промокод.
                    </span>
                  </span>
                </label>
                <div className="mt-4 grid gap-4 sm:grid-cols-[180px_1fr]">
                  <label htmlFor="promoCode" className="grid gap-2">
                    <span className="text-sm font-semibold text-city-ink">Промокод</span>
                    <input
                      id="promoCode"
                      name="promoCode"
                      defaultValue={DEFAULT_PROMO_CODE}
                      className="min-h-12 rounded-2xl border border-city-line px-4 font-bold uppercase outline-none transition focus:border-city-green focus:ring-4 focus:ring-city-green/10"
                    />
                  </label>
                  <label htmlFor="discountText" className="grid gap-2">
                    <span className="text-sm font-semibold text-city-ink">Текст скидки</span>
                    <input
                      id="discountText"
                      name="discountText"
                      placeholder={DEFAULT_EVENT_DISCOUNT_TEXT}
                      className="min-h-12 rounded-2xl border border-city-line px-4 outline-none transition focus:border-city-green focus:ring-4 focus:ring-city-green/10"
                    />
                  </label>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-city-ink">
                  <input name="publishedToVk" type="checkbox" className="h-4 w-4 accent-city-green" />
                  Опубликовано VK
                </label>
                <label className="flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-city-ink">
                  <input name="publishedToInstagram" type="checkbox" className="h-4 w-4 accent-city-green" />
                  Опубликовано Instagram
                </label>
              </div>

              <label htmlFor="adminNote" className="grid gap-2">
                <span className="text-sm font-semibold text-city-ink">Внутренняя заметка</span>
                <textarea
                  id="adminNote"
                  name="adminNote"
                  rows={3}
                  placeholder="Например: договорились на 15% с билета, публикация в сторис 06.08"
                  className="rounded-2xl border border-city-line bg-white px-4 py-3 outline-none transition focus:border-city-green focus:ring-4 focus:ring-city-green/10"
                />
              </label>

              <button className="min-h-12 rounded-full bg-city-green px-6 font-semibold text-white transition hover:bg-city-blue sm:w-fit">
                Добавить событие
              </button>
            </div>
          </form>

          <div className="rounded-3xl border border-city-line bg-white p-4">
            <h3 className="text-lg font-bold text-city-ink">Сейчас на сайте</h3>
            <div className="mt-4 grid gap-3">
              {activity.events.length ? (
                activity.events.map((event) => {
                  const promo = getEventPromoText(event as any);

                  return (
                    <div key={event.id} className="rounded-2xl bg-city-soft p-4 text-sm">
                      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                        <div>
                          <p className="font-bold text-city-ink">{event.title}</p>
                          <p className="mt-1 text-city-muted">{formatAdminEventDate(event.startsAt)}</p>
                          {event.price ? (
                            <p className="mt-1 font-semibold text-city-ink">
                              от {event.price.toLocaleString("ru-RU")} ₽
                            </p>
                          ) : null}
                        </div>
                        <form action={deleteAdminActivityEvent}>
                          <input type="hidden" name="activityId" value={activity.id} />
                          <input type="hidden" name="eventId" value={event.id} />
                          <button className="rounded-full border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50">
                            Удалить
                          </button>
                        </form>
                      </div>
                      {promo ? (
                        <div className="mt-3 rounded-2xl bg-white p-3">
                          <p className="font-bold text-city-green">{promo.discountText}</p>
                          <p className="mt-1 text-city-muted">{promo.instruction}</p>
                        </div>
                      ) : null}
                      <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                        {(event as any).publishedToVk ? (
                          <span className="rounded-full bg-city-green/10 px-3 py-1 text-city-green">VK</span>
                        ) : null}
                        {(event as any).publishedToInstagram ? (
                          <span className="rounded-full bg-city-green/10 px-3 py-1 text-city-green">Instagram</span>
                        ) : null}
                        {event.signupUrl ? (
                          <a href={event.signupUrl} target="_blank" rel="noopener noreferrer" className="rounded-full bg-white px-3 py-1 text-city-green">
                            Запись
                          </a>
                        ) : null}
                      </div>
                      {(event as any).adminNote ? (
                        <p className="mt-3 text-xs leading-5 text-city-muted">
                          Заметка: {(event as any).adminNote}
                        </p>
                      ) : null}
                    </div>
                  );
                })
              ) : (
                <p className="text-sm leading-6 text-city-muted">
                  Событий пока нет. Добавьте ближайшую дату, и она появится на карточке,
                  главной и странице “Куда сходить в Туле”.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
