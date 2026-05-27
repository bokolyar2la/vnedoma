import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-city-line bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-city-green text-lg font-bold text-white transition group-hover:bg-city-blue">
            В
          </span>
          <span>
            <span className="block text-lg font-semibold leading-5 text-city-ink">Вне дома</span>
            <span className="block text-xs font-medium text-city-muted">Тула</span>
          </span>
        </Link>
        <nav className="flex items-center gap-2 text-sm font-medium text-city-muted sm:gap-4">
          <Link href="/tula" className="transition hover:text-city-green">
            Каталог
          </Link>
          <Link href="/admin" className="hidden transition hover:text-city-green sm:inline">
            Админка
          </Link>
          <Link
            href="/add"
            className="rounded-full bg-city-green px-4 py-2 text-white transition hover:-translate-y-0.5 hover:bg-city-blue"
          >
            Добавить
          </Link>
        </nav>
      </div>
    </header>
  );
}
