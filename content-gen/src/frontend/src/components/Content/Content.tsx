import React, { ReactNode, ReactElement } from "react";
import ContentToolbar from "./ContentToolbar";

interface ContentProps {
    children?: ReactNode;
}

const Content: React.FC<ContentProps> = ({ children }) => {
    const childrenArray = React.Children.toArray(children) as ReactElement[];
    const toolbar = childrenArray.find(
        (child) => React.isValidElement(child) && child.type === ContentToolbar
    );
    const content = childrenArray.filter(
        (child) => !(React.isValidElement(child) && child.type === ContentToolbar)
    );

    return (
        <div
            className="content"
            style={{
                display: "flex",
                flex: "1",
                flexDirection: "column",
                height: "100%",
                boxSizing: "border-box",
                position: "relative",
                minWidth: '320px',
            }}
        >
            {toolbar && <div style={{ flexShrink: 0 }}>{toolbar}</div>}

            <div
                className="panelContent"
                style={{
                    display: "flex",
                    flexDirection: "column",
                    flex: 1,
                    width:'100%',
                    overflow: "hidden",
                    minHeight: 0,
                }}
            >
                {content}
            </div>
        </div>
    );
};

export default Content;




