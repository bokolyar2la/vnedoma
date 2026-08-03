import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ActivityStatType } from "@prisma/client";
import { redirect } from "next/navigation";
import {
  logoutOrganizer,
  markBookingRequestViewed,
  updateOrganizerBookingSettings,
  updateOrganizerPassword
} from "@/app/organizer/actions";
import { ActivityImage } from "@/components/ActivityImage";
import { getUpcomingEventWhere } from "@/lib/events";
import { formatPrice } from "@/lib/format";
import { getOrganizerAccount } from "@/lib/organizer-auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Кабинет организатора",
  robots: {
    index: false,
    follow: false
  }
};

export const dynamic = "force-dynamic";

type OrganizerPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type Tab = "activities" | "requests" | "stats" | "settings";

const statLabels: Record<ActivityStatType, string> = {
  view: "Просмотры",
  signup_click: "Клики записаться",
  nearest_event_click: "Клики на ближайшую дату"
};

function hasParam(params: Record<string, string | string[] | undefined>, key: string) {
  return params[key] === "1";
}

function getTab(params: Record<string, string | string[] | undefined>): Tab {
  const tab = params.tab;
  return tab === "requests" || tab === "stats" || tab === "settings" ? tab : "activities";
}

function statusText(status: string) {
  const labels: Record<string, string> = {
    pending: "на проверке",
    approved: "доступ выдан",
    rejected: "отклонено",
    done: "готово"
  };

  return labels[status] ?? status;
}

function statusClass(status: string) {
  if (status === "rejected") {
    return "bg-red-50 text-red-700";
  }

  if (status === "approved" || status === "done") {
    return "bg-city-green/10 text-city-green";
  }

  return "bg-[#fff7df] text-[#8a6419]";
}

function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short"
  })
    .format(date)
    .replace(".", "");
}

function formatEventTime(date: Date) {
  return new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

const billingPlanLabels: Record<string, string> = {
  free: "Базовое размещение",
  active: "Активное размещение",
  pro: "Продвижение"
};

const billingStatusLabels: Record<string, string> = {
  free: "бесплатно",
  trial: "тестовый период",
  active: "активно",
  expired: "истекло"
};

type OrganizerBillingFields = {
  billingPlan: string;
  billingStatus: string;
  paidUntil: Date | null;
  trialUntil: Date | null;
};

function formatBillingDate(date: Date | null) {
  if (!date) {
    return null;
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(date);
}

function getBillingUntil(account: {
  billingStatus: string;
  paidUntil: Date | null;
  trialUntil: Date | null;
}) {
  return account.billingStatus === "trial" ? account.trialUntil : account.paidUntil;
}

export default async function OrganizerCabinetPage({ searchParams }: OrganizerPageProps) {
  const account = await getOrganizerAccount();

  if (!account) {
    redirect("/organizer/login");
  }

  const params = searchParams ? await searchParams : {};
  const currentTab = getTab(params);
  const now = new Date();

  const [accesses, claims, editRequests, eventRequests, bookingRequests] = await Promise.all([
    prisma.organizerAccess.findMany({
      where: { accountId: account.id },
      include: {
        organizer: {
          include: {
            activities: {
              include: {
                category: true,
                events: {
                  where: getUpcomingEventWhere(now),
                  orderBy: { startsAt: "asc" },
                  take: 1
                }
              },
              orderBy: { updatedAt: "desc" }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.organizerClaimRequest.findMany({
      where: { accountId: account.id },
      include: { organizer: true, activity: true },
      orderBy: { createdAt: "desc" }
    }),
    prisma.organizerEditRequest.findMany({
      where: { accountId: account.id },
      include: { activity: true },
      orderBy: { createdAt: "desc" },
      take: 30
    }),
    prisma.organizerEventRequest.findMany({
      where: { accountId: account.id },
      include: { activity: true },
      orderBy: { createdAt: "desc" },
      take: 30
    }),
    prisma.activityBookingRequest.findMany({
      where: { organizerAccountId: account.id },
      include: {
        activity: {
          select: {
            title: true,
            slug: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 30
    })
  ]);

  const activities = accesses.flatMap((access) => access.organizer.activities);
  const activityIds = activities.map((activity) => activity.id);
  const statsSince = new Date(now);
  statsSince.setDate(statsSince.getDate() - 30);
  const groupedStats = activityIds.length
    ? await prisma.activityStatEvent.groupBy({
        by: ["activityId", "type"],
        where: {
          activityId: { in: activityIds },
          createdAt: { gte: statsSince }
        },
        _count: { _all: true }
      })
    : [];

  const statsByActivity = new Map<
    number,
    Record<ActivityStatType, number>
  >();

  for (const activity of activities) {
    statsByActivity.set(activity.id, {
      view: 0,
      signup_click: 0,
      nearest_event_click: 0
    });
  }

  for (const row of groupedStats) {
    const stats = statsByActivity.get(row.activityId);
    if (stats) {
      stats[row.type] = row._count._all;
    }
  }

  const totals = activities.reduce(
    (sum, activity) => {
      const stats = statsByActivity.get(activity.id);
      return {
        view: sum.view + (stats?.view ?? 0),
        signup_click: sum.signup_click + (stats?.signup_click ?? 0),
        nearest_event_click:
          sum.nearest_event_click + (stats?.nearest_event_click ?? 0)
      };
    },
    { view: 0, signup_click: 0, nearest_event_click: 0 }
  );

  const pendingEdits = editRequests.filter((item) => item.status === "pending").length;
  const pendingEvents = eventRequests.filter((item) => item.status === "pending").length;
  const newBookings = bookingRequests.filter((item) => !item.viewedAt).length;
  const publishedActivities = activities.filter((activity) => activity.status === "published").length;
  const verifiedActivities = activities.filter((activity) => activity.isVerified).length;
  const nextEvent = activities
    .flatMap((activity) =>
      activity.events.map((event) => ({
        ...event,
        activityTitle: activity.title,
        activitySlug: activity.slug,
        address: activity.address
      }))
    )
    .sort((left, right) => left.startsAt.getTime() - right.startsAt.getTime())[0];
  const billingAccount = account as typeof account & OrganizerBillingFields;
  const billingUntil = getBillingUntil(billingAccount);
  const billingUntilText = formatBillingDate(billingUntil);
  const billingPlanLabel = billingPlanLabels[billingAccount.billingPlan] ?? billingAccount.billingPlan;
  const billingStatusLabel = billingStatusLabels[billingAccount.billingStatus] ?? billingAccount.billingStatus;

  const requestItems = [
    ...claims.map((claim) => ({
      id: `claim-${claim.id}`,
      title: claim.activity?.title ?? claim.organizer.name,
      type: "Доступ к карточке",
      status: claim.status
    })),
    ...editRequests.map((request) => ({
      id: `edit-${request.id}`,
      title: request.activity.title,
      type: "Правка карточки",
      status: request.status
    })),
    ...eventRequests.map((request) => ({
      id: `event-${request.id}`,
      title: request.activity.title,
      type: "Ближайшее событие",
      status: request.status
    }))
  ];

  const tabs: Array<{ id: Tab; label: string; href: string }> = [
    { id: "activities", label: "Мои активности", href: "/organizer" },
    { id: "requests", label: "Заявки и правки", href: "/organizer?tab=requests" },
    { id: "stats", label: "Статистика", href: "/organizer?tab=stats" },
    { id: "settings", label: "Настройки", href: "/organizer?tab=settings" }
  ];

  if (accesses.length === 0) {
    return (
      <div className="min-h-screen bg-[#eef4f1] px-3 py-5 sm:px-5 lg:px-8">
        <div className="mx-auto grid max-w-5xl overflow-hidden rounded-[28px] border border-white/70 bg-white/85 shadow-soft backdrop-blur lg:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="border-b border-city-line/70 bg-[#f7fbf9] p-5 lg:border-b-0 lg:border-r">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl bg-city-green ring-1 ring-city-line/50">
                <Image src="/favicon.png" alt="" width={40} height={40} className="h-full w-full object-cover" />
              </div>
              <div>
                <p className="font-bold leading-tight text-city-ink">влюди</p>
                <p className="text-xs text-city-muted">Заявка организатора</p>
              </div>
            </div>

            <div className="mt-8 rounded-[24px] bg-[#fff7df] p-5">
              <p className="text-sm font-bold text-[#8a6419]">Доступ еще не подтвержден</p>
              <p className="mt-2 text-xs leading-5 text-city-muted">
                Кабинет с правками и событиями откроется после ручной проверки заявки.
              </p>
            </div>

            <form action={logoutOrganizer} className="mt-5">
              <button className="w-full rounded-2xl border border-city-line bg-white px-4 py-3 text-sm font-semibold text-city-ink transition hover:border-city-green hover:text-city-green">
                Выйти
              </button>
            </form>
          </aside>

          <main className="p-5 sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-city-green">
              Влюди · проверка доступа
            </p>
            <h1 className="mt-3 max-w-3xl text-3xl font-bold leading-tight text-city-ink sm:text-4xl">
              Заявка отправлена и ждет проверки
            </h1>
            <p className="mt-4 max-w-3xl leading-7 text-city-muted">
              Мы сначала проверяем, что заявитель действительно связан с активностью, и только после этого
              открываем доступ к редактированию карточки и добавлению ближайших событий.
            </p>

            {hasParam(params, "registered") ? (
              <div className="mt-6 rounded-2xl border border-city-green/30 bg-city-green/10 p-4 text-sm font-semibold text-city-ink">
                Спасибо, заявка принята. Если понадобится уточнение, мы свяжемся по указанному контакту.
              </div>
            ) : null}

            <section className="mt-8 rounded-[24px] border border-city-line bg-white p-5 shadow-sm">
              <h2 className="text-xl font-bold text-city-ink">Ваши заявки</h2>
              <div className="mt-5 grid gap-3">
                {claims.length ? (
                  claims.map((claim) => (
                    <div
                      key={claim.id}
                      className="flex flex-col gap-3 rounded-2xl bg-city-soft p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="text-sm font-semibold text-city-ink">
                          {claim.activity?.title ?? claim.organizer.name}
                        </p>
                        <p className="mt-1 text-xs text-city-muted">Доступ к карточке</p>
                      </div>
                      <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${statusClass(claim.status)}`}>
                        {statusText(claim.status)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="rounded-2xl bg-city-soft p-4 text-sm leading-6 text-city-muted">
                    Активных заявок пока нет.
                  </p>
                )}
              </div>
            </section>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#eef4f1] px-3 py-5 sm:px-5 lg:px-8">
      <div className="mx-auto grid max-w-7xl overflow-hidden rounded-[28px] border border-white/70 bg-white/80 shadow-soft backdrop-blur lg:grid-cols-[230px_minmax(0,1fr)]">
        <aside className="border-b border-city-line/70 bg-[#f7fbf9] p-5 lg:min-h-[calc(100vh-2.5rem)] lg:border-b-0 lg:border-r">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl bg-city-green ring-1 ring-city-line/50">
              <Image src="/favicon.png" alt="" width={40} height={40} className="h-full w-full object-cover" />
            </div>
            <div>
              <p className="font-bold leading-tight text-city-ink">влюди</p>
              <p className="text-xs text-city-muted">Организатор</p>
            </div>
          </div>

          <nav className="mt-8 grid gap-1">
            {tabs.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className={`flex items-center justify-between gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  currentTab === item.id
                    ? "bg-city-green/10 text-city-green"
                    : "text-city-muted hover:bg-white hover:text-city-green"
                }`}
              >
                <span>{item.label}</span>
                {item.id === "requests" && newBookings > 0 ? (
                  <span className="rounded-full bg-city-green px-2 py-0.5 text-xs font-bold text-white">
                    +{newBookings}
                  </span>
                ) : null}
              </Link>
            ))}
            <Link
              href="/add"
              className="rounded-2xl px-4 py-3 text-sm font-semibold text-city-muted transition hover:bg-white hover:text-city-green"
            >
              Добавить активность
            </Link>
          </nav>

          <div className="mt-8 rounded-[24px] bg-city-green/10 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-lg font-bold text-city-green">
              {billingAccount.billingPlan === "pro" ? "PRO" : billingAccount.billingPlan === "active" ? "A" : "0"}
            </div>
            <p className="mt-4 text-sm font-bold leading-5 text-city-green">
              {billingPlanLabel}
            </p>
            <p className="mt-2 text-xs leading-5 text-city-muted">
              Статус: {billingStatusLabel}
              {billingUntilText ? ` до ${billingUntilText}` : ""}. Добавляйте даты и обновляйте карточку.
            </p>
          </div>

          <form action={logoutOrganizer} className="mt-5">
            <button className="w-full rounded-2xl border border-city-line bg-white px-4 py-3 text-sm font-semibold text-city-ink transition hover:border-city-green hover:text-city-green">
              Выйти
            </button>
          </form>
        </aside>

        <main className="p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-city-green">
                Кабинет организатора
              </p>
              <h1 className="mt-2 text-3xl font-bold leading-tight text-city-ink">
                Здравствуйте, {account.name}
              </h1>
              <p className="mt-3 max-w-2xl leading-7 text-city-muted">
                Здесь можно быстро добавить дату, отправить правку карточки и посмотреть заявки.
              </p>
            </div>
            <Link
              href="/add"
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-city-green px-5 text-sm font-semibold text-white transition hover:bg-city-blue"
            >
              Добавить активность
            </Link>
          </div>

          {hasParam(params, "registered") ? (
            <div className="mt-6 rounded-2xl border border-city-green/30 bg-city-green/10 p-4 text-sm font-semibold text-city-ink">
              Заявка отправлена. После проверки карточка появится в разделе “Мои активности”.
            </div>
          ) : null}

          <section className="mt-6 grid gap-4 lg:grid-cols-[1fr_1.2fr]">
            <div className="rounded-[24px] border border-city-line bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-wide text-city-green">
                Размещение
              </p>
              <h2 className="mt-2 text-2xl font-bold text-city-ink">{billingPlanLabel}</h2>
              <p className="mt-2 text-sm leading-6 text-city-muted">
                Статус: {billingStatusLabel}
                {billingUntilText ? ` до ${billingUntilText}` : ""}.
              </p>
              <Link
                href="/organizers"
                className="mt-4 inline-flex text-sm font-semibold text-city-green"
              >
                Посмотреть возможности
              </Link>
            </div>
            <div className="rounded-[24px] border border-city-line bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-wide text-city-green">
                Что дает активное размещение
              </p>
              <p className="mt-2 text-sm leading-6 text-city-muted">
                Заявки через Влюди, уведомления на почту, ближайшие события на карточке,
                статистика и возможность попадать в подборки с актуальными датами.
              </p>
            </div>
          </section>

          {currentTab === "activities" ? (
            <section className="mt-7 rounded-[24px] border border-city-line bg-white p-5 shadow-sm">
              <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-city-green">
                    Первые шаги
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-city-ink">
                    Что можно сделать в кабинете
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-city-muted">
                    Поддерживайте карточку актуальной: добавляйте ближайшие события,
                    обновляйте описание и принимайте заявки от участников через Влюди.
                  </p>
                </div>
                <div className="grid gap-2 sm:grid-cols-2 lg:min-w-[420px]">
                  <Link
                    href={activities[0] ? `/organizer/activities/${activities[0].slug}#event-form` : "/add"}
                    className="inline-flex min-h-11 items-center justify-center rounded-full bg-city-green px-5 text-sm font-semibold text-white transition hover:bg-city-blue"
                  >
                    Добавить дату
                  </Link>
                  <Link
                    href="/organizer?tab=settings"
                    className="inline-flex min-h-11 items-center justify-center rounded-full border border-city-line px-5 text-sm font-semibold text-city-ink transition hover:border-city-green hover:text-city-green"
                  >
                    Настроить запись
                  </Link>
                </div>
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-4">
                {[
                  "Добавить ближайшую дату или событие",
                  "Отправить правку описания и контактов",
                  "Включить запись через Влюди",
                  "Смотреть заявки в разделе “Заявки и правки”"
                ].map((item, index) => (
                  <div key={item} className="rounded-2xl bg-city-soft p-4">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-bold text-city-green">
                      {index + 1}
                    </span>
                    <p className="mt-3 text-sm font-semibold leading-5 text-city-ink">{item}</p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <section className="mt-7 grid gap-4 sm:grid-cols-3">
            <div className="rounded-[24px] border border-city-line bg-white p-5 shadow-sm">
              <p className="text-sm text-city-muted">Карточек</p>
              <p className="mt-2 text-3xl font-bold text-city-ink">{activities.length}</p>
              <p className="mt-2 text-sm text-city-muted">
                {publishedActivities} опубликовано, {verifiedActivities} проверено
              </p>
            </div>
            <div className="rounded-[24px] border border-city-line bg-white p-5 shadow-sm">
              <p className="text-sm text-city-muted">Просмотры за 30 дней</p>
              <p className="mt-2 text-3xl font-bold text-city-ink">{totals.view}</p>
              <Link href="/organizer?tab=stats" className="mt-3 inline-flex text-sm font-semibold text-city-green">
                Открыть статистику
              </Link>
            </div>
            <div className="rounded-[24px] border border-city-line bg-white p-5 shadow-sm">
              <p className="text-sm text-city-muted">На проверке</p>
              <p className="mt-2 text-3xl font-bold text-city-ink">{pendingEdits + pendingEvents}</p>
              <Link href="/organizer?tab=requests" className="mt-3 inline-flex text-sm font-semibold text-city-green">
                Смотреть заявки
              </Link>
            </div>
          </section>

          {currentTab === "activities" ? (
            <>
              <section className="mt-8">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-city-ink">Мои активности</h2>
                    <p className="mt-1 text-sm text-city-muted">
                      Откройте карточку, чтобы добавить дату, правку или похожую карточку.
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {activities.map((activity) => {
                    const stats = statsByActivity.get(activity.id);
                    return (
                      <article
                        key={activity.id}
                        className="overflow-hidden rounded-[24px] border border-city-line bg-white p-3 shadow-sm"
                      >
                        <ActivityImage
                          title={activity.title}
                          categoryName={activity.category.name}
                          imageUrl={activity.imageUrl}
                          className="aspect-[4/3] rounded-[18px]"
                        />
                        <div className="px-1 pb-1 pt-4">
                          <h3 className="line-clamp-2 text-base font-bold leading-6 text-city-ink">
                            {activity.title}
                          </h3>
                          <p className="mt-2 text-sm text-city-muted">{activity.address}</p>
                          <p className="mt-1 text-sm font-semibold text-city-ink">{formatPrice(activity)}</p>
                          <p className="mt-3 text-xs text-city-muted">
                            Просмотры: {stats?.view ?? 0} · Записи: {stats?.signup_click ?? 0}
                          </p>
                          <div className="mt-4 rounded-2xl bg-city-soft p-3">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <p className="text-sm font-bold text-city-ink">
                                  Запись через Влюди {account.platformBookingEnabled ? "включена" : "выключена"}
                                </p>
                                <p className="mt-1 text-xs leading-5 text-city-muted">
                                  {account.platformBookingEnabled
                                    ? `Заявки приходят на ${account.notificationEmail ?? account.email}`
                                    : "Можно принимать заявки прямо со страницы активности."}
                                </p>
                              </div>
                              {account.platformBookingEnabled ? (
                                <Link
                                  href="/organizer?tab=settings"
                                  className="inline-flex min-h-9 items-center justify-center rounded-full bg-white px-3 text-xs font-semibold text-city-green transition hover:text-city-blue"
                                >
                                  Настроить
                                </Link>
                              ) : (
                                <form action={updateOrganizerBookingSettings}>
                                  <input type="hidden" name="platformBookingEnabled" value="on" />
                                  <input
                                    type="hidden"
                                    name="notificationEmail"
                                    value={account.notificationEmail ?? account.email}
                                  />
                                  <input
                                    type="hidden"
                                    name="notificationTelegram"
                                    value={account.notificationTelegram ?? ""}
                                  />
                                  <input
                                    type="hidden"
                                    name="platformBookingDiscountText"
                                    value={account.platformBookingDiscountText ?? "Промокод ВЛЮДИ: 10% скидка"}
                                  />
                                  <button className="inline-flex min-h-9 items-center justify-center rounded-full bg-city-green px-3 text-xs font-semibold text-white transition hover:bg-city-blue">
                                    Включить
                                  </button>
                                </form>
                              )}
                            </div>
                          </div>
                          <div className="mt-4 grid gap-2 sm:grid-cols-2">
                            <Link
                              href={`/organizer/activities/${activity.slug}#event-form`}
                              className="inline-flex min-h-10 items-center justify-center rounded-full bg-city-green px-4 text-sm font-semibold text-white transition hover:bg-city-blue"
                            >
                              Добавить дату
                            </Link>
                            <Link
                              href={`/organizer/activities/${activity.slug}#edit-card`}
                              className="inline-flex min-h-10 items-center justify-center rounded-full border border-city-line px-4 text-sm font-semibold text-city-ink transition hover:border-city-green hover:text-city-green"
                            >
                              Изменить
                            </Link>
                          </div>
                          <Link
                            href={`/organizer/activities/${activity.slug}`}
                            className="mt-3 inline-flex text-sm font-semibold text-city-green transition hover:text-city-blue"
                          >
                            Открыть управление
                          </Link>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>

              <section className="mt-8 grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
                <div className="rounded-[24px] border border-city-line bg-white p-5 shadow-sm">
                  <h2 className="text-xl font-bold text-city-ink">Ближайшее событие</h2>
                  {nextEvent ? (
                    <div className="mt-5 rounded-2xl bg-city-soft p-4">
                      <div className="flex gap-4">
                        <div className="shrink-0 rounded-2xl border border-city-line bg-white px-3 py-2 text-center">
                          <p className="text-2xl font-bold leading-none text-city-ink">
                            {formatShortDate(nextEvent.startsAt).split(" ")[0]}
                          </p>
                          <p className="mt-1 text-xs uppercase text-city-muted">
                            {formatShortDate(nextEvent.startsAt).split(" ")[1]}
                          </p>
                        </div>
                        <div>
                          <h3 className="font-bold text-city-ink">{nextEvent.title}</h3>
                          <p className="mt-2 text-sm leading-6 text-city-muted">
                            {nextEvent.activityTitle} · {formatEventTime(nextEvent.startsAt)} · {nextEvent.address}
                          </p>
                          <Link
                            href={`/organizer/activities/${nextEvent.activitySlug}`}
                            className="mt-3 inline-flex text-sm font-semibold text-city-green"
                          >
                            Открыть карточку
                          </Link>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-4 rounded-2xl bg-city-soft p-4 text-sm leading-6 text-city-muted">
                      Дат пока нет. Откройте активность и добавьте ближайшее событие.
                    </p>
                  )}
                </div>

                <div className="rounded-[24px] border border-city-line bg-white p-5 shadow-sm">
                  <h2 className="text-xl font-bold text-city-ink">Заявки и правки</h2>
                  <p className="mt-2 text-sm leading-6 text-city-muted">
                    Заявки через Влюди: {newBookings}. Необработанные правки: {pendingEdits}.
                    Необработанные события: {pendingEvents}.
                  </p>
                  <Link href="/organizer?tab=requests" className="mt-4 inline-flex text-sm font-semibold text-city-green">
                    Смотреть все
                  </Link>
                </div>
              </section>
            </>
          ) : null}

          {currentTab === "requests" ? (
            <section className="mt-8 rounded-[24px] border border-city-line bg-white p-5 shadow-sm">
              <h2 className="text-2xl font-bold text-city-ink">Заявки и правки</h2>
              <div className="mt-5 rounded-[24px] bg-city-soft p-4">
                <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                  <div>
                    <h3 className="text-lg font-bold text-city-ink">Заявки через Влюди</h3>
                    <p className="mt-1 text-sm text-city-muted">
                      Люди, которые оставили контакт на странице вашей активности.
                    </p>
                  </div>
                  <span className="w-fit rounded-full bg-white px-3 py-1 text-xs font-semibold text-city-green">
                    Новых: {newBookings}
                  </span>
                </div>
                <div className="mt-4 grid gap-3">
                  {bookingRequests.length ? (
                    bookingRequests.map((request) => (
                      <div
                        key={request.id}
                        className={`rounded-2xl bg-white p-4 ${
                          request.viewedAt ? "" : "ring-1 ring-city-green/25"
                        }`}
                      >
                        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-bold text-city-ink">{request.activity.title}</p>
                              <span
                                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                                  request.viewedAt
                                    ? "bg-city-soft text-city-muted"
                                    : "bg-city-green/10 text-city-green"
                                }`}
                              >
                                {request.viewedAt ? "просмотрено" : "новая"}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-city-muted">
                              {request.name} · {request.contact}
                            </p>
                            {request.message ? (
                              <p className="mt-2 text-sm leading-6 text-city-muted">{request.message}</p>
                            ) : null}
                            {request.discountText ? (
                              <p className="mt-2 text-xs font-semibold text-city-green">{request.discountText}</p>
                            ) : null}
                          </div>
                          <div className="flex flex-wrap gap-2 sm:justify-end">
                            {!request.viewedAt ? (
                              <form action={markBookingRequestViewed}>
                                <input type="hidden" name="requestId" value={request.id} />
                                <button className="rounded-full bg-city-green px-3 py-1 text-xs font-semibold text-white transition hover:bg-city-blue">
                                  Отметить просмотренной
                                </button>
                              </form>
                            ) : null}
                            <Link
                              href={`/activity/${request.activity.slug}`}
                              className="rounded-full bg-city-soft px-3 py-1 text-xs font-semibold text-city-green transition hover:text-city-blue"
                            >
                              Открыть карточку
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="rounded-2xl bg-white p-4 text-sm leading-6 text-city-muted">
                      Заявок через Влюди пока нет. Их можно включить в настройках.
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-5 grid gap-3">
                {requestItems.length ? (
                  requestItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col gap-3 rounded-2xl bg-city-soft p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="text-sm font-semibold text-city-ink">{item.title}</p>
                        <p className="mt-1 text-xs text-city-muted">{item.type}</p>
                      </div>
                      <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${statusClass(item.status)}`}>
                        {statusText(item.status)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="rounded-2xl bg-city-soft p-4 text-sm leading-6 text-city-muted">
                    Заявок пока нет.
                  </p>
                )}
              </div>
            </section>
          ) : null}

          {currentTab === "stats" ? (
            <section className="mt-8 rounded-[24px] border border-city-line bg-white p-5 shadow-sm">
              <h2 className="text-2xl font-bold text-city-ink">Статистика за 30 дней</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                {(Object.values(ActivityStatType) as ActivityStatType[]).map((type) => (
                  <div key={type} className="rounded-2xl bg-city-soft p-4">
                    <p className="text-sm text-city-muted">{statLabels[type]}</p>
                    <p className="mt-2 text-3xl font-bold text-city-ink">{totals[type]}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 overflow-x-auto">
                <table className="w-full min-w-[680px] text-left text-sm">
                  <thead className="text-city-muted">
                    <tr>
                      <th className="border-b border-city-line py-3 pr-4">Активность</th>
                      <th className="border-b border-city-line py-3 pr-4">Просмотры</th>
                      <th className="border-b border-city-line py-3 pr-4">Записаться</th>
                      <th className="border-b border-city-line py-3 pr-4">Ближайшая дата</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activities.map((activity) => {
                      const stats = statsByActivity.get(activity.id);
                      return (
                        <tr key={activity.id}>
                          <td className="border-b border-city-line py-3 pr-4 font-semibold text-city-ink">
                            {activity.title}
                          </td>
                          <td className="border-b border-city-line py-3 pr-4">{stats?.view ?? 0}</td>
                          <td className="border-b border-city-line py-3 pr-4">{stats?.signup_click ?? 0}</td>
                          <td className="border-b border-city-line py-3 pr-4">{stats?.nearest_event_click ?? 0}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          {currentTab === "settings" ? (
            <section className="mt-8 rounded-[24px] border border-city-line bg-white p-5 shadow-sm">
              <h2 className="text-2xl font-bold text-city-ink">Настройки профиля</h2>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl bg-city-soft p-4">
                  <p className="text-sm text-city-muted">Имя</p>
                  <p className="mt-2 font-semibold text-city-ink">{account.name}</p>
                </div>
                <div className="rounded-2xl bg-city-soft p-4">
                  <p className="text-sm text-city-muted">Email для входа</p>
                  <p className="mt-2 font-semibold text-city-ink">{account.email}</p>
                </div>
                <div className="rounded-2xl bg-city-soft p-4 md:col-span-2">
                  <p className="text-sm text-city-muted">Контакт</p>
                  <p className="mt-2 font-semibold text-city-ink">{account.contact ?? "Не указан"}</p>
                </div>
              </div>
              {params.password === "changed" ? (
                <p className="mt-5 rounded-2xl border border-city-green/30 bg-city-green/10 p-4 text-sm font-semibold text-city-ink">
                  Пароль обновлен.
                </p>
              ) : null}
              {params.booking === "saved" ? (
                <p className="mt-5 rounded-2xl border border-city-green/30 bg-city-green/10 p-4 text-sm font-semibold text-city-ink">
                  Настройки записи сохранены.
                </p>
              ) : null}
              {typeof params.error === "string" ? (
                <p className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                  {params.error}
                </p>
              ) : null}

              <div className="mt-6 grid gap-5 xl:grid-cols-2">
                <form action={updateOrganizerBookingSettings} className="rounded-[24px] bg-city-soft p-5">
                  <h3 className="text-xl font-bold text-city-ink">Запись через Влюди</h3>
                  <p className="mt-2 text-sm leading-6 text-city-muted">
                    Если включить, на ваших карточках появится форма заявки через платформу.
                    Участнику будет показан бонус: промокод ВЛЮДИ.
                  </p>
                  <label className="mt-5 flex gap-3 rounded-2xl bg-white p-4">
                    <input
                      type="checkbox"
                      name="platformBookingEnabled"
                      defaultChecked={account.platformBookingEnabled}
                      className="mt-1 h-4 w-4 accent-city-green"
                    />
                    <span>
                      <span className="block text-sm font-bold text-city-ink">Включить запись через Влюди</span>
                      <span className="mt-1 block text-sm leading-5 text-city-muted">
                        Заявки будут сохраняться в разделе “Заявки и правки”.
                      </span>
                    </span>
                  </label>
                  <label className="mt-4 block">
                    <span className="text-sm font-semibold text-city-ink">Email для уведомлений</span>
                    <input
                      name="notificationEmail"
                      type="email"
                      defaultValue={account.notificationEmail ?? account.email}
                      className="mt-2 w-full rounded-2xl border border-city-line bg-white px-4 py-3 outline-none transition focus:border-city-green"
                      placeholder="email@example.ru"
                    />
                  </label>
                  <label className="mt-4 block">
                    <span className="text-sm font-semibold text-city-ink">Telegram для уведомлений</span>
                    <input
                      name="notificationTelegram"
                      defaultValue={account.notificationTelegram ?? ""}
                      className="mt-2 w-full rounded-2xl border border-city-line bg-white px-4 py-3 outline-none transition focus:border-city-green"
                      placeholder="chat_id Telegram"
                    />
                    <span className="mt-2 block text-xs leading-5 text-city-muted">
                      Для автоматической отправки нужен Telegram-бот и chat_id. Сейчас контакт сохраняется для заявок.
                    </span>
                  </label>
                  <label className="mt-4 block">
                    <span className="text-sm font-semibold text-city-ink">Бонус для участников</span>
                    <input
                      name="platformBookingDiscountText"
                      defaultValue={account.platformBookingDiscountText ?? "Промокод ВЛЮДИ: 10% скидка"}
                      className="mt-2 w-full rounded-2xl border border-city-line bg-white px-4 py-3 outline-none transition focus:border-city-green"
                    />
                  </label>
                  <button className="mt-5 min-h-12 w-full rounded-full bg-city-green px-5 font-semibold text-white transition hover:bg-city-blue">
                    Сохранить настройки записи
                  </button>
                </form>

                <form action={updateOrganizerPassword} className="rounded-[24px] bg-city-soft p-5">
                  <h3 className="text-xl font-bold text-city-ink">Смена пароля</h3>
                  <p className="mt-2 text-sm leading-6 text-city-muted">
                    Для безопасности нужно указать текущий пароль.
                  </p>
                  <label className="mt-5 block">
                    <span className="text-sm font-semibold text-city-ink">Текущий пароль</span>
                    <input
                      name="currentPassword"
                      type="password"
                      autoComplete="current-password"
                      className="mt-2 w-full rounded-2xl border border-city-line bg-white px-4 py-3 outline-none transition focus:border-city-green"
                    />
                  </label>
                  <label className="mt-4 block">
                    <span className="text-sm font-semibold text-city-ink">Новый пароль</span>
                    <input
                      name="newPassword"
                      type="password"
                      autoComplete="new-password"
                      className="mt-2 w-full rounded-2xl border border-city-line bg-white px-4 py-3 outline-none transition focus:border-city-green"
                    />
                  </label>
                  <label className="mt-4 block">
                    <span className="text-sm font-semibold text-city-ink">Повторите новый пароль</span>
                    <input
                      name="repeatPassword"
                      type="password"
                      autoComplete="new-password"
                      className="mt-2 w-full rounded-2xl border border-city-line bg-white px-4 py-3 outline-none transition focus:border-city-green"
                    />
                  </label>
                  <button className="mt-5 min-h-12 w-full rounded-full bg-city-ink px-5 font-semibold text-white transition hover:bg-city-blue">
                    Обновить пароль
                  </button>
                </form>
              </div>
            </section>
          ) : null}
        </main>
      </div>
    </div>
  );
}
