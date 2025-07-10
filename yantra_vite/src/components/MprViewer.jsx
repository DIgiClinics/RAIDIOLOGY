import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { ChevronLeft, ChevronRight, User } from "lucide-react";

const Loader = ({ text }) => (
    <div className="flex flex-col items-center justify-center h-full gap-4">
        <svg
            aria-hidden="true"
            className="w-10 h-10 text-gray-600 animate-spin fill-blue-500"
            viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg"
        >
            <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
            <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
        </svg>
        <p className="text-gray-400">{text}</p>
    </div>
);

const MprViewer = () => {
    const { sessionId } = useParams();
    const SERVER_URL = import.meta.env.VITE_SERVER_URL;
    const SUPER_MICRO = import.meta.env.VITE_SUPER_MICRO;

    const [isLoading, setIsLoading] = useState(true);
    const [isReady, setIsReady] = useState(false);
    const [niftyName, setNiftyName] = useState(null);
    const [fileUrl, setFileUrl] = useState(null);
    const [subTestList, setSubTestList] = useState([]);
    const [selectedSubTest, setSelectedSubTest] = useState(null);
    const [conversionFailed, setConversionFailed] = useState(false);
    const [isPatientDataVisible, setIsPatientDataVisible] = useState(true);
    const [sessionMeta, setSessionMeta] = useState(null);

    useEffect(() => {
        if (!sessionId) return;
        const fetchMetadata = async () => {
            try {
                const { data } = await axios.get(`${SERVER_URL}/api/session/metadata/${sessionId}`);
                const niftyMap = data.niftyFileMap || {};
                const subTests = Object.keys(niftyMap);
                setSubTestList(subTests);
                if (subTests.length > 0) {
                    setSelectedSubTest(subTests[0]);
                }
                setSessionMeta({
                    mrn: data.mrn,
                    patientName: data.patientName,
                    age: data.age,
                    gender: data.gender,
                    consultingDoctor: data.consultingDoctor,
                    symptoms: data.symptoms,
                    admissionDate: data.admissionDate,
                });
            } catch (err) {
                // console.error("Error fetching metadata:", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchMetadata();
    }, [sessionId, SERVER_URL]);

    useEffect(() => {
        if (!sessionId || !selectedSubTest) return;
        const fetchSelectedNifti = async () => {
            try {
                const { data } = await axios.get(`${SERVER_URL}/api/session/metadata/${sessionId}`);
                const fileList = data.niftyFileMap?.[selectedSubTest] || [];
                if (fileList.length > 0) {
                    setNiftyName(fileList[0]);
                    setConversionFailed(false);
                } else {
                    setNiftyName(null);
                    setConversionFailed(true);
                }
            } catch (err) {
                // console.error("Error fetching subTest NIfTI file:", err);
                setNiftyName(null);
                setConversionFailed(true);
            }
        };
        fetchSelectedNifti();
    }, [selectedSubTest, sessionId, SERVER_URL]);

    useEffect(() => {
        if (!niftyName || !sessionId || !selectedSubTest) return;
        setIsReady(false);
        const url = `${SUPER_MICRO}/download/${sessionId}/${selectedSubTest}/${niftyName}`;
        setFileUrl(url);
    }, [niftyName, sessionId, selectedSubTest, SUPER_MICRO]);

    useEffect(() => {
        if (!fileUrl) return;
        const waitForPapaya = setInterval(() => {
            if (window.papaya?.Container?.startPapaya) {
                clearInterval(waitForPapaya);
                if (window.papayaContainers) {
                    window.papayaContainers.length = 0;
                }
                const div = document.querySelector(".papaya");
                if (div) div.innerHTML = "";
                window.papaya.Container.startPapaya();
                setTimeout(() => setIsReady(true), 1000);
            }
        }, 100);
        return () => {
            clearInterval(waitForPapaya);
            const div = document.querySelector(".papaya");
            if (div) div.innerHTML = "";
        };
    }, [fileUrl]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-900">
                <Loader text="Loading Session..." />
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-900 text-white font-sans">
            {/* Patient Data Sidebar */}
            <aside
                className={`flex-shrink-0 bg-gray-800 transition-all duration-300 ease-in-out ${isPatientDataVisible ? "w-80 p-6" : "w-0"
                    } overflow-hidden h-full flex flex-col`}
            >
                <div className="flex-grow overflow-y-auto">
                    <h2 className="text-xl font-bold mb-6 flex items-center">
                        <User className="mr-3" /> Patient Information
                    </h2>
                    {sessionMeta && (
                         <div className="space-y-4 text-sm">
                            <div>
                                <label className="font-semibold text-gray-400">MRN</label>
                                <p>{sessionMeta.mrn}</p>
                            </div>
                            <div>
                                <label className="font-semibold text-gray-400">Patient Name</label>
                                <p>{sessionMeta.patientName}</p>
                            </div>
                            <div>
                                <label className="font-semibold text-gray-400">Age & Gender</label>
                                <p>{sessionMeta.age}, {sessionMeta.gender}</p>
                            </div>
                            <div>
                                <label className="font-semibold text-gray-400">Consulting Doctor</label>
                                <p>{sessionMeta.consultingDoctor}</p>
                            </div>
                            <div>
                                <label className="font-semibold text-gray-400">Symptoms</label>
                                <p className="whitespace-pre-wrap">{sessionMeta.symptoms}</p>
                            </div>
                            <div>
                                <label className="font-semibold text-gray-400">Admission Date</label>
                                <p>{new Date(sessionMeta.admissionDate).toLocaleString()}</p>
                            </div>
                        </div>
                    )}
                </div>
            </aside>

            {/* Main Content: MPR Viewer */}
            <main className="flex-1 flex flex-col p-4 bg-black min-w-0">
                <header className="flex-shrink-0 mb-4 flex justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsPatientDataVisible(!isPatientDataVisible)}
                            className="bg-gray-800 p-2 rounded-full hover:bg-gray-700 transition-colors focus:outline-none"
                            title={isPatientDataVisible ? "Hide Patient Info" : "Show Patient Info"}
                        >
                            {isPatientDataVisible ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
                        </button>
                        <h1 className="text-lg font-semibold text-gray-300">
                            MPR Viewer: <span className="font-mono bg-gray-800 px-2 py-1 rounded">{sessionId}</span>
                        </h1>
                    </div>
                    {subTestList.length > 0 && (
                        <div className="flex items-center">
                            <label htmlFor="subtest" className="text-gray-300 mr-3">Sub Tests:</label>
                            <select
                                id="subtest"
                                value={selectedSubTest || ""}
                                onChange={(e) => setSelectedSubTest(e.target.value)}
                                className="bg-gray-800 text-white border border-gray-600 rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {subTestList.map((subTest) => (
                                    <option key={subTest} value={subTest}>
                                        {subTest}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </header>

                <div className="flex-1 flex items-center justify-center rounded-lg overflow-hidden relative min-h-0">
                    {conversionFailed ? (
                        <div className="bg-red-900 border border-red-700 text-red-200 px-6 py-5 rounded-lg max-w-md text-center">
                            <strong className="font-bold text-lg block mb-2">MPR Conversion Failed</strong>
                            <p>The file count is too low or some files are missing.</p>
                        </div>
                    ) : fileUrl ? (
                        <div key={fileUrl} className="absolute top-0 left-0 w-full h-full">
                            {!isReady && <Loader text="Unpacking and setting up viewer..." />}
                            <div
                                className="papaya w-full h-full"
                                style={{ visibility: isReady ? "visible" : "hidden" }}
                                data-params={JSON.stringify({
                                    images: [fileUrl],
                                    kioskMode: true,
                                    expandable: false,
                                    showControls: true
                                })}
                            ></div>
                        </div>
                    ) : (
                         <div className="text-gray-500">Select a series to begin viewing.</div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default MprViewer; 