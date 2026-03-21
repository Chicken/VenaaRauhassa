import { StarFilled, StarOutlined } from "@ant-design/icons";
import { Button, DatePicker, Select } from "antd";
import dayjs from "dayjs";
import { useRouter } from "next/router";
import React, { useState } from "react";
import { useStickyState } from "~/lib/hooks/useStickyState";
import type { AllTrains } from "~/types";

const pickerStyle: React.CSSProperties = {
  width: "100%",
  height: "40px",
  maxWidth: "300px",
};

type TrainSelectorProps = {
  maintenance: boolean;
  initialDate: string;
  selectedDate: string | null;
  setSelectedDate: (date: string | null) => void;
  selectedTrain: string | null;
  setSelectedTrain: (train: string | null) => void;
  trainsLoaded: boolean;
  allTrains: AllTrains;
};

export const TrainSelector: React.FC<TrainSelectorProps> = ({
  maintenance,
  initialDate,
  selectedDate,
  setSelectedDate,
  selectedTrain,
  setSelectedTrain,
  trainsLoaded,
  allTrains,
}) => {
  const [trainLoading, setTrainLoading] = useState<boolean>(false);
  const [favorites, setFavorites] = useStickyState<string[]>("trainFavorites", []);
  const router = useRouter();

  const toggleFavorite = (value: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setFavorites((prev) =>
      prev.includes(value) ? prev.filter((f) => f !== value) : [...prev, value]
    );
  };

  return (
    <>
      <DatePicker
        placeholder="Valitse päivä"
        disabled={maintenance}
        disabledDate={(current) => current && current < dayjs().subtract(2, "day")}
        defaultValue={dayjs(initialDate)}
        style={pickerStyle}
        onChange={(_date, dateString) => {
          if (dateString && typeof dateString === "string") {
            setSelectedDate(dateString.split(".").reverse().join("-"));
          } else {
            setSelectedDate(null);
            setSelectedTrain(null);
          }
        }}
        format="DD.MM.YYYY"
      />

      <Select
        style={pickerStyle}
        disabled={maintenance || (selectedDate && trainsLoaded ? false : true)}
        loading={selectedDate && !trainsLoaded ? true : false}
        showSearch
        allowClear
        value={selectedTrain}
        placeholder={trainsLoaded ? "Valitse juna" : "Ladataan..."}
        optionFilterProp="children"
        onSelect={(_value, option) => {
          if (option && typeof option.value === "string") setSelectedTrain(option.value);
        }}
        onClear={() => setSelectedTrain(null)}
        filterOption={(input, option) => {
          if (!option) return false;

          const terms = [
            option.label,
            option.arrivalStationName,
            option.arrivalStationShortCode,
            option.departureStationName,
            option.departureStationShortCode,
          ];

          const keywords = input.split(" ");
          if (keywords.length === 0) return false;
          return keywords.every((keyword) =>
            terms.some((term: string) => term.toLowerCase().includes(keyword.toLowerCase()))
          );
        }}
        filterSort={(optionA, optionB) => {
          const aFav = favorites.includes(String(optionA.value ?? ""));
          const bFav = favorites.includes(String(optionB.value ?? ""));
          if (aFav && !bFav) return -1;
          if (!aFav && bFav) return 1;
          return parseInt(String(optionA.value ?? 0)) - parseInt(String(optionB.value ?? 0));
        }}
        virtual={false}
        dropdownRender={(menu) => <div style={{ maxHeight: 250, overflow: "auto" }}>{menu}</div>}
        options={allTrains}
        optionRender={(option) => {
          const isFav = favorites.includes(String(option.value));
          return (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>{option.label}</span>
              <span
                onClick={(e) => toggleFavorite(String(option.value), e)}
                style={{
                  cursor: "pointer",
                  color: isFav ? "#fadb14" : "#bbb",
                  flexShrink: 0,
                  paddingLeft: "8px",
                  fontSize: "16px",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {isFav ? <StarFilled /> : <StarOutlined />}
              </span>
            </div>
          );
        }}
      />

      <Button
        disabled={maintenance || (selectedDate && selectedTrain ? false : true)}
        loading={trainLoading}
        onClick={() => {
          setTrainLoading(true);
          router.push(`/train/${selectedDate}/${selectedTrain}`).catch(console.error);
        }}
      >
        Jatka
      </Button>
    </>
  );
};
