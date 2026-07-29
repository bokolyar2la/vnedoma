import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { registerOrganizer } from "@/app/organizer/actions";
import { OrganizerRegisterSubmitButton } from "@/app/organizer/register/submit-button";
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

      <form action={registerOrganizer} className="mt-8 space-y-6 rounded-3xl border border-city-line bg-white p-5 shadow-soft sm:p-6">
        <input type="hidden" name="activityId" value={activity.id} />

        <div className="grid gap-5">
          <div>
            <label htmlFor="name" className="text-sm font-semibold text-city-ink">
              Как вас представить
            </label>
            <input
              id="name"
              name="name"
              required
              className="mt-2 min-h-12 w-full rounded-2xl border border-city-line px-4 outline-none transition focus:border-city-green focus:ring-4 focus:ring-city-green/10"
              placeholder="Ваше имя или название организации"
            />
            <p className="mt-2 text-xs leading-5 text-city-muted">
              Это имя будет видно администратору при проверке заявки.
            </p>
          </div>

          <div>
            <label htmlFor="contact" className="text-sm font-semibold text-city-ink">
              Куда написать по заявке
            </label>
            <input
              id="contact"
              name="contact"
              required
              className="mt-2 min-h-12 w-full rounded-2xl border border-city-line px-4 outline-none transition focus:border-city-green focus:ring-4 focus:ring-city-green/10"
              placeholder="Telegram, VK, телефон или email"
            />
            <p className="mt-2 text-xs leading-5 text-city-muted">
              Подойдёт любой удобный контакт, если понадобится уточнение.
            </p>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="email" className="text-sm font-semibold text-city-ink">
              Email для входа и статуса
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="mt-2 min-h-12 w-full rounded-2xl border border-city-line px-4 outline-none transition focus:border-city-green focus:ring-4 focus:ring-city-green/10"
              placeholder="name@example.ru"
            />
            <p className="mt-2 text-xs leading-5 text-city-muted">
              На этот адрес придёт письмо о заявке и доступе.
            </p>
          </div>

          <div>
            <label htmlFor="password" className="text-sm font-semibold text-city-ink">
              Пароль для кабинета
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              className="mt-2 min-h-12 w-full rounded-2xl border border-city-line px-4 outline-none transition focus:border-city-green focus:ring-4 focus:ring-city-green/10"
              placeholder="Минимум 8 символов"
            />
            <p className="mt-2 text-xs leading-5 text-city-muted">
              Он понадобится, чтобы вернуться в кабинет после проверки.
            </p>
          </div>
        </div>

        <div>
          <label htmlFor="proofUrl" className="text-sm font-semibold text-city-ink">
            Подтверждение, что карточка ваша
          </label>
          <input
            id="proofUrl"
            name="proofUrl"
            className="mt-2 min-h-12 w-full rounded-2xl border border-city-line px-4 outline-none transition focus:border-city-green focus:ring-4 focus:ring-city-green/10"
            placeholder="Ссылка на сайт, группу, афишу или страницу организации"
          />
          <p className="mt-2 text-xs leading-5 text-city-muted">
            Можно вставить ссылку без https://. Если ссылки нет, опишите связь в комментарии.
          </p>
        </div>

        <div>
          <label htmlFor="message" className="text-sm font-semibold text-city-ink">
            Комментарий для проверки
          </label>
          <textarea
            id="message"
            name="message"
            rows={5}
            className="mt-2 w-full rounded-2xl border border-city-line px-4 py-3 outline-none transition focus:border-city-green focus:ring-4 focus:ring-city-green/10"
            placeholder="Напишите, как вы связаны с карточкой и что хотите обновлять"
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <OrganizerRegisterSubmitButton />
          <p className="text-xs leading-5 text-city-muted">
            После отправки откроется кабинет со статусом заявки.
          </p>
        </div>
      </form>

      <Link href="/organizer/login" className="mt-6 inline-flex text-sm font-semibold text-city-green hover:text-city-blue">
        Уже отправляли заявку или получили доступ? Войти
      </Link>
    </div>
  );
}
