"use client";

import { message } from "antd";
import dayjs from "dayjs";
import { useCallback, useEffect, useState } from "react";
import { FeedbackModal } from "~/components/FeedbackModal";
import { Footer } from "~/components/Footer";
import { Header } from "~/components/Header";
import { TrainSelector } from "~/components/TrainSelector";
import { WelcomeModal } from "~/components/WelcomeModal";
import { useMounted } from "~/lib/hooks/useMounted";
import { useStickyState } from "~/lib/hooks/useStickyState";
import type { AllTrains } from "~/types";

type Props = {
  frontMessage?: string;
  initialDate: string;
  initialTrains: AllTrains;
  maintenance: boolean;
};

export function HomePage({ frontMessage, initialDate, initialTrains, maintenance }: Props) {
  const [messageApi, messageContextHolder] = message.useMessage();
  const mounted = useMounted();

  const [allTrains, setAllTrains] = useState(initialTrains);
  const [usingCachedTrains, setUsingCachedTrains] = useState(false);
  const [trainsLoaded, setTrainsLoaded] = useState(true);
  const [isFbModalOpen, setIsFbModalOpen] = useState(false);
  const [welcomeShown, setWelcomeShown] = useStickyState("welcomeShown", false);
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(initialDate);
  const [selectedTrain, setSelectedTrain] = useState<string | null>(null);

  const getTrains = useCallback(
    async (date: string) => {
      setTrainsLoaded(false);

      try {
        const response = await fetch(`/api/trains?date=${date}`);
        if (!response.ok) throw new Error(`Train request failed with ${response.status}`);
        setUsingCachedTrains(response.headers.get("X-PWA-Cache") === "true");
        setAllTrains((await response.json()) as AllTrains);
      } catch (error) {
        console.error(error);
        setAllTrains([]);
        setUsingCachedTrains(false);
        void messageApi.open({
          type: "error",
          content: "Junien hakeminen epäonnistui.",
        });
      } finally {
        setTrainsLoaded(true);
      }
    },
    [messageApi]
  );

  useEffect(() => {
    setSelectedTrain(null);
    setAllTrains([]);
    setUsingCachedTrains(false);

    if (selectedDate === initialDate) {
      setAllTrains(initialTrains);
      return;
    }
    if (selectedDate) void getTrains(selectedDate);
  }, [selectedDate, getTrains, initialDate, initialTrains]);

  useEffect(() => {
    const isCurrentDate = selectedDate === dayjs().format("YYYY-MM-DD");
    const url = !selectedDate || isCurrentDate ? "/" : `/?date=${selectedDate}`;
    const currentUrl = window.location.pathname + window.location.search;
    if (currentUrl !== url) window.history.pushState(null, "", url);
  }, [selectedDate]);

  const openWelcome = () => {
    if (window.plausible) window.plausible("Welcome Modal Viewed");
    setWelcomeOpen(true);
  };

  return (
    <>
      {messageContextHolder}
      <FeedbackModal isFbModalOpen={isFbModalOpen} setIsFbModalOpen={setIsFbModalOpen} />
      <WelcomeModal
        open={welcomeOpen}
        onClose={() => {
          setWelcomeOpen(false);
          setWelcomeShown(true);
        }}
      />

      <div className="frontpage">
        <div className="content">
          <div className="header">
            <Header maintenance={maintenance} />
          </div>
          {frontMessage ? <p className="front-message">{frontMessage}</p> : null}
          <div className="trainselector">
            <TrainSelector
              maintenance={maintenance}
              initialDate={initialDate}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              selectedTrain={selectedTrain}
              setSelectedTrain={setSelectedTrain}
              trainsLoaded={trainsLoaded}
              allTrains={allTrains}
            />
            {usingCachedTrains ? (
              <p className="pwa-stale-note" role="status">
                Ei verkkoyhteyttä. Junalista näytetään laitteen välimuistista.
              </p>
            ) : null}
            {mounted && !welcomeShown ? (
              <a style={{ color: "#757575", textDecoration: "underline" }} onClick={openWelcome}>
                Uusi täällä? Lue infoteksti!
              </a>
            ) : null}
          </div>
        </div>

        <Footer setIsFbModalOpen={setIsFbModalOpen} onInfoClick={openWelcome} />
      </div>
    </>
  );
}
