"use client";

import { ErrorComponent } from "~/components/ErrorComponent";

export default function ErrorPage({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <>
      <title>VenaaRauhassa - Virhe</title>
      <meta name="robots" content="noindex,nofollow" />
      <ErrorComponent
        message="Tapahtui kriittinen virhe, yritä uudelleen myöhemmin."
        showReload
        onRetry={retry}
      />
    </>
  );
}
