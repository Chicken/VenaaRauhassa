import { Button } from "antd";
import React, { type SetStateAction } from "react";

type FooterProps = {
  setIsFbModalOpen: (value: SetStateAction<boolean>) => void;
  onInfoClick: () => void;
};

export const Footer: React.FC<FooterProps> = ({ setIsFbModalOpen, onInfoClick }) => {
  return (
    <div className="footer">
      <Button
        onClick={() => setIsFbModalOpen(true)}
        style={{
          fontWeight: 500,
          height: "40px",
          fontSize: "16px",
          marginBottom: "10px",
        }}
      >
        💬 Anna palautetta
      </Button>

      <p style={{ color: "#757575" }}>
        <a
          style={{ color: "#757575", textDecoration: "underline", cursor: "pointer" }}
          onClick={onInfoClick}
        >
          Mikä palvelun tarkoitus on?
        </a>{" "}
        - VenaaRauhassa on{" "}
        <a
          style={{ color: "#757575", textDecoration: "underline" }}
          href="https://github.com/Chicken/VenaaRauhassa"
        >
          avointa lähdekoodia
        </a>
      </p>

      <a
        style={{
          color: "#757575",
          fontSize: "12px",
          textDecoration: "underline",
        }}
        href="https://www.digitraffic.fi/kayttoehdot/"
      >
        Liikennetietojen lähde Fintraffic / digitraffic.fi, lisenssi CC 4.0 BY
      </a>

      <p
        style={{
          color: "#757575",
          fontSize: "12px",
          marginTop: "5px",
        }}
      >
        Emme ole <span style={{ fontStyle: "italic" }}>VR-Yhtymä Oyj:n</span>, sen tytäryhtiöiden
        tai sen yhteistyökumppanien kanssa sidoksissa tai millään tavalla virallisesti yhteydessä
        niihin. Virallinen verkkosivusto on osoitteessa{" "}
        <a style={{ color: "#757575", textDecoration: "underline" }} href="https://www.vr.fi/">
          www.vr.fi
        </a>
        .
      </p>
    </div>
  );
};
