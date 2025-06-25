import React, { useEffect } from "react";

const PapayaViewer = ({ doctorName, datasetName, fileName, startupView = "axial" }) => {
    const dataServer = process.env.REACT_APP_DataServer;
    const fileUrl = `${dataServer}/nifti/${doctorName}/${datasetName}/${fileName}`;

    useEffect(() => {
        const waitForPapaya = setInterval(() => {
            if (window.papaya && window.papaya.Container?.startPapaya) {
                clearInterval(waitForPapaya);
                window.papayaContainers = []; // Clear existing viewers
                window.papaya.Container.startPapaya();
            }
        }, 100);

        return () => {
            clearInterval(waitForPapaya);
            const papayaDiv = document.querySelector(".papaya");
            if (papayaDiv) papayaDiv.innerHTML = "";
        };
    }, [fileUrl, startupView]);

    return (
        <div className="p-10"
            style={{
                width: "100%",
                // width: "1250px",
                
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
            }}
        >
            <h2 style={{ textAlign: "center", margin: "20px 0", color: "white" }}>
                MPR  Viewer
            </h2>
            <div
                className="papaya"
                data-params={`{
                    "images": ["${fileUrl}"],
                    "kioskMode": true,
                    "expandable": false,
                    "showControls": true,
                    "startupView": "${startupView}"
                }`}
                style={{
                    width: "1000px",
                    height: "750px",
                    maxWidth: "100%",
                    maxHeight: "100%",
                }}
            ></div>
        </div>
    );
};

export default PapayaViewer;
