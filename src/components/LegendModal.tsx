import React, { type Dispatch, type SetStateAction } from "react";
import { Modal } from "antd";

const LegendItem = ({ color, text }: { color: string; text: string }) => {
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
          backgroundColor: color,
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
}: {
  IsOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
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
        <LegendItem color={"#9399b2"} text={"Paikka ei saatavilla"} />
        <LegendItem color={"#f38ba8"} text={"Paikka varattu valitulle matkalle"} />
        <LegendItem color={"#fab387"} text={"Paikan vaunu ei kulje määränpäähän saakka"} />
        <LegendItem color={"#f9e2af"} text={"Paikka osittain varattu valitulle matkalle"} />
        <LegendItem color={"#a6e3a1"} text={"Paikka vapaa"} />
      </Modal>
    </>
  );
};
