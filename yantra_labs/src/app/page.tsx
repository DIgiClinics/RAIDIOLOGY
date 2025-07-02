// src/app/page.tsx (or your Home component file)

'use client';

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

const Home = () => {
    const router = useRouter();
    // Assuming these are defined in your .env.local file
    const flaskUrl = process.env.NEXT_PUBLIC_FLASK_URL;

    const [doctorName, setDoctorName] = useState("");
    const [datasetName, setDatasetName] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!doctorName || !datasetName) {
            setError("Both fields are required.");
            return;
        }
        setError("");
        setIsLoading(true);

        try {
            // Optional: You might keep a call here to ensure the dataset exists
            // before redirecting, but the viewer should fetch the actual file list.
            // For example, the /generate_nifty call can serve as validation.
            await axios.get(`${flaskUrl}/generate_nifty`, {
                params: { doctorName, datasetName },
            });

            const response = await fetch(
                `${flaskUrl}/get_nifti_by_doctor_dataset?doctorName=${doctorName}&datasetName=${datasetName}`
            );

            const data = await response.json();


            // The critical change: We navigate and let the next page handle its own data.
            router.push(`/viewer/${doctorName}/${datasetName}/${data.fileName}`);

        } catch (err: any) {
            console.error("Error during pre-flight check:", err);
            setError("Dataset not found or server error. Please check your inputs.");
            setIsLoading(false);
        }
    };

    return (
        <div className="h-screen w-screen overflow-hidden bg-gray-100 flex items-center justify-center">
            <div className="bg-white p-6 sm:p-8 rounded-lg shadow-lg w-[90%] max-w-md">
                <h1 className="text-2xl sm:text-3xl font-semibold text-center text-blue-600 mb-4 sm:mb-6">
                    Welcome to the DICOM Image Viewer
                </h1>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="doctorName" className="block text-sm font-medium text-gray-600">
                            Doctor Name
                        </label>
                        <input
                            type="text"
                            id="doctorName"
                            value={doctorName}
                            onChange={(e) => setDoctorName(e.target.value)}
                            className={`w-full p-3 mt-1 border ${error && !doctorName ? "border-red-500" : "border-gray-300"} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            placeholder="Enter doctor's name"
                        />
                    </div>
                    <div>
                        <label htmlFor="datasetName" className="block text-sm font-medium text-gray-600">
                            Dataset Name
                        </label>
                        <input
                            type="text"
                            id="datasetName"
                            value={datasetName}
                            onChange={(e) => setDatasetName(e.target.value)}
                            className={`w-full p-3 mt-1 border ${error && !datasetName ? "border-red-500" : "border-gray-300"} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            placeholder="Enter dataset name"
                        />
                    </div>
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 px-6 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400"
                        >
                            {isLoading ? "Loading..." : "View Dataset"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Home;