// 'use client';

// import React, { useEffect, useState } from "react";
// import { useParams } from "next/navigation";

// declare global {
//     interface Window {
//         papaya?: any;
//         papayaContainers?: any[];
//     }
// }

// const PapayaViewer: React.FC = () => {
//     const { doctorName, datasetName, niftyName } = useParams() as {
//         doctorName: string;
//         datasetName: string;
//         niftyName: string;
//     };

//     const [isReady, setIsReady] = useState(false);
//     const [fileUrl, setFileUrl] = useState<string | null>(null);

//     useEffect(() => {
//         if (!niftyName) return;

//         const url = `${process.env.NEXT_PUBLIC_DATA_SERVER}/nifti/${niftyName}`;
//         console.log(url)
//         setFileUrl(url);
//     }, [niftyName]);

//     useEffect(() => {
//         if (!fileUrl) return;

//         // Clean up previous Papaya instances
//         const container = document.querySelector(".papaya");
//         if (container) container.innerHTML = "";

//         const waitForPapaya = setInterval(() => {
//             if (window.papaya?.Container?.startPapaya) {
//                 clearInterval(waitForPapaya);

//                 // Ensure global containers reset
//                 window.papayaContainers = [];

//                 window.papaya.Container.startPapaya();
//                 setIsReady(true);
//             }
//         }, 100);

//         return () => {
//             clearInterval(waitForPapaya);
//             const div = document.querySelector(".papaya");
//             if (div) div.innerHTML = "";
//         };
//     }, [fileUrl]);

//     if (!fileUrl || !doctorName || !datasetName) return null;

//     return (
//         <div
//             key={fileUrl} // Forces full remount when URL changes
//             style={{
//                 padding: "20px",
//                 textAlign: "center",
//                 backgroundColor: "#121212",
//                 height: "100vh",
//                 boxSizing: "border-box",
//             }}
//         >
//             <h2 style={{ color: "#fff", marginBottom: "20px" }}>
//                 MPR Viewer: {doctorName}/{datasetName}
//             </h2>

//             <div style={{ width: "60%", margin: "0 auto" }}>
//                 <h2 style={{ textAlign: "center", margin: "20px 0", color: "#fff" }}>
//                     MPR NIfTI Viewer
//                 </h2>

//                 {/* Papaya viewer target */}
//                 <div
//                     className="papaya"
//                     data-params={JSON.stringify({
//                         images: [fileUrl],
//                         kioskMode: true,
//                         expandable: false,
//                         showControls: true,
//                     })}
//                 ></div>
//             </div>
//         </div>
//     );
// };

// export default PapayaViewer;






'use client';

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";

declare global {
    interface Window {
        papaya?: any;
        papayaContainers?: any[];
    }
}

const PapayaViewer: React.FC = () => {
    const { doctorName, datasetName, niftyName } = useParams() as {
        doctorName: string;
        datasetName: string;
        niftyName: string;
    };

    const [isReady, setIsReady] = useState(false);
    const [fileUrl, setFileUrl] = useState<string | null>(null);

    useEffect(() => {
        if (!niftyName) return;
        const url = `${process.env.NEXT_PUBLIC_DATA_SERVER}/nifti/${niftyName}`;
        setFileUrl(url);
    }, [niftyName]);

    useEffect(() => {
        if (!fileUrl) return;

        // Always ensure Papaya container exists before running startPapaya
        const waitForPapaya = setInterval(() => {
            if (window.papaya?.Container?.startPapaya) {
                clearInterval(waitForPapaya);

                // Clear old instances
                if (window.papayaContainers) {
                    window.papayaContainers.length = 0;
                }

                // Start viewer
                window.papaya.Container.startPapaya();

                // Allow render time before hiding spinner
                setTimeout(() => setIsReady(true), 1000 );
            }
        }, 100);

        return () => {
            clearInterval(waitForPapaya);
            const div = document.querySelector(".papaya");
            if (div) div.innerHTML = "";
        };
    }, [fileUrl]);

    if (!fileUrl || !doctorName || !datasetName) return null;

    return (
        <div
            key={fileUrl}
            style={{
                padding: "20px",
                textAlign: "center",
                backgroundColor: "#121212",
                height: "100vh",
                boxSizing: "border-box",
            }}
        >
            <h2 style={{ color: "#fff", marginBottom: "20px" }}>
                MPR Viewer: {doctorName}/{datasetName}
            </h2>

            <div style={{ width: "60%", margin: "0 auto" }}>
                {!isReady && (
                    <div className="flex flex-col items-center justify-center mt-12 gap-2">
                        <div role="status">
                            <svg
                                aria-hidden="true"
                                className="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
                                viewBox="0 0 100 101"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                                    fill="currentColor"
                                />
                                <path
                                    d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                                    fill="currentFill"
                                />
                            </svg>
                            <span className="sr-only">Loading...</span>
                        </div>
                        <p className="text-sm text-white">Unpacking... setting data</p>
                    </div>
                )}

                {/* Always render this div — but visually hide until ready */}
                <div
                    className="papaya"
                    style={{ display: isReady ? "block" : "none" }}
                    data-params={JSON.stringify({
                        images: [fileUrl],
                        kioskMode: true,
                        expandable: false,
                        showControls: true,
                    })}
                ></div>
            </div>
        </div>
    );
};

export default PapayaViewer;
