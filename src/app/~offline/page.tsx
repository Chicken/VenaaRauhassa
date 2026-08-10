import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "VenaaRauhassa - Ei verkkoyhteyttä",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <main className="offline-page">
      <Image src="/vr_favicon.png" width={88} height={88} alt="" priority unoptimized />
      <p className="offline-page-label">Yhteys katkesi</p>
      <h1>Junatietoa ei ole tallennettu tälle sivulle</h1>
      <p>
        Aiemmin avaamasi junakartat toimivat ilman verkkoyhteyttä vuorokauden ajan. Palaa etusivulle
        tai yritä tätä sivua uudelleen, kun yhteys toimii.
      </p>
      <div className="offline-page-actions">
        <a className="pwa-action pwa-action-primary" href="">
          Yritä uudelleen
        </a>
        <form action="/">
          <button className="pwa-action" type="submit">
            Etusivulle
          </button>
        </form>
      </div>
    </main>
  );
}
