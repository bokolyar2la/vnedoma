import type { Metadata } from "next";

const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "hello@vlyudi.ru";

export const metadata: Metadata = {
  title: "Политика обработки персональных данных",
  description:
    "Как Влюди обрабатывает данные пользователей и организаторов при добавлении активностей и обращениях по сайту."
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
        Эта политика объясняет, какие данные могут обрабатываться на сайте Влюди
        и для чего они используются.
      </p>

      <div className="mt-8 space-y-5 rounded-[30px] border border-city-line bg-white p-6 leading-7 text-city-muted shadow-soft">
        <section>
          <h2 className="text-2xl font-bold text-city-ink">Какие данные мы получаем</h2>
          <p className="mt-3">
            Когда пользователь добавляет активность или пишет по контактам проекта, он
            может передать название организации, имя или название организатора, телефон,
            ссылку для связи, адрес, описание активности и контакт для обратной связи.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-city-ink">Зачем нужны данные</h2>
          <p className="mt-3">
            Данные используются для проверки карточек, связи с заявителем, публикации
            информации об активности, исправления ошибок и удаления недостоверных сведений.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-city-ink">Что публикуется на сайте</h2>
          <p className="mt-3">
            В каталоге могут быть опубликованы название активности, описание, адрес,
            цена, категория, контактная ссылка или телефон организатора. Контакт
            заявителя, указанный только для связи с редакцией, не предназначен для
            публичной публикации.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-city-ink">Передача третьим лицам</h2>
          <p className="mt-3">
            Мы не продаем персональные данные. Данные могут обрабатываться техническими
            сервисами, которые обеспечивают работу сайта, хостинга, базы данных и почты.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-city-ink">Обращения по данным</h2>
          <p className="mt-3">
            Чтобы исправить или удалить информацию, напишите на{" "}
            <a className="font-semibold text-city-green" href={`mailto:${contactEmail}`}>
              {contactEmail}
            </a>
            . В обращении укажите ссылку на страницу и что именно нужно изменить.
          </p>
        </section>
      </div>
    </div>
  );
}
