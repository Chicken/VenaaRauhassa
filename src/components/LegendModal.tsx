import { Modal, Switch } from "antd";
import { type Dispatch, type SetStateAction } from "react";

const LegendItem = ({
  text,
  bgColor,
  bgGradient = false,
  borderColor,
}: {
  text: string;
  bgColor?: string;
  bgGradient?: boolean;
  borderColor?: string;
}) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
      }}
    >
      <div
        style={{
          width: "25px",
          height: "25px",
          borderRadius: "50%",
          [bgGradient ? "background" : "backgroundColor"]: bgColor ?? "rgba(0,0,0,0)",
          marginRight: "10px",
          alignSelf: "center",
          border: borderColor ? `2px solid ${borderColor}` : "none",
        }}
      />
      <p style={{ fontWeight: 500 }}>{text}</p>
    </div>
  );
};

export const LegendModal = ({
  IsOpen,
  setIsOpen,
  heatmapEnabled,
  setHeatmapEnabled,
}: {
  IsOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  heatmapEnabled: boolean;
  setHeatmapEnabled: Dispatch<SetStateAction<boolean>>;
}) => {
  const handleOk = () => {
    setIsOpen(false);
  };

  const handleCancel = () => {
    setIsOpen(false);
  };

  // TODO: add border colors

  return (
    <>
      <Modal title="Tietoisku" open={IsOpen} onOk={handleOk} onCancel={handleCancel} footer={null}>
        <p>
          Voit klikata paikkaa nähdäksesi sen varauksen asemalta toiselle. Voit myös rajata
          asemaväliä liikuttamalla liukusäätimen päätepisteitä.
        </p>
        <LegendItem bgColor={"#45475a"} text={"Paikka ei saatavilla"} />
        <LegendItem bgColor={"#9399b2"} text={"Paikan vaunu ei kulje määränpäähän saakka"} />
        <LegendItem bgColor={"#f38ba8"} text={"Paikka varattu valitulle matkalle"} />
        {heatmapEnabled ? (
          <LegendItem
            bgGradient
            bgColor="linear-gradient(180deg, #f38ba8, #f9e2af, #a6e3a1)"
            text={"Paikka osittain varattu valitulle matkalle"}
          />
        ) : (
          <LegendItem bgColor={"#f9e2af"} text={"Paikka osittain varattu valitulle matkalle"} />
        )}
        <LegendItem bgColor={"#a6e3a1"} text={"Paikka vapaa"} />
        <LegendItem
          borderColor={"#820909"}
          text={"Erikoispaikka (ekstra, ravintolavaunu, hytti, eläin)"}
        />
        <p>
          Vaihda keltaisesta väliväristä edistyneempään lämpökarttaan:&nbsp;
          <Switch
            checked={heatmapEnabled}
            onChange={() => {
              // @ts-expect-error no types for globally available plausible function
              if (window.plausible) {
                // @ts-expect-error no types for globally available plausible function
                // eslint-disable-next-line
                window.plausible("Change Map Type", { props: { heatmapEnabled: !heatmapEnabled } });
              }
              setHeatmapEnabled((s) => !s);
            }}
          />
        </p>
      </Modal>
    </>
  );
};
