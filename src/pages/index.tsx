import { message } from "antd";
import dayjs from "dayjs";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import { FeedbackModal } from "~/components/FeedbackModal";
import { Footer } from "~/components/Footer";
import { Header } from "~/components/Header";
import { TrainSelector } from "~/components/TrainSelector";
import { getBaseURL, isInMaintenance } from "~/lib/deployment";
import { getInitialTrains } from "~/lib/digitraffic";

export default function Home({
  initialDate,
  initialTrains,
  maintenance,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const router = useRouter();
  const [messageApi, messageContextHolder] = message.useMessage();

  const [allTrains, setAllTrains] = useState(initialTrains);
  const [trainsLoaded, setTrainsLoaded] = useState<boolean>(true);

  const [isFbModalOpen, setIsFbModalOpen] = useState<boolean>(false);

  const [selectedDate, setSelectedDate] = useState<string | null>(initialDate);
  const [selectedTrain, setSelectedTrain] = useState<string | null>(null);

  useEffect(() => {
    // @ts-expect-error no types for globally available plausible function
    // eslint-disable-next-line
    if (window.plausible) window.plausible("pageview");
  }, []);

  const getTrains = useCallback(async (date: string) => {
    setTrainsLoaded(false);

    const res = (await fetch("/api/trains?date=" + date)
      .then((res) => {
        if (!res.ok) throw new Error("Not ok");
        return res.json();
      })
      .catch((err) => {
        console.error(err);
        void messageApi.open({
          type: "error",
          content: "Junien hakeminen epäonnistui.",
        });
        return null;
      })) as Awaited<ReturnType<typeof getInitialTrains>> | null;
    if (res == null) return;
    setAllTrains(res);

    setTrainsLoaded(true);
  }, [messageApi]);

  useEffect(() => {
    if (selectedDate === initialDate) {
      setAllTrains(initialTrains);
      return;
    }
    if (!selectedDate) return;
    getTrains(selectedDate).catch(console.error);
  }, [selectedDate, getTrains, initialDate, initialTrains]);

  useEffect(() => {
    if (selectedDate && selectedTrain) {
      router.prefetch(`/train/${selectedDate}/${selectedTrain}`).catch(console.error);
    }
  }, [router, selectedDate, selectedTrain]);

  useEffect(() => {
    const isCurrentDate = selectedDate === dayjs().format("YYYY-MM-DD");
    if ((isCurrentDate || selectedDate == null) && router.asPath !== "/")
      router.push("/", undefined, { shallow: true }).catch(console.error);
    else if (selectedDate && !isCurrentDate && router.asPath !== `/?date=${selectedDate}`)
      router.push(`/?date=${selectedDate}`, undefined, { shallow: true }).catch(console.error);
  }, [router, selectedDate]);

  return (
    <>
      <Head>
        <title>VenaaRauhassa</title>
        <meta property="og:title" content="VenaaRauhassa" />
        <meta
          name="description"
          content="VenaaRauhassa on palvelu, jolla näet junien istuimien tilanteen asemakohtaisesti. Näin mahdollisuutesi kasvavat, että saat istua rauhassa."
        />
        <meta
          property="og:description"
          content="VenaaRauhassa on palvelu, jolla näet junien istuimien tilanteen asemakohtaisesti. Näin mahdollisuutesi kasvavat, että saat istua rauhassa."
        />
        <meta
          name="keywords"
          content="venaarauhassa, venaarauhas, venaa, rauhassa, rauhas, vr, juna, paikka, kartta, asema"
        />
        <meta property="og:url" content={getBaseURL() + "/"} />
        <link rel="canonical" href={getBaseURL() + "/"} />
      </Head>

      {messageContextHolder}
      <FeedbackModal isFbModalOpen={isFbModalOpen} setIsFbModalOpen={setIsFbModalOpen} />

      <div className="frontpage">
        <div className="content">
          <div className="header">
            <Header maintenance={maintenance} />
          </div>
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
          </div>
        </div>

        <Footer setIsFbModalOpen={setIsFbModalOpen} />
      </div>
    </>
  );
}

export const getServerSideProps = (async ({ res, query }) => {
  res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=7200");

  const initialDate = dayjs(
    typeof query.date === "string" && /^\d\d\d\d\-\d\d\-\d\d$/.test(query.date)
      ? query.date
      : undefined
  ).format("YYYY-MM-DD");

  const maintenance = isInMaintenance();

  if (maintenance) {
    return {
      props: {
        maintenance,
        initialDate,
        initialTrains: [],
      },
    };
  }

  const initialTrains = await getInitialTrains(initialDate);

  return {
    props: {
      maintenance,
      initialDate,
      initialTrains,
    },
  };
}) satisfies GetServerSideProps<{
  initialDate: string;
  maintenance: boolean;
  initialTrains: {
    value: string;
    label: string;
  }[];
}>;
