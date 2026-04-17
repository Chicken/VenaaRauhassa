import React from "react";
import { Button, Modal } from "antd";
import { useMounted } from "~/lib/hooks/useMounted";

type WelcomeModalProps = {
  open: boolean;
  onClose: () => void;
};

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ open, onClose }) => {
  const mounted = useMounted();

  return (
    <Modal
      title="Tervetuloa VenaaRauhassa palveluun"
      open={mounted && open}
      onOk={onClose}
      onCancel={onClose}
      centered
      footer={[
        <Button key="ok" type="primary" onClick={onClose}>
          Selvä!
        </Button>,
      ]}
    >
      <p>
        VenaaRauhassa on verkkopalvelu, jolla näet helposti suomalaisten junien istuinpaikkojen varaustilanteen asemakohtaisesti.
        Tämä helpottaa löytämään paikan ruuhkaisista junissa, minimoiden vieraat ihmiset vieruspaikalla.
        Valitse vain lähtösi päivänmäärä ja junanumero, niin pääset näkemään vaunukartan.
        Vaunukartalta voit valita istuinpaikan tarkastellaksesi sen varaustilanteen, joka näkyy ylhäällä asemakohtaisesti.
        Voit myös rajata asemaväliä liikuttamalla päätepisteitä, jolloin kartan värit tarkentuvat sille välille.
        Lisätietoja ja asetuksia löytyy junasivun oikean yläkulman kysymysmerkki-painikkeesta.
      </p>
      <p>
        &apos;Löydä paikkasi&apos; ominaisuus yrittää löytää parhaan mahdollisen istumapaikan.
        Huomioi kuitenkin, että se on erittäin kokeellinen.
        Tärkeä huomio on myös VR:n junat, jotka jakautuvat kahtia.
        VR ei näissä tapauksissa ilmoita kovin selvästi, että toisen junan numero vaihtuu.
        Joudut tällöin hakemaan vaunukartan junan uudella numerolla.
      </p>
      <p>Voit katsoa tämän tekstin uudestaan sivun alalaidan &quot;Mikä palvelun tarkoitus on?&quot; kohdasta.</p>
    </Modal>
  );
};
