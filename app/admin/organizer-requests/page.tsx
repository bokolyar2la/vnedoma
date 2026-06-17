import type { Metadata } from "next";
import { OrganizerRequestStatus } from "@prisma/client";
import Link from "next/link";
import {
  approveClaimRequest,
  approveEditRequest,
  approveEventRequest,
  rejectClaimRequest,
  rejectEditRequest,
  rejectEventRequest
} from "@/app/organizer/actions";
import { formatDateTime, formatPrice } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Заявки организаторов"
};

export const dynamic = "force-dynamic";

const statusLabels: Record<string, string> = {
  pending: "на проверке",
  approved: "доступ выдан",
  rejected: "отклонено",
  done: "готово"
};

function statusText(status: string) {
  return statusLabels[status] ?? status;
}

function value(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (typeof value === "boolean") {
    return value ? "да" : "нет";
  }

  if (value instanceof Date) {
    return formatDateTime(value);
  }

  return String(value);
}

function AdminComment({ defaultValue }: { defaultValue?: string | null }) {
  return (
    <label className="mt-4 grid gap-2 text-sm">
      <span className="font-semibold text-city-ink">Комментарий администратора</span>
      <textarea
        name="adminComment"
        defaultValue={defaultValue ?? ""}
        rows={2}
        className="rounded-2xl border border-city-line px-3 py-2 outline-none transition focus:border-city-green"
      />
    </label>
  );
}

function RequestActions({
  id,
  approveAction,
  rejectAction
}: {
  id: number;
  approveAction: (formData: FormData) => Promise<void>;
  rejectAction: (formData: FormData) => Promise<void>;
}) {
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <button
        formAction={approveAction}
        className="rounded-full bg-city-green px-4 py-2 text-sm font-semibold text-white transition hover:bg-city-blue"
      >
        Принять
      </button>
      <button
        formAction={rejectAction}
        className="rounded-full border border-city-line bg-white px-4 py-2 text-sm font-semibold text-city-ink transition hover:border-red-300 hover:text-red-700"
      >
        Отклонить
      </button>
      <input type="hidden" name="id" value={id} />
    </div>
  );
}

const statusOrder: Record<string, number> = {
  pending: 0,
  approved: 1,
  done: 1,
  rejected: 2
};

function sortByStatusAndDate<T extends { status: string; createdAt: Date }>(items: T[]) {
  return [...items].sort((a, b) => {
    const statusDiff = (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9);

    if (statusDiff !== 0) {
      return statusDiff;
    }

    return b.createdAt.getTime() - a.createdAt.getTime();
  });
}

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getSearchParam(
  params: Record<string, string | string[] | undefined>,
  key: string
) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

export default async function OrganizerRequestsPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};
  const showAll = getSearchParam(params, "show") === "all";
  const requestWhere = showAll
    ? undefined
    : { status: OrganizerRequestStatus.pending };

  const [claimRequests, editRequests, eventRequests] = await Promise.all([
    prisma.organizerClaimRequest.findMany({
      where: requestWhere,
      include: {
        account: true,
        organizer: true,
        activity: true
      },
      orderBy: { createdAt: "desc" },
      take: 50
    }),
    prisma.organizerEditRequest.findMany({
      where: requestWhere,
      include: {
        account: true,
        activity: true
      },
      orderBy: { createdAt: "desc" },
      take: 50
    }),
    prisma.organizerEventRequest.findMany({
      where: requestWhere,
      include: {
        account: true,
        activity: true
      },
      orderBy: { createdAt: "desc" },
      take: 50
    })
  ]);
  const claims = sortByStatusAndDate(claimRequests);
  const edits = sortByStatusAndDate(editRequests);
  const events = sortByStatusAndDate(eventRequests);

  const pendingCount =
    claims.filter((item) => item.status === "pending").length +
    edits.filter((item) => item.status === "pending").length +
    events.filter((item) => item.status === "pending").length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-city-green">
            Админка
          </p>
          <h1 className="mt-3 text-3xl font-bold text-city-ink">Заявки организаторов</h1>
          <p className="mt-3 text-city-muted">
            На проверке: <span className="font-semibold text-city-ink">{pendingCount}</span>
          </p>
          <p className="mt-2 text-sm text-city-muted">
            {showAll ? "Показана вся история заявок." : "Показаны только новые заявки."}{" "}
            <Link
              href={showAll ? "/admin/organizer-requests" : "/admin/organizer-requests?show=all"}
              className="font-semibold text-city-green hover:text-city-blue"
            >
              {showAll ? "Вернуться к новым" : "Показать историю"}
            </Link>
          </p>
        </div>
        <Link
          href="/admin"
          className="rounded-full border border-city-line bg-white px-4 py-2 text-sm font-semibold text-city-ink transition hover:border-city-green"
        >
          Назад в админку
        </Link>
      </div>

      <section className="mt-8">
        <h2 className="text-2xl font-bold text-city-ink">Доступ к карточкам</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {claims.length ? (
            claims.map((claim) => (
              <form key={claim.id} className="rounded-3xl border border-city-line bg-white p-5 shadow-soft">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-lg font-bold text-city-ink">
                    {claim.activity?.title ?? claim.organizer.name}
                  </h3>
                  <span className="rounded-full bg-city-soft px-3 py-1 text-sm font-semibold text-city-green">
                    {statusText(claim.status)}
                  </span>
                </div>
                <div className="mt-4 space-y-2 text-sm text-city-muted">
                  <p>Аккаунт: {claim.account.name} · {claim.account.email}</p>
                  <p>Контакт: {claim.account.contact ?? "—"}</p>
                  <p>Организатор: {claim.organizer.name}</p>
                  <p>Создано: {formatDateTime(claim.createdAt)}</p>
                  {claim.proofUrl ? (
                    <p>
                      Подтверждение:{" "}
                      <a href={claim.proofUrl} target="_blank" rel="noopener noreferrer" className="text-city-green">
                        открыть
                      </a>
                    </p>
                  ) : null}
                  {claim.message ? <p>Сообщение: {claim.message}</p> : null}
                </div>
                <AdminComment defaultValue={claim.adminComment} />
                {claim.status === "pending" ? (
                  <RequestActions
                    id={claim.id}
                    approveAction={approveClaimRequest}
                    rejectAction={rejectClaimRequest}
                  />
                ) : null}
              </form>
            ))
          ) : (
            <p className="text-city-muted">Заявок пока нет.</p>
          )}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-bold text-city-ink">Правки карточек</h2>
        <div className="mt-4 grid gap-4">
          {edits.length ? (
            edits.map((edit) => (
              <form key={edit.id} className="rounded-3xl border border-city-line bg-white p-5 shadow-soft">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-city-ink">{edit.activity.title}</h3>
                    <p className="mt-1 text-sm text-city-muted">
                      {edit.account.name} · {edit.account.email} · {formatDateTime(edit.createdAt)}
                    </p>
                  </div>
                  <span className="rounded-full bg-city-soft px-3 py-1 text-sm font-semibold text-city-green">
                    {statusText(edit.status)}
                  </span>
                </div>
                <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                  <p><b>Название:</b> {value(edit.title)}</p>
                  <p><b>Адрес:</b> {value(edit.address)}</p>
                  <p><b>Цена:</b> {edit.isFree ? "бесплатно" : `${value(edit.priceFrom)} - ${value(edit.priceTo)}`}</p>
                  <p><b>18+:</b> {value(edit.isAdultsOnly)}</p>
                  <p><b>Новичкам:</b> {value(edit.beginnerFriendly)}</p>
                  <p><b>Можно одному:</b> {value(edit.canComeAlone)}</p>
                  <p><b>Телефон:</b> {value(edit.contactPhone)}</p>
                  <p><b>Ссылка:</b> {value(edit.contactUrl)}</p>
                  <p><b>Фото:</b> {value(edit.imageUrl)}</p>
                  <p><b>Текущая цена:</b> {formatPrice(edit.activity)}</p>
                </div>
                {edit.description ? (
                  <div className="mt-4 rounded-2xl bg-city-soft p-4 text-sm leading-6 text-city-muted">
                    {edit.description}
                  </div>
                ) : null}
                {edit.note ? <p className="mt-4 text-sm text-city-muted">Комментарий: {edit.note}</p> : null}
                <AdminComment defaultValue={edit.adminComment} />
                {edit.status === "pending" ? (
                  <RequestActions
                    id={edit.id}
                    approveAction={approveEditRequest}
                    rejectAction={rejectEditRequest}
                  />
                ) : null}
              </form>
            ))
          ) : (
            <p className="text-city-muted">Правок пока нет.</p>
          )}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-bold text-city-ink">Ближайшие события</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {events.length ? (
            events.map((event) => (
              <form key={event.id} className="rounded-3xl border border-city-line bg-white p-5 shadow-soft">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-lg font-bold text-city-ink">{event.title}</h3>
                  <span className="rounded-full bg-city-soft px-3 py-1 text-sm font-semibold text-city-green">
                    {statusText(event.status)}
                  </span>
                </div>
                <div className="mt-4 space-y-2 text-sm text-city-muted">
                  <p>Карточка: {event.activity.title}</p>
                  <p>Аккаунт: {event.account.name} · {event.account.email}</p>
                  <p>Начало: {formatDateTime(event.startsAt)}</p>
                  <p>Окончание: {value(event.endsAt)}</p>
                  <p>Цена: {value(event.price)}</p>
                  <p>Места: {value(event.seatsAvailable)}</p>
                  {event.signupUrl ? (
                    <p>
                      Запись:{" "}
                      <a href={event.signupUrl} target="_blank" rel="noopener noreferrer" className="text-city-green">
                        открыть
                      </a>
                    </p>
                  ) : null}
                  {event.note ? <p>Комментарий: {event.note}</p> : null}
                </div>
                <AdminComment defaultValue={event.adminComment} />
                {event.status === "pending" ? (
                  <RequestActions
                    id={event.id}
                    approveAction={approveEventRequest}
                    rejectAction={rejectEventRequest}
                  />
                ) : null}
              </form>
            ))
          ) : (
            <p className="text-city-muted">Событий пока нет.</p>
          )}
        </div>
      </section>
    </div>
  );
}
