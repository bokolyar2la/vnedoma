"use client";

import { useId, useState } from "react";

export function CoverUploadField() {
  const id = useId();
  const [filename, setFilename] = useState("");
  return (
    <section className="rounded-3xl border border-city-line bg-city-soft p-5 sm:p-6">
      <h2 className="text-xl font-bold text-city-ink">Обложка активности</h2>
      <div className="relative mt-4 rounded-2xl border-2 border-dashed border-city-green/40 bg-white transition hover:border-city-green hover:bg-city-green/5 focus-within:ring-2 focus-within:ring-city-green">
        <label htmlFor={id} className="flex min-h-40 flex-col items-center justify-center gap-3 px-5 py-7 text-center">
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-9 w-9 text-city-green">
            <path d="M12 16V4m-4 4 4-4 4 4M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-lg font-bold text-city-green sm:text-xl">Загрузить обложку</span>
          <span className="text-sm text-city-muted">Выберите фотографию на устройстве</span>
        </label>
        <input id={id} name="imageFile" type="file" accept="image/jpeg,image/png,image/webp"
          aria-label="Загрузить обложку"
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.setCustomValidity(file && file.size > 5 * 1024 * 1024 ? "Обложка должна быть не больше 5 МБ." : "");
            event.target.reportValidity();
            setFilename(file?.name ?? "");
          }} />
      </div>
      {filename ? <p className="mt-3 break-all text-sm font-semibold text-city-ink">Выбрано: {filename}</p> : null}
      <p className="mt-3 text-sm leading-6 text-city-muted">JPG, PNG или WebP до 5 МБ. Текущая обложка сохранится, пока вы не выберете новую.</p>
    </section>
  );
}
