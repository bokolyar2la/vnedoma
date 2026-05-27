import Link from "next/link";

type Breadcrumb = {
  label: string;
  href?: string;
};

type BreadcrumbsProps = {
  items: Breadcrumb[];
};

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Навигационная цепочка" className="text-sm text-city-muted">
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex items-center gap-2">
            {index > 0 ? <span className="text-city-muted/50">/</span> : null}
            {item.href ? (
              <Link href={item.href} className="transition hover:text-city-green">
                {item.label}
              </Link>
            ) : (
              <span className="font-medium text-city-ink">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
