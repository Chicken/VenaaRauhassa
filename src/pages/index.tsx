import { Button, DatePicker, Flex, Select } from "antd";
import dayjs from "dayjs";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import { getJSON } from "~/lib/http";

const pickerStyle: React.CSSProperties = {
  width: "100%",
  height: "40px",
  maxWidth: "300px",
};

const slogans = [
  '"Ilman vieruskaveria"',
  '"Koska tässä kestää..."',
  '"Noniin ja Kokkolasta lähdettiin noin 45 minuuttia myöhässä. Syynä oli junakohtaukset ja rautatieongelmat"',
  '"Vieläkin Ratapihalla"',
  '"Vertauskelvoton Rautaromu"',
  '"Junan suunnan vaihtamisessa on ongelmia, jarrut ovat liian tiukalla"',
  '"Omalla matkalla"',
  '"Tarkoituksella yksin"',
];

export default function Home({
  initialDate,
  initialTrains,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const router = useRouter();
  const [sloganText, setSloganText] = useState<string | null>(null);

  const [allTrains, setAllTrains] = useState<
    {
      value: string;
      label: string;
    }[]
  >(initialTrains);
  const [trainsLoaded, setTrainsLoaded] = useState<boolean>(true);
  const [trainLoading, setTrainLoading] = useState<boolean>(false);

  const [selectedDate, setSelectedDate] = useState<string | null>(initialDate);
  const [selectedTrain, setSelectedTrain] = useState<string | null>(null);

  const getTrains = useCallback(async (date: string) => {
    setTrainsLoaded(false);

    const res = (await getJSON(`https://rata.digitraffic.fi/api/v1/trains/${date}`)) as {
      trainNumber: number;
      trainType: string;
    }[];

    setAllTrains(
      res
        .filter((t) => ["IC", "S"].includes(t.trainType))
        .map((t) => ({
          value: t.trainNumber.toString(),
          label: t.trainType + t.trainNumber,
        }))
    );

    setTrainsLoaded(true);
  }, []);

  useEffect(() => {
    if (selectedDate === initialDate) {
      setAllTrains(initialTrains);
      return;
    }
    if (!selectedDate) return;
    getTrains(selectedDate).catch(console.error);
  }, [selectedDate, getTrains, initialDate, initialTrains]);

  useEffect(() => {
    const text = slogans[Math.floor(Math.random() * slogans.length)];
    setSloganText(text ? text : "");
  }, []);

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
        <meta property="og:url" content="https://venaarauhassa.fi/" />
        <link rel="canonical" href="https://venaarauhassa.fi/" />
      </Head>
      <Flex
        style={{ width: "100%", gap: "5px" }}
        justify={"center"}
        align={"center"}
        vertical={true}
      >
        <Link href="/" style={{ color: "unset" }}>
          <h1 style={{ marginBottom: "0px" }}>
            <span style={{ color: "#00a149" }}>V</span>enaa
            <span style={{ color: "#00a149" }}>R</span>auhassa
          </h1>
        </Link>
        <p
          style={{
            fontSize: "14px",
            fontStyle: "italic",
            marginTop: "0px",
            textAlign: "center",
          }}
        >
          {sloganText}
        </p>
        <br />

        <DatePicker
          placeholder="Valitse päivä"
          defaultValue={dayjs(initialDate)}
          style={pickerStyle}
          onChange={(_date, dateString) => {
            if (dateString) {
              setSelectedDate(dateString.split(".").reverse().join("-"));
            } else {
              setSelectedDate(null);
              setSelectedTrain(null);
            }
          }}
          format="DD.MM.YYYY"
        />

        <br />
        <Select
          style={pickerStyle}
          disabled={selectedDate && trainsLoaded ? false : true}
          loading={selectedDate && !trainsLoaded ? true : false}
          showSearch
          allowClear
          value={selectedTrain}
          placeholder={trainsLoaded ? "Valitse juna" : "Ladataan..."}
          optionFilterProp="children"
          onSelect={(_value, option) => setSelectedTrain(option.value)}
          onClear={() => setSelectedTrain(null)}
          filterOption={(input, option) =>
            (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
          }
          filterSort={(optionA, optionB) => parseInt(optionA.value) - parseInt(optionB.value)}
          options={allTrains}
        />

        <br />

        <br />

        <Button
          disabled={selectedDate && selectedTrain ? false : true}
          loading={trainLoading}
          onClick={() => {
            setTrainLoading(true);
            router.push(`/train/${selectedDate}/${selectedTrain}`).catch(console.error);
          }}
        >
          Jatka
        </Button>

        <div style={{ position: "absolute", bottom: "0", textAlign: "center" }}>
          <p style={{ color: "#949090" }}>
            Tämä on{" "}
            <a
              style={{ color: "#949090", textDecoration: "underline" }}
              href="https://github.com/Chicken/VenaaRauhassa"
            >
              avoimen lähdekoodin
            </a>{" "}
            projekti
          </p>

          <a
            style={{
              color: "#B1B0B0",
              fontSize: "10px",
              marginLeft: "10px",
              marginRight: "10px",
              textDecoration: "underline",
            }}
            href="https://www.digitraffic.fi/kayttoehdot/"
          >
            Liikennetietojen lähde Fintraffic / digitraffic.fi, lisenssi CC 4.0 BY
          </a>

          <p
            style={{
              color: "#B1B0B0",
              fontSize: "10px",
              marginLeft: "10px",
              marginRight: "10px",
              marginTop: "5px",
            }}
          >
            Emme ole <span style={{ fontStyle: "italic" }}>VR-Yhtymä Oyj:n</span>, sen
            tytäryhtiöiden tai sen yhteistyökumppanien kanssa sidoksissa tai millään tavalla
            virallisesti yhteydessä niihin. Virallinen verkkosivusto on osoitteessa{" "}
            <a style={{ color: "#B1B0B0", textDecoration: "underline" }} href="https://www.vr.fi/">
              www.vr.fi
            </a>
            .
          </p>
        </div>
      </Flex>
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

  const initialTrains = (await getJSON(
    `https://rata.digitraffic.fi/api/v1/trains/${initialDate}`
  )) as { trainNumber: number; trainType: string }[];

  return {
    props: {
      initialDate,
      initialTrains: initialTrains
        .filter((t) => ["IC", "S"].includes(t.trainType))
        .map((t) => ({
          value: t.trainNumber.toString(),
          label: t.trainType + t.trainNumber,
        })),
    },
  };
}) satisfies GetServerSideProps<{
  initialDate: string;
  initialTrains: {
    value: string;
    label: string;
  }[];
}>;
