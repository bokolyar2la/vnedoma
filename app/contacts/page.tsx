import type { Metadata } from "next";
import Link from "next/link";
import { legalConfig, legalOwnerLabel } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Контакты",
  description:
    "Контакты проекта Влюди в Туле: как сообщить об ошибке, добавить активность, уточнить информацию или попросить удалить карточку."
};

export default function ContactsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-city-green">
        Влюди · Тула и Тульская область
      </p>
      <h1 className="mt-3 text-3xl font-bold text-city-ink sm:text-5xl">
        Контакты проекта Влюди
      </h1>
      <p className="mt-5 text-lg leading-8 text-city-muted">
        Влюди — справочный каталог социальных активностей в Туле. Мы собираем встречи,
        клубы, прогулки, мастер-классы и другие офлайн-форматы, куда можно прийти одному
        и оказаться среди людей.
      </p>

      <div className="mt-8 grid gap-5">
        <section className="rounded-[30px] border border-city-line bg-white p-6 shadow-soft">
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

        <section className="rounded-[30px] border border-city-line bg-white p-6 shadow-soft">
          <h2 className="text-2xl font-bold text-city-ink">Регион проекта</h2>
          <p className="mt-4 leading-7 text-city-muted">
            Сейчас Влюди работает с активностями в Туле и Тульской области. Основной каталог
            находится на странице{" "}
            <Link className="font-semibold text-city-green" href="/tula">
              активности в Туле
            </Link>
            , а быстрые подборки помогают найти{" "}
            <Link className="font-semibold text-city-green" href="/tula/besplatno">
              бесплатные занятия
            </Link>
            , форматы{" "}
            <Link className="font-semibold text-city-green" href="/tula/mozhno-odnomu">
              куда можно прийти одному
            </Link>{" "}
            и места{" "}
            <Link className="font-semibold text-city-green" href="/tula/gde-poznakomitsya">
              где познакомиться с людьми
            </Link>
            .
          </p>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
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

        <section className="rounded-[24px] bg-city-soft p-5">
          <h2 className="text-xl font-bold text-city-ink">Важное уточнение</h2>
          <p className="mt-3 leading-7 text-city-muted">
            Информация на сайте носит справочный характер и не является публичной офертой.
            Расписание, цены, наличие мест и условия участия лучше уточнять у организаторов
            перед посещением.
          </p>
        </section>
      </div>
    </div>
  );
}
