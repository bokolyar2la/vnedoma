import type { Metadata } from "next";
import Link from "next/link";

const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "hello@vlyudi.ru";

export const metadata: Metadata = {
  title: "Пользовательское соглашение",
  description:
    "Правила использования каталога Влюди, добавления активностей и работы со справочной информацией."
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-city-green">
        Влюди · документы
      </p>
      <h1 className="mt-3 text-3xl font-bold text-city-ink sm:text-5xl">
        Пользовательское соглашение
      </h1>
      <p className="mt-5 text-lg leading-8 text-city-muted">
        Сайт Влюди помогает находить офлайн-активности в Туле. Используя сайт,
        пользователь принимает эти правила.
      </p>

      <div className="mt-8 space-y-5 rounded-[30px] border border-city-line bg-white p-6 leading-7 text-city-muted shadow-soft">
        <section>
          <h2 className="text-2xl font-bold text-city-ink">Справочный характер</h2>
          <p className="mt-3">
            Информация на сайте носит справочный характер. Расписание, цены, возрастные
            ограничения, наличие мест и условия участия нужно уточнять у организаторов.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-city-ink">Добавление активностей</h2>
          <p className="mt-3">
            Пользователь может предложить активность через страницу{" "}
            <Link className="font-semibold text-city-green" href="/add">
              добавления
            </Link>
            . Отправка формы не гарантирует публикацию. Мы можем редактировать,
            отклонять, архивировать или удалять карточки, если информация неполная,
            устаревшая, недостоверная или не подходит тематике каталога.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-city-ink">Ответственность организаторов</h2>
          <p className="mt-3">
            Организаторы отвечают за фактическое проведение активности, качество услуг,
            безопасность участников, актуальность условий и соблюдение применимых правил.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-city-ink">Исправление информации</h2>
          <p className="mt-3">
            Если карточка содержит ошибку или должна быть удалена, напишите на{" "}
            <a className="font-semibold text-city-green" href={`mailto:${contactEmail}`}>
              {contactEmail}
            </a>
            . Мы рассмотрим обращение и обновим информацию при подтверждении.
          </p>
        </section>
      </div>
    </div>
  );
}
