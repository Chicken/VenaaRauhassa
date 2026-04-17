import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

const messages = [
  // Jokes
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
  '"Juna on osallistunut autokolariin"',
  '"Ratavaurion vuoksi raiteet ovat sähköisesti varautuneet"',
  '"Junaliikenne on keskeytetty poliisioperaation vuoksi"',
  '"Sillä talvi yllätti, taas kerran"',
  '"Rataa ei ole hiekoitettu riittävästi"',
  // Call to action
  'Annathan palautetta sivun alaosassa!',
  'Kerro palvelusta kaverille!',
  'Jaa tämä kikka sosiaalisessa mediassa!',
  // Trivia
  'Oman lipun paikalla ei ole pakko istua, mutta se on suositeltavaa!',
  'Tuntuuko siltä, että kartta on väärin? VR voi kytkeä vaunun väärinpäin junaan!',
  'Tiesitkö, että pääradalla vaunu numero yksi on Helsinkiä kohti?',
  'Turun tunnin junan hinta oli noin kolme miljardia euroa!',
  'Tiesitkö, että VenaaRauhassa on mainittu VR:n sisäisessä dokumentaatiossa?',
  'Tiesitkö, että päärata on Helsinki - Oulu?',
  // Developer opinions
  'Pääradan yksikaistaisuus on junaliikenteen hirveimpiä pullonkauloja',
  'Jos junaverkko toimii, ihmeitä on tapahtunut',
  'VenaaRauhassa on alhaalla vain jos VR:n tai Digitrafficin rajapinnat eivät toimi',
  // Statistics
  'Kotimaan kaukoliikenteessä tehtiin noin 15 miljoonaa matkaa vuonna 2024',
  'VenaaRauhassa palvelua käytetään kuukausittain noin 20 000 kertaa',
  'Noin prosentti VR:n matkoista hyödyntää VenaaRauhassa palvelua',
  'Suosituimmat junat ovat: IC25, IC28, ja IC27. Kaikki Helsinki - Rovaniemi väliä kulkevia!'
];

type HeaderProps = {
  maintenance: boolean;
};

export const Header: React.FC<HeaderProps> = ({ maintenance }) => {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => setMessage(messages[Math.floor(Math.random() * messages.length)]!), []);

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
        {message}
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
