type BookingNotificationInput = {
  activityTitle: string;
  customerName: string;
  customerContact: string;
  message?: string | null;
  notificationEmail?: string | null;
  notificationTelegram?: string | null;
  discountText?: string | null;
};

function buildBookingText(input: BookingNotificationInput) {
  return [
    `Новая заявка через Влюди: ${input.activityTitle}`,
    `Имя: ${input.customerName}`,
    `Контакт: ${input.customerContact}`,
    input.message ? `Комментарий: ${input.message}` : null,
    input.discountText ? `Условие: ${input.discountText}` : null
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n");
}

export async function notifyOrganizerAboutBooking(input: BookingNotificationInput) {
  const text = buildBookingText(input);
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
