import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  createOrganizerEditRequest,
  createOrganizerEventRequest
} from "@/app/organizer/actions";
import { ActivityImage } from "@/components/ActivityImage";
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

function getParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return typeof value === "string" ? value : "";
}

function fieldId(name: string) {
  return `organizer-${name}`;
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
        orderBy: { startsAt: "asc" },
        take: 5
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

  const [editRequests, eventRequests] = await Promise.all([
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
    })
  ]);

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
      type: "Правка",
      status: request.status,
      createdAt: request.createdAt
    })),
    ...eventRequests.map((request) => ({
      id: `event-${request.id}`,
      type: "Событие",
      status: request.status,
      createdAt: request.createdAt
    }))
  ]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 6);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Link href="/organizer" className="text-sm font-semibold text-city-green hover:text-city-blue">
        Вернуться в кабинет
      </Link>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(320px,0.55fr)]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-city-green">
            {activity.category.name}
          </p>
          <h1 className="mt-3 text-3xl font-bold leading-tight text-city-ink sm:text-4xl">
            {activity.title}
          </h1>
          <p className="mt-3 text-city-muted">
            Организатор: <span className="font-semibold text-city-ink">{activity.organizer.name}</span>
          </p>
        </div>
        <ActivityImage
          title={activity.title}
          categoryName={activity.category.name}
          imageUrl={activity.imageUrl}
          className="aspect-[16/10] rounded-[24px]"
        />
      </div>

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

      <section className="mt-8 rounded-3xl border border-city-line bg-white p-5 shadow-soft sm:p-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div>
            <h2 className="text-2xl font-bold text-city-ink">Предложить правки</h2>
            <p className="mt-2 max-w-3xl leading-7 text-city-muted">
              Изменения появятся на сайте после проверки. Это защищает карточку от случайных ошибок.
            </p>
          </div>
          <span className="rounded-full bg-city-soft px-4 py-2 text-sm font-semibold text-city-green">
            Сейчас: {formatPrice(activity)}
          </span>
        </div>

        <form action={createOrganizerEditRequest} className="mt-6 grid gap-5">
          <input type="hidden" name="activityId" value={activity.id} />

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
              rows={6}
              className="rounded-2xl border border-city-line px-4 py-3 outline-none transition focus:border-city-green"
            />
          </label>

          <label className="grid gap-2" htmlFor={fieldId("address")}>
            <span className="text-sm font-semibold text-city-ink">Адрес</span>
            <input
              id={fieldId("address")}
              name="address"
              defaultValue={activity.address}
              className="min-h-12 rounded-2xl border border-city-line px-4 outline-none transition focus:border-city-green"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
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

          <div className="grid gap-3 sm:grid-cols-3">
            <label className="flex items-center gap-3 rounded-2xl bg-city-soft p-4 text-sm font-semibold text-city-ink">
              <input name="isFree" type="checkbox" defaultChecked={activity.isFree} className="h-4 w-4" />
              Бесплатно
            </label>
            <label className="flex items-center gap-3 rounded-2xl bg-city-soft p-4 text-sm font-semibold text-city-ink">
              <input
                name="beginnerFriendly"
                type="checkbox"
                defaultChecked={activity.beginnerFriendly}
                className="h-4 w-4"
              />
              Подходит новичкам
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
            <label className="grid gap-2" htmlFor={fieldId("contactPhone")}>
              <span className="text-sm font-semibold text-city-ink">Телефон</span>
              <input
                id={fieldId("contactPhone")}
                name="contactPhone"
                defaultValue={activity.contactPhone ?? ""}
                className="min-h-12 rounded-2xl border border-city-line px-4 outline-none transition focus:border-city-green"
              />
            </label>
            <label className="grid gap-2" htmlFor={fieldId("contactUrl")}>
              <span className="text-sm font-semibold text-city-ink">Ссылка для записи</span>
              <input
                id={fieldId("contactUrl")}
                name="contactUrl"
                defaultValue={activity.contactUrl ?? ""}
                placeholder="vk.com, t.me, сайт или ссылка на запись"
                className="min-h-12 rounded-2xl border border-city-line px-4 outline-none transition focus:border-city-green"
              />
            </label>
          </div>

          <label className="grid gap-2" htmlFor={fieldId("imageUrl")}>
            <span className="text-sm font-semibold text-city-ink">Ссылка на фото</span>
            <input
              id={fieldId("imageUrl")}
              name="imageUrl"
              defaultValue={activity.imageUrl ?? ""}
              placeholder="Можно оставить текущую или прислать новую ссылку"
              className="min-h-12 rounded-2xl border border-city-line px-4 outline-none transition focus:border-city-green"
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

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-city-line bg-white p-5 shadow-soft sm:p-6">
          <h2 className="text-2xl font-bold text-city-ink">Ближайшее событие</h2>
          <p className="mt-2 leading-7 text-city-muted">
            Можно добавить конкретную дату встречи, занятия или набора.
          </p>

          <form action={createOrganizerEventRequest} className="mt-6 grid gap-4">
            <input type="hidden" name="activityId" value={activity.id} />
            <label className="grid gap-2" htmlFor={fieldId("eventTitle")}>
              <span className="text-sm font-semibold text-city-ink">Название события</span>
              <input
                id={fieldId("eventTitle")}
                name="eventTitle"
                placeholder="Например, открытая встреча"
                className="min-h-12 rounded-2xl border border-city-line px-4 outline-none transition focus:border-city-green"
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2" htmlFor={fieldId("startsAt")}>
                <span className="text-sm font-semibold text-city-ink">Начало</span>
                <input
                  id={fieldId("startsAt")}
                  name="startsAt"
                  type="datetime-local"
                  className="min-h-12 rounded-2xl border border-city-line px-4 outline-none transition focus:border-city-green"
                />
              </label>
              <label className="grid gap-2" htmlFor={fieldId("endsAt")}>
                <span className="text-sm font-semibold text-city-ink">Окончание</span>
                <input
                  id={fieldId("endsAt")}
                  name="endsAt"
                  type="datetime-local"
                  className="min-h-12 rounded-2xl border border-city-line px-4 outline-none transition focus:border-city-green"
                />
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2" htmlFor={fieldId("eventPrice")}>
                <span className="text-sm font-semibold text-city-ink">Цена</span>
                <input
                  id={fieldId("eventPrice")}
                  name="eventPrice"
                  type="number"
                  min="0"
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
                  className="min-h-12 rounded-2xl border border-city-line px-4 outline-none transition focus:border-city-green"
                />
              </label>
            </div>
            <label className="grid gap-2" htmlFor={fieldId("signupUrl")}>
              <span className="text-sm font-semibold text-city-ink">Ссылка на запись</span>
              <input
                id={fieldId("signupUrl")}
                name="signupUrl"
                placeholder="VK, Telegram, Timepad или сайт"
                className="min-h-12 rounded-2xl border border-city-line px-4 outline-none transition focus:border-city-green"
              />
            </label>
            <label className="grid gap-2" htmlFor={fieldId("eventNote")}>
              <span className="text-sm font-semibold text-city-ink">Комментарий</span>
              <textarea
                id={fieldId("eventNote")}
                name="eventNote"
                rows={3}
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
            <h2 className="text-xl font-bold text-city-ink">Опубликованные события</h2>
            <div className="mt-4 space-y-3">
              {activity.events.length ? (
                activity.events.map((event) => (
                  <div key={event.id} className="rounded-2xl bg-city-soft p-4 text-sm">
                    <p className="font-semibold text-city-ink">{event.title}</p>
                    <p className="mt-1 text-city-muted">{formatDateTime(event.startsAt)}</p>
                    {event.signupUrl ? (
                      <a
                        href={event.signupUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex font-semibold text-city-green"
                      >
                        Ссылка на запись
                      </a>
                    ) : null}
                  </div>
                ))
              ) : (
                <p className="text-city-muted">Событий пока нет.</p>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-city-line bg-white p-5 shadow-soft sm:p-6">
            <h2 className="text-xl font-bold text-city-ink">Последние заявки</h2>
            <div className="mt-4 space-y-3 text-sm text-city-muted">
              {recentRequests.map((request) => (
                <div key={request.id} className="rounded-2xl bg-city-soft p-4">
                  <p className="font-semibold text-city-ink">{request.type}: {request.status}</p>
                  <p className="mt-1">{formatDateTime(request.createdAt)}</p>
                </div>
              ))}
              {!recentRequests.length ? <p>Заявок пока нет.</p> : null}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
