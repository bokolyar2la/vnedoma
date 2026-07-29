"use client";

import { useState } from "react";

export function SubmitterContactFields() {
  const [submittedByOrganizer, setSubmittedByOrganizer] = useState(false);

  return (
    <section className="rounded-3xl bg-city-soft p-4">
      <label className="flex items-start gap-3 text-sm font-semibold text-city-ink">
        <input
          name="submittedByOrganizer"
          type="checkbox"
          checked={submittedByOrganizer}
          onChange={(event) => setSubmittedByOrganizer(event.target.checked)}
          className="mt-1 h-4 w-4 accent-city-green"
        />
        <span>
          Я организатор этой активности
          <span className="mt-1 block font-normal leading-6 text-city-muted">
            Если вы добавляете свою активность, оставьте email — на него придёт статус заявки.
          </span>
        </span>
      </label>

      {submittedByOrganizer ? (
        <div className="mt-4">
          <label htmlFor="submitterContact" className="text-sm font-semibold text-city-ink">
            Email для уведомлений
          </label>
          <input
            id="submitterContact"
            name="submitterContact"
            type="email"
            required
            className="mt-2 min-h-12 w-full rounded-2xl border border-city-line bg-white px-4 outline-none transition focus:border-city-green focus:ring-4 focus:ring-city-green/10"
            placeholder="name@example.ru"
          />
          <p className="mt-2 text-xs leading-5 text-city-muted">
            Сюда придёт письмо после отправки и после публикации карточки.
          </p>
        </div>
      ) : null}
    </section>
  );
}
