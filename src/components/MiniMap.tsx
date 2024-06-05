import React, { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { Easing, animate } from "~/lib/animate";
import type { Wagon } from "~/pages/train/[date]/[train]";

interface MiniMapProps {
  wagons: Wagon[];
  mainMapRef: HTMLDivElement | null;
}

export const MiniMap: React.FC<MiniMapProps> = ({ wagons, mainMapRef }) => {
  const [miniMapRef, setMiniMapRef] = useState<HTMLDivElement | null>(null);
  const [boxPosition, setBoxPosition] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const animationFrameRef = useRef<number | null>(null);
  const cancelClickAnimationRef = useRef<(() => void) | null>(null);
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

  const handleMapClick = useCallback(
    (e: React.MouseEvent) => {
      if (miniMapRef && mainMapRef) {
        const boxWidth = (mainMapRef.clientWidth / mainMapRef.scrollWidth) * miniMapRef.clientWidth;
        const maxMiniBoxLeft = miniMapRef.clientWidth - boxWidth;
        const newLeft = Math.min(
          Math.max(0, e.clientX - miniMapRef.offsetLeft - boxWidth / 2),
          maxMiniBoxLeft
        );

        const maxMainScrollLeft = mainMapRef.scrollWidth - mainMapRef.clientWidth;
        const oldScrollLeft = mainMapRef.scrollLeft;
        const newScrollLeft = (newLeft / maxMiniBoxLeft) * maxMainScrollLeft;
        if (cancelClickAnimationRef.current) cancelClickAnimationRef.current();
        cancelClickAnimationRef.current = animate((t) => {
          mainMapRef.scrollLeft =
            oldScrollLeft + (newScrollLeft - oldScrollLeft) * Easing.easeInOutQuad(t);
        }, 200);
      }
    },
    [miniMapRef, mainMapRef]
  );

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

  const hasDoubleDeckers = wagons.some((wagon) => wagon.floors.length > 1);

  return (
    <div
      id="mini-map"
      ref={(ref) => setMiniMapRef(ref)}
      className="minimap"
      onClick={handleMapClick}
      style={{ height: hasDoubleDeckers ? "80px" : "50px" }}
    >
      {wagons.map((wagon, idx) => {
        const wagonHasUpstairs = wagon.floors.length > 1;
        return (
          <div key={wagon.number} className="minimap-wagon-container">
            {wagon.floors.map((floor) => {
              const isLeft = idx === 0;
              const isRight = idx === wagons.length - 1;
              const isEnd = isLeft || isRight;
              const isTop = !wagonHasUpstairs || floor.number === 1;
              let className = "minimap-wagon";
              if (isEnd && isTop)
                className = isLeft ? "minimap-locomotive-left" : "minimap-locomotive-right";
              return (
                <div
                  key={floor.number}
                  className={className}
                  style={{
                    height: hasDoubleDeckers ? (wagonHasUpstairs ? "50%" : "70%") : "100%",
                  }}
                >
                  <span style={{ fontWeight: "bold", fontSize: "12px", paddingLeft: "8px" }}>
                    {wagon.number}
                  </span>
                </div>
              );
            })}
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
          width: mainMapRef ? `${(mainMapRef.clientWidth / mainMapRef.scrollWidth) * 100}%` : "0",
          height: "100%",
          backgroundColor: "rgba(0, 0, 0, 0.3)",
          borderRadius: "5px",
        }}
      />
    </div>
  );
};
