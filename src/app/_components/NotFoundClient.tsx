"use client";

import { LeftCircleOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { useRouter } from "next/navigation";

export function NotFoundClient() {
  const router = useRouter();

  return (
    <div style={{ textAlign: "center" }}>
      <h1>Sivua ei löytynyt...</h1>
      <Button
        style={{
          fontWeight: 500,
          height: "40px",
          fontSize: "16px",
        }}
        onClick={() => router.push("/")}
      >
        <LeftCircleOutlined /> Etusivulle
      </Button>
    </div>
  );
}
