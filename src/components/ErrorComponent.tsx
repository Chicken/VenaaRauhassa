import React from "react";
import Head from "next/head";
import { Button } from "antd";
import { LeftCircleOutlined, ReloadOutlined } from "@ant-design/icons";
import { useRouter } from "next/router";

type ErrorProps = {
  maintenance?: boolean;
  date?: string;
};

export const ErrorComponent: React.FC<ErrorProps> = ({ maintenance, date }) => {
  const router = useRouter();

  return (
    <div style={{ textAlign: "center" }}>
      <Head>
        <title>VenaaRauhassa - Virhe</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      {maintenance ? (
        <h1>Palvelu huoltokatkolla...</h1>
      ) : (
        <h1>Virhe tapahtui junaa haettaessa, yritä uudelleen</h1>
      )}
      <Button onClick={() => void router.push(date ? `/?date=${date}` : "/").catch(console.error)}>
        <LeftCircleOutlined /> Takaisin
      </Button>
      {!maintenance && (
        <Button onClick={() => window.location.reload()}>
          <ReloadOutlined /> Yritä uudelleen
        </Button>
      )}
    </div>
  );
};
