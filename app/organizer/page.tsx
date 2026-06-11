import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { logoutOrganizer } from "@/app/organizer/actions";
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

export default async function OrganizerCabinetPage({ searchParams }: OrganizerPageProps) {
  const account = await getOrganizerAccount();

  if (!account) {
    redirect("/organizer/login");
  }

  const params = searchParams ? await searchParams : {};
  const [accesses, claims, editRequests, eventRequests] = await Promise.all([
    prisma.organizerAccess.findMany({
      where: { accountId: account.id },
      include: {
        organizer: {
          include: {
            activities: {
              include: { category: true },
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

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-city-green">
            Влюди · кабинет организатора
          </p>
          <h1 className="mt-3 text-3xl font-bold text-city-ink">Здравствуйте, {account.name}</h1>
          <p className="mt-3 max-w-2xl text-city-muted">
            Здесь можно отправлять правки по своим карточкам и добавлять ближайшие события. Изменения появятся на сайте после проверки.
          </p>
        </div>
        <form action={logoutOrganizer}>
          <button className="rounded-full border border-city-line bg-white px-4 py-2 text-sm font-semibold text-city-ink transition hover:border-city-green">
            Выйти
          </button>
        </form>
      </div>

      {hasParam(params, "registered") ? (
        <div className="mt-6 rounded-2xl border border-city-green/30 bg-city-green/10 p-4 text-sm text-city-ink">
          Заявка отправлена. После проверки карточка появится в разделе “Мои активности”.
        </div>
      ) : null}

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-city-line bg-white p-5 shadow-soft">
          <p className="text-sm text-city-muted">Мои активности</p>
          <p className="mt-2 text-3xl font-bold text-city-ink">{activities.length}</p>
        </div>
        <div className="rounded-3xl border border-city-line bg-white p-5 shadow-soft">
          <p className="text-sm text-city-muted">Правки на проверке</p>
          <p className="mt-2 text-3xl font-bold text-city-ink">
            {editRequests.filter((item) => item.status === "pending").length}
          </p>
        </div>
        <div className="rounded-3xl border border-city-line bg-white p-5 shadow-soft">
          <p className="text-sm text-city-muted">События на проверке</p>
          <p className="mt-2 text-3xl font-bold text-city-ink">
            {eventRequests.filter((item) => item.status === "pending").length}
          </p>
        </div>
      </section>

      <section className="mt-8 rounded-3xl border border-city-line bg-white p-5 shadow-soft">
        <h2 className="text-xl font-bold text-city-ink">Мои активности</h2>
        {activities.length ? (
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {activities.map((activity) => (
              <Link
                key={activity.id}
                href={`/organizer/activities/${activity.slug}`}
                className="rounded-2xl border border-city-line p-4 transition hover:-translate-y-0.5 hover:border-city-green hover:shadow-soft"
              >
                <p className="text-sm font-semibold text-city-green">{activity.category.name}</p>
                <h3 className="mt-2 text-lg font-bold text-city-ink">{activity.title}</h3>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-city-muted">
                  {activity.description}
                </p>
                <p className="mt-3 text-sm font-semibold text-city-ink">Открыть карточку</p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-city-muted">
            Пока нет подтверждённых карточек. Если вы уже отправили заявку, она появится здесь после проверки.
          </p>
        )}
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-city-line bg-white p-5 shadow-soft">
          <h2 className="text-xl font-bold text-city-ink">Заявки на доступ</h2>
          <div className="mt-4 space-y-3">
            {claims.length ? (
              claims.map((claim) => (
                <div key={claim.id} className="rounded-2xl bg-city-soft p-4 text-sm">
                  <p className="font-semibold text-city-ink">
                    {claim.activity?.title ?? claim.organizer.name}
                  </p>
                  <p className="mt-1 text-city-muted">Статус: {statusText(claim.status)}</p>
                </div>
              ))
            ) : (
              <p className="text-city-muted">Заявок пока нет.</p>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-city-line bg-white p-5 shadow-soft">
          <h2 className="text-xl font-bold text-city-ink">Продвижение</h2>
          <p className="mt-3 leading-7 text-city-muted">
            Позже здесь появятся горячие активности недели, закрепление в подборках и расширенная статистика карточек.
          </p>
          <p className="mt-4 rounded-2xl bg-city-soft p-4 text-sm font-semibold text-city-ink">
            Базовое размещение в каталоге останется бесплатным.
          </p>
        </div>
      </section>
    </div>
  );
}
