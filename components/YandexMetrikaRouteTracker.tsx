"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const metrikaId = Number(process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID || "109691466");

declare global {
  interface Window {
    ym?: (
      counterId: number,
      methodName: "hit" | "init" | "reachGoal",
      urlOrOptions?: string | Record<string, unknown>,
      options?: Record<string, unknown>
    ) => void;
  }
}

export function YandexMetrikaRouteTracker() {
  const pathname = usePathname();
  const isFirstRender = useRef(true);
  const previousUrl = useRef<string | null>(null);

  useEffect(() => {
    const currentUrl = window.location.href;

    if (isFirstRender.current) {
      isFirstRender.current = false;
      previousUrl.current = currentUrl;
      return;
    }

    window.ym?.(metrikaId, "hit", currentUrl, {
      referer: previousUrl.current ?? document.referrer
    });
    previousUrl.current = currentUrl;
  }, [pathname]);

  return null;
}
