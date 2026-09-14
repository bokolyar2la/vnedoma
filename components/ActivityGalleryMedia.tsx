"use client";

import { useState } from "react";
import { isVkPageUrl, safeMediaUrl } from "@/lib/media-url";

export function ActivityGalleryMedia({ url, type, caption, title, previewOnly = false }: {
  url: string;
  type: string;
  caption: string | null;
  title: string;
  previewOnly?: boolean;
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const href = safeMediaUrl(url);
  const vkPage = Boolean(href && isVkPageUrl(href));
  const showImage = type === "image" && href && !vkPage && failedUrl !== href;
  const showVideo = type === "video" && href && /\.(mp4|webm)(?:[?#]|$)/i.test(href) && failedUrl !== href;

  if (previewOnly && !showImage && !showVideo) return null;

  return (
    <div className="overflow-hidden rounded-[24px] bg-city-soft">
      {showVideo ? (
        <video src={href} controls playsInline preload="metadata" aria-label={caption || title}
          onError={() => setFailedUrl(href)} className="aspect-[4/3] w-full bg-black object-contain" />
      ) : showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={href} alt={caption || title} loading="lazy"
          onError={() => setFailedUrl(href)}
          className="aspect-[4/3] w-full object-cover" />
      ) : (
        <div className="flex min-h-32 flex-col items-center justify-center gap-3 p-5 text-center">
          {type === "image" ? (
            <p className="text-sm text-city-muted">
              {vkPage ? "Фото размещено во ВКонтакте" : "Предпросмотр фото недоступен"}
            </p>
          ) : null}
          {href ? (
            <a href={href} target="_blank" rel="noopener noreferrer"
              className="font-semibold text-city-green underline underline-offset-4 hover:text-city-blue">
              {type === "video" ? "Открыть видео" : vkPage ? "Посмотреть фото в VK" : "Открыть источник фото"}
            </a>
          ) : <p className="text-sm text-city-muted">Ссылка на материал недоступна</p>}
        </div>
      )}
      {caption ? <p className="p-4 text-sm leading-6 text-city-muted">{caption}</p> : null}
    </div>
  );
}
