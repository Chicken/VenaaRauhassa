import React, { useRef, useEffect, useState, useCallback } from "react";

interface Wagon {
  number: number;
  // Lisää tähän muut mahdolliset wagon-ominaisuudet
}

interface MiniMapProps {
  wagons: Wagon[];
  mainMapRef: React.RefObject<HTMLDivElement>;
}

const MiniMap: React.FC<MiniMapProps> = ({ wagons, mainMapRef }) => {
  const miniMapRef = useRef<HTMLDivElement>(null);
  const [boxPosition, setBoxPosition] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const mainMap = mainMapRef.current;
    const miniMap = miniMapRef.current;

    if (mainMap && miniMap) {
      const syncScroll = () => {
        const maxMainScrollLeft = mainMap.scrollWidth - mainMap.clientWidth;
        const boxWidth = (miniMap.clientWidth / wagons.length) * 1.5;
        const maxMiniBoxLeft = miniMap.clientWidth - boxWidth;
        const newLeft = (mainMap.scrollLeft / maxMainScrollLeft) * maxMiniBoxLeft;
        setBoxPosition(newLeft);
      };

      mainMap.addEventListener("scroll", syncScroll);

      return () => {
        mainMap.removeEventListener("scroll", syncScroll);
      };
    }
  }, [mainMapRef, wagons.length]);

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const handleDrag = (clientX: number) => {
    const miniMap = miniMapRef.current;
    const mainMap = mainMapRef.current;

    if (miniMap && mainMap) {
      const boxWidth = (miniMap.clientWidth / wagons.length) * 1.5;
      const maxMiniBoxLeft = miniMap.clientWidth - boxWidth;
      const newLeft = Math.min(Math.max(0, clientX - miniMap.offsetLeft - boxWidth / 2), maxMiniBoxLeft);

      setBoxPosition(newLeft);

      const maxMainScrollLeft = mainMap.scrollWidth - mainMap.clientWidth;
      const newScrollLeft = (newLeft / maxMiniBoxLeft) * maxMainScrollLeft;

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      animationFrameRef.current = requestAnimationFrame(() => {
        mainMap.scrollLeft = newScrollLeft;
      });
    }
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging) {
        handleDrag(e.clientX);
      }
    },
    [isDragging]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (isDragging && e.touches.length === 1 ) {
        handleDrag(e.touches[0]!.clientX);
      }
    },
    [isDragging]
  );

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleDragEnd);
      window.addEventListener("touchmove", handleTouchMove);
      window.addEventListener("touchend", handleDragEnd);

      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleDragEnd);
        window.removeEventListener("touchmove", handleTouchMove);
        window.removeEventListener("touchend", handleDragEnd);
      };
    }
  }, [isDragging, handleMouseMove, handleTouchMove]);

  const boxWidth = miniMapRef.current ? `${1.5 * (100 / wagons.length)}%` : "0";

  return (
    <div id="mini-map" ref={miniMapRef} className="minimap">
      {wagons.map((wagon, idx) => {
        let wagonClass;

        switch (idx) {
          case 0:
            wagonClass = "minimap-locomotive-left";
            break;
          case wagons.length - 1:
            wagonClass = "minimap-locomotive-right";
            break;
          default:
            wagonClass = "minimap-wagon";
        }

        return (
          <div key={wagon.number} className={wagonClass}>
            <span style={{ fontWeight: "bold", fontSize: 10 }}>{wagon.number}</span>
          </div>
        );
      })}
      <div
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
        style={{
          position: "absolute",
          top: 0,
          left: `${boxPosition}px`,
          width: boxWidth,
          height: "100%",
          backgroundColor: "rgba(0, 0, 0, 0.3)",
          cursor: "pointer",
        }}
      />
    </div>
  );
};

export default MiniMap;
