"use client";

import { CloseOutlined, DownloadOutlined, ExportOutlined } from "@ant-design/icons";
import { Button, Modal } from "antd";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useStickyState } from "~/lib/hooks/useStickyState";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

type NavigatorWithStandalone = Navigator & { standalone?: boolean };

function track(event: string) {
  if (window.plausible) window.plausible(event);
}

export function InstallPwaButton() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [installed, setInstalled] = useState(true);
  const [minimized, setMinimized] = useStickyState("pwaInstallMinimized", false);

  useEffect(() => {
    const navigatorWithStandalone = navigator as NavigatorWithStandalone;
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      navigatorWithStandalone.standalone === true;
    const iosDevice =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

    setInstalled(standalone);
    setIsIos(iosDevice);

    const handleInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
      track("PWA Install Offered");
    };
    const handleInstalled = () => {
      setInstalled(true);
      setInstallPrompt(null);
      track("PWA Installed");
    };

    window.addEventListener("beforeinstallprompt", handleInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  if (installed || (!installPrompt && !isIos)) return null;

  const install = async () => {
    if (!installPrompt) {
      track("PWA iOS Install Help Viewed");
      setShowIosHelp(true);
      return;
    }

    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    track(outcome === "accepted" ? "PWA Install Accepted" : "PWA Install Dismissed");
    setInstallPrompt(null);
  };

  return (
    <>
      {minimized ? (
        <Button
          className="footer-action-button pwa-install-compact"
          icon={<DownloadOutlined />}
          onClick={() => void install()}
        >
          Asenna sovellus
        </Button>
      ) : (
        <div className="pwa-install-card">
          <Image src="/vr_favicon.png" width={44} height={44} alt="" />
          <div>
            <strong>VenaaRauhassa sovelluksena</strong>
            <span>
              Asenna sovellus ja pidä viimeisimmät junakartat mukana verkkoyhteyden pettäessä.
            </span>
          </div>
          <Button
            className="pwa-install-primary"
            icon={<DownloadOutlined />}
            onClick={() => void install()}
          >
            Asenna
          </Button>
          <button
            className="pwa-install-dismiss"
            type="button"
            aria-label="Pienennä asennuskehotus"
            title="Pienennä"
            onClick={() => {
              setMinimized(true);
              track("PWA Install Minimized");
            }}
          >
            <CloseOutlined aria-hidden />
          </button>
        </div>
      )}

      <Modal
        title="Asenna VenaaRauhassa"
        open={showIosHelp}
        centered
        footer={[
          <Button key="close" type="primary" onClick={() => setShowIosHelp(false)}>
            Selvä
          </Button>,
        ]}
        onCancel={() => setShowIosHelp(false)}
      >
        <p className="pwa-install-instruction">
          <ExportOutlined aria-hidden /> Avaa selaimen Jaa-valikko ja valitse sitten
          <strong> Lisää Koti-valikkoon</strong>.
        </p>
      </Modal>
    </>
  );
}
