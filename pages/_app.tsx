import { useEffect } from "react";
import type { AppProps } from "next/app";


export default function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // ✅ Register service worker for PWA + offline caching
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/service-worker.js")
        .then((reg) => console.log("Service Worker registered:", reg))
        .catch((err) => console.error("Service Worker registration failed:", err));
    }
  }, []);

  return <Component {...pageProps} />;
}
