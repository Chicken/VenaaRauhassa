import { ConfigProvider, Layout } from "antd";
import locale from "antd/locale/fi_FI";
import "dayjs/locale/fi";
import { GeistSans } from "geist/font/sans";
import { type AppType } from "next/app";
import Head from "next/head";

import "~/styles/global.css";

const { Content } = Layout;

const App: AppType = ({ Component, pageProps }) => {
  return (
    <ConfigProvider
      locale={locale}
      theme={{
        token: {
          fontFamily: GeistSans.style.fontFamily,
        },
      }}
    >
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#00a149" />
        <meta property="og:type" content="website" />
        <link rel="icon" href="/vr_favicon.png" sizes="any" />
      </Head>

      <Layout className="layout" style={{ minHeight: "100vh" }}>
        <Content className="layoutPadding">
          <div className={`site-layout-content ${GeistSans.className}`}>
            <Component {...pageProps} />
          </div>
        </Content>
      </Layout>
    </ConfigProvider>
  );
};

export default App;
