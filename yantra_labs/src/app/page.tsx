// src/app/page.tsx (or your Home component file)

'use client';

import React from "react";


const Home = () => {


  
    return (
        <div className="h-screen w-screen overflow-hidden bg-gray-100 flex items-center justify-center">
            <div className="bg-white p-6 sm:p-8 rounded-lg shadow-lg w-[90%] max-w-md">
                <h1 className="text-2xl sm:text-3xl font-semibold text-center text-blue-600 mb-4 sm:mb-6">
                    Welcome to the DICOM Image Viewer
                </h1>
                
            </div>
        </div>
    );
};

export default Home;