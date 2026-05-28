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
    <Link
      href={`/activity/${activity.slug}`}
      className="group block h-full rounded-[28px] bg-white p-3 shadow-soft ring-1 ring-city-line/80 transition duration-300 hover:-translate-y-1 hover:shadow-lg hover:ring-city-green/40"
      aria-label={activity.title}
    >
      <div className="relative">
        <ActivityImage
          title={activity.title}
          categoryName={activity.category.name}
          imageUrl={activity.imageUrl ?? null}
          className="aspect-[16/10]"
        />
        <div className="pointer-events-none absolute inset-x-3 top-3 flex items-start justify-between gap-3">
          <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-city-green shadow-sm backdrop-blur">
            {activity.category.name}
          </span>
          <span className="rounded-full bg-city-ink/90 px-3 py-1 text-xs font-semibold text-white shadow-sm backdrop-blur">
            {formatPrice(activity)}
          </span>
        </div>
      </div>

      <div className="px-2 pb-2 pt-4">
        <h3 className="text-xl font-bold leading-snug text-city-ink transition group-hover:text-city-green">
          {activity.title}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-city-muted">
          {activity.description}
        </p>
        <p className="mt-3 line-clamp-1 text-sm font-medium text-city-ink">
          Место: {activity.address}
        </p>
        {badges.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {badges.map((badge) => (
              <span
                key={badge}
                className="rounded-full bg-city-soft px-3 py-1 text-xs font-medium text-city-green"
              >
                {badge}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </Link>
  );
}
