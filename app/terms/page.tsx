import type { Metadata } from "next";
import Link from "next/link";
import { legalConfig, legalOwnerLabel } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Пользовательское соглашение",
  description:
    "Правила использования каталога Влюди, добавления активностей и работы со справочной информацией.",
  alternates: { canonical: "/terms" },
  robots: { index: false, follow: true }
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

      <div className="mt-8 space-y-6 rounded-[30px] border border-city-line bg-white p-6 leading-7 text-city-muted shadow-soft">
        <section>
          <h2 className="text-2xl font-bold text-city-ink">Владелец проекта</h2>
          <p className="mt-3">
            Владелец сайта: {legalOwnerLabel}. Контакт для обращений:{" "}
            <a className="font-semibold text-city-green" href={`mailto:${legalConfig.contactEmail}`}>
              {legalConfig.contactEmail}
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-city-ink">Справочный характер информации</h2>
          <p className="mt-3">
            Информация на сайте носит справочный характер и не является публичной
            офертой. Расписание, цены, возрастные ограничения, наличие мест и условия
            участия нужно уточнять у организаторов.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-city-ink">Влюди не является организатором</h2>
          <p className="mt-3">
            Влюди не проводит активности, не продает билеты, не принимает оплату за
            участие и не заключает договоры от имени организаторов. Запись, оплата,
            возвраты и участие происходят напрямую между пользователем и организатором.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-city-ink">Ответственность организаторов</h2>
          <p className="mt-3">
            Организаторы отвечают за фактическое проведение активности, качество услуг,
            безопасность участников, актуальность условий, соблюдение закона и обработку
            заявок, которые пользователь отправляет им вне сайта Влюди.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-city-ink">Добавление активностей</h2>
          <p className="mt-3">
            Пользователь может предложить активность через страницу{" "}
            <Link className="font-semibold text-city-green" href="/add">
              добавления
            </Link>
            . Отправляя форму, пользователь подтверждает, что имеет право передать эту
            информацию, а размещение описания, ссылок, контактов и изображений не нарушает
            права третьих лиц.
          </p>
          <p className="mt-3">
            Отправка формы не гарантирует публикацию. Влюди может редактировать,
            отклонять, архивировать или удалять карточки, если информация неполная,
            устаревшая, недостоверная, нарушает права третьих лиц или не подходит
            тематике каталога.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-city-ink">Реклама и платное размещение</h2>
          <p className="mt-3">
            На текущем этапе каталог работает как справочный проект. Если в будущем на
            сайте появятся платные рекламные размещения или продвижение карточек, такие
            материалы будут оформляться с учетом требований законодательства о рекламе,
            включая необходимую маркировку.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-city-ink">Исправление и удаление информации</h2>
          <p className="mt-3">
            Если карточка содержит ошибку, нарушает права третьих лиц или должна быть
            удалена, напишите на{" "}
            <a className="font-semibold text-city-green" href={`mailto:${legalConfig.contactEmail}`}>
              {legalConfig.contactEmail}
            </a>
            . В обращении укажите ссылку на страницу и суть проблемы.
          </p>
        </section>
      </div>
    </div>
  );
}
