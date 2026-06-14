import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { logoutOrganizer } from "@/app/organizer/actions";
import { ActivityImage } from "@/components/ActivityImage";
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

type NavigationItem = {
  label: string;
  href?: string;
  active?: boolean;
  disabled?: boolean;
};

function hasParam(params: Record<string, string | string[] | undefined>, key: string) {
  return params[key] === "1";
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

function formatDashboardPrice(activity: {
  isFree: boolean;
  priceFrom: number | null;
  priceTo: number | null;
}) {
  if (activity.isFree) {
    return "Бесплатно";
  }

  if (activity.priceFrom && activity.priceTo) {
    return `${activity.priceFrom.toLocaleString("ru-RU")}-${activity.priceTo.toLocaleString("ru-RU")} ₽`;
  }

  if (activity.priceFrom) {
    return `от ${activity.priceFrom.toLocaleString("ru-RU")} ₽`;
  }

  if (activity.priceTo) {
    return `до ${activity.priceTo.toLocaleString("ru-RU")} ₽`;
  }

  return "Цена уточняется";
}

export default async function OrganizerCabinetPage({ searchParams }: OrganizerPageProps) {
  const account = await getOrganizerAccount();

  if (!account) {
    redirect("/organizer/login");
  }

  const params = searchParams ? await searchParams : {};
  const now = new Date();
  const [accesses, claims, editRequests, eventRequests] = await Promise.all([
    prisma.organizerAccess.findMany({
      where: { accountId: account.id },
      include: {
        organizer: {
          include: {
            activities: {
              include: {
                category: true,
                events: {
                  where: {
                    startsAt: {
                      gte: now
                    }
                  },
                  orderBy: {
                    startsAt: "asc"
                  },
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
      take: 5
    }),
    prisma.organizerEventRequest.findMany({
      where: { accountId: account.id },
      include: { activity: true },
      orderBy: { createdAt: "desc" },
      take: 5
    })
  ]);

  const activities = accesses.flatMap((access) => access.organizer.activities);
  const pendingEdits = editRequests.filter((item) => item.status === "pending").length;
  const pendingEvents = eventRequests.filter((item) => item.status === "pending").length;
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
  ].slice(0, 6);

  if (accesses.length === 0) {
    return (
      <div className="min-h-screen bg-[#eef4f1] px-3 py-5 sm:px-5 lg:px-8">
        <div className="mx-auto grid max-w-5xl overflow-hidden rounded-[28px] border border-white/70 bg-white/85 shadow-soft backdrop-blur lg:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="border-b border-city-line/70 bg-[#f7fbf9] p-5 lg:border-b-0 lg:border-r">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-city-green text-sm font-bold text-white">
                В
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
              Сейчас это еще не полноценный кабинет организатора. Мы сначала проверяем, что
              заявитель действительно связан с активностью, и только после этого открываем
              доступ к редактированию карточки и добавлению ближайших событий.
            </p>

            {hasParam(params, "registered") ? (
              <div className="mt-6 rounded-2xl border border-city-green/30 bg-city-green/10 p-4 text-sm font-semibold text-city-ink">
                Спасибо, заявка принята. Если понадобится уточнение, мы свяжемся по указанному
                контакту.
              </div>
            ) : null}

            <section className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-[24px] border border-city-line bg-white p-5 shadow-sm">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-city-green text-lg font-bold text-white">
                  1
                </div>
                <h2 className="mt-5 text-base font-bold text-city-ink">Заявка создана</h2>
                <p className="mt-2 text-sm leading-6 text-city-muted">
                  Мы получили данные и ссылку для подтверждения.
                </p>
              </div>
              <div className="rounded-[24px] border border-city-line bg-white p-5 shadow-sm">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#fff7df] text-lg font-bold text-[#8a6419]">
                  2
                </div>
                <h2 className="mt-5 text-base font-bold text-city-ink">Ручная проверка</h2>
                <p className="mt-2 text-sm leading-6 text-city-muted">
                  Проверяем связь с организатором и карточкой.
                </p>
              </div>
              <div className="rounded-[24px] border border-city-line bg-white p-5 shadow-sm">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-city-soft text-lg font-bold text-city-green">
                  3
                </div>
                <h2 className="mt-5 text-base font-bold text-city-ink">Доступ к ЛК</h2>
                <p className="mt-2 text-sm leading-6 text-city-muted">
                  После одобрения появятся карточки, правки и события.
                </p>
              </div>
            </section>

            <section className="mt-8 rounded-[24px] border border-city-line bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-city-ink">Ваши заявки</h2>
                  <p className="mt-2 text-sm leading-6 text-city-muted">
                    Здесь виден статус запросов на доступ. Если заявку отклонят по ошибке,
                    можно написать на почту проекта.
                  </p>
                </div>
                <span className="rounded-full bg-city-soft px-3 py-1 text-xs font-semibold text-city-green">
                  {claims.length}
                </span>
              </div>

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
                      <span
                        className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${statusClass(
                          claim.status
                        )}`}
                      >
                        {statusText(claim.status)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="rounded-2xl bg-city-soft p-4 text-sm leading-6 text-city-muted">
                    Активных заявок пока нет. Откройте карточку активности и нажмите “Я
                    организатор”, если хотите запросить доступ.
                  </p>
                )}
              </div>
            </section>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/tula"
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-city-green px-5 text-sm font-semibold text-white transition hover:bg-city-blue"
              >
                Вернуться в каталог
              </Link>
              <Link
                href="/contacts"
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-city-line bg-white px-5 text-sm font-semibold text-city-ink transition hover:border-city-green hover:text-city-green"
              >
                Написать в Влюди
              </Link>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const navigationItems: NavigationItem[] = [
    { label: "Мои активности", active: true },
    { label: "Добавить активность", href: "/add" },
    { label: "Заявки и правки", disabled: true },
    { label: "Статистика", disabled: true },
    { label: "Настройки", disabled: true }
  ];

  const quickActions = [
    {
      label: "Новая активность",
      text: "Предложите карточку за несколько минут",
      href: "/add",
      mark: "+"
    },
    {
      label: "Локально",
      text: "Покажите свою активность в Туле",
      mark: "Т"
    },
    {
      label: "Бесплатно",
      text: "Базовое размещение без оплаты",
      mark: "0"
    },
    {
      label: "Для сообщества",
      text: "Находите единомышленников и участников",
      mark: "Л"
    }
  ];

  return (
    <div className="min-h-screen bg-[#eef4f1] px-3 py-5 sm:px-5 lg:px-8">
      <div className="mx-auto grid max-w-7xl overflow-hidden rounded-[28px] border border-white/70 bg-white/80 shadow-soft backdrop-blur lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="border-b border-city-line/70 bg-[#f7fbf9] p-5 lg:min-h-[calc(100vh-2.5rem)] lg:border-b-0 lg:border-r">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-city-green text-sm font-bold text-white">
              В
            </div>
            <div>
              <p className="font-bold leading-tight text-city-ink">влюди</p>
              <p className="text-xs text-city-muted">Организатор</p>
            </div>
          </div>

          <nav className="mt-8 grid gap-1">
            {navigationItems.map((item) =>
              item.href ? (
                <Link
                  key={item.label}
                  href={item.href}
                  className="rounded-2xl px-4 py-3 text-sm font-semibold text-city-muted transition hover:bg-white hover:text-city-green"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  key={item.label}
                  className={`rounded-2xl px-4 py-3 text-sm font-semibold ${
                    item.active
                      ? "bg-city-green/10 text-city-green"
                      : item.disabled
                        ? "cursor-not-allowed text-city-muted/55"
                      : "text-city-muted"
                  }`}
                  aria-disabled={item.disabled}
                >
                  {item.label}
                </span>
              )
            )}
          </nav>

          <div className="mt-8 rounded-[24px] bg-city-green/10 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-lg font-bold text-city-green">
              0
            </div>
            <p className="mt-4 text-sm font-bold leading-5 text-city-green">
              Базовое размещение бесплатное
            </p>
            <p className="mt-2 text-xs leading-5 text-city-muted">
              Расскажите о своей активности, а мы проверим карточку перед публикацией.
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
                Здесь можно следить за карточками, отправлять правки и добавлять ближайшие
                события. Изменения появляются на сайте после проверки.
              </p>
            </div>
            <Link
              href="/organizers"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-city-line bg-white px-5 text-sm font-semibold text-city-ink transition hover:border-city-green hover:text-city-green"
            >
              Организаторам
            </Link>
          </div>

          {hasParam(params, "registered") ? (
            <div className="mt-6 rounded-2xl border border-city-green/30 bg-city-green/10 p-4 text-sm font-semibold text-city-ink">
              Заявка отправлена. После проверки карточка появится в разделе “Мои активности”.
            </div>
          ) : null}

          <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {quickActions.map((action) =>
              action.href ? (
                <Link
                  key={action.label}
                  href={action.href}
                  className="group rounded-[24px] border border-city-line bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-city-green hover:shadow-soft"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-city-green text-lg font-bold text-white transition group-hover:bg-city-ink">
                    {action.mark}
                  </div>
                  <h2 className="mt-5 text-base font-bold text-city-ink">{action.label}</h2>
                  <p className="mt-2 text-sm leading-6 text-city-muted">{action.text}</p>
                  <p className="mt-4 text-sm font-semibold text-city-green">Открыть</p>
                </Link>
              ) : (
                <div
                  key={action.label}
                  className="rounded-[24px] border border-city-line bg-white p-5 shadow-sm"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-city-green text-lg font-bold text-white">
                    {action.mark}
                  </div>
                  <h2 className="mt-5 text-base font-bold text-city-ink">{action.label}</h2>
                  <p className="mt-2 text-sm leading-6 text-city-muted">{action.text}</p>
                </div>
              )
            )}
          </section>

          <section className="mt-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-city-ink">Мои активности</h2>
                <p className="mt-1 text-sm text-city-muted">
                  {publishedActivities} опубликовано, {verifiedActivities} подтверждено
                </p>
              </div>
              <Link
                href="/add"
                className="hidden text-sm font-semibold text-city-green transition hover:text-city-blue sm:inline"
              >
                Добавить активность
              </Link>
            </div>

            {activities.length ? (
              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {activities.slice(0, 8).map((activity) => (
                  <Link
                    key={activity.id}
                    href={`/organizer/activities/${activity.slug}`}
                    className="group overflow-hidden rounded-[22px] border border-city-line bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-city-green hover:shadow-soft"
                  >
                    <div className="relative">
                      <ActivityImage
                        title={activity.title}
                        categoryName={activity.category.name}
                        imageUrl={activity.imageUrl}
                        className="aspect-[4/3] rounded-[18px]"
                      />
                      <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-city-ink shadow-sm">
                        {activity.category.name}
                      </span>
                    </div>
                    <div className="px-1 pb-1 pt-4">
                      <h3 className="line-clamp-2 min-h-[3rem] text-base font-bold leading-6 text-city-ink transition group-hover:text-city-green">
                        {activity.title}
                      </h3>
                      <p className="mt-2 line-clamp-1 text-sm text-city-muted">
                        {activity.address}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-city-ink">
                        {formatDashboardPrice(activity)}
                      </p>
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            activity.status === "published"
                              ? "bg-city-green/10 text-city-green"
                              : "bg-city-soft text-city-muted"
                          }`}
                        >
                          {activity.status === "published" ? "Опубликовано" : "На проверке"}
                        </span>
                        {activity.isVerified ? (
                          <span className="rounded-full bg-city-soft px-3 py-1 text-xs font-semibold text-city-green">
                            Проверено
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-[24px] border border-city-line bg-white p-6 shadow-sm">
                <h3 className="text-lg font-bold text-city-ink">Карточек пока нет</h3>
                <p className="mt-2 max-w-2xl leading-7 text-city-muted">
                  Если вы уже отправили заявку, она появится здесь после проверки. Можно
                  предложить новую активность или запросить доступ к существующей карточке.
                </p>
                <Link
                  href="/add"
                  className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-city-green px-5 text-sm font-semibold text-white transition hover:bg-city-blue"
                >
                  Добавить активность
                </Link>
              </div>
            )}
          </section>

          <section className="mt-8 grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-[24px] border border-city-line bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-city-ink">Ближайшее событие</h2>
                  <p className="mt-2 text-sm leading-6 text-city-muted">
                    Когда появятся даты встреч, они будут видны в карточке активности.
                  </p>
                </div>
                {nextEvent ? (
                  <div className="shrink-0 rounded-2xl border border-city-line px-3 py-2 text-center">
                    <p className="text-2xl font-bold leading-none text-city-ink">
                      {formatShortDate(nextEvent.startsAt).split(" ")[0]}
                    </p>
                    <p className="mt-1 text-xs uppercase text-city-muted">
                      {formatShortDate(nextEvent.startsAt).split(" ")[1]}
                    </p>
                  </div>
                ) : null}
              </div>

              {nextEvent ? (
                <div className="mt-5 rounded-2xl bg-city-soft p-4">
                  <h3 className="font-bold text-city-ink">{nextEvent.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-city-muted">
                    {nextEvent.activityTitle} · {formatEventTime(nextEvent.startsAt)} ·{" "}
                    {nextEvent.address}
                  </p>
                  <Link
                    href={`/organizer/activities/${nextEvent.activitySlug}`}
                    className="mt-4 inline-flex min-h-10 items-center justify-center rounded-full bg-white px-4 text-sm font-semibold text-city-ink transition hover:text-city-green"
                  >
                    Открыть
                  </Link>
                </div>
              ) : (
                <div className="mt-5 rounded-2xl bg-city-soft p-4">
                  <p className="text-sm leading-6 text-city-muted">
                    Пока нет добавленных дат. Откройте карточку активности и отправьте ближайшее
                    событие на проверку, когда будете готовы.
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-[24px] border border-city-line bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-city-ink">Заявки и правки</h2>
                  <p className="mt-2 text-sm leading-6 text-city-muted">
                    Правки на проверке: {pendingEdits}. События на проверке: {pendingEvents}.
                  </p>
                </div>
                <span className="rounded-full bg-city-soft px-3 py-1 text-xs font-semibold text-city-green">
                  {requestItems.length}
                </span>
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
                      <span
                        className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${statusClass(
                          item.status
                        )}`}
                      >
                        {statusText(item.status)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="rounded-2xl bg-city-soft p-4 text-sm leading-6 text-city-muted">
                    Заявок пока нет. Когда вы отправите правку или запросите доступ к карточке,
                    статус появится здесь.
                  </p>
                )}
              </div>
            </div>
          </section>

          <section className="mt-5 grid gap-5 xl:grid-cols-2">
            <div className="rounded-[24px] border border-city-line bg-white p-5 shadow-sm">
              <h2 className="text-xl font-bold text-city-ink">Сообщения</h2>
              <p className="mt-3 leading-7 text-city-muted">
                Позже здесь можно будет собрать вопросы от участников и уведомления по карточкам.
                Пока лучше указывать актуальную ссылку для записи в каждой активности.
              </p>
              <span className="mt-5 inline-flex min-h-10 items-center rounded-full bg-city-soft px-4 text-sm font-semibold text-city-muted">
                Раздел готовится
              </span>
            </div>

            <div className="rounded-[24px] border border-city-line bg-white p-5 shadow-sm">
              <h2 className="text-xl font-bold text-city-ink">Продвижение</h2>
              <p className="mt-3 leading-7 text-city-muted">
                В будущем здесь появятся горячие активности недели, закрепление в подборках и
                расширенная статистика. Базовое размещение в каталоге останется бесплатным.
              </p>
              <span className="mt-5 inline-flex min-h-10 items-center rounded-full bg-city-green/10 px-4 text-sm font-semibold text-city-green">
                Бесплатная база сохраняется
              </span>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
