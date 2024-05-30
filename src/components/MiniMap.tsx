import React, { useCallback, useEffect, useReducer, useRef, useState } from "react";

interface Wagon {
  number: number;
  // Lisää tähän muut mahdolliset wagon-ominaisuudet
}

interface MiniMapProps {
  wagons: Wagon[];
  mainMapRef: HTMLDivElement | null;
}

export const MiniMap: React.FC<MiniMapProps> = ({ wagons, mainMapRef }) => {
  const [miniMapRef, setMiniMapRef] = useState<HTMLDivElement | null>(null);
  const [boxPosition, setBoxPosition] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const animationFrameRef = useRef<number | null>(null);
  const [, forceUpdate] = useReducer<(x: number) => number>((x) => x + 1, 0);

  useEffect(() => {
    if (mainMapRef && miniMapRef) {
      const syncScroll = () => {
        const maxMainScrollLeft = mainMapRef.scrollWidth - mainMapRef.clientWidth;
        const boxWidth = (mainMapRef.clientWidth / mainMapRef.scrollWidth) * miniMapRef.clientWidth;
        const maxMiniBoxLeft = miniMapRef.clientWidth - boxWidth;
        const newLeft = (mainMapRef.scrollLeft / maxMainScrollLeft) * maxMiniBoxLeft;
        setBoxPosition(newLeft);
      };

      mainMapRef.addEventListener("scroll", syncScroll);
      return () => mainMapRef.removeEventListener("scroll", syncScroll);
    }
  }, [miniMapRef, mainMapRef]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
  }, []);

  const handleDrag = useCallback(
    (clientX: number) => {
      if (miniMapRef && mainMapRef) {
        const boxWidth = (mainMapRef.clientWidth / mainMapRef.scrollWidth) * miniMapRef.clientWidth;
        const maxMiniBoxLeft = miniMapRef.clientWidth - boxWidth;
        const newLeft = Math.min(
          Math.max(0, clientX - miniMapRef.offsetLeft - boxWidth / 2),
          maxMiniBoxLeft
        );

        setBoxPosition(newLeft);

        const maxMainScrollLeft = mainMapRef.scrollWidth - mainMapRef.clientWidth;
        const newScrollLeft = (newLeft / maxMiniBoxLeft) * maxMainScrollLeft;

        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);

        animationFrameRef.current = requestAnimationFrame(() => {
          mainMapRef.scrollLeft = newScrollLeft;
        });
      }
    },
    [miniMapRef, mainMapRef]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging) {
        handleDrag(e.clientX);
      }
    },
    [isDragging, handleDrag]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (isDragging && e.touches.length === 1) {
        handleDrag(e.touches[0]!.clientX);
      }
    },
    [isDragging, handleDrag]
  );

  const handleDragStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      setIsDragging(true);
      const event = e.nativeEvent;
      if (event instanceof MouseEvent) {
        handleDrag(event.clientX);
      } else {
        if (event.touches?.length) handleDrag(event.touches[0]!.clientX);
      }
    },
    [handleDrag]
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
  }, [isDragging, handleMouseMove, handleTouchMove, handleDragEnd]);

  useEffect(() => {
    const onResize = () => forceUpdate();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  });

  return (
    <div
      id="mini-map"
      ref={(ref) => setMiniMapRef(ref)}
      className="minimap"
      onMouseDown={handleDragStart}
      onTouchStart={handleDragStart}
    >
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
        style={{
          position: "absolute",
          top: 0,
          left: `${boxPosition}px`,
          width: mainMapRef ? `${(mainMapRef.clientWidth / mainMapRef.scrollWidth) * 100}%` : "0",
          height: "100%",
          backgroundColor: "rgba(0, 0, 0, 0.3)",
          borderRadius: "5px",
        }}
      />
    </div>
  );
};
