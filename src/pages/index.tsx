import { Button, DatePicker, Flex, Select, Modal,Input, message, Form  } from "antd";
import dayjs from "dayjs";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import { getBaseURL, isInMaintenance } from "~/lib/deployment";
import { getInitialTrains } from "~/lib/vr";

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

  const [allTrains, setAllTrains] = useState(initialTrains);
  const [trainsLoaded, setTrainsLoaded] = useState<boolean>(true);
  const [trainLoading, setTrainLoading] = useState<boolean>(false);

  const [selectedDate, setSelectedDate] = useState<string | null>(initialDate);
  const [selectedTrain, setSelectedTrain] = useState<string | null>(null);

  const [messageApi, messageContextHolder] = message.useMessage();

  const [fbForm] = Form.useForm();
  const [isFbModalOpen, setIsFbModalOpen] = useState<boolean>(false);

  const getTrains = useCallback(async (date: string) => {
    setTrainsLoaded(false);

    const res = await getInitialTrains(date);
    setAllTrains(res);

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
        <meta property="og:url" content={getBaseURL() + "/"} />
        <link rel="canonical" href={getBaseURL() + "/"} />
      </Head>

      {messageContextHolder}

      {/* Feedback modal */}
      <Modal
        title="Palautelaatikko"
        open={isFbModalOpen}
        onOk={() => {
          setIsFbModalOpen(false);
          fbForm.resetFields()
        }}
        onCancel={() => {
          setIsFbModalOpen(false);
          fbForm.resetFields()
        }}
        centered={true}
        footer={[
          <Button key="back" onClick={()=>{
            setIsFbModalOpen(false)
            fbForm.resetFields()
          }}>
            Peruuta
          </Button>,
          <Button form="myForm" key="submit" htmlType="submit" onClick={()=>{
            fbForm.submit()
          }} type="primary">
            Lähetä
          </Button>
        ]}
      >


    <Form form={fbForm} layout="vertical" style={{marginTop:"2em"}} onFinish={(values) => {
      void (async () => {
        console.log(values)
        setIsFbModalOpen(false)
        fbForm.resetFields()
        messageApi
        .open({
          type: "success",
          content: "Kiitos palautteesta!",
        })
        .then(
          () => null,
          () => null
        );

        await fetch("/api/sendFeedback", {
          method: "POST",
          body: JSON.stringify(values)
        })
      })();
    }} >
      <Form.Item
        name="email"
        label="Sähköposti (Vapaaehtoinen)"
        rules={[
          {
            type: 'email',
            message: 'Syötä kelvollinen sähköpostiosoite!',
          },
        ]}
      >
        <Input />
      </Form.Item>

      <Form.Item
        label="Palaute"
        name="feedback"
        rules={[{ required: true, message: 'Tyhjää palautetta ei voi lähettää!' },{max: 1500,message: "Maksimipituus on 1500 merkkiä!",}]}
      >
        <Input.TextArea 
          placeholder="Anna palautetta tai kehitysideoita..."
          autoSize={{ minRows: 3, maxRows: 5 }}
        />
      </Form.Item>
    </Form>

      </Modal>

      <Flex
        style={{ width: "100%", gap: "5px" }}
        justify={"center"}
        align={"center"}
        vertical={true}
      >
        <div style={{ width: "calc(250px + 10vw)" }}>
          <Link href="/" style={{ color: "unset" }}>
            <Image
              style={{ width: "100%", height: "auto" }}
              src="/vr_logo.png"
              width={475}
              height={70}
              alt="VenaaRauhassa"
            />
          </Link>
        </div>
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

        {isInMaintenance() && (
          <h2
            style={{
              textAlign: "center",
            }}
          >
            Palvelu on huoltokatkolla VR:n tekemien rajapintamuutoksien takia.
            <br />
            Asiaa selvitellään
          </h2>
        )}

        <DatePicker
          placeholder="Valitse päivä"
          disabled={isInMaintenance()}
          disabledDate={(current) => current && current < dayjs().subtract(2, "day")}
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
          disabled={isInMaintenance() || (selectedDate && trainsLoaded ? false : true)}
          loading={selectedDate && !trainsLoaded ? true : false}
          showSearch
          allowClear
          value={selectedTrain}
          placeholder={trainsLoaded ? "Valitse juna" : "Ladataan..."}
          optionFilterProp="children"
          onSelect={(_value, option) => setSelectedTrain(option.value)}
          onClear={() => setSelectedTrain(null)}
          filterOption={(input, option) => {
            if (!option) return false;

            const terms = [
              option.label,
              option.arrivalStationName,
              option.arrivalStationShortCode,
              option.departureStationName,
              option.departureStationShortCode,
            ];

            const keywords = input.split(" ");
            if (keywords.length === 0) return false;
            return keywords.every((keyword) =>
              terms.some((term) => term.toLowerCase().includes(keyword.toLowerCase()))
            );
          }}
          filterSort={(optionA, optionB) => parseInt(optionA.value) - parseInt(optionB.value)}
          options={allTrains}
        />

        <br />

        <br />

        <Button
          disabled={isInMaintenance() || (selectedDate && selectedTrain ? false : true)}
          loading={trainLoading}
          onClick={() => {
            setTrainLoading(true);
            router.push(`/train/${selectedDate}/${selectedTrain}`).catch(console.error);
          }}
        >
          Jatka
        </Button>

        <div style={{ position: "absolute", bottom: "0", textAlign: "center" }}>
          <Button
            onClick={() => setIsFbModalOpen(true)}
            style={{
              fontWeight: "bold",
              height: "40px",
              fontSize: "16px",
              marginBottom: "10px",
            }}
          >
            ✨ Anna palautetta ✨{" "}
            <span
              style={{
                backgroundColor: "rgba(0, 0, 200, 0.2)",
                borderRadius: "10px",
                padding: "1px 7px",
                marginLeft: "5px",
                boxSizing: "border-box",
              }}
            >
              Beta
            </span>
          </Button>

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

  const initialTrains = await getInitialTrains(initialDate);

  return {
    props: {
      initialDate,
      initialTrains,
    },
  };
}) satisfies GetServerSideProps<{
  initialDate: string;
  initialTrains: {
    value: string;
    label: string;
  }[];
}>;
