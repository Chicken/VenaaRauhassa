import { createCache, extractStyle, StyleProvider } from "@ant-design/cssinjs";
import type { DocumentContext } from "next/document";
import Document, { Head, Html, Main, NextScript } from "next/document";
import { env } from "~/lib/env";

const AppDocument = () => (
  <Html lang="en">
    <Head>
      {env.NEXT_PUBLIC_PLAUSIBLE_SCRIPT && env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN ? (
        <>
          <script
            defer
            data-domain={env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN}
            src={env.NEXT_PUBLIC_PLAUSIBLE_SCRIPT}
          ></script>
          <script
            dangerouslySetInnerHTML={{
              __html:
                "window.plausible = window.plausible || function() {(window.plausible.q = window.plausible.q || []).push(arguments)}",
            }}
          ></script>
        </>
      ) : (
        <></>
      )}
    </Head>
    <body>
      <Main />
      <NextScript />
    </body>
  </Html>
);

AppDocument.getInitialProps = async (ctx: DocumentContext) => {
  const cache = createCache();
  const originalRenderPage = ctx.renderPage;
  ctx.renderPage = () =>
    originalRenderPage({
      enhanceApp: (App) => (props) => (
        <StyleProvider cache={cache}>
          <App {...props} />
        </StyleProvider>
      ),
    });

  const initialProps = await Document.getInitialProps(ctx);
  const style = extractStyle(cache, true);
  return {
    ...initialProps,
    styles: (
      <>
        {initialProps.styles}
        <style dangerouslySetInnerHTML={{ __html: style }} />
      </>
    ),
  };
};

export default AppDocument;
