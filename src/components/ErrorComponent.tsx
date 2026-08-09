"use client";

import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  LeftCircleOutlined,
  LoadingOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { Button, Tooltip } from "antd";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { FeedbackModal } from "~/components/FeedbackModal";

type ErrorProps = {
  message: string;
  /** default false */
  showReload?: boolean;
  /** default true */
  showFeedback?: boolean;
  date?: string;
  onRetry?: () => void;
};

export const ErrorComponent: React.FC<ErrorProps> = ({
  message,
  showReload,
  showFeedback,
  date,
  onRetry,
}) => {
  const router = useRouter();
  const [isFbModalOpen, setIsFbModalOpen] = useState<boolean>(false);
  const [statuses, setStatuses] = useState<{
    digitraffic: boolean;
    vrApi: boolean;
    vrId: boolean;
  } | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);

  useEffect(() => {
    setLoadingStatus(true);
    fetch("/api/service-status")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch status");
        return res.json();
      })
      .then((data: { digitraffic: boolean; vrApi: boolean; vrId: boolean }) => {
        setStatuses(data);
      })
      .catch((err) => {
        console.error(err);
        setStatuses(null);
      })
      .finally(() => setLoadingStatus(false));
  }, []);

  const renderStatus = (label: string, isUp: boolean) => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "8px",
        fontSize: "15px",
      }}
    >
      <span>{label}</span>
      {isUp ? (
        <Tooltip title="Järjestelmä toimii normaalisti">
          <CheckCircleOutlined style={{ color: "#52c41a", fontSize: "18px" }} />
        </Tooltip>
      ) : (
        <Tooltip title="Järjestelmässä on häiriöitä">
          <CloseCircleOutlined style={{ color: "#ff4d4f", fontSize: "18px" }} />
        </Tooltip>
      )}
    </div>
  );

  return (
    <div style={{ textAlign: "center" }}>
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
          onClick={() => router.push(date ? `/?date=${date}` : "/")}
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
            onClick={onRetry ?? (() => window.location.reload())}
          >
            <ReloadOutlined /> Yritä uudelleen
          </Button>
        )}
      </div>

      <FeedbackModal isFbModalOpen={isFbModalOpen} setIsFbModalOpen={setIsFbModalOpen} />

      {(showFeedback ?? true) && (
        <div style={{ maxWidth: "800px", margin: "auto" }}>
          <div
            style={{
              maxWidth: "300px",
              margin: "20px auto",
              padding: "15px",
              background: "#f5f5f5",
              borderRadius: "8px",
              textAlign: "left",
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: "15px", fontSize: "16px" }}>
              Järjestelmien tila
            </h3>
            {loadingStatus ? (
              <div style={{ textAlign: "center", padding: "10px" }}>
                <LoadingOutlined style={{ fontSize: "24px", color: "#1890ff" }} />
              </div>
            ) : statuses ? (
              <>
                {renderStatus("Digitraffic API", statuses.digitraffic)}
                {renderStatus("VR API", statuses.vrApi)}
                {renderStatus("VR Tunnistautuminen", statuses.vrId)}
              </>
            ) : (
              <div style={{ fontSize: "14px", color: "#999" }}>Tietoja ei saatavilla</div>
            )}
          </div>
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
