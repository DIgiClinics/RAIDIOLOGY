'use client';

import React, { useState } from 'react';
import axios from 'axios';

const Page = () => {
  const [jsonInput, setJsonInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleStartSession = async () => {
    setError('');
    setLoading(true);

    try {
      const parsedData = JSON.parse(jsonInput);

      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/session/start`,
        parsedData
      );

      const sessionId = res.data.sessionId;

      // Redirect to /dcm/:sessionId
      window.location.href = `${process.env.NEXT_PUBLIC_FRONTEND}/dcm/${sessionId}`;
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.error || 'Invalid JSON or server error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Start DICOM Session</h1>

      <textarea
        rows={20}
        className="w-full p-3 border border-gray-300 rounded font-mono"
        placeholder="Paste session JSON here..."
        value={jsonInput}
        onChange={(e) => setJsonInput(e.target.value)}
      />

      {error && (
        <p className="text-red-600 mt-2 font-semibold">{error}</p>
      )}

      <button
        className="mt-4 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        onClick={handleStartSession}
        disabled={loading}
      >
        {loading ? 'Starting session...' : 'Start Session'}
      </button>
    </div>
  );
};

export default Page;
