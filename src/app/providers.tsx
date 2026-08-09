"use client";

import { ConfigProvider, Layout } from "antd";
import locale from "antd/locale/fi_FI";
import "dayjs/locale/fi";
import { GeistSans } from "geist/font/sans";
import type { ReactNode } from "react";

const { Content } = Layout;

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ConfigProvider
      locale={locale}
      theme={{
        token: {
          fontFamily: GeistSans.style.fontFamily,
        },
      }}
    >
      <Layout className="layout" style={{ minHeight: "100vh" }}>
        <Content className="layoutPadding">
          <div className={`site-layout-content ${GeistSans.className}`}>{children}</div>
        </Content>
      </Layout>
    </ConfigProvider>
  );
}
