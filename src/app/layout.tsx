import { AntdRegistry } from "@ant-design/nextjs-registry";
import type { Metadata, Viewport } from "next";
import Script from "next/script";
import type { ReactNode } from "react";
import { getBaseURL } from "~/lib/deployment";
import { env } from "~/lib/env";
import "~/styles/global.css";
import { PwaProvider } from "./_components/PwaProvider";
import { Providers } from "./providers";

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
  applicationName: "VenaaRauhassa",
  icons: {
    icon: "/vr_favicon.png",
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "VenaaRauhassa",
  },
  formatDetection: { telephone: false },
  openGraph: { type: "website" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#00a149",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const plausibleEndpoint = env.NEXT_PUBLIC_PLAUSIBLE_ENDPOINT;
  const plausibleScript = env.NEXT_PUBLIC_PLAUSIBLE_SCRIPT;

  return (
    <html lang="fi">
      <body>
        {plausibleScript && plausibleEndpoint ? (
          <>
            <Script src={plausibleScript} strategy="afterInteractive" />
            <Script id="plausible-init" strategy="afterInteractive">
              {`
                window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)},plausible.init=plausible.init||function(i){plausible.o=i||{}};
                plausible.init({
                  endpoint: ${JSON.stringify(plausibleEndpoint)},
                  transformRequest: (payload) => {
                    payload.u = payload.u.replace(/\\/\\d{4}-\\d{2}-\\d{2}/, "");
                    return payload;
                  },
                });
              `}
            </Script>
          </>
        ) : null}
        <AntdRegistry>
          <PwaProvider>
            <Providers>{children}</Providers>
          </PwaProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
