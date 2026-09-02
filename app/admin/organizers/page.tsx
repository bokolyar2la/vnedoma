import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  deleteEmptyOrganizer,
  deleteOrganizerWithActivities,
  deleteOrganizerAccount,
  disableOrganizerAccount,
  enableOrganizerAccount,
  revokeOrganizerAccess,
  updateOrganizerBilling
} from "@/app/admin/organizers/actions";
import { isEffectivelyPromoted, resolveOrganizerBilling } from "@/lib/billing";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Организаторы в админке"
};

export const dynamic = "force-dynamic";

function Dash() {
  return <span className="text-city-muted">—</span>;
}

function AdminButton({
  children,
  danger = false
}: {
  children: ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      className={[
        "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
        danger
          ? "border-red-200 bg-white text-red-700 hover:bg-red-50"
          : "border-city-line bg-white text-city-ink hover:border-city-green hover:text-city-green"
      ].join(" ")}
    >
      {children}
    </button>
  );
}

const billingPlanLabels: Record<string, string> = {
  free: "Бесплатно",
  active: "Активное размещение",
  pro: "Продвижение"
};

const billingStatusLabels: Record<string, string> = {
  free: "бесплатно",
  trial: "тест",
  active: "оплачен",
  expired: "истек"
};

type OrganizerBillingFields = {
  billingPlan: string;
  billingStatus: string;
  paidUntil: Date | null;
  trialUntil: Date | null;
  billingComment: string | null;
  platformBookingEnabled: boolean;
};

function formatDateInput(date: Date | null) {
  return date ? date.toISOString().slice(0, 10) : "";
}

function formatAdminDate(date: Date | null) {
  if (!date) {
    return "не указано";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(date);
}

function getAccountPromotion(
  account: {
  accesses: Array<{
    organizer: {
      activities: Array<{
        isPromoted: boolean;
        priority: number;
        promotedUntil: Date | null;
      }>;
    };
  }>;
  },
  now: Date
) {
  const activities = account.accesses.flatMap((access) => access.organizer.activities);
  const promoted = activities.filter((activity) => isEffectivelyPromoted(activity, now));

  return {
    enabled: promoted.length > 0,
    priority: promoted[0]?.priority ?? 30,
    promotedUntil: promoted[0]?.promotedUntil ?? null
  };
}

export default async function AdminOrganizersPage() {
  const now = new Date();
  const [organizers, accounts] = await Promise.all([
    prisma.organizer.findMany({
      include: {
        city: true,
        _count: {
          select: {
            activities: true,
            accounts: true,
            claims: true
          }
        }
      },
      orderBy: { name: "asc" }
    }),
    prisma.organizerAccount.findMany({
      include: {
        accesses: {
          include: {
            organizer: {
              include: {
                city: true,
                _count: {
                  select: {
                    activities: true
                  }
                },
                activities: {
                  select: {
                    isPromoted: true,
                    priority: true,
                    promotedUntil: true
                  }
                }
              }
            }
          },
          orderBy: { createdAt: "desc" }
        },
        _count: {
          select: {
            claims: true,
            editRequests: true,
            eventRequests: true
          }
        }
      },
      orderBy: [{ isDisabled: "asc" }, { createdAt: "desc" }]
    })
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-city-green">
            Админка
          </p>
          <h1 className="mt-3 text-3xl font-bold text-city-ink">Организаторы</h1>
          <p className="mt-3 max-w-3xl text-city-muted">
            Здесь отдельно видны организации из каталога и аккаунты личного кабинета. Тестовые аккаунты можно удалить, а реальные временно отключить.
          </p>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-city-muted">
            Важно: аккаунт ЛК и карточка активности — разные вещи. Если у организатора
            указано “активностей: 0”, карточки в каталоге еще нет, ее нужно создать отдельно.
          </p>
        </div>
        <Link href="/admin" className="text-sm font-semibold text-city-green">
          К сводке
        </Link>
      </div>

      <section className="mt-8">
        <h2 className="text-2xl font-bold text-city-ink">Аккаунты ЛК</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {accounts.length ? (
            accounts.map((account) => {
              const promotion = getAccountPromotion(account, now);
              const billingAccount = account as typeof account & OrganizerBillingFields;
              const resolvedBilling = resolveOrganizerBilling(billingAccount, now);

              return (
              <article
                key={account.id}
                className="rounded-3xl border border-city-line bg-white p-5 shadow-soft"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-city-ink">{account.name}</h3>
                    <p className="mt-1 text-sm text-city-muted">
                      {account.email}
                      {account.contact ? ` · ${account.contact}` : ""}
                    </p>
                  </div>
                  <span className="rounded-full bg-city-soft px-3 py-1 text-sm font-semibold text-city-green">
                    {account.isDisabled ? "отключен" : "активен"}
                  </span>
                </div>

                <div className="mt-4 grid gap-2 text-sm text-city-muted sm:grid-cols-3">
                  <p>Заявки: {account._count.claims}</p>
                  <p>Правки: {account._count.editRequests}</p>
                  <p>События: {account._count.eventRequests}</p>
                </div>

                <form action={updateOrganizerBilling} className="mt-4 rounded-2xl border border-city-line bg-city-soft p-4">
                  <input type="hidden" name="accountId" value={account.id} />
                  <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                    <div>
                      <p className="text-sm font-semibold text-city-ink">Коммерция</p>
                      <p className="mt-1 text-xs leading-5 text-city-muted">
                        Сейчас: {billingPlanLabels[billingAccount.billingPlan] ?? billingAccount.billingPlan}, {billingStatusLabels[resolvedBilling.status] ?? resolvedBilling.status}.
                        Оплачен до: {formatAdminDate(billingAccount.paidUntil)}.
                      </p>
                    </div>
                    {promotion.enabled ? (
                      <span className="w-fit rounded-full bg-white px-3 py-1 text-xs font-semibold text-city-green">
                        продвижение до {formatAdminDate(promotion.promotedUntil)}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <label className="grid gap-1 text-xs font-semibold text-city-ink">
                      Тариф
                      <select
                        name="billingPlan"
                        defaultValue={billingAccount.billingPlan}
                        className="rounded-2xl border border-city-line bg-white px-3 py-2 text-sm font-normal text-city-ink outline-none focus:border-city-green"
                      >
                        <option value="free">Бесплатно</option>
                        <option value="active">Активное размещение</option>
                        <option value="pro">Продвижение</option>
                      </select>
                    </label>
                    <label className="grid gap-1 text-xs font-semibold text-city-ink">
                      Статус
                      <select
                        name="billingStatus"
                        defaultValue={resolvedBilling.status}
                        className="rounded-2xl border border-city-line bg-white px-3 py-2 text-sm font-normal text-city-ink outline-none focus:border-city-green"
                      >
                        <option value="free">Бесплатно</option>
                        <option value="trial">Тестовый период</option>
                        <option value="active">Оплачен</option>
                        <option value="expired">Истек</option>
                      </select>
                    </label>
                    <label className="grid gap-1 text-xs font-semibold text-city-ink">
                      Оплачен до
                      <input
                        name="paidUntil"
                        type="date"
                        defaultValue={formatDateInput(billingAccount.paidUntil)}
                        className="rounded-2xl border border-city-line bg-white px-3 py-2 text-sm font-normal text-city-ink outline-none focus:border-city-green"
                      />
                    </label>
                    <label className="grid gap-1 text-xs font-semibold text-city-ink">
                      Тест до
                      <input
                        name="trialUntil"
                        type="date"
                        defaultValue={formatDateInput(billingAccount.trialUntil)}
                        className="rounded-2xl border border-city-line bg-white px-3 py-2 text-sm font-normal text-city-ink outline-none focus:border-city-green"
                      />
                    </label>
                    <label className="flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-xs font-semibold text-city-ink">
                      <input
                        name="platformBookingEnabled"
                        type="checkbox"
                        defaultChecked={billingAccount.platformBookingEnabled && resolvedBilling.isActive}
                        className="h-4 w-4 accent-city-green"
                      />
                      Заявки через Влюди
                    </label>
                    <label className="flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-xs font-semibold text-city-ink">
                      <input
                        name="promoteActivities"
                        type="checkbox"
                        defaultChecked={promotion.enabled}
                        className="h-4 w-4 accent-city-green"
                      />
                      Продвигать карточки
                    </label>
                    <label className="grid gap-1 text-xs font-semibold text-city-ink">
                      Приоритет
                      <input
                        name="priority"
                        type="number"
                        min="0"
                        max="100"
                        defaultValue={promotion.priority}
                        className="rounded-2xl border border-city-line bg-white px-3 py-2 text-sm font-normal text-city-ink outline-none focus:border-city-green"
                      />
                    </label>
                    <label className="grid gap-1 text-xs font-semibold text-city-ink sm:col-span-2">
                      Комментарий по оплате
                      <input
                        name="billingComment"
                        defaultValue={billingAccount.billingComment ?? ""}
                        placeholder="Например: счет ЮKassa 990 ₽, оплата 03.08"
                        className="rounded-2xl border border-city-line bg-white px-3 py-2 text-sm font-normal text-city-ink outline-none focus:border-city-green"
                      />
                    </label>
                  </div>
                  <button className="mt-4 rounded-full bg-city-green px-4 py-2 text-xs font-semibold text-white transition hover:bg-city-blue">
                    Сохранить коммерцию
                  </button>
                </form>

                <div className="mt-4 rounded-2xl bg-city-soft p-4">
                  <p className="text-sm font-semibold text-city-ink">Доступы к организаторам</p>
                  {account.accesses.length ? (
                    <div className="mt-3 grid gap-3">
                      {account.accesses.map((access) => (
                        <div
                          key={access.id}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 text-sm"
                        >
                          <div>
                            <p className="font-semibold text-city-ink">{access.organizer.name}</p>
                            <p className="text-city-muted">
                              {access.organizer.city.name} · активностей: {access.organizer._count.activities}
                            </p>
                            {access.organizer._count.activities === 0 ? (
                              <p className="mt-1 text-xs font-semibold text-city-coral">
                                Карточки активности еще нет
                              </p>
                            ) : null}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {access.organizer._count.activities === 0 ? (
                              <Link
                                href={`/admin/activities/new?organizerId=${access.organizer.id}`}
                                className="rounded-full bg-city-green px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-city-blue"
                              >
                                Создать карточку
                              </Link>
                            ) : null}
                            <form action={revokeOrganizerAccess}>
                              <input type="hidden" name="accessId" value={access.id} />
                              <AdminButton>Убрать доступ</AdminButton>
                            </form>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-city-muted">Доступов пока нет.</p>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {account.isDisabled ? (
                    <form action={enableOrganizerAccount}>
                      <input type="hidden" name="accountId" value={account.id} />
                      <AdminButton>Включить</AdminButton>
                    </form>
                  ) : (
                    <form action={disableOrganizerAccount}>
                      <input type="hidden" name="accountId" value={account.id} />
                      <AdminButton>Отключить</AdminButton>
                    </form>
                  )}
                  <form action={deleteOrganizerAccount}>
                    <input type="hidden" name="accountId" value={account.id} />
                    <AdminButton danger>Удалить аккаунт</AdminButton>
                  </form>
                </div>
              </article>
              );
            })
          ) : (
            <p className="text-city-muted">Аккаунтов ЛК пока нет.</p>
          )}
        </div>
      </section>

      <section className="mt-10 overflow-x-auto rounded-3xl border border-city-line bg-white p-4 shadow-soft">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-city-ink">Организаторы в каталоге</h2>
            <p className="mt-2 text-sm text-city-muted">
              Пустого организатора можно удалить сразу. Организатора с активностями удаляйте
              только для тестовых или ошибочных записей: вместе с ним удалятся его карточки.
            </p>
          </div>
        </div>
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="text-city-muted">
            <tr className="border-b border-city-line">
              <th className="py-3 pr-4 font-semibold">Название</th>
              <th className="py-3 pr-4 font-semibold">Город</th>
              <th className="py-3 pr-4 font-semibold">Телефон</th>
              <th className="py-3 pr-4 font-semibold">Сайт</th>
              <th className="py-3 pr-4 font-semibold">Telegram</th>
              <th className="py-3 pr-4 font-semibold">Активностей</th>
              <th className="py-3 pr-4 font-semibold">Аккаунтов</th>
              <th className="py-3 pr-4 font-semibold">Действие</th>
            </tr>
          </thead>
          <tbody>
            {organizers.map((organizer) => (
              <tr key={organizer.id} className="border-b border-city-line last:border-0">
                <td className="py-3 pr-4 font-semibold text-city-ink">{organizer.name}</td>
                <td className="py-3 pr-4 text-city-muted">{organizer.city.name}</td>
                <td className="py-3 pr-4 text-city-muted">{organizer.phone ?? <Dash />}</td>
                <td className="py-3 pr-4 text-city-muted">
                  {organizer.websiteUrl ? (
                    <a href={organizer.websiteUrl} className="text-city-green hover:text-city-blue">
                      сайт
                    </a>
                  ) : (
                    <Dash />
                  )}
                </td>
                <td className="py-3 pr-4 text-city-muted">
                  {organizer.telegramUrl ? (
                    <a href={organizer.telegramUrl} className="text-city-green hover:text-city-blue">
                      Telegram
                    </a>
                  ) : (
                    <Dash />
                  )}
                </td>
                <td className="py-3 pr-4 text-city-muted">{organizer._count.activities}</td>
                <td className="py-3 pr-4 text-city-muted">{organizer._count.accounts}</td>
                <td className="py-3 pr-4">
                  {organizer._count.activities === 0 ? (
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/admin/activities/new?organizerId=${organizer.id}`}
                        className="rounded-full bg-city-green px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-city-blue"
                      >
                        Создать карточку
                      </Link>
                      <form action={deleteEmptyOrganizer}>
                        <input type="hidden" name="organizerId" value={organizer.id} />
                        <AdminButton danger>Удалить</AdminButton>
                      </form>
                    </div>
                  ) : (
                    <form action={deleteOrganizerWithActivities} className="grid gap-2">
                      <input type="hidden" name="organizerId" value={organizer.id} />
                      <label className="flex items-center gap-2 text-xs text-city-muted">
                        <input
                          name="confirmDeleteWithActivities"
                          type="checkbox"
                          required
                          className="h-4 w-4"
                        />
                        удалить {organizer._count.activities} активн.
                      </label>
                      <AdminButton danger>Удалить всё</AdminButton>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
