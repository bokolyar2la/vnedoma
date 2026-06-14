import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { registerOrganizer } from "@/app/organizer/actions";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Заявка на доступ к карточке",
  robots: {
    index: false,
    follow: false
  }
};

type RegisterPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getSingle(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

export default async function OrganizerRegisterPage({ searchParams }: RegisterPageProps) {
  const params = searchParams ? await searchParams : {};
  const activityId = Number(getSingle(params, "activityId"));
  const error = getSingle(params, "error");

  if (!Number.isInteger(activityId) || activityId <= 0) {
    notFound();
  }

  const activity = await prisma.activity.findUnique({
    where: { id: activityId },
    include: {
      organizer: true
    }
  });

  if (!activity) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-city-green">
        Влюди · доступ организатора
      </p>
      <h1 className="mt-3 text-3xl font-bold text-city-ink">
        Получить доступ к карточке
      </h1>
      <p className="mt-4 text-city-muted">
        Отправьте заявку, если вы представляете активность. Кабинет с правками и
        ближайшими событиями откроется только после ручного подтверждения.
      </p>

      <div className="mt-6 rounded-3xl border border-city-line bg-city-soft p-5">
        <p className="text-sm text-city-muted">Карточка</p>
        <p className="mt-1 text-lg font-bold text-city-ink">{activity.title}</p>
        <p className="mt-1 text-sm text-city-muted">{activity.organizer.name}</p>
      </div>

      {error ? (
        <div className="mt-6 rounded-2xl border border-city-coral/30 bg-city-coral/10 p-4 text-sm text-city-ink">
          {error}
        </div>
      ) : null}

      <form action={registerOrganizer} className="mt-8 space-y-5 rounded-3xl border border-city-line bg-white p-5 shadow-soft sm:p-6">
        <input type="hidden" name="activityId" value={activity.id} />

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className="text-sm font-semibold text-city-ink">
              Имя, клуб или студия
            </label>
            <input
              id="name"
              name="name"
              required
              className="mt-2 min-h-12 w-full rounded-2xl border border-city-line px-4 outline-none transition focus:border-city-green focus:ring-4 focus:ring-city-green/10"
              placeholder="Имя, название клуба или студии"
            />
          </div>

          <div>
            <label htmlFor="contact" className="text-sm font-semibold text-city-ink">
              Контакт для связи
            </label>
            <input
              id="contact"
              name="contact"
              required
              className="mt-2 min-h-12 w-full rounded-2xl border border-city-line px-4 outline-none transition focus:border-city-green focus:ring-4 focus:ring-city-green/10"
              placeholder="Telegram, VK, телефон или email"
            />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="email" className="text-sm font-semibold text-city-ink">
              Email для проверки статуса
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="mt-2 min-h-12 w-full rounded-2xl border border-city-line px-4 outline-none transition focus:border-city-green focus:ring-4 focus:ring-city-green/10"
              placeholder="name@example.ru"
            />
          </div>

          <div>
            <label htmlFor="password" className="text-sm font-semibold text-city-ink">
              Пароль для повторного входа
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              className="mt-2 min-h-12 w-full rounded-2xl border border-city-line px-4 outline-none transition focus:border-city-green focus:ring-4 focus:ring-city-green/10"
              placeholder="минимум 8 символов"
            />
          </div>
        </div>

        <div>
          <label htmlFor="proofUrl" className="text-sm font-semibold text-city-ink">
            Ссылка для подтверждения
          </label>
          <input
            id="proofUrl"
            name="proofUrl"
            className="mt-2 min-h-12 w-full rounded-2xl border border-city-line px-4 outline-none transition focus:border-city-green focus:ring-4 focus:ring-city-green/10"
            placeholder="официальная группа, сайт, Timepad или пост"
          />
          <p className="mt-2 text-xs leading-5 text-city-muted">
            Можно вставить ссылку без https://. Если подтверждения недостаточно, мы напишем и уточним.
          </p>
        </div>

        <div>
          <label htmlFor="message" className="text-sm font-semibold text-city-ink">
            Комментарий
          </label>
          <textarea
            id="message"
            name="message"
            rows={4}
            className="mt-2 w-full rounded-2xl border border-city-line px-4 py-3 outline-none transition focus:border-city-green focus:ring-4 focus:ring-city-green/10"
            placeholder="Кто вы и что хотите обновлять в карточке"
          />
        </div>

        <button className="min-h-12 rounded-full bg-city-green px-6 font-semibold text-white transition hover:bg-city-blue">
          Отправить на проверку
        </button>
      </form>

      <Link href="/organizer/login" className="mt-6 inline-flex text-sm font-semibold text-city-green hover:text-city-blue">
        Уже отправляли заявку или получили доступ? Войти
      </Link>
    </div>
  );
}
