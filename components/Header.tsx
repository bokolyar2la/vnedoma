import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-city-line/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="group flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-city-green text-lg font-bold text-white shadow-sm transition group-hover:bg-city-blue">
            В
          </span>
          <span className="min-w-0">
            <span className="block text-lg font-bold leading-5 text-city-ink">Влюди</span>
            <span className="block text-xs font-medium text-city-muted">Тула</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1 rounded-full bg-city-soft/80 p-1 text-sm font-semibold text-city-muted sm:gap-2">
          <Link
            href="/tula"
            className="rounded-full px-3 py-2 transition hover:bg-white hover:text-city-green hover:shadow-sm"
          >
            Каталог
          </Link>
          <Link
            href="/add"
            className="rounded-full bg-city-green px-4 py-2 text-white shadow-sm transition hover:bg-city-blue"
          >
            Добавить
          </Link>
        </nav>
      </div>
    </header>
  );
}
