import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  deleteEmptyOrganizer,
  deleteOrganizerAccount,
  disableOrganizerAccount,
  enableOrganizerAccount,
  revokeOrganizerAccess
} from "@/app/admin/organizers/actions";
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

export default async function AdminOrganizersPage() {
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
        </div>
        <Link href="/admin" className="text-sm font-semibold text-city-green">
          К сводке
        </Link>
      </div>

      <section className="mt-8">
        <h2 className="text-2xl font-bold text-city-ink">Аккаунты ЛК</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {accounts.length ? (
            accounts.map((account) => (
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

                <div className="mt-4 rounded-2xl bg-city-soft p-4">
                  <p className="text-sm font-semibold text-city-ink">Доступы к карточкам</p>
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
                          </div>
                          <form action={revokeOrganizerAccess}>
                            <input type="hidden" name="accessId" value={access.id} />
                            <AdminButton>Убрать доступ</AdminButton>
                          </form>
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
            ))
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
              Организатора можно удалить только если у него нет активностей.
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
                    <form action={deleteEmptyOrganizer}>
                      <input type="hidden" name="organizerId" value={organizer.id} />
                      <AdminButton danger>Удалить</AdminButton>
                    </form>
                  ) : (
                    <Dash />
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
