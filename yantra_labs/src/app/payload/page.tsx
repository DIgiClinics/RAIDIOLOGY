"use client";

import { useState } from "react";

const StartSessionPage = () => {
    const [jsonInput, setJsonInput] = useState("");
    const [error, setError] = useState("");

    const deploymentURL = process.env.NEXT_PUBLIC_DEPLOYMENT || "https://dicomviewer.digitalclinics.ai";
    const apiEndpoint = `${deploymentURL}/api/session/start`;
    const redirectBaseUrl = `${deploymentURL}/dcm`;

    const handleStartSession = async () => {
        let payload;

        try {
            payload = JSON.parse(jsonInput);
        } catch (err) {
            setError("Invalid JSON format.");
            return;
        }

        try {
            const response = await fetch(apiEndpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`API call failed with status: ${response.status}`);
            }

            const data = await response.json();

            if (data.sessionId) {
                const redirectUrl = `${redirectBaseUrl}/${data.sessionId}`;
                window.location.href = redirectUrl;
            } else {
                setError("Session ID not found in response.");
            }
        } catch (err) {
            console.error(err);
            setError("Error starting session. Check console for details.");
        }
    };

    return (
        <div className="min-h-screen p-6 bg-gray-50 flex flex-col items-center justify-center">
            <div className="w-full max-w-3xl bg-white shadow-lg rounded-xl p-6">
                <h1 className="text-2xl font-bold mb-4 text-center">Start DICOM Session</h1>
                <textarea
                    className="w-full h-64 p-4 border rounded-md font-mono text-sm"
                    placeholder='Paste your session JSON here...'
                    value={jsonInput}
                    onChange={(e) => {
                        setJsonInput(e.target.value);
                        setError("");
                    }}
                ></textarea>

                {error && <p className="text-red-600 mt-2">{error}</p>}

                <button
                    onClick={handleStartSession}
                    className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition"
                >
                    Start Session
                </button>
            </div>
        </div>
    );
};

export default StartSessionPage;
