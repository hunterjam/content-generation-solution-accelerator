import React, { ReactNode } from "react";
import { Body1Strong } from "@fluentui/react-components";

interface PanelLeftToolbarProps {
  panelIcon?: ReactNode;
  panelTitle?: string | null;
  children?: ReactNode;
}

const PanelLeftToolbar: React.FC<PanelLeftToolbarProps> = ({
  panelIcon,
  panelTitle,
  children,
}) => {
  return (
    <div
      className="panelToolbar"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "16px",
        boxSizing: "border-box",
        height: "56px",
      }}
    >
      {(panelIcon || panelTitle) && (
        <div
          className="panelTitle"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            flexShrink: 1,
            overflow: "hidden",
            minWidth: 0,
          }}
        >
          {panelIcon && (
            <div
              style={{
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
              }}
            >
              {panelIcon}
            </div>
          )}
          {panelTitle && (
            <Body1Strong
              style={{
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {panelTitle}
            </Body1Strong>
          )}
        </div>
      )}
      <div
        className="panelTools"
        style={{
          display: "flex",
          alignItems: "center",
          flexGrow: 1,
          justifyContent: "flex-end",
          minWidth: 0,
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default PanelLeftToolbar;




