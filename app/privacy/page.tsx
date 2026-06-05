import type { Metadata } from "next";
import { legalConfig, legalOwnerLabel } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Политика обработки персональных данных",
  description:
    "Как Влюди обрабатывает персональные данные пользователей и организаторов при добавлении активностей и обращениях по сайту."
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-city-green">
        Влюди · документы
      </p>
      <h1 className="mt-3 text-3xl font-bold text-city-ink sm:text-5xl">
        Политика обработки персональных данных
      </h1>
      <p className="mt-5 text-lg leading-8 text-city-muted">
        Политика описывает, какие данные обрабатываются на сайте {legalConfig.siteUrl},
        зачем они нужны и как пользователь может обратиться по вопросам обработки данных.
      </p>

      <div className="mt-8 space-y-6 rounded-[30px] border border-city-line bg-white p-6 leading-7 text-city-muted shadow-soft">
        <section>
          <h2 className="text-2xl font-bold text-city-ink">Оператор данных</h2>
          <p className="mt-3">
            Оператор персональных данных и владелец проекта: {legalOwnerLabel}. Контакт
            для обращений по персональным данным:{" "}
            <a className="font-semibold text-city-green" href={`mailto:${legalConfig.contactEmail}`}>
              {legalConfig.contactEmail}
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-city-ink">Какие данные обрабатываются</h2>
          <p className="mt-3">
            При добавлении активности или обращении по контактам пользователь может
            передать название организации или проекта, имя или название организатора,
            телефон, email, ссылку для связи, адрес, описание активности, контакт
            заявителя и иную информацию, которую он сам указывает в форме.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-city-ink">Цели обработки</h2>
          <p className="mt-3">
            Данные используются для приема и проверки заявок, связи с заявителем,
            публикации карточек активностей, исправления ошибок, удаления недостоверной
            информации, защиты сайта от злоупотреблений и выполнения требований закона.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-city-ink">Что может быть опубликовано</h2>
          <p className="mt-3">
            В каталоге могут быть опубликованы название активности, описание, адрес,
            цена, категория, изображение, контактная ссылка или телефон организатора.
            Контакт заявителя, указанный только для связи с редакцией, не предназначен
            для публичной публикации.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-city-ink">Правовые основания</h2>
          <p className="mt-3">
            Обработка выполняется на основании согласия пользователя, пользовательского
            соглашения, обращений пользователя и законных интересов оператора по
            поддержанию справочного каталога и защите его работы.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-city-ink">Срок хранения</h2>
          <p className="mt-3">
            Данные хранятся столько, сколько необходимо для целей обработки: пока
            карточка находится в каталоге, пока рассматривается обращение, либо пока
            требуется хранение для защиты прав и законных интересов. Пользователь может
            попросить удалить или исправить данные.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-city-ink">Передача и хранение</h2>
          <p className="mt-3">
            Данные могут обрабатываться техническими сервисами, которые обеспечивают
            работу сайта, хостинга, базы данных и почты. База данных проекта размещается
            у российского хостинг-провайдера Timeweb Cloud.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-city-ink">Cookies и аналитика</h2>
          <p className="mt-3">
            Сайт может использовать технические cookies, необходимые для работы сервиса.
            При подключении Яндекс.Метрики данные о посещениях будут использоваться для
            анализа работы сайта и улучшения каталога. Пользователь может ограничить
            использование cookies в настройках браузера.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-city-ink">Как отозвать согласие</h2>
          <p className="mt-3">
            Чтобы отозвать согласие, исправить или удалить данные, напишите на{" "}
            <a className="font-semibold text-city-green" href={`mailto:${legalConfig.contactEmail}`}>
              {legalConfig.contactEmail}
            </a>
            . В обращении укажите ссылку на страницу и что именно нужно изменить или удалить.
          </p>
        </section>
      </div>
    </div>
  );
}
