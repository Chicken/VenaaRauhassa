import { Baby, Coffee, PawPrint, Plus, Utensils, VolumeX } from "lucide-react";
import React, { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { useMediaQuery } from "react-responsive";
import { Easing, animate } from "~/lib/animate";
import type { Wagon } from "~/types";

interface MiniMapProps {
  wagons: Wagon[];
  mainMapRef: HTMLDivElement | null;
}

export const MiniMap: React.FC<MiniMapProps> = ({ wagons, mainMapRef }) => {
  const [miniMapRef, setMiniMapRef] = useState<HTMLDivElement | null>(null);
  const [boxRef, setBoxRef] = useState<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const animationFrameRef = useRef<number | null>(null);
  const cancelClickAnimationRef = useRef<(() => void) | null>(null);
  const [, forceUpdate] = useReducer<(x: number) => number>((x) => x + 1, 0);

  const isMobile = useMediaQuery({
    maxWidth: 768,
  });

  useEffect(() => {
    if (!mainMapRef || !miniMapRef || !boxRef) return;
    if (!isMobile) {
      const syncScroll = () => {
        miniMapRef.style.paddingLeft = "0";
        miniMapRef.style.paddingRight = "0";
        const maxMainScrollLeft = mainMapRef.scrollWidth - mainMapRef.clientWidth;
        const boxWidth = (mainMapRef.clientWidth / mainMapRef.scrollWidth) * miniMapRef.clientWidth;
        const maxMiniBoxLeft = miniMapRef.clientWidth - boxWidth;
        const newLeft = (mainMapRef.scrollLeft / maxMainScrollLeft) * maxMiniBoxLeft;
        window.requestAnimationFrame(() => {
          boxRef.style.left = `${newLeft}px`;
          boxRef.style.width = `${boxWidth}px`;
        });
      };
      mainMapRef.addEventListener("scroll", syncScroll);
      window.addEventListener("resize", syncScroll);
      syncScroll();
      return () => {
        mainMapRef.removeEventListener("scroll", syncScroll);
        window.removeEventListener("resize", syncScroll);
      };
    } else {
      let syncAnimFrame: number | null = null;
      let reverseSyncAnimFrame: number | null = null;
      let syncTimeout: ReturnType<typeof setTimeout> | null = null;
      let reverseTimeout: ReturnType<typeof setTimeout> | null = null;
      let syncScroll: () => void = null!;
      let reverseSyncScroll: () => void = null!;
      let removed = false;
      syncScroll = () => {
        const maxMainScrollLeft = mainMapRef.scrollWidth - mainMapRef.clientWidth;
        const maxMiniScrollLeft = miniMapRef.scrollWidth - miniMapRef.clientWidth;

        if (syncTimeout) clearTimeout(syncTimeout);
        miniMapRef.removeEventListener("scroll", reverseSyncScroll);
        if (syncAnimFrame) cancelAnimationFrame(syncAnimFrame);
        syncAnimFrame = window.requestAnimationFrame(() => {
          miniMapRef.scrollLeft = (mainMapRef.scrollLeft / maxMainScrollLeft) * maxMiniScrollLeft;
          syncTimeout = setTimeout(
            () => !removed && miniMapRef.addEventListener("scroll", reverseSyncScroll),
            50
          );
        });
      };
      reverseSyncScroll = () => {
        const maxMainScrollLeft = mainMapRef.scrollWidth - mainMapRef.clientWidth;
        const maxMiniScrollLeft = miniMapRef.scrollWidth - miniMapRef.clientWidth;

        if (reverseTimeout) clearTimeout(reverseTimeout);
        mainMapRef.removeEventListener("scroll", syncScroll);
        if (reverseSyncAnimFrame) cancelAnimationFrame(reverseSyncAnimFrame);
        reverseSyncAnimFrame = window.requestAnimationFrame(() => {
          mainMapRef.scrollLeft = (miniMapRef.scrollLeft / maxMiniScrollLeft) * maxMainScrollLeft;
          reverseTimeout = setTimeout(
            () => !removed && mainMapRef.addEventListener("scroll", syncScroll),
            50
          );
        });
      };
      const syncResize = () => {
        miniMapRef.style.paddingLeft = "0";
        miniMapRef.style.paddingRight = "0";

        const boxWidth = (mainMapRef.clientWidth / mainMapRef.scrollWidth) * miniMapRef.scrollWidth;
        boxRef.style.width = `${boxWidth}px`;
        boxRef.style.left = `calc(50% - ${boxWidth}px / 2)`;

        const padding = miniMapRef.clientWidth / 2 - boxWidth / 2;
        miniMapRef.style.paddingLeft = `${padding}px`;
        miniMapRef.style.paddingRight = `${padding}px`;

        syncScroll();
      };
      mainMapRef.addEventListener("scroll", syncScroll);
      miniMapRef.addEventListener("scroll", reverseSyncScroll);
      window.addEventListener("resize", syncResize);
      syncResize();
      return () => {
        removed = true;
        mainMapRef.removeEventListener("scroll", syncScroll);
        miniMapRef.removeEventListener("scroll", reverseSyncScroll);
        window.removeEventListener("resize", syncResize);
      };
    }
  }, [isMobile, miniMapRef, mainMapRef, boxRef]);

  const handleMapClick = useCallback(
    (e: React.MouseEvent) => {
      if (!miniMapRef || !mainMapRef || !boxRef) return;
      if (!isMobile) {
        const boxWidth = (mainMapRef.clientWidth / mainMapRef.scrollWidth) * miniMapRef.clientWidth;
        const maxMiniBoxLeft = miniMapRef.clientWidth - boxWidth;
        const bounding = miniMapRef.getBoundingClientRect();
        const newLeft = Math.min(
          Math.max(0, e.clientX - bounding.x - boxWidth / 2),
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
      } else {
        const padding = miniMapRef.clientWidth / 2 - boxRef.clientWidth / 2;
        const bounding = miniMapRef.getBoundingClientRect();
        const xOnMap =
          (miniMapRef.scrollLeft + e.clientX - bounding.x - padding) *
          (mainMapRef.scrollWidth / (miniMapRef.scrollWidth - padding * 2));

        const oldScrollLeft = mainMapRef.scrollLeft;
        const newScrollLeft = xOnMap - mainMapRef.clientWidth / 2;

        if (cancelClickAnimationRef.current) cancelClickAnimationRef.current();
        cancelClickAnimationRef.current = animate((t) => {
          mainMapRef.scrollLeft =
            oldScrollLeft + (newScrollLeft - oldScrollLeft) * Easing.easeInOutQuad(t);
        }, 200);
      }
    },
    [isMobile, miniMapRef, mainMapRef, boxRef]
  );

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
  }, []);

  const handleDrag = useCallback(
    (clientX: number) => {
      if (!isMobile && miniMapRef && mainMapRef && boxRef) {
        const boxWidth = (mainMapRef.clientWidth / mainMapRef.scrollWidth) * miniMapRef.clientWidth;
        const maxMiniBoxLeft = miniMapRef.clientWidth - boxWidth;
        const bounding = miniMapRef.getBoundingClientRect();
        const newLeft = Math.min(Math.max(0, clientX - bounding.x - boxWidth / 2), maxMiniBoxLeft);

        const maxMainScrollLeft = mainMapRef.scrollWidth - mainMapRef.clientWidth;
        const newScrollLeft = (newLeft / maxMiniBoxLeft) * maxMainScrollLeft;

        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);

        animationFrameRef.current = requestAnimationFrame(() => {
          mainMapRef.scrollLeft = newScrollLeft;
        });
      }
    },
    [isMobile, miniMapRef, mainMapRef, boxRef]
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
    <div style={{ position: "relative" }}>
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
              {[...wagon.floors].reverse().map((floor) => {
                const isLeft = idx === 0;
                const isRight = idx === wagons.length - 1;
                const isEnd = isLeft || isRight;
                const isTop = !wagonHasUpstairs || floor.number === 2;
                const isBottom = !wagonHasUpstairs || floor.number === 1;
                let className = "minimap-wagon ";
                if (isEnd && isTop)
                  className += isLeft ? "minimap-locomotive-left" : "minimap-locomotive-right";
                return (
                  <div
                    key={floor.number}
                    className={className}
                    style={{
                      position: "relative",
                      height: hasDoubleDeckers ? (wagonHasUpstairs ? "50%" : "70%") : "100%",
                    }}
                  >
                    <span
                      style={{
                        fontWeight: "bold",
                        fontSize: "14px",
                        paddingLeft: "8px",
                        position: "absolute",
                      }}
                    >
                      {wagon.number}
                    </span>
                    {floor.services.includes("PETS") ? (
                      <span style={{ margin: "auto" }}>
                        <PawPrint size="22px" />
                      </span>
                    ) : null}
                    {floor.services.includes("PLAY-AREA") ? (
                      <span style={{ margin: "auto" }}>
                        <Baby size="22px" />
                      </span>
                    ) : null}
                    {floor.services.includes("EKSTRA-RELAXED") ? (
                      <span
                        style={{
                          fontWeight: "bold",
                          fontSize: "12px",
                          margin: "auto",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <span className="ekstra-text">Ekstra</span>{" "}
                        <Coffee size="18px" className="ekstra-icon" />
                      </span>
                    ) : null}
                    {floor.services.includes("EKSTRA-CALM") ? (
                      <span
                        style={{
                          fontWeight: "bold",
                          fontSize: "12px",
                          margin: "auto",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <span className="ekstra-text">Ekstra</span>{" "}
                        <VolumeX size="18px" className="ekstra-icon"  />
                      </span>
                    ) : null}
                    {floor.services.includes("EKSTRA-PLUS") ? (
                      <span
                        style={{
                          fontWeight: "bold",
                          fontSize: "12px",
                          margin: "auto",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <span className="ekstra-text">Ekstra</span>{" "}
                        <Plus size="18px" className="ekstra-icon" />
                      </span>
                    ) : null}
                    {["TPB", "RX", "RK", "ERD", "TTC"].includes(wagon.type) && isBottom ? (
                      <span style={{ margin: "auto" }}>
                        <Utensils size="22px" />
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          );
        })}
        <div
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
          className="minimap-box"
          ref={(ref) => setBoxRef(ref)}
          style={{
            position: "absolute",
            top: 0,
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.3)",
            borderRadius: "5px",
          }}
        ></div>
      </div>
    </div>
  );
};
