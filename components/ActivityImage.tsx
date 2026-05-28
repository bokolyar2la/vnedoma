type ActivityImageProps = {
  title: string;
  categoryName: string;
  imageUrl: string | null;
  className?: string;
};

type CategoryVisual = {
  gradient: string;
  symbol: string;
  accent: string;
};

function getCategoryVisual(categoryName: string): CategoryVisual {
  const name = categoryName.toLowerCase();

  if (name.includes("твор")) {
    return {
      gradient: "from-[#fff1d8] via-[#ffd6b8] to-[#f7a98f]",
      symbol: "✦",
      accent: "text-[#9a4b2f]"
    };
  }

  if (name.includes("спорт")) {
    return {
      gradient: "from-[#dff8ec] via-[#bfe8e8] to-[#8ec7df]",
      symbol: "↗",
      accent: "text-[#166b63]"
    };
  }

  if (name.includes("танц")) {
    return {
      gradient: "from-[#ffe2ef] via-[#ffc0b0] to-[#f49a63]",
      symbol: "♪",
      accent: "text-[#9a3f52]"
    };
  }

  if (name.includes("лекц")) {
    return {
      gradient: "from-[#e8eef5] via-[#cfdbe8] to-[#9fb5c8]",
      symbol: "§",
      accent: "text-[#41566b]"
    };
  }

  if (name.includes("обуч")) {
    return {
      gradient: "from-[#eef0ff] via-[#d7e2ff] to-[#b8c9f2]",
      symbol: "A",
      accent: "text-[#4658a8]"
    };
  }

  if (name.includes("встреч") || name.includes("клуб")) {
    return {
      gradient: "from-[#eef6dc] via-[#dbecc7] to-[#b9d7b1]",
      symbol: "•",
      accent: "text-[#4f7448]"
    };
  }

  return {
    gradient: "from-[#edf7f4] via-[#d9ece6] to-[#c4dfd6]",
    symbol: "•",
    accent: "text-city-green"
  };
}

export function ActivityImage({
  title,
  categoryName,
  imageUrl,
  className = ""
}: ActivityImageProps) {
  const visual = getCategoryVisual(categoryName);
  const classes = `relative overflow-hidden rounded-[24px] ${className}`;

  if (imageUrl) {
    return (
      <div className={`${classes} bg-city-soft`}>
        <img
          src={imageUrl}
          alt={title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
      </div>
    );
  }

  return (
    <div className={`${classes} bg-gradient-to-br ${visual.gradient}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,0.75),transparent_32%),radial-gradient(circle_at_75%_80%,rgba(255,255,255,0.38),transparent_30%)]" />
      <div className="absolute inset-x-5 bottom-5 flex items-end justify-between gap-4">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-wide ${visual.accent}`}>
            {categoryName}
          </p>
          <p className="mt-1 max-w-[11rem] text-sm font-semibold leading-snug text-city-ink/75">
            Вне дома
          </p>
        </div>
        <span className={`text-5xl font-bold leading-none ${visual.accent} opacity-75`}>
          {visual.symbol}
        </span>
      </div>
    </div>
  );
}
