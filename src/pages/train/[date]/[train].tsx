import { LeftCircleOutlined, QuestionCircleOutlined, ReloadOutlined } from "@ant-design/icons";
import { Button, Slider, message } from "antd";
import dayjs from "dayjs";
import { type GetServerSideProps, type InferGetServerSidePropsType } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
// @ts-expect-error no types exists
import { SvgLoader, SvgProxy } from "react-svgmt";
import { ZodError } from "zod";
import { hueShift } from "~/lib/colors";
import { getBaseURL, isInMaintenance } from "~/lib/deployment";
import { useStickyState } from "~/lib/hooks/useStickyState";
import { getStations, getTrainOnDate } from "~/lib/vr";
import { LegendModal } from "../../../components/LegendModal";

function getSeatId(event: MouseEvent) {
  if (!(event.target instanceof Element)) {
    return null;
  }

  let target = event.target;
  let seat: string | null = null;
  while (target !== document.body) {
    if (seat) {
      const wagon = target.getAttribute("data-wagon");
      if (wagon) {
        return [parseInt(wagon), parseInt(seat)];
      }
    } else if (target.id.startsWith("seat_")) {
      seat = target.id.slice(5);
    } else if (target.id.startsWith("bed_")) {
      seat = target.id.slice(4);
    }
    target = target.parentElement!;
  }
  return null;
}

function getSeatSelector(type: string, number: number): string {
  switch (type) {
    case "BED":
      return `#highlight_${number} + path`;
    default:
      return `#seat_${number}_shape`;
  }
}

export default function TrainPage({
  error,
  date,
  initialRange,
  initialSelectedSeat,
  train,
  stations,
  wagons,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  if (process.env.NODE_ENV === "development")
    console.debug(error, date, initialRange, initialSelectedSeat, train, stations, wagons);

  const router = useRouter();
  const [messageApi, messageContextHolder] = message.useMessage();

  const [timeRange, setTimeRange] = useState<number[]>(initialRange ?? [0, 0]);
  const [LModalOpen, setLModalOpen] = useState<boolean>(false);

  const [selectedSeat, setSelectedSeat] = useState<number[] | null>(initialSelectedSeat ?? null);

  const [heatmapEnabled, setHeatmapEnabled] = useStickyState("heatmapEnabled", true);

  useEffect(() => {
    if (!train) return;
    function safeShallow(url: string) {
      if (decodeURIComponent(router.asPath) !== url)
        void router.replace(url, undefined, { shallow: true }).catch(console.error);
    }
    if (
      timeRange[0] === 0 &&
      timeRange[1] === train?.timeTableRows.length &&
      selectedSeat === null
    ) {
      safeShallow(`/train/${train.departureDate}/${train.trainNumber}`);
    } else if (
      (timeRange[0] !== 0 || timeRange[1] !== train?.timeTableRows.length) &&
      selectedSeat !== null
    ) {
      safeShallow(
        `/train/${train.departureDate}/${train.trainNumber}?from=${
          stations[timeRange[0]!]!.stationShortCode
        }&to=${stations[timeRange[1]!]!.stationShortCode}&seat=${selectedSeat[0]}-${
          selectedSeat[1]
        }`
      );
    } else if (selectedSeat !== null) {
      safeShallow(
        `/train/${train.departureDate}/${train.trainNumber}?seat=${selectedSeat[0]}-${selectedSeat[1]}`
      );
    } else {
      safeShallow(
        `/train/${train.departureDate}/${train.trainNumber}?from=${
          stations[timeRange[0]!]!.stationShortCode
        }&to=${stations[timeRange[1]!]!.stationShortCode}`
      );
    }
  }, [router, train, stations, initialRange, initialSelectedSeat, timeRange, selectedSeat]);

  useEffect(() => {
    if (!initialSelectedSeat) return;
    const timeout = setTimeout(() => {
      const seatEl = document.querySelector(
        `[data-wagon="${initialSelectedSeat[0]}"] #seat_${initialSelectedSeat[1]}_shape`
      );
      if (!seatEl) return;
      seatEl.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }, 500);
    return () => clearTimeout(timeout);
  }, [initialSelectedSeat]);

  useEffect(() => {
    if (!selectedSeat) return;
    const seatEl = document.querySelector(
      `[data-wagon="${selectedSeat[0]}"] #seat_${selectedSeat[1]}_shape`
    );
    if (!seatEl) return;
    const timeout = setTimeout(() => {
      seatEl.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }, 0);
    return () => clearTimeout(timeout);
  }, [selectedSeat]);

  useEffect(() => {
    const [leftHandle, rightHandle] = [...document.querySelectorAll(".ant-slider-handle")] as [
      HTMLElement,
      HTMLElement,
    ];

    const allSliderDots = Array.from(
      document.getElementsByClassName("ant-slider-dot")
    ) as HTMLElement[];

    allSliderDots.forEach((dotEl) => {
      if (!dotEl.classList.contains("ant-slider-dot-active")) {
        dotEl.style.borderColor = "rgba(0, 0, 0, 0.06)";
      }
    });

    const sliderDots = Array.from(
      document.getElementsByClassName("ant-slider-dot-active")
    ) as HTMLElement[];

    let styleStr = "linear-gradient(to right, ";

    sliderDots.forEach((dotEl, i) => {
      const percent = (i / (sliderDots.length - 1)) * 100 + "%";
      const nextPercent = ((i + 1) / (sliderDots.length - 1)) * 100 + "%";

      const seat =
        selectedSeat && wagons
          ? wagons
              .find((w) => w.number === selectedSeat[0])!
              .floors.flatMap((f) => f.seats)
              .find((s) => s.number === selectedSeat[1])!
          : null;

      const color = seat
        ? {
            unavailable: "#9399b2",
            reserved: "#f38ba8",
            open: "#a6e3a1",
          }[seat.status[i + timeRange[0]!]!]
        : "#7f849c";

      if (i === 0) leftHandle.style.setProperty("--handle-color", color);
      if (i === sliderDots.length - 2) rightHandle.style.setProperty("--handle-color", color);

      if (i === sliderDots.length - 1) {
        styleStr = styleStr.slice(0, -2);
        styleStr += ")";
      } else {
        styleStr += `${color} ${percent}, ${color} ${nextPercent}, `;
      }

      dotEl.style.borderColor = color;
    });

    const sliderEl = document.getElementsByClassName("ant-slider-track-1")[0] as HTMLElement;
    if (sliderEl) sliderEl.style.background = styleStr;
  }, [timeRange, selectedSeat, wagons]);

  useEffect(() => {
    router.prefetch(date ? `/?date=${date}` : "/").catch(console.error);
  }, [router, date]);

  useEffect(() => {
    const el = document.getElementById("wagon-map");
    if (!el) return;
    el.style.cursor = "grab";

    let pos = { left: 0, x: 0 };
    let timestamp = 0;
    let animationId: number | null = null;

    const mouseDownHandler = (e: MouseEvent) => {
      if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
      el.style.cursor = "grabbing";
      el.style.userSelect = "none";
      timestamp = Date.now();

      pos = {
        left: el.scrollLeft,
        x: e.clientX,
      };

      document.addEventListener("mousemove", mouseMoveHandler);
      document.addEventListener("mouseup", mouseUpHandler);
    };

    let velocity = 0;
    let prevLeft = 0;
    const mouseMoveHandler = (e: MouseEvent) => {
      const dx = e.clientX - pos.x;
      prevLeft = el.scrollLeft;
      el.scrollLeft = pos.left - dx;
      velocity = (1.5 * velocity + (el.scrollLeft - prevLeft)) / 2.5;
    };

    const mouseUpHandler = (e: MouseEvent) => {
      if (Date.now() - timestamp < 150 && Math.abs(e.clientX - pos.x) < 50)
        setSelectedSeat(getSeatId(e));

      el.style.cursor = "grab";
      el.style.removeProperty("user-select");

      document.removeEventListener("mousemove", mouseMoveHandler);
      document.removeEventListener("mouseup", mouseUpHandler);

      animationId = requestAnimationFrame(slideScroll);
    };

    const slideScroll = () => {
      if (Math.abs(velocity) < 0.1) {
        animationId = null;
        return;
      }
      el.scrollLeft += velocity;
      velocity *= 0.95;
      animationId = requestAnimationFrame(slideScroll);
    };

    el.addEventListener("mousedown", mouseDownHandler);

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      document.removeEventListener("mousemove", mouseMoveHandler);
      document.removeEventListener("mouseup", mouseUpHandler);
      el.removeEventListener("mousedown", mouseDownHandler);
    };
  }, []);

  if (error) {
    return (
      <div style={{ textAlign: "center" }}>
        <Head>
          <title>VenaaRauhassa - Virhe</title>
          <meta name="robots" content="noindex,nofollow" />
        </Head>
        {isInMaintenance() ? (
          <h1>Palvelu huoltokatkolla...</h1>
        ) : (
          <h1>Virhe tapahtui junaa haettaessa, yritä uudelleen</h1>
        )}
        <Button
          onClick={() => void router.push(date ? `/?date=${date}` : "/").catch(console.error)}
        >
          <LeftCircleOutlined /> Takaisin
        </Button>
        {
          !isInMaintenance() && (
            <Button onClick={() => window.location.reload()}>
              <ReloadOutlined /> Yritä uudelleen
            </Button>
          )
        }
      </div>
    );
  }

  if (!train) {
    return (
      <div style={{ textAlign: "center" }}>
        <Head>
          <title>VenaaRauhassa - 404</title>
          <meta name="robots" content="noindex,nofollow" />
        </Head>
        <h1>Junaa ei löytynyt...</h1>
        <Button
          onClick={() => void router.push(date ? `/?date=${date}` : "/").catch(console.error)}
        >
          <LeftCircleOutlined /> Takaisin
        </Button>
      </div>
    );
  }

  const fiDate = train.departureDate.split("-").reverse().map(Number).join(".");

  // TODO: when range is set, show cooler information
  // TODO: when seat is set, show cooler information
  // TODO: maybe even og:image with @vercel/og

  const totalSeats = wagons.reduce(
    (a, c) => a + c.floors.reduce((a2, c2) => a2 + c2.seats.length, 0),
    0
  );
  const ecoSeatObjs = wagons.flatMap((w) =>
    w.floors.flatMap((f) =>
      f.seats.filter((seat) => seat.productType === "ECO_CLASS_SEAT" && seat.services.length === 0)
    )
  );
  const ecoSeats = ecoSeatObjs.length;
  const bookedEcoSeats = ecoSeatObjs.filter((s) => s.status.includes("reserved")).length;
  const percentageBookedEcoSeats =
    ecoSeatObjs.reduce((a, c) => a + c.status.filter((s) => s === "reserved").length, 0) /
    ecoSeatObjs.reduce((a, c) => a + c.status.length, 0);

  const siteTitle = `VenaaRauhassa - ${train.trainType}${train.trainNumber} - ${fiDate}`;
  const description =
    train && stations
      ? `Juna ${train.trainType}${train.trainNumber} lähtee asemalta ${stations[0]?.station.replace(
          " asema",
          ""
        )} klo ${dayjs(stations[0]!.departureTime).format("HH:mm")} ja saapuu asemalle ${stations
          .at(-1)
          ?.station.replace(" asema", "")} klo ${dayjs(stations.at(-1)?.arrivalTime).format(
          "HH:mm"
        )}. Välillä on ${totalSeats} paikkaa, joista ${ecoSeats} on normaaleja. Normaaleista välillä on varattuna ${bookedEcoSeats} paikkaa. Mutta todellisuudessa paikat ovat ajallisesti varattuna vain ${(
          percentageBookedEcoSeats * 100
        ).toFixed(0)}% ajasta.`
      : "";
  const url = `${getBaseURL()}/train/${train.departureDate}/${train.trainNumber}`;
  const tags = [
    "venaarauhassa",
    "venaarauhas",
    "venaa",
    "rauhassa",
    "rauhas",
    "vr",
    "juna",
    "paikka",
    "kartta",
    "asema",
    train.trainType + train.trainNumber,
    train.trainType === "IC" ? "intercity" : "pendolino",
    train.trainNumber,
    fiDate,
    ...stations.map((station) => station.station.replace(" asema", "")),
  ];

  return (
    <>
      <Head>
        <title>{siteTitle}</title>
        <meta property="og:title" content={siteTitle} />
        <meta name="description" content={description} />
        <meta property="og:description" content={description} />
        <meta name="keywords" content={tags.join(",")} />
        <meta property="og:url" content={url} />
        <link rel="canonical" href={url} />
      </Head>

      {messageContextHolder}

      <div
        style={{
          display: "flex",
          flexDirection: "row",
          flexWrap: "wrap",
          gap: "8px",
          alignItems: "center",
        }}
      >
        <Button
          onClick={() => void router.push(date ? `/?date=${date}` : "/").catch(console.error)}
        >
          <LeftCircleOutlined /> Takaisin
        </Button>
        <h1 className="train-title">
          {fiDate}
          <span style={{ marginLeft: "5px" }}>{train.trainType + train.trainNumber}</span>
        </h1>
        <div style={{ marginLeft: "auto" }}>
          <Button
            onClick={() => {
              // @ts-expect-error no types for globally available plausible function
              // eslint-disable-next-line
              if (window.plausible) window.plausible("Press Help");
              setLModalOpen(true);
            }}
          >
            <QuestionCircleOutlined />
          </Button>
        </div>
      </div>

      <div
        style={{
          paddingTop: "0.5em",
          paddingLeft: "2em",
          paddingBottom: "calc(8px + 1vw)",
          overflowX: "scroll",
          overflowY: "hidden",
        }}
      >
        <Slider
          range
          max={stations.length - 1}
          value={timeRange}
          onChange={(value) => {
            // @ts-expect-error no types for globally available plausible function
            // eslint-disable-next-line
            if (window.plausible) window.plausible("Change Range");
            if (value[0] === value[1]) {
              if (value[0] === 0 || value[0] === stations.length - 1) return;
              setTimeRange(
                timeRange[0] !== value[0] ? [value[1]!, value[0]! + 1] : [value[1]! - 1, value[0]!]
              );
              return;
            }
            setTimeRange(value);
          }}
          tooltip={{
            open: false,
          }}
          marks={Object.fromEntries(
            stations.map((station, i) => {
              const seat = selectedSeat
                ? wagons
                    .find((w) => w.number === selectedSeat[0])!
                    .floors.flatMap((f) => f.seats)
                    .find((s) => s.number === selectedSeat[1])!
                : null;

              const stationName = station.station.replace(" asema", "");
              return [
                i,
                <div
                  key={station.stationShortCode}
                  style={{
                    marginTop: i % 2 === 1 ? "15px" : "5px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <p
                    style={{
                      width: "fit-content",
                      color: seat?.status[i] === "unavailable" ? "grey" : "unset",
                      fontSize: "max(12px, min(18px, calc(8px + 0.5vw)))",
                      margin: "0px",
                    }}
                  >
                    {i % 2 === 1 ? <br /> : ""}
                    {stationName}
                  </p>
                  <p
                    style={{
                      color: seat?.status[i] === "unavailable" ? "grey" : "unset",
                      fontSize: "max(10px, min(16px, calc(4px + 0.5vw)))",
                      margin: "0px",
                    }}
                  >
                    {station.arrivalTime && dayjs(station.arrivalTime).format("HH:mm")}
                    {station.arrivalTime && station.departureTime && " - "}
                    {station.departureTime && dayjs(station.departureTime).format("HH:mm")}
                  </p>
                </div>,
              ];
            })
          )}
          style={{
            margin: "auto",
            marginBottom: "60px",
            minWidth: "500px",
            maxWidth: "90%",
          }}
        />
      </div>

      <div
        id="wagon-map"
        className="wagonClass"
        style={{
          display: "flex",
          overflow: "auto",
          paddingBottom: "8px",
        }}
      >
        {wagons.map((wagon) => {
          return (
            <div
              key={wagon.number}
              style={{
                display: "flex",
                flexDirection: "column",
              }}
            >
              {[...wagon.floors].reverse().map((floor) => (
                <SvgLoader
                  className={"wagon-svg"}
                  key={floor.number}
                  path={floor.image}
                  style={{
                    aspectRatio: "calc(1587 + 12) / calc(237 + 12)",
                    padding: "6px",
                  }}
                  data-wagon={wagon.number}
                >
                  {/* background */}
                  <SvgProxy selector="svg > g > path" fill="f9f9f9" />
                  {floor.seats.map((seat) => {
                    const statusRange = seat.status.slice(timeRange[0], timeRange[1]);

                    const isSelected = selectedSeat
                      ? seat.number === selectedSeat[1] && wagon.number === selectedSeat[0]
                      : false;

                    const allUnavailable = statusRange.every((r) => r === "unavailable");
                    const allReserved = statusRange.every((r) => r === "reserved");
                    const allOpen = statusRange.every((r) => r === "open");

                    const extra = seat.productType === "EXTRA_CLASS_SEAT";
                    const restaurant = seat.productType === "SEAT_UPSTAIRS_RESTAURANT_WAGON";
                    const wheelchair = seat.services.some((s) => s.includes("WHEELCHAIR"));
                    const compartment = seat.services.some((s) => s.includes("COMPARTMENT"));
                    const petCoach = seat.services.some((s) => s.includes("PET-COACH"));
                    const pet = seat.services.some((s) => s.includes("PETS"));
                    const bed = seat.type === "BED";
                    const special =
                      extra || restaurant || wheelchair || compartment || petCoach || pet || bed;

                    const proxies = [
                      <SvgProxy
                        key={seat.number + "-bg"}
                        selector={getSeatSelector(seat.type, seat.number)}
                        fill={(() => {
                          if (allUnavailable) return "#45475a";
                          if (statusRange.includes("unavailable")) return "#9399b2";
                          if (allReserved) return "#f38ba8";
                          if (allOpen) return "#a6e3a1";
                          if (heatmapEnabled)
                            return hueShift(
                              "#f9e2af",
                              20 *
                                (8 / 2 -
                                  (statusRange.filter((r) => r === "reserved").length /
                                    statusRange.length) *
                                    8)
                            );
                          return "#f9e2af";
                        })()}
                        stroke={(() => {
                          if (isSelected) return "#313244";
                          if (special) return "#820909";
                          return "#1b50af";
                        })()}
                        stroke-width={(() => {
                          if (heatmapEnabled) {
                            if (isSelected) return "5px";
                            if (allReserved || allOpen || special) return "3px";
                            return "1px";
                          } else {
                            if (isSelected) return "3px";
                            if (special) return "2px";
                            return "1px";
                          }
                        })()}
                      />,
                    ];

                    if (pet || petCoach) {
                      proxies.push(
                        <SvgProxy
                          key={seat.number + "-pet-indicator"}
                          selector={"#pet_seat_indicator_" + seat.number}
                          fill="rgb(213, 238, 250)"
                        />
                      );
                      if (pet) {
                        proxies.push(
                          <SvgProxy
                            key={seat.number + "-seat-number-1"}
                            selector={"#seatnumber_" + seat.number}
                            fill="none"
                          />
                        );
                        proxies.push(
                          <SvgProxy
                            key={seat.number + "-seat-number-2"}
                            selector={"#seatnumber_" + seat.number + "-with-service-icon"}
                            fill="rgb(27, 80, 175)"
                          />
                        );
                      }
                    }

                    return proxies;
                  })}
                </SvgLoader>
              ))}

              <div style={{ textAlign: "center" }}>
                <span style={{ fontWeight: "bold", fontSize: 20 }}>{wagon.number}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* TODO: scaled train model map */}

      <div
        style={{
          textAlign: "center",
          width: "100%",
        }}
      >
        <Button
          onClick={() => {
            // @ts-expect-error no types for globally available plausible function
            // eslint-disable-next-line
            if (window.plausible) window.plausible("Find Seat");

            function getSeatGroup(floor: Floor, seat: Seat): Seat[] {
              if (seat.services.includes("OPPOSITE")) {
                const seatsInSection = floor.seats.filter(
                  (s) => s.section === seat.section && s.number !== seat.number
                );
                return seatsInSection;
              } else {
                const adjacentNumber = seat.number % 2 ? seat.number + 1 : seat.number - 1;
                const adjacent = floor.seats.find((s) => s.number === adjacentNumber);
                if (adjacent) return [adjacent];
                return [];
              }
            }

            function groupScore(group: Seat[]) {
              if (!group.length) return 1;
              return (
                group.reduce(
                  (a, c) =>
                    a +
                    c.status.slice(timeRange[0], timeRange[1]).filter((s) => s === "open").length /
                      c.status.length,
                  0
                ) / group.length
              );
            }

            const possibleSeats = wagons.flatMap((w) =>
              w.floors.flatMap((f) =>
                f.seats
                  .filter(
                    (s) =>
                      s.productType === "ECO_CLASS_SEAT" &&
                      ["WHEELCHAIR", "COMPARTMENT", "PETS", "PET-COACH"].every(
                        (tSrv) => !s.services.some((srv) => srv.includes(tSrv))
                      ) &&
                      // should probably use time occupied instead of just stations
                      s.status.slice(timeRange[0], timeRange[1]).every((r) => r === "open")
                  )
                  .map((s) => {
                    const group = getSeatGroup(f, s);
                    return { ...s, wagon: w.number, group, groupScore: groupScore(group) };
                  })
              )
            );

            if (!possibleSeats.length) {
              messageApi
                .open({
                  type: "error",
                  content: "Ei avoimia paikkoja junassa :(",
                })
                .then(
                  () => null,
                  () => null
                );
              return;
            }

            const posToNum = (pos: string | null) => (pos === "WINDOW" ? 1 : 0);

            // this sorting and filtering is very primitive and the logic should be fine tuned to be more human-like

            possibleSeats.sort((s1, s2) => {
              if (s1.group.length - s2.group.length) return s1.group.length - s2.group.length;
              if (s2.groupScore - s1.groupScore) return s2.groupScore - s1.groupScore;
              if (posToNum(s2.position) - posToNum(s1.position))
                return posToNum(s2.position) - posToNum(s1.position);
              return 0;
            });

            let criteria = 0;
            let best = possibleSeats;

            criteria = best[0]!.group.length;
            best = best.filter((s) => s.group.length === criteria);

            if (process.env.NODE_ENV === "development") console.log("group length", criteria, best);

            criteria = best[0]!.groupScore;
            best = best.filter((s) => s.groupScore >= criteria - 0.0001);

            if (process.env.NODE_ENV === "development") console.log("group score", criteria, best);

            criteria = posToNum(best[0]!.position);
            best = best.filter((s) => posToNum(s.position) === criteria);

            if (process.env.NODE_ENV === "development") console.log("position", criteria, best);

            if (selectedSeat)
              best = best.filter(
                (s) => s.wagon !== selectedSeat[0] || s.number !== selectedSeat[1]
              );

            if (!best.length) {
              messageApi
                .open({
                  type: "info",
                  content: "Ei muita yhtä hyviä vaihtoehtoja",
                })
                .then(
                  () => null,
                  () => null
                );
              return;
            }

            const randomSeat = best[Math.floor(Math.random() * best.length)]!;
            if (process.env.NODE_ENV === "development") console.log(randomSeat);

            setSelectedSeat([randomSeat.wagon, randomSeat.number]);

            messageApi
              .open({
                type: "success",
                content: `Vaunu ${randomSeat.wagon} paikka ${randomSeat.number}`,
              })
              .then(
                () => null,
                () => null
              );
          }}
          style={{
            fontWeight: "bold",
            height: "40px",
            fontSize: "16px",
          }}
        >
          ✨ Löydä paikkasi ✨{" "}
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
      </div>

      <div
        style={{
          position: "absolute",
          bottom: "0",
          left: "0",
          textAlign: "center",
          width: "100%",
        }}
      >
        <a
          style={{
            color: "#B1B0B0",
            fontSize: "10px",
            marginLeft: "10px",
            marginRight: "10px",
            textDecoration: "underline",
          }}
          href="https://www.vr.fi/"
        >
          Paikkakarttojen lähde <span style={{ fontStyle: "italic" }}>VR-Yhtymä Oyj</span>
        </a>

        <br />

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
          Emme ole <span style={{ fontStyle: "italic" }}>VR-Yhtymä Oyj:n</span>, sen tytäryhtiöiden
          tai sen yhteistyökumppanien kanssa sidoksissa tai millään tavalla virallisesti yhteydessä
          niihin. Virallinen verkkosivusto on osoitteessa{" "}
          <a style={{ color: "#B1B0B0", textDecoration: "underline" }} href="https://www.vr.fi/">
            www.vr.fi
          </a>
          .
        </p>
      </div>

      <LegendModal
        IsOpen={LModalOpen}
        setIsOpen={setLModalOpen}
        heatmapEnabled={heatmapEnabled}
        setHeatmapEnabled={setHeatmapEnabled}
      />
    </>
  );
}

export const getServerSideProps = (async (context) => {
  if (isInMaintenance()) {
    return {
      props: {
        error: true,
      },
    };
  }

  context.res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");

  if (typeof context.query.date !== "string" || typeof context.query.train !== "string") {
    return { props: { error: true } };
  }

  const date = new Date(context.query.date);
  if (isNaN(date.getTime())) {
    return { props: { error: true } };
  }

  try {
    const [train, allStations] = await Promise.all([
      getTrainOnDate(context.query.date, context.query.train),
      getStations(),
    ]);

    if (!train) {
      return {
        props: {
          error: false,
          date: context.query.date,
          train: null,
        },
      };
    }

    const stations = train.timeTableRows
      .map((row, i, rows) =>
        i > 1 ? { ...row.dep, arrivalTime: rows[i - 1]!.arr.scheduledTime } : row.dep
      )
      .concat(train.timeTableRows.at(-1)!.arr)
      .map((station, i, stations) => ({
        departureTime: i === stations.length - 1 ? null : new Date(station.scheduledTime).getTime(),
        arrivalTime:
          i === stations.length - 1
            ? new Date(station.scheduledTime).getTime()
            : "arrivalTime" in station
            ? new Date(station.arrivalTime).getTime()
            : null,
        stationShortCode: station.stationShortCode,
        station: allStations[station.stationShortCode] ?? station.stationShortCode,
      }));

    const wagons = Object.values(train.timeTableRows[0]!.wagons)
      .filter((w) => w.placeType !== "VEHICLE")
      .sort((w1, w2) => w2.number - w1.number)
      .map((wagon) => ({
        number: wagon.number,
        type: wagon.type,
        floors: Array(wagon.floorCount)
          .fill(0)
          .map((_, floor) => ({
            number: floor + 1,
            image:
              "https://prod.wagonmap.prodvrfi.vrpublic.fi/images/v1.6.0/" +
              wagon.type +
              (wagon.floorCount != 1 ? (floor ? "_up" : "_down") : "") +
              ".svg",
            seats: wagon.placeList
              .filter((place) => place.floor === floor + 1)
              .map((place) => ({
                number: place.number,
                section: place.logicalSection,
                status: train.timeTableRows.map((row) => {
                  const rowWagon = Object.values(row.wagons).find(
                    (wagon2) => wagon2.number === wagon.number
                  );
                  if (!rowWagon) return "unavailable";
                  const rowPlace = rowWagon.placeList.find(
                    (place2) => place2.number === place.number
                  );
                  if (!rowPlace) {
                    // VR API IS VERY STUPID
                    return "reserved";
                    // throw new Error(
                    //   `Place ${place.number} not found wagon ${wagon.number} of ${train.trainNumber} from ${row.dep.stationShortCode} to ${row.arr.stationShortCode} on ${train.departureDate}`
                    // );
                  }
                  return rowPlace.bookable ? "open" : "reserved";
                }),
                type: place.type,
                productType: place.productType,
                services: place.services,
                position: place.position,
              })),
          })),
      }));
    if (["IM2", "EDO"].includes(wagons[0]?.type ?? "")) wagons.reverse();

    let initialRange: number[] | null = [0, train.timeTableRows.length];
    let initialSelectedSeat: number[] | null = null;

    if (typeof context.query.from === "string" && typeof context.query.to === "string") {
      const rangeStart = stations.findIndex((s) => s.stationShortCode === context.query.from);
      const rangeEnd = stations.findIndex((s) => s.stationShortCode === context.query.to);
      if (rangeStart >= 0 && rangeEnd > 0 && rangeStart < rangeEnd) {
        initialRange = [rangeStart, rangeEnd];
      }
    }

    if (typeof context.query.seat === "string") {
      const seat = context.query.seat.split("-").map((s) => parseInt(s));
      if (
        seat.length === 2 &&
        !isNaN(seat[0]!) &&
        !isNaN(seat[1]!) &&
        wagons.some(
          (w) =>
            w.number === seat[0] && w.floors.some((f) => f.seats.some((s) => s.number === seat[1]))
        )
      ) {
        initialSelectedSeat = seat;
      }
    }

    return {
      props: {
        error: false,
        date: context.query.date,
        initialRange,
        initialSelectedSeat,
        train,
        stations,
        wagons,
      },
    };
  } catch (e: unknown) {
    console.error("train server props", e);
    if (e instanceof ZodError) {
      console.error(e.issues, e.issues[0]);
    }
    context.res.statusCode = 500;
    return { props: { error: true, date: context.query.date } };
  }
}) satisfies GetServerSideProps<
  (
    | {
        error: false;
        initialRange: number[];
        initialSelectedSeat: number[] | null;
        train: NonNullable<Awaited<ReturnType<typeof getTrainOnDate>>>;
        stations: {
          arrivalTime: number | null;
          departureTime: number | null;
          stationShortCode: string;
          station: string;
        }[];
        wagons: {
          number: number;
          type: string;
          floors: Floor[];
        }[];
      }
    | {
        error: false;
        train: null;
      }
    | {
        error: true;
      }
  ) & { date?: string }
>;

type Floor = {
  number: number;
  image: string;
  seats: Seat[];
};

type Seat = {
  number: number;
  section: number;
  status: ("open" | "reserved" | "unavailable")[];
  productType: string;
  type: string;
  services: string[];
  position: string | null;
};
