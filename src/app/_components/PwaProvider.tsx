"use client";

import { SerwistProvider, useSerwist } from "@serwist/turbopack/react";
import { RefreshCw, WifiOff } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

const UPDATE_SIGNAL = "venaarauhassa-pwa-update";

function cacheHomePage() {
  if (!("serviceWorker" in navigator) || !navigator.onLine) return;

  const url =
    window.location.pathname === "/" ? window.location.pathname + window.location.search : "/";
  void navigator.serviceWorker.ready.then((registration) => {
    registration.active?.postMessage({ type: "CACHE_HOME", url });
  });
}

function navigationUsedPwaCache() {
  const navigation = performance.getEntriesByType("navigation")[0] as
    PerformanceNavigationTiming | undefined;
  return navigation?.serverTiming.some((metric) => metric.name === "pwa-cache") ?? false;
}

function PwaStatus() {
  const { serwist } = useSerwist();
  const [online, setOnline] = useState(true);
  const [usingCachedDocument, setUsingCachedDocument] = useState(false);
  const [reconnected, setReconnected] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const applyingUpdate = useRef(false);

  useEffect(() => {
    setOnline(navigator.onLine);
    setUsingCachedDocument(navigationUsedPwaCache());

    const handleOffline = () => {
      setOnline(false);
      setReconnected(false);
    };
    const handleOnline = () => {
      setOnline(true);
      setReconnected(true);
      cacheHomePage();
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.key === UPDATE_SIGNAL && event.newValue) applyingUpdate.current = true;
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    window.addEventListener("storage", handleStorage);
    cacheHomePage();

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  useEffect(() => {
    if (!serwist) return;

    const handleWaiting = () => setUpdateAvailable(true);
    const handleControlling = () => {
      if (applyingUpdate.current) window.location.reload();
    };

    serwist.addEventListener("waiting", handleWaiting);
    serwist.addEventListener("controlling", handleControlling);

    return () => {
      serwist.removeEventListener("waiting", handleWaiting);
      serwist.removeEventListener("controlling", handleControlling);
    };
  }, [serwist]);

  if (!online) {
    return (
      <div className="pwa-status pwa-status-offline" role="status">
        <WifiOff aria-hidden size={18} />
        <span>Ei verkkoyhteyttä. Näytetyt junatiedot voivat olla vanhentuneita.</span>
      </div>
    );
  }

  if (usingCachedDocument) {
    return (
      <div className="pwa-status pwa-status-offline" role="status">
        <WifiOff aria-hidden size={18} />
        <span>Näytetään laitteelle tallennettua versiota. Tiedot voivat olla vanhentuneita.</span>
        <button type="button" onClick={() => window.location.reload()}>
          Yritä päivittää
        </button>
      </div>
    );
  }

  if (updateAvailable) {
    return (
      <div className="pwa-status" role="status">
        <RefreshCw aria-hidden size={18} />
        <span>VenaaRauhassa palvelusta on saatavilla uusi versio.</span>
        <button
          type="button"
          onClick={() => {
            applyingUpdate.current = true;
            localStorage.setItem(UPDATE_SIGNAL, String(Date.now()));
            serwist?.messageSkipWaiting();
          }}
        >
          Päivitä
        </button>
      </div>
    );
  }

  if (reconnected) {
    return (
      <div className="pwa-status" role="status">
        <RefreshCw aria-hidden size={18} />
        <span>Verkkoyhteys palautui.</span>
        <button type="button" onClick={() => window.location.reload()}>
          Päivitä tiedot
        </button>
        <button
          className="pwa-status-dismiss"
          type="button"
          aria-label="Sulje ilmoitus"
          onClick={() => setReconnected(false)}
        >
          ×
        </button>
      </div>
    );
  }

  return null;
}

export function PwaProvider({ children }: { children: ReactNode }) {
  return (
    <SerwistProvider
      swUrl="/serwist/sw.js"
      disable={process.env.NODE_ENV !== "production"}
      cacheOnNavigation={false}
      reloadOnOnline={false}
    >
      <PwaStatus />
      {children}
    </SerwistProvider>
  );
}
