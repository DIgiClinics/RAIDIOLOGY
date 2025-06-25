import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Home = () => {
    const baseUrl = process.env.REACT_APP_DataServer;
    const flaskUrl = process.env.REACT_APP_FLASK_URL;
    const [doctorName, setDoctorName] = useState(""); 
    const [datasetName, setDatasetName] = useState(""); 
    const [error, setError] = useState(""); 
    const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!doctorName || !datasetName) {
        setError("Both fields are required.");
        return;
    }

    setError(""); // Clear previous errors

    try {
        // ✅ Step 1: Generate NIfTI file (if not already created)
        const generateRes = await axios.get(`${flaskUrl}/generate_nifty`, {
            params: { doctorName, datasetName },
        });

        console.log("NIfTI response:", generateRes.data);

        // ✅ Step 2: Now get folder contents
        const folderRes = await axios.get(`${baseUrl}/getFolderContents`, {
            params: { doctorName, datasetName },
        });

        const folderData = folderRes.data;
        console.log("DICOM files:", folderData);

        // ✅ Step 3: Navigate to viewer with data
        navigate(`/viewer/${doctorName}/${datasetName}`, {
            state: [folderData, datasetName, 1],
        });
    } catch (err) {
        console.error("Error during NIfTI generation or data fetch:", err);
        setError("Something went wrong. Please check inputs or server.");
    }
};


    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
                <h1 className="text-3xl font-semibold text-center text-blue-600 mb-6">
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
                            className={`w-full p-3 mt-2 border ${error && !doctorName ? "border-red-500" : "border-gray-300"} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
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
                            className={`w-full p-3 mt-2 border ${error && !datasetName ? "border-red-500" : "border-gray-300"} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            placeholder="Enter dataset name"
                        />
                    </div>

                    {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

                    <div className="mt-6">
                        <button
                            type="submit"
                            className="w-full py-3 px-6 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            View Dataset
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Home;
