import React from "react";

const Home = () => {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-blue-200">
      <div className="bg-white/90 p-8 sm:p-12 rounded-2xl shadow-2xl w-[90%] max-w-lg flex flex-col items-center">
        <img
          src="/logo.jpg"
          alt="DICOM Viewer Logo"
          className="w-24 h-24 rounded-full shadow-lg mb-6 border-4 border-blue-200 object-cover"
        />
        <h1 className="text-3xl sm:text-4xl font-extrabold text-center text-blue-700 mb-3 drop-shadow">
          Welcome to the DICOM Image Viewer
        </h1>
        <p className="text-gray-600 text-center mb-8 text-lg">
          Effortlessly view, annotate, and explore medical images in your browser.
        </p>
        {/* <a
          href="/dcm/demo"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg shadow transition-all duration-200 text-lg"
        >
          Try a Demo Session
        </a> */}
      </div>
    </div>
  );
};

export default Home; 