import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
      <h1 className="text-3xl font-bold text-city-ink">Страница не найдена</h1>
      <p className="mt-4 text-city-muted">
        Возможно, активность была снята с публикации или адрес изменился.
      </p>
      <Link
        href="/tula"
        className="mt-6 inline-flex rounded-full bg-city-green px-5 py-3 font-semibold text-white"
      >
        Перейти в каталог
      </Link>
    </div>
  );
}
