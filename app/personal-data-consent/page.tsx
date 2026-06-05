import type { Metadata } from "next";
import { legalConfig, legalOwnerLabel } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Согласие на обработку персональных данных",
  description:
    "Согласие пользователя на обработку персональных данных при добавлении активности или обращении через сайт Влюди."
};

export default function PersonalDataConsentPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-city-green">
        Влюди · документы
      </p>
      <h1 className="mt-3 text-3xl font-bold text-city-ink sm:text-5xl">
        Согласие на обработку персональных данных
      </h1>
      <p className="mt-5 text-lg leading-8 text-city-muted">
        Отправляя форму на сайте {legalConfig.siteUrl}, пользователь дает согласие на
        обработку персональных данных на условиях ниже.
      </p>

      <div className="mt-8 space-y-6 rounded-[30px] border border-city-line bg-white p-6 leading-7 text-city-muted shadow-soft">
        <section>
          <h2 className="text-2xl font-bold text-city-ink">Оператор</h2>
          <p className="mt-3">
            {legalOwnerLabel}. Контакт для обращений:{" "}
            <a className="font-semibold text-city-green" href={`mailto:${legalConfig.contactEmail}`}>
              {legalConfig.contactEmail}
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-city-ink">Данные</h2>
          <p className="mt-3">
            Согласие распространяется на данные, которые пользователь сам передает через
            формы сайта: имя или название организатора, телефон, email, ссылку для связи,
            контакт заявителя, адрес, описание активности и иную информацию из формы.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-city-ink">Цели</h2>
          <p className="mt-3">
            Данные обрабатываются для приема заявки, проверки информации, связи с
            заявителем, публикации карточки активности, исправления ошибок и рассмотрения
            обращений.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-city-ink">Действия с данными</h2>
          <p className="mt-3">
            Оператор может собирать, записывать, систематизировать, хранить, уточнять,
            использовать, публиковать часть сведений в карточке активности, блокировать,
            удалять и уничтожать данные в пределах указанных целей.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-city-ink">Срок и отзыв согласия</h2>
          <p className="mt-3">
            Согласие действует до достижения целей обработки или до его отзыва. Чтобы
            отозвать согласие, исправить или удалить данные, напишите на{" "}
            <a className="font-semibold text-city-green" href={`mailto:${legalConfig.contactEmail}`}>
              {legalConfig.contactEmail}
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
