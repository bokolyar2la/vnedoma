import Link from "next/link";
import { ActivityImage } from "@/components/ActivityImage";
import { formatPrice } from "@/lib/format";

type ActivityCardProps = {
  activity: {
    title: string;
    slug: string;
    description: string;
    address: string;
    priceFrom: number | null;
    priceTo: number | null;
    isFree: boolean;
    isForAdults: boolean;
    beginnerFriendly: boolean;
    canComeAlone: boolean;
    imageUrl?: string | null;
    category: {
      name: string;
    };
  };
};

export function ActivityCard({ activity }: ActivityCardProps) {
  const badges = [
    activity.beginnerFriendly ? "Новичкам" : null,
    activity.canComeAlone ? "Можно одному" : null,
    activity.isFree ? "Бесплатно" : null
  ].filter((badge): badge is string => Boolean(badge));

  return (
    <article className="group flex h-full flex-col rounded-2xl border border-city-line bg-white p-4 shadow-soft transition hover:-translate-y-1 hover:border-city-green/60 hover:shadow-lg">
      <ActivityImage
        title={activity.title}
        categoryName={activity.category.name}
        imageUrl={activity.imageUrl ?? null}
        className="aspect-[16/10]"
      />
      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="rounded-full bg-city-soft px-3 py-1 text-xs font-semibold text-city-green">
          {activity.category.name}
        </span>
        <span className="shrink-0 text-sm font-semibold text-city-ink">
          {formatPrice(activity)}
        </span>
      </div>
      <h3 className="mt-4 text-xl font-semibold leading-snug text-city-ink">
        {activity.title}
      </h3>
      <p className="mt-3 line-clamp-3 text-sm leading-6 text-city-muted">
        {activity.description}
      </p>
      <p className="mt-4 text-sm font-medium leading-6 text-city-ink">
        {activity.address}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {badges.map((badge) => (
          <span
            key={badge}
            className="rounded-full border border-city-line px-3 py-1 text-xs text-city-muted"
          >
            {badge}
          </span>
        ))}
      </div>
      <Link
        href={`/activity/${activity.slug}`}
        className="mt-5 inline-flex w-fit items-center rounded-full bg-city-ink px-4 py-2 text-sm font-semibold text-white transition group-hover:bg-city-green"
      >
        Подробнее
      </Link>
    </article>
  );
}
