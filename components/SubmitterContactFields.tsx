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
            Если вы организатор, оставьте канал связи — мы напишем, если нужно уточнить детали перед публикацией.
          </span>
        </span>
      </label>

      {submittedByOrganizer ? (
        <div className="mt-4">
          <label htmlFor="submitterContact" className="text-sm font-semibold text-city-ink">
            Как с вами связаться
          </label>
          <input
            id="submitterContact"
            name="submitterContact"
            required
            className="mt-2 min-h-12 w-full rounded-2xl border border-city-line bg-white px-4 outline-none transition focus:border-city-green focus:ring-4 focus:ring-city-green/10"
            placeholder="Telegram, VK, телефон или email"
          />
        </div>
      ) : null}
    </section>
  );
}
