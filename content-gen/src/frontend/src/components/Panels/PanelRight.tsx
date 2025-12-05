import React, { useState, useEffect, ReactNode, ReactElement } from "react";
import eventBus from "../eventbus";
import PanelRightToolbar from "./PanelRightToolbar";

interface PanelRightProps {
  panelWidth?: number;
  panelResize?: boolean;
  panelType: "first" | "second" | "third" | "fourth";
  defaultClosed?: boolean;
  children?: ReactNode;
}

const PanelRight: React.FC<PanelRightProps> = ({
  panelWidth = 325,
  panelResize = true,
  panelType = "first",
  defaultClosed = false,
  children,
}) => {
  const [isActive, setIsActive] = useState(() =>
    defaultClosed ? false : panelType === "first"
  );
  const [width, setWidth] = useState<number>(panelWidth);
  const [isHandleHovered, setIsHandleHovered] = useState(false);

  useEffect(() => {
    if (eventBus.getPanelWidth() === 400) {
      eventBus.setPanelWidth(panelWidth);
    }
    setWidth(eventBus.getPanelWidth());

    const handleActivePanel = (panel: "first" | "second" | "third" | "fourth" | null) => {
      setIsActive(panel === panelType);
    };

    const handleWidthChange = (newWidth: number) => {
      setWidth(newWidth);
    };

    eventBus.on("setActivePanel", handleActivePanel);
    eventBus.on("panelWidthChanged", handleWidthChange);

    return () => {
      eventBus.off("setActivePanel", handleActivePanel);
      eventBus.off("panelWidthChanged", handleWidthChange);
    };
  }, [panelType, panelWidth]);

  useEffect(() => {
    eventBus.emit("panelInitState", {
      panelType,
      isActive,
    });
  }, []);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!panelResize) return;

    const startX = e.clientX;
    const startWidth = width;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.min(
        500,
        Math.max(256, startWidth - (moveEvent.clientX - startX))
      );
      setWidth(newWidth);
      eventBus.setPanelWidth(newWidth);
    };

    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      document.body.style.userSelect = "";
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);

    document.body.style.userSelect = "none";
  };

  if (!isActive) return null;

  const childrenArray = React.Children.toArray(children) as ReactElement[];
  const toolbar = childrenArray.find(
    (child) => React.isValidElement(child) && child.type === PanelRightToolbar
  );
  const content = childrenArray.filter(
    (child) => !(React.isValidElement(child) && child.type === PanelRightToolbar)
  );

  return (
    <div
      className="panelRight"
      style={{
        width: `${width}px`,
        display: "flex",
        flexDirection: "column",
        backgroundColor: "var(--colorNeutralBackground4)",
        height: "100%",
        boxSizing: "border-box",
        position: "relative",
        borderLeft: panelResize
          ? isHandleHovered
            ? "2px solid var(--colorNeutralStroke2)"
            : "2px solid transparent"
          : "none",
      }}
    >
      {toolbar && <div style={{ flexShrink: 0 }}>{toolbar}</div>}

      <div
        className="panelContent"
        style={{
          flex: 1,
          overflowY: "auto",
        }}
      >
        {content}
      </div>

      {panelResize && (
        <div
          className="resizeHandle"
          onMouseDown={handleMouseDown}
          onMouseEnter={() => setIsHandleHovered(true)}
          onMouseLeave={() => setIsHandleHovered(false)}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "2px",
            height: "100%",
            cursor: "ew-resize",
            zIndex: 1,
            backgroundColor: isHandleHovered
              ? "var(--colorNeutralStroke2)"
              : "transparent",
          }}
        />
      )}
    </div>
  );
};

export default PanelRight;




