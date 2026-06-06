"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";

const metrikaId = process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID || "109691466";

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

export function YandexMetrika() {
  const pathname = usePathname();
  const isFirstRender = useRef(true);
  const previousUrl = useRef<string | null>(null);

  useEffect(() => {
    if (!metrikaId) {
      return;
    }

    const currentUrl = window.location.href;

    if (isFirstRender.current) {
      isFirstRender.current = false;
      previousUrl.current = currentUrl;
      return;
    }

    window.ym?.(Number(metrikaId), "hit", currentUrl, {
      referer: previousUrl.current ?? document.referrer
    });
    previousUrl.current = currentUrl;
  }, [pathname]);

  if (!metrikaId) {
    return null;
  }

  return (
    <>
      <Script id="yandex-metrika" strategy="afterInteractive">
        {`
          (function(m,e,t,r,i,k,a){
            m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
            m[i].l=1*new Date();
            for (var j = 0; j < document.scripts.length; j++) {
              if (document.scripts[j].src === r) { return; }
            }
            k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
          })(window, document, "script", "https://mc.yandex.ru/metrika/tag.js?id=${metrikaId}", "ym");

          ym(${metrikaId}, "init", {
            ssr: true,
            webvisor: true,
            clickmap: true,
            ecommerce: "dataLayer",
            referrer: document.referrer,
            url: location.href,
            accurateTrackBounce: true,
            trackLinks: true
          });
        `}
      </Script>
      <noscript>
        <div>
          <img
            src={`https://mc.yandex.ru/watch/${metrikaId}`}
            style={{ position: "absolute", left: "-9999px" }}
            alt=""
          />
        </div>
      </noscript>
    </>
  );
}
