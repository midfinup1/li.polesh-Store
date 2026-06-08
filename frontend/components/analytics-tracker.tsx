"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { api } from "@/lib/api";

function getArtworkId(pathname: string) {
  const match = pathname.match(/^\/artwork\/(\d+)/);
  return match ? Number(match[1]) : null;
}

function shouldTrack(pathname: string) {
  return !pathname.startsWith("/admin");
}

export function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!shouldTrack(pathname)) {
      return;
    }

    const artworkId = getArtworkId(pathname);

    void api.analytics
      .trackView({
        path: pathname,
        artwork_id: artworkId,
        event_type: "page_view",
      })
      .catch(() => {
        // Аналитика не должна ломать пользовательский сценарий.
      });
  }, [pathname]);

  return null;
}
