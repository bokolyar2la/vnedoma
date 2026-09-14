"use client";

import { useId, useState } from "react";
import { ActivityGalleryMedia } from "@/components/ActivityGalleryMedia";

export function MediaUploadSlot({ position, media }: {
  position: number;
  media?: { url: string; type: string; caption: string | null };
}) {
  const id = useId();
  const [filename, setFilename] = useState("");
  const [remove, setRemove] = useState(false);
  return (
    <div className="min-w-0 rounded-2xl border border-city-line bg-white p-4">
      <p className="mb-3 text-sm font-semibold text-city-ink">Материал {position}</p>
      {media && !remove ? <ActivityGalleryMedia {...media} title={`Материал ${position}`} /> : null}
      <label htmlFor={id} className="mt-3 flex min-h-12 cursor-pointer items-center justify-center rounded-2xl border border-dashed border-city-green/50 bg-city-green/5 px-4 text-center text-sm font-semibold text-city-green">
        Загрузить новое фото или видео
      </label>
      <input id={id} name={`media${position}File`} type="file"
        accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
        disabled={remove}
        className="mt-2 block w-full min-w-0 text-sm text-city-muted file:mr-3 file:rounded-full file:border-0 file:bg-city-soft file:px-3 file:py-2"
        onChange={(event) => {
          const file = event.target.files?.[0];
          const limit = file?.type.startsWith("video/") ? 20 : 5;
          event.target.setCustomValidity(file && file.size > limit * 1024 * 1024 ? `Файл должен быть не больше ${limit} МБ.` : "");
          event.target.reportValidity();
          setFilename(file?.name ?? "");
        }} />
      {filename ? <p className="mt-2 break-all text-sm text-city-ink">Выбран файл: {filename}</p> : null}
      <p className="mt-2 text-xs leading-5 text-city-muted">Фото: JPG, PNG, WebP до 5 МБ. Видео: MP4, WebM до 20 МБ. Выбранный файл заменит текущий материал после сохранения.</p>
      <input name={`media${position}Caption`} defaultValue={media?.caption ?? ""} aria-label={`Подпись к материалу ${position}`}
        placeholder="Подпись к фото или видео" className="mt-3 min-h-12 w-full rounded-2xl border border-city-line px-4" />
      {media ? <label className="mt-3 flex items-center gap-2 text-sm text-city-muted">
        <input name={`media${position}Remove`} type="checkbox" checked={remove} onChange={(event) => setRemove(event.target.checked)} />
        Удалить этот материал при сохранении
      </label> : null}
    </div>
  );
}
