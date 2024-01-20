import { Modal, Switch } from "antd";
import { type Dispatch, type SetStateAction } from "react";

const LegendItem = ({
  color,
  text,
  gradient = false,
}: {
  color: string;
  text: string;
  gradient?: boolean;
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
          borderRadius: "12.5px",
          [gradient ? "background" : "backgroundColor"]: color,
          marginRight: "10px",
          alignSelf: "center",
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

  return (
    <>
      <Modal title="Tietoisku" open={IsOpen} onOk={handleOk} onCancel={handleCancel} footer={null}>
        <p>
          Voit klikata paikkaa nähdäksesi sen varauksen asemalta toiselle. Voit myös rajata
          asemaväliä liikuttamalla liukusäätimen päätepisteitä.
        </p>
        <LegendItem color={"#45475a"} text={"Paikka ei saatavilla"} />
        <LegendItem color={"#9399b2"} text={"Paikan vaunu ei kulje määränpäähän saakka"} />
        <LegendItem color={"#f38ba8"} text={"Paikka varattu valitulle matkalle"} />
        {heatmapEnabled ? (
          <LegendItem
            color="linear-gradient(180deg, #f38ba8, #f9e2af, #a6e3a1)"
            gradient={true}
            text={"Paikka osittain varattu valitulle matkalle"}
          />
        ) : (
          <LegendItem color={"#f9e2af"} text={"Paikka osittain varattu valitulle matkalle"} />
        )}
        <LegendItem color={"#a6e3a1"} text={"Paikka vapaa"} />
        <p>
          Vaihda keltaisesta väliväristä edistyneempään lämpökarttaan:&nbsp;
          <Switch checked={heatmapEnabled} onChange={() => setHeatmapEnabled((s) => !s)} />
        </p>
      </Modal>
    </>
  );
};
