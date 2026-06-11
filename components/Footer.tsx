import Link from "next/link";
import { legalConfig, legalOwnerLabel } from "@/lib/legal";

const footerLinks = [
  { label: "Организаторам", href: "/organizers" },
  { label: "Контакты", href: "/contacts" },
  { label: "Политика обработки данных", href: "/privacy" },
  { label: "Согласие на обработку данных", href: "/personal-data-consent" },
  { label: "Пользовательское соглашение", href: "/terms" }
];

export function Footer() {
  return (
    <footer className="mt-16 border-t border-city-line/80 bg-white/80">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 text-sm text-city-muted sm:px-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <Link href="/" className="inline-flex items-center gap-3 text-city-ink">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-city-green text-base font-extrabold text-white">
              В
            </span>
            <span>
              <span className="block text-xl font-black leading-5">влюди</span>
              <span className="block text-xs text-city-muted">Тула</span>
            </span>
          </Link>
          <p className="mt-4 max-w-2xl leading-6">
            Влюди - справочный каталог социальных активностей в Туле. Информация
            не является публичной офертой. Расписание, цены, наличие мест и условия
            участия уточняйте у организаторов.
          </p>
          <p className="mt-3 leading-6">Владелец проекта: {legalOwnerLabel}.</p>
          <p className="mt-3 leading-6">
            Для исправления информации или удаления карточки напишите на{" "}
            <a className="font-semibold text-city-green" href={`mailto:${legalConfig.contactEmail}`}>
              {legalConfig.contactEmail}
            </a>
            .
          </p>
        </div>

        <nav className="flex flex-col gap-3 lg:items-end">
          {footerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-semibold text-city-ink transition hover:text-city-green"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
