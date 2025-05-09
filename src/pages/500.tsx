import Head from "next/head";

export default function Error() {
  return (
    <div style={{ textAlign: "center" }}>
      <Head>
        <title>VenaaRauhassa - 500</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <h1>Tapahtui kriittinen virhe, yritä uudelleen myöhemmin.</h1>
    </div>
  );
}
