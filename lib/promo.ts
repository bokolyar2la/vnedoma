export const DEFAULT_PROMO_CODE = "ВЛЮДИ";
export const DEFAULT_EVENT_DISCOUNT_TEXT = "Скидка 10% по промокоду ВЛЮДИ";

function clean(value: string | null | undefined) {
  return value?.trim() || "";
}

export function normalizePromoCode(value: string | null | undefined) {
  return clean(value).toUpperCase() || DEFAULT_PROMO_CODE;
}

export function normalizeDiscountText(value: string | null | undefined) {
  return clean(value);
}

export function getEventPromoText(input: {
  isPromoEnabled?: boolean | null;
  promoCode?: string | null;
  discountText?: string | null;
}) {
  if (input.isPromoEnabled !== true || !clean(input.discountText)) {
    return null;
  }

  const promoCode = normalizePromoCode(input.promoCode);
  const discountText = normalizeDiscountText(input.discountText);

  return {
    promoCode,
    discountText,
    instruction: `Назовите промокод ${promoCode} при записи или оплате у организатора.`
  };
}
