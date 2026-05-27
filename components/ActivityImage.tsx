type ActivityImageProps = {
  title: string;
  categoryName: string;
  imageUrl: string | null;
  className?: string;
};

export function ActivityImage({
  title,
  categoryName,
  imageUrl,
  className = ""
}: ActivityImageProps) {
  const classes = `relative overflow-hidden rounded-2xl bg-city-soft ${className}`;

  if (imageUrl) {
    return (
      <div className={classes}>
        <img
          src={imageUrl}
          alt={title}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
        />
      </div>
    );
  }

  return (
    <div className={`${classes} flex min-h-40 items-center justify-center p-5`}>
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-city-green">
          {categoryName}
        </p>
        <p className="mt-2 text-lg font-bold leading-snug text-city-ink">{title}</p>
      </div>
    </div>
  );
}
