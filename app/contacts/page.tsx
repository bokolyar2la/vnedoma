import type { Metadata } from "next";
import Link from "next/link";
import { legalConfig, legalOwnerLabel } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Контакты",
  description:
    "Контакты проекта Влюди: как сообщить об ошибке, добавить активность или попросить удалить информацию."
};

export default function ContactsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-city-green">
        Влюди · контакты
      </p>
      <h1 className="mt-3 text-3xl font-bold text-city-ink sm:text-5xl">
        Контакты проекта
      </h1>
      <p className="mt-5 text-lg leading-8 text-city-muted">
        Влюди собирает социальные активности в Туле: встречи, клубы, прогулки,
        мастер-классы и другие форматы, куда можно прийти одному и оказаться среди людей.
      </p>

      <section className="mt-8 rounded-[30px] border border-city-line bg-white p-6 shadow-soft">
        <h2 className="text-2xl font-bold text-city-ink">Для связи</h2>
        <p className="mt-4 leading-7 text-city-muted">
          По вопросам исправления информации, удаления карточки, добавления активности
          или сотрудничества напишите на{" "}
          <a className="font-semibold text-city-green" href={`mailto:${legalConfig.contactEmail}`}>
            {legalConfig.contactEmail}
          </a>
          .
        </p>
        <p className="mt-3 leading-7 text-city-muted">Владелец проекта: {legalOwnerLabel}.</p>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-[24px] border border-city-line bg-white p-5 shadow-soft">
          <h2 className="text-xl font-bold text-city-ink">Для организаторов</h2>
          <p className="mt-3 leading-7 text-city-muted">
            Если вы проводите офлайн-активности в Туле, добавьте карточку через форму.
            После проверки она может появиться в каталоге.
          </p>
          <Link
            href="/add"
            className="mt-5 inline-flex rounded-full bg-city-green px-5 py-3 text-sm font-semibold text-white transition hover:bg-city-blue"
          >
            Добавить активность
          </Link>
        </div>

        <div className="rounded-[24px] border border-city-line bg-white p-5 shadow-soft">
          <h2 className="text-xl font-bold text-city-ink">Для пользователей</h2>
          <p className="mt-3 leading-7 text-city-muted">
            Если вы нашли ошибку в адресе, цене, описании или ссылке для записи,
            напишите нам. Мы проверим информацию и обновим карточку.
          </p>
        </div>
      </section>
    </div>
  );
}
