import type { Metadata } from "next";
import Link from "next/link";
import { ActivityStatType } from "@prisma/client";
import { redirect } from "next/navigation";
import {
  createOrganizerEditRequest,
  createOrganizerEventRequest
} from "@/app/organizer/actions";
import { ActivityImage } from "@/components/ActivityImage";
import { getUpcomingEventWhere } from "@/lib/events";
import { formatDateTime, formatPrice } from "@/lib/format";
import { getOrganizerAccount } from "@/lib/organizer-auth";
import { prisma } from "@/lib/prisma";

type OrganizerActivityPageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata: Metadata = {
  title: "Карточка активности",
  robots: {
    index: false,
    follow: false
  }
};

export const dynamic = "force-dynamic";

const statLabels: Record<ActivityStatType, string> = {
  view: "Просмотры",
  signup_click: "Клики записаться",
  nearest_event_click: "Клики на ближайшую дату"
};

function getParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return typeof value === "string" ? value : "";
}

function fieldId(name: string) {
  return `organizer-${name}`;
}

function formatDateTimeLocal(date: Date | null) {
  if (!date) {
    return "";
  }

  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function requestStatusText(status: string) {
  if (status === "pending") {
    return "на проверке";
  }
  if (status === "done" || status === "approved") {
    return "принято";
  }
  if (status === "rejected") {
    return "отклонено";
  }
  return status;
}

export default async function OrganizerActivityPage({
  params,
  searchParams
}: OrganizerActivityPageProps) {
  const account = await getOrganizerAccount();

  if (!account) {
    redirect("/organizer/login");
  }

  const { slug } = await params;
  const query = searchParams ? await searchParams : {};
  const activity = await prisma.activity.findUnique({
    where: { slug },
    include: {
      category: true,
      organizer: true,
      events: {
        where: getUpcomingEventWhere(new Date()),
        orderBy: { startsAt: "asc" },
        take: 8
      }
    }
  });

  if (!activity) {
    redirect("/organizer");
  }

  const access = await prisma.organizerAccess.findUnique({
    where: {
      accountId_organizerId: {
        accountId: account.id,
        organizerId: activity.organizerId
      }
    }
  });

  if (!access) {
    redirect("/organizer");
  }

  const statsSince = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [editRequests, eventRequests, statRows] = await Promise.all([
    prisma.organizerEditRequest.findMany({
      where: {
        accountId: account.id,
        activityId: activity.id
      },
      orderBy: { createdAt: "desc" },
      take: 5
    }),
    prisma.organizerEventRequest.findMany({
      where: {
        accountId: account.id,
        activityId: activity.id
      },
      orderBy: { createdAt: "desc" },
      take: 5
    }),
    prisma.activityStatEvent.groupBy({
      by: ["type"],
      where: {
        activityId: activity.id,
        createdAt: { gte: statsSince }
      },
      _count: { _all: true }
    })
  ]);

  const totals: Record<ActivityStatType, number> = {
    view: 0,
    signup_click: 0,
    nearest_event_click: 0
  };
  statRows.forEach((row) => {
    totals[row.type] = row._count._all;
  });

  const copyEventId = Number(getParam(query, "copyEventId"));
  const eventToCopy = Number.isInteger(copyEventId)
    ? activity.events.find((event) => event.id === copyEventId)
    : null;
  const success =
    getParam(query, "edit") === "sent"
      ? "Правки отправлены на проверку."
      : getParam(query, "event") === "sent"
        ? "Событие отправлено на проверку."
        : "";
  const error = getParam(query, "error");
  const recentRequests = [
    ...editRequests.map((request) => ({
      id: `edit-${request.id}`,
      type: "Правка карточки",
      status: request.status,
      createdAt: request.createdAt
    })),
    ...eventRequests.map((request) => ({
      id: `event-${request.id}`,
      type: "Дата / событие",
      status: request.status,
      createdAt: request.createdAt
    }))
  ]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 6);
  const cloneCardHref = `/add?${new URLSearchParams({
    title: activity.title,
    categoryId: String(activity.categoryId),
    organizerName: activity.organizer.name,
    description: activity.description,
    address: activity.address,
    priceNote: activity.priceNote ?? "",
    contactPhone: activity.contactPhone ?? "",
    contactUrl: activity.contactUrl ?? ""
  }).toString()}`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/organizer"
          className="inline-flex min-h-11 items-center rounded-full border border-city-line bg-white px-5 text-sm font-semibold text-city-ink transition hover:border-city-green hover:text-city-green"
        >
          Вернуться в кабинет
        </Link>
        <Link
          href={`/activity/${activity.slug}`}
          className="inline-flex min-h-11 items-center rounded-full bg-city-soft px-5 text-sm font-semibold text-city-green transition hover:text-city-blue"
        >
          Открыть на сайте
        </Link>
      </div>

      <section className="mt-6 grid gap-6 rounded-[28px] border border-city-line bg-white p-5 shadow-soft sm:p-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-city-green">
            {activity.category.name}
          </p>
          <h1 className="mt-3 text-3xl font-bold leading-tight text-city-ink sm:text-4xl">
            {activity.title}
          </h1>
          <p className="mt-3 text-city-muted">
            Организатор:{" "}
            <span className="font-semibold text-city-ink">{activity.organizer.name}</span>
          </p>
          <p className="mt-2 text-city-muted">
            Стоимость:{" "}
            <span className="font-semibold text-city-ink">
              {formatPrice({
                isFree: activity.isFree,
                priceFrom: activity.priceFrom,
                priceTo: activity.priceTo,
                priceNote: activity.priceNote
              })}
            </span>
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <a
              href="#event-form"
              className="rounded-3xl bg-city-green p-5 text-white shadow-soft transition hover:bg-city-blue"
            >
              <span className="block text-sm font-semibold opacity-90">Самое частое</span>
              <span className="mt-2 block text-xl font-bold">Добавить дату</span>
            </a>
            <a
              href="#edit-card"
              className="rounded-3xl border border-city-line bg-city-soft p-5 text-city-ink transition hover:border-city-green"
            >
              <span className="block text-sm font-semibold text-city-green">Если что-то устарело</span>
              <span className="mt-2 block text-xl font-bold">Изменить карточку</span>
            </a>
            <Link
              href={cloneCardHref}
              className="rounded-3xl border border-city-green/40 bg-white p-5 text-city-ink transition hover:border-city-green hover:bg-city-green/5"
            >
              <span className="block text-sm font-semibold text-city-green">Похожий формат</span>
              <span className="mt-2 block text-xl font-bold">Создать копию</span>
            </Link>
          </div>
        </div>
        <ActivityImage
          title={activity.title}
          categoryName={activity.category.name}
          imageUrl={activity.imageUrl}
          className="aspect-[16/10] rounded-[24px]"
        />
      </section>

      {success ? (
        <div className="mt-6 rounded-2xl border border-city-green/30 bg-city-green/10 p-4 text-sm font-semibold text-city-ink">
          {success}
        </div>
      ) : null}
      {error ? (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      ) : null}

      <section className="mt-6 grid gap-4 sm:grid-cols-3">
        {(Object.values(ActivityStatType) as ActivityStatType[]).map((type) => (
          <div key={type} className="rounded-3xl border border-city-line bg-white p-5 shadow-soft">
            <p className="text-sm text-city-muted">{statLabels[type]} за 30 дней</p>
            <p className="mt-2 text-3xl font-bold text-city-ink">{totals[type]}</p>
          </div>
        ))}
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(300px,0.55fr)]">
        <div id="event-form" className="scroll-mt-24 rounded-3xl border border-city-line bg-white p-5 shadow-soft sm:p-6">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-city-green">
                Быстрое действие
              </p>
              <h2 className="mt-2 text-2xl font-bold text-city-ink">Добавить дату / событие</h2>
              <p className="mt-2 leading-7 text-city-muted">
                Обычно достаточно указать дату и время. Остальные поля заполняйте только если
                цена, ссылка или количество мест отличаются от карточки.
              </p>
            </div>
            {eventToCopy ? (
              <span className="rounded-full bg-city-green/10 px-4 py-2 text-sm font-semibold text-city-green">
                Заполнено из события
              </span>
            ) : null}
          </div>

          <form action={createOrganizerEventRequest} className="mt-6 grid gap-4">
            <input type="hidden" name="activityId" value={activity.id} />
            <label className="grid gap-2" htmlFor={fieldId("eventTitle")}>
              <span className="text-sm font-semibold text-city-ink">Название события</span>
              <input
                id={fieldId("eventTitle")}
                name="eventTitle"
                defaultValue={eventToCopy?.title ?? activity.title}
                placeholder="Можно оставить название карточки"
                className="min-h-12 rounded-2xl border border-city-line px-4 outline-none transition focus:border-city-green"
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2" htmlFor={fieldId("startsAt")}>
                <span className="text-sm font-semibold text-city-ink">Дата и время начала</span>
                <input
                  id={fieldId("startsAt")}
                  name="startsAt"
                  type="datetime-local"
                  defaultValue={formatDateTimeLocal(eventToCopy?.startsAt ?? null)}
                  className="min-h-12 rounded-2xl border border-city-line px-4 outline-none transition focus:border-city-green"
                />
              </label>
              <label className="grid gap-2" htmlFor={fieldId("endsAt")}>
                <span className="text-sm font-semibold text-city-ink">Окончание</span>
                <input
                  id={fieldId("endsAt")}
                  name="endsAt"
                  type="datetime-local"
                  defaultValue={formatDateTimeLocal(eventToCopy?.endsAt ?? null)}
                  className="min-h-12 rounded-2xl border border-city-line px-4 outline-none transition focus:border-city-green"
                />
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2" htmlFor={fieldId("eventPrice")}>
                <span className="text-sm font-semibold text-city-ink">Цена события</span>
                <input
                  id={fieldId("eventPrice")}
                  name="eventPrice"
                  type="number"
                  min="0"
                  defaultValue={eventToCopy?.price ?? ""}
                  placeholder="Можно оставить пустым"
                  className="min-h-12 rounded-2xl border border-city-line px-4 outline-none transition focus:border-city-green"
                />
              </label>
              <label className="grid gap-2" htmlFor={fieldId("seatsAvailable")}>
                <span className="text-sm font-semibold text-city-ink">Свободные места</span>
                <input
                  id={fieldId("seatsAvailable")}
                  name="seatsAvailable"
                  type="number"
                  min="0"
                  defaultValue={eventToCopy?.seatsAvailable ?? ""}
                  placeholder="Если есть лимит"
                  className="min-h-12 rounded-2xl border border-city-line px-4 outline-none transition focus:border-city-green"
                />
              </label>
            </div>
            <label className="grid gap-2" htmlFor={fieldId("signupUrl")}>
              <span className="text-sm font-semibold text-city-ink">Ссылка на запись</span>
              <input
                id={fieldId("signupUrl")}
                name="signupUrl"
                defaultValue={eventToCopy?.signupUrl ?? activity.contactUrl ?? ""}
                placeholder="VK, Telegram, Timepad или сайт"
                className="min-h-12 rounded-2xl border border-city-line px-4 outline-none transition focus:border-city-green"
              />
            </label>
            <label className="grid gap-2" htmlFor={fieldId("eventNote")}>
              <span className="text-sm font-semibold text-city-ink">Комментарий для проверки</span>
              <textarea
                id={fieldId("eventNote")}
                name="eventNote"
                rows={2}
                placeholder="Например: это повтор той же встречи каждую пятницу"
                className="rounded-2xl border border-city-line px-4 py-3 outline-none transition focus:border-city-green"
              />
            </label>
            <button className="min-h-12 rounded-full bg-city-green px-6 font-semibold text-white transition hover:bg-city-blue sm:w-fit">
              Отправить событие
            </button>
          </form>
        </div>

        <div className="grid gap-6">
          <div className="rounded-3xl border border-city-line bg-white p-5 shadow-soft sm:p-6">
            <h2 className="text-xl font-bold text-city-ink">Опубликованные даты</h2>
            <div className="mt-4 space-y-3">
              {activity.events.length ? (
                activity.events.map((event) => (
                  <div key={event.id} className="rounded-2xl bg-city-soft p-4 text-sm">
                    <p className="font-semibold text-city-ink">{event.title}</p>
                    <p className="mt-1 text-city-muted">{formatDateTime(event.startsAt)}</p>
                    <div className="mt-3 flex flex-wrap gap-3">
                      <Link
                        href={`/organizer/activities/${activity.slug}?copyEventId=${event.id}#event-form`}
                        className="font-semibold text-city-green transition hover:text-city-blue"
                      >
                        Повторить
                      </Link>
                      {event.signupUrl ? (
                        <a
                          href={event.signupUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-city-green transition hover:text-city-blue"
                        >
                          Ссылка на запись
                        </a>
                      ) : null}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-city-muted">Дат пока нет. Добавьте ближайшую встречу слева.</p>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-city-line bg-white p-5 shadow-soft sm:p-6">
            <h2 className="text-xl font-bold text-city-ink">Последние заявки</h2>
            <div className="mt-4 space-y-3 text-sm text-city-muted">
              {recentRequests.map((request) => (
                <div key={request.id} className="rounded-2xl bg-city-soft p-4">
                  <p className="font-semibold text-city-ink">
                    {request.type}: {requestStatusText(request.status)}
                  </p>
                  <p className="mt-1">{formatDateTime(request.createdAt)}</p>
                </div>
              ))}
              {!recentRequests.length ? <p>Заявок пока нет.</p> : null}
            </div>
          </div>
        </div>
      </section>

      <section
        id="edit-card"
        className="mt-8 scroll-mt-24 rounded-3xl border border-city-line bg-white p-5 shadow-soft sm:p-6"
      >
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-city-green">
              Правки карточки
            </p>
            <h2 className="mt-2 text-2xl font-bold text-city-ink">Изменить карточку активности</h2>
            <p className="mt-2 max-w-3xl leading-7 text-city-muted">
              Эти изменения появятся на сайте после проверки. Обложку лучше загрузить файлом:
              старая картинка сохранится, если новый файл не выбран.
            </p>
          </div>
          <Link
            href={cloneCardHref}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-city-green/40 bg-city-green/5 px-5 text-sm font-semibold text-city-green transition hover:border-city-green"
          >
            Создать похожую карточку
          </Link>
        </div>

        <form
          action={createOrganizerEditRequest}
          encType="multipart/form-data"
          className="mt-6 grid gap-5"
        >
          <input type="hidden" name="activityId" value={activity.id} />
          <input type="hidden" name="imageUrl" value={activity.imageUrl ?? ""} />

          <label className="grid gap-2" htmlFor={fieldId("title")}>
            <span className="text-sm font-semibold text-city-ink">Название</span>
            <input
              id={fieldId("title")}
              name="title"
              defaultValue={activity.title}
              className="min-h-12 rounded-2xl border border-city-line px-4 outline-none transition focus:border-city-green"
            />
          </label>

          <label className="grid gap-2" htmlFor={fieldId("description")}>
            <span className="text-sm font-semibold text-city-ink">Описание</span>
            <textarea
              id={fieldId("description")}
              name="description"
              defaultValue={activity.description}
              rows={5}
              className="rounded-2xl border border-city-line px-4 py-3 outline-none transition focus:border-city-green"
            />
          </label>

          <label className="grid gap-2" htmlFor={fieldId("whyGoText")}>
            <span className="text-sm font-semibold text-city-ink">Почему стоит пойти</span>
            <textarea
              id={fieldId("whyGoText")}
              name="whyGoText"
              defaultValue={activity.whyGoText ?? ""}
              rows={3}
              placeholder="Что человек получит, какая атмосфера, кому особенно подойдет."
              className="rounded-2xl border border-city-line px-4 py-3 outline-none transition focus:border-city-green"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 sm:col-span-2" htmlFor={fieldId("priceNote")}>
              <span className="text-sm font-semibold text-city-ink">Как показать стоимость на сайте</span>
              <input
                id={fieldId("priceNote")}
                name="priceNote"
                defaultValue={activity.priceNote ?? ""}
                placeholder="Свободный взнос, средний чек 1 500 ₽, цена уточняется"
                className="min-h-12 rounded-2xl border border-city-line px-4 outline-none transition focus:border-city-green"
              />
              <span className="text-xs leading-5 text-city-muted">
                Если заполнить это поле, на сайте покажется этот текст вместо чисел.
              </span>
            </label>
            <label className="grid gap-2" htmlFor={fieldId("priceFrom")}>
              <span className="text-sm font-semibold text-city-ink">Цена от</span>
              <input
                id={fieldId("priceFrom")}
                name="priceFrom"
                type="number"
                min="0"
                defaultValue={activity.priceFrom ?? ""}
                className="min-h-12 rounded-2xl border border-city-line px-4 outline-none transition focus:border-city-green"
              />
            </label>
            <label className="grid gap-2" htmlFor={fieldId("priceTo")}>
              <span className="text-sm font-semibold text-city-ink">Цена до</span>
              <input
                id={fieldId("priceTo")}
                name="priceTo"
                type="number"
                min="0"
                defaultValue={activity.priceTo ?? ""}
                className="min-h-12 rounded-2xl border border-city-line px-4 outline-none transition focus:border-city-green"
              />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            <label className="flex items-center gap-3 rounded-2xl bg-city-soft p-4 text-sm font-semibold text-city-ink">
              <input name="isFree" type="checkbox" defaultChecked={activity.isFree} className="h-4 w-4" />
              Бесплатно
            </label>
            <label className="flex items-center gap-3 rounded-2xl bg-city-soft p-4 text-sm font-semibold text-city-ink">
              <input name="isAdultsOnly" type="checkbox" defaultChecked={activity.isAdultsOnly} className="h-4 w-4" />
              18+
            </label>
            <label className="flex items-center gap-3 rounded-2xl bg-city-soft p-4 text-sm font-semibold text-city-ink">
              <input
                name="beginnerFriendly"
                type="checkbox"
                defaultChecked={activity.beginnerFriendly}
                className="h-4 w-4"
              />
              Новичкам
            </label>
            <label className="flex items-center gap-3 rounded-2xl bg-city-soft p-4 text-sm font-semibold text-city-ink">
              <input
                name="canComeAlone"
                type="checkbox"
                defaultChecked={activity.canComeAlone}
                className="h-4 w-4"
              />
              Можно одному
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2" htmlFor={fieldId("address")}>
              <span className="text-sm font-semibold text-city-ink">Адрес</span>
              <input
                id={fieldId("address")}
                name="address"
                defaultValue={activity.address}
                className="min-h-12 rounded-2xl border border-city-line px-4 outline-none transition focus:border-city-green"
              />
            </label>
            <label className="grid gap-2" htmlFor={fieldId("contactPhone")}>
              <span className="text-sm font-semibold text-city-ink">Телефон</span>
              <input
                id={fieldId("contactPhone")}
                name="contactPhone"
                defaultValue={activity.contactPhone ?? ""}
                className="min-h-12 rounded-2xl border border-city-line px-4 outline-none transition focus:border-city-green"
              />
            </label>
            <label className="grid gap-2 sm:col-span-2" htmlFor={fieldId("contactUrl")}>
              <span className="text-sm font-semibold text-city-ink">Ссылка для связи / записи</span>
              <input
                id={fieldId("contactUrl")}
                name="contactUrl"
                defaultValue={activity.contactUrl ?? ""}
                placeholder="vk.com, t.me, сайт или ссылка на запись"
                className="min-h-12 rounded-2xl border border-city-line px-4 outline-none transition focus:border-city-green"
              />
            </label>
          </div>

          <label
            className="grid cursor-pointer gap-3 rounded-3xl border-2 border-dashed border-city-green/50 bg-city-green/5 p-5 transition hover:border-city-green hover:bg-city-green/10"
            htmlFor={fieldId("imageFile")}
          >
            <span className="text-base font-bold text-city-ink">Загрузить новую обложку</span>
            <span className="text-sm leading-6 text-city-muted">
              Старое фото сохранится, если файл не выбрать. JPG, PNG или WebP до 5 МБ.
            </span>
            <input
              id={fieldId("imageFile")}
              name="imageFile"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="rounded-2xl border border-city-line bg-white px-4 py-3 text-sm text-city-muted outline-none transition file:mr-4 file:rounded-full file:border-0 file:bg-city-green file:px-4 file:py-2 file:font-semibold file:text-white focus:border-city-green"
            />
          </label>

          <label className="grid gap-2" htmlFor={fieldId("note")}>
            <span className="text-sm font-semibold text-city-ink">Комментарий для Влюди</span>
            <textarea
              id={fieldId("note")}
              name="note"
              rows={3}
              placeholder="Что важно учесть при проверке"
              className="rounded-2xl border border-city-line px-4 py-3 outline-none transition focus:border-city-green"
            />
          </label>

          <button className="min-h-12 rounded-full bg-city-green px-6 font-semibold text-white transition hover:bg-city-blue sm:w-fit">
            Отправить правки
          </button>
        </form>
      </section>
    </div>
  );
}
