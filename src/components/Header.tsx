import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

const slogans = [
  '"Ilman vieruskaveria"',
  '"Koska tässä kestää..."',
  '"Noniin ja Kokkolasta lähdettiin noin 45 minuuttia myöhässä. Syynä oli junakohtaukset ja rautatieongelmat"',
  '"Vieläkin Ratapihalla"',
  '"Vertauskelvoton Rautaromu"',
  '"Junan suunnan vaihtamisessa on ongelmia, jarrut ovat liian tiukalla"',
  '"Omalla matkalla"',
  '"Tarkoituksella yksin"',
  '"Olemme pysähdyksissä sillä meillä on kuljettaja hukassa"',
  '"Hyvät matkustajat, veturi on tulessa, poistukaa junasta rauhallisesti"',
];

type HeaderProps = {
  maintenance: boolean;
};

export const Header: React.FC<HeaderProps> = ({ maintenance }) => {
  const [sloganText, setSloganText] = useState<string | null>(null);

  useEffect(() => {
    const text = slogans[Math.floor(Math.random() * slogans.length)];
    setSloganText(text ? text : "");
  }, []);

  return (
    <>
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

      {maintenance && (
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
    </>
  );
};
