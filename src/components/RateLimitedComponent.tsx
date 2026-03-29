import { LeftCircleOutlined, ReloadOutlined } from "@ant-design/icons";
import { Button } from "antd";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

type Props = {
  retryAfter: number;
  date?: string;
};

export const RateLimitedComponent: React.FC<Props> = ({ retryAfter, date }) => {
  const router = useRouter();
  const [secondsLeft, setSecondsLeft] = useState(retryAfter);

  useEffect(() => {
    setSecondsLeft(retryAfter);
    const timer = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [retryAfter]);

  return (
    <div style={{ textAlign: "center" }}>
      <Head>
        <title>VenaaRauhassa - Liian monta pyyntöä</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <h1>Liian monta pyyntöä</h1>
      <p style={{ fontSize: "16px", maxWidth: "400px", margin: "0 auto 20px" }}>
        Olet lähettänyt liian monta pyyntöä lyhyessä ajassa. Odota hetki ennen kuin yrität
        uudelleen.
      </p>
      {secondsLeft > 0 && (
        <p style={{ fontSize: "20px", fontWeight: 500, marginBottom: "20px" }}>
          Yritä uudelleen {secondsLeft} sekunnin kuluttua
        </p>
      )}
      <Button
        style={{
          fontWeight: 500,
          height: "40px",
          fontSize: "16px",
          width: "170px",
          marginRight: "10px",
        }}
        onClick={() => void router.push(date ? `/?date=${date}` : "/").catch(console.error)}
      >
        <LeftCircleOutlined /> Etusivulle
      </Button>
      {secondsLeft <= 0 && (
        <Button
          style={{ fontWeight: 500, height: "40px", fontSize: "16px", width: "170px" }}
          onClick={() => window.location.reload()}
        >
          <ReloadOutlined /> Yritä uudelleen
        </Button>
      )}
    </div>
  );
};
