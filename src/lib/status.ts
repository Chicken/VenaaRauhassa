import { cache, MINUTE } from "~/lib/cacheFn";

export const getAPIStatus = cache(1 * MINUTE, 1 * MINUTE, async () => {
  const [digitrafficRes, vrRes] = await Promise.all([
    fetch("https://status.digitraffic.fi/index.json"),
    fetch("https://status.antti.codes/api/status-page/heartbeat/vr"),
  ]);

  let digitrafficOk = false;
  if (digitrafficRes.ok) {
    const data = (await digitrafficRes.json()) as {
      systems: { name: string; status: string }[];
    };
    const trainSystem = data.systems.find((s) => s.name === "rail/api/v1/trains");
    digitrafficOk = trainSystem?.status === "ok";
  }

  let vrApiOk = false;
  let vrIdOk = false;
  if (vrRes.ok) {
    const data = (await vrRes.json()) as {
      heartbeatList: Record<string, { status: number }[]>;
    };
    // 99 = VR API, 102 = VR ID API
    const vrApiHeartbeats = data.heartbeatList["99"];
    const vrIdHeartbeats = data.heartbeatList["102"];

    if (vrApiHeartbeats && vrApiHeartbeats.length > 0)
      vrApiOk = vrApiHeartbeats[vrApiHeartbeats.length - 1]?.status === 1;
    if (vrIdHeartbeats && vrIdHeartbeats.length > 0)
      vrIdOk = vrIdHeartbeats[vrIdHeartbeats.length - 1]?.status === 1;
  }
  return {
    digitraffic: digitrafficOk,
    vrApi: vrApiOk,
    vrId: vrIdOk,
  };
}, "getAPIStatus");
