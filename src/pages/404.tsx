import { LeftCircleOutlined } from "@ant-design/icons";
import { Button } from "antd";
import Head from "next/head";
import { useRouter } from "next/router";

export default function NotFound() {
  const router = useRouter();
  return (
    <div style={{ textAlign: "center" }}>
      <Head>
        <title>VenaaRauhassa - 404</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <h1>Sivua ei löytynyt...</h1>
      <Button onClick={() => void router.push("/").catch(console.error)}>
        <LeftCircleOutlined /> Etusivulle
      </Button>
    </div>
  );
}
