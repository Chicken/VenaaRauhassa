import { LeftCircleOutlined, ReloadOutlined } from "@ant-design/icons";
import { Button } from "antd";
import Head from "next/head";
import { useRouter } from "next/router";
import React, { useState } from "react";
import { FeedbackModal } from "~/components/FeedbackModal";

type ErrorProps = {
  message: string;
  /** default false */
  showReload?: boolean;
  /** default true */
  showFeedback?: boolean;
  date?: string;
};

export const ErrorComponent: React.FC<ErrorProps> = ({
  message,
  showReload,
  showFeedback,
  date,
}) => {
  const router = useRouter();
  const [isFbModalOpen, setIsFbModalOpen] = useState<boolean>(false);

  return (
    <div style={{ textAlign: "center" }}>
      <Head>
        <title>VenaaRauhassa - Virhe</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <h1>{message}</h1>
      <div
        style={{
          marginBottom: "10px",
        }}
      >
        <Button
          style={{
            fontWeight: 500,
            height: "40px",
            width: "170px",
            fontSize: "16px",
            marginRight: "10px",
          }}
          onClick={() => void router.push(date ? `/?date=${date}` : "/").catch(console.error)}
        >
          <LeftCircleOutlined /> Etusivulle
        </Button>
        {showReload && (
          <Button
            style={{
              fontWeight: 500,
              height: "40px",
              width: "170px",
              fontSize: "16px",
            }}
            onClick={() => window.location.reload()}
          >
            <ReloadOutlined /> Yritä uudelleen
          </Button>
        )}
      </div>
      <FeedbackModal isFbModalOpen={isFbModalOpen} setIsFbModalOpen={setIsFbModalOpen} />

      {(showFeedback ?? true) && (
        <div style={{ maxWidth: "800px", margin: "auto" }}>
          <p style={{ fontSize: "16px" }}>
            Useasti virheet johtuvat VR:n ongelmista tai järjestelmämuutoksista. Muut viat yritämme
            automaattisesti paikantaa ja korjata mahdollisemman nopeasti. Voit kuitenkin halutessasi
            jättää palautetta.
          </p>
          <Button
            onClick={() => setIsFbModalOpen(true)}
            style={{
              fontWeight: 500,
              height: "40px",
              fontSize: "16px",
              marginRight: "10px",
            }}
          >
            💬 Anna palautetta
          </Button>
        </div>
      )}
    </div>
  );
};
