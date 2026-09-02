import { getAppBaseUrl, sendServiceEmail, textToHtml } from "@/lib/email";

type BookingNotificationInput = {
  activityTitle: string;
  customerName: string;
  customerContact: string;
  message?: string | null;
  notificationEmail?: string | null;
  notificationTelegram?: string | null;
  discountText?: string | null;
};

type OrganizerServiceNotificationInput = {
  email?: string | null;
  name?: string | null;
  activityTitle?: string | null;
  organizerName?: string | null;
};

type ActivitySubmissionNotificationInput = {
  activityId?: number | null;
  activityTitle: string;
  activitySlug?: string | null;
  organizerName?: string | null;
  submitterContact?: string | null;
  contactPhone?: string | null;
  contactUrl?: string | null;
  description?: string | null;
};

const DEFAULT_DISCOUNT_TEXT =
  "Скидка 10% по промокоду ВЛЮДИ. Попросите участника назвать промокод при записи или оплате.";
const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;

export function extractEmailAddress(value?: string | null) {
  return value?.match(EMAIL_PATTERN)?.[0] ?? null;
}

function cleanOptional(value?: string | null) {
  const trimmed = value?.trim();

  if (!trimmed || /[ÐÑ]/.test(trimmed)) {
    return null;
  }

  return trimmed;
}

function buildBookingText(input: BookingNotificationInput) {
  const discountText = cleanOptional(input.discountText) || DEFAULT_DISCOUNT_TEXT;

  return [
    `У вас новая заявка на активность «${input.activityTitle}» через Влюди.`,
    "",
    "Свяжитесь с участником напрямую по указанному контакту и уточните детали записи.",
    "",
    `Имя: ${input.customerName}`,
    `Контакт: ${input.customerContact}`,
    input.message ? `Комментарий: ${input.message}` : null,
    `Бонус для участника: ${discountText}`,
    "",
    `Посмотреть заявку: ${getAppBaseUrl()}/organizer?tab=requests`
  ]
    .filter((line): line is string => line !== null)
    .join("\n");
}

async function sendEmailSafely(to: string | null | undefined, subject: string, text: string) {
  const email = to?.trim();

  if (!email) {
    return;
  }

  try {
    const result = await sendServiceEmail({
      to: email,
      subject,
      text,
      html: textToHtml(text)
    });

    if (result.status === "skipped") {
      console.warn(`Service email skipped: ${result.reason}`, { to: email, subject });
    }
  } catch (error) {
    console.error("Failed to send service email", error);
  }
}

export async function notifySubmitterActivityReceived(
  input: ActivitySubmissionNotificationInput
) {
  const email = extractEmailAddress(input.submitterContact);
  const text = [
    input.organizerName ? `${input.organizerName}, здравствуйте!` : "Здравствуйте!",
    "",
    `Ваша заявка на добавление активности «${input.activityTitle}» принята.`,
    "Скоро проверим информацию и, если всё в порядке, опубликуем карточку во Влюди.",
    "После публикации пришлём письмо со ссылкой, чтобы запросить доступ к карточке для редактирования и добавления событий.",
    "",
    "Влюди"
  ].join("\n");

  await sendEmailSafely(email, "Активность отправлена на проверку", text);
}

export async function notifySubmitterActivityPublished(
  input: ActivitySubmissionNotificationInput
) {
  const email = extractEmailAddress(input.submitterContact);
  const activityUrl = input.activitySlug
    ? `${getAppBaseUrl()}/activity/${input.activitySlug}`
    : getAppBaseUrl();
  const claimUrl = input.activityId
    ? `${getAppBaseUrl()}/organizer/register?activityId=${input.activityId}`
    : `${getAppBaseUrl()}/organizer/claim`;
  const text = [
    input.organizerName ? `${input.organizerName}, здравствуйте!` : "Здравствуйте!",
    "",
    `Круто, ваша заявка одобрена: карточка «${input.activityTitle}» опубликована во Влюди.`,
    "Теперь можно запросить доступ к карточке, чтобы редактировать её и добавлять ближайшие события.",
    "",
    `Запросить доступ: ${claimUrl}`,
    `Открыть опубликованную карточку: ${activityUrl}`,
    "",
    "Влюди"
  ].join("\n");

  await sendEmailSafely(email, "Ваша карточка опубликована во Влюди", text);
}

export async function notifyOrganizerAboutBooking(input: BookingNotificationInput) {
  const text = buildBookingText(input);

  await sendEmailSafely(
    input.notificationEmail,
    `Новая заявка на «${input.activityTitle}»`,
    text
  );

  const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
  const telegramChatId = input.notificationTelegram?.trim();
  const notificationWebhookUrl = process.env.NOTIFICATION_WEBHOOK_URL;

  if (telegramToken && telegramChatId && /^-?\d+$/.test(telegramChatId)) {
    await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: telegramChatId,
        text
      })
    }).catch(() => null);
  }

  if (notificationWebhookUrl) {
    await fetch(notificationWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "activity_booking_request",
        email: input.notificationEmail,
        telegram: input.notificationTelegram,
        text,
        payload: input
      })
    }).catch(() => null);
  }
}

export async function notifyOrganizerRegistrationReceived(
  input: OrganizerServiceNotificationInput
) {
  const title = cleanOptional(input.activityTitle);
  const text = [
    input.name ? `${input.name}, здравствуйте!` : "Здравствуйте!",
    "",
    "Заявка на кабинет получена, после проверки доступ откроется.",
    title ? `Карточка: ${title}` : null,
    "",
    `Кабинет организатора: ${getAppBaseUrl()}/organizer`
  ]
    .filter((line): line is string => line !== null)
    .join("\n");

  await sendEmailSafely(
    input.email,
    "Заявка на кабинет Влюди получена",
    text
  );
}

export async function notifyOrganizerAccessApproved(
  input: OrganizerServiceNotificationInput
) {
  const title = cleanOptional(input.activityTitle);
  const organizerName = cleanOptional(input.organizerName);
  const cabinetUrl = `${getAppBaseUrl()}/organizer`;
  const bookingSettingsUrl = `${getAppBaseUrl()}/organizer?tab=settings`;
  const requestsUrl = `${getAppBaseUrl()}/organizer?tab=requests`;
  const text = [
    input.name ? `${input.name}, здравствуйте!` : "Здравствуйте!",
    "",
    "Доступ к кабинету Влюди открыт.",
    title ? `Карточка: ${title}` : null,
    organizerName ? `Организатор: ${organizerName}` : null,
    "",
    "Теперь в кабинете можно:",
    "1. Добавлять ближайшие даты и события.",
    "2. Отправлять правки к описанию, цене, адресу и контактам.",
    "3. Включить запись через Влюди, чтобы участники оставляли заявки на странице активности.",
    "4. Смотреть заявки в разделе «Заявки и правки».",
    "",
    `Открыть кабинет: ${cabinetUrl}`,
    `Включить запись через Влюди: ${bookingSettingsUrl}`,
    `Смотреть заявки: ${requestsUrl}`
  ]
    .filter((line): line is string => line !== null)
    .join("\n");

  await sendEmailSafely(
    input.email,
    "Доступ к кабинету Влюди открыт: что можно сделать дальше",
    text
  );
}
