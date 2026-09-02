export function formatPrice(options: {
  isFree: boolean;
  priceFrom: number | null;
  priceTo: number | null;
  priceNote?: string | null;
}) {
  if (options.priceNote) {
    return options.priceNote;
  }

  if (options.isFree) {
    return "Бесплатно";
  }

  if (options.priceFrom && options.priceTo) {
    return `${options.priceFrom.toLocaleString("ru-RU")}–${options.priceTo.toLocaleString("ru-RU")} ₽`;
  }

  if (options.priceFrom) {
    return `от ${options.priceFrom.toLocaleString("ru-RU")} ₽`;
  }

  if (options.priceTo) {
    return `до ${options.priceTo.toLocaleString("ru-RU")} ₽`;
  }

  return "Цена уточняется";
}

export function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "Europe/Moscow"
  }).format(date);
}
