// 'use client';

// import { useEffect } from "react";
// import { useSearchParams, useParams } from "next/navigation";

// declare global {
//     interface Window {
//         papaya?: any;
//         papayaContainers?: any[];
//     }
// }

// const PapayaViewerPage = () => {
//     const params = useParams();
//     const imageName = params.imageName as string;

//     const fileUrl = `http://localhost:8003/nifti/${imageName}`;

//     useEffect(() => {
//         const waitForPapaya = setInterval(() => {
//             if (window.papaya && window.papaya.Container?.startPapaya) {
//                 clearInterval(waitForPapaya);
//                 window.papayaContainers = [];
//                 window.papaya.Container.startPapaya();
//             }
//         }, 100);

//         return () => clearInterval(waitForPapaya);
//     }, [fileUrl]);

//     return (
//         <div style={{ width: "50%", height: "10px" }}>
//             <h2 style={{ textAlign: "center", margin: "20px 0" }}>Papaya NIfTI Viewer</h2>
//             <div
//                 className="papaya"
//                 data-params={`{"images":["${fileUrl}"],"kioskMode":true,"expandable":false,"showControls":true}`}
                
//             ></div>

//         </div>
//     );
// };

// export default PapayaViewerPage;


'use client';

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

declare global {
    interface Window {
        papaya?: any;
        papayaContainers?: any[];
    }
}

const PapayaViewerPage = () => {
    const params = useParams();
    const imageName = params.imageName as string;
    const fileUrl = `http://localhost:8003/nifti/${imageName}`;

    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true); // Ensures this only runs on client

        const waitForPapaya = setInterval(() => {
            if (window.papaya && window.papaya.Container?.startPapaya) {
                clearInterval(waitForPapaya);
                window.papayaContainers = [];
                window.papaya.Container.startPapaya();
            }
        }, 100);

        return () => {
            clearInterval(waitForPapaya);
            const papayaDiv = document.querySelector(".papaya");
            if (papayaDiv) papayaDiv.innerHTML = "";
        };
    }, [fileUrl]);

    if (!isClient) return null; // Skip rendering on server

    return (
        <div style={{ width: "60%" }}>
            <h2 style={{ textAlign: "center", margin: "20px 0" }}>Papaya NIfTI Viewer</h2>
            <div
                className="papaya"
                data-params={`{
                    "images":["${fileUrl}"],
                    "kioskMode":true,
                    "expandable":false,
                    "showControls":true
                }`}
            ></div>
        </div>
    );
};

export default PapayaViewerPage;
