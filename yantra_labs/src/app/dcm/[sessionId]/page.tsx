'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import { LayoutDashboard, View } from 'lucide-react';

// Dynamically import heavy components
const Dcmvi = dynamic(() => import('../../../components/Viewer'), { ssr: false });
const MprViewer = dynamic(() => import('../../../components/MprViewer'), { ssr: false });

export default function ViewerPage() {
    const searchParams = useSearchParams();
    const modeParam = searchParams?.get('mode');

    const viewMode = useMemo(() => (modeParam === 'MPR' ? 'MPR' : '2D'), [modeParam]);

    const handleModeChange = (newMode: '2D' | 'MPR') => {
        const url = new URL(window.location.href);
        url.searchParams.set('mode', newMode);
        window.location.href = url.toString();
    };

    return (
        <div className="bg-gray-900 h-screen w-screen flex flex-col text-white overflow-hidden">
            {/* Navbar */}
            <nav className="bg-black/40 backdrop-blur-lg shadow-xl px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-4 w-full z-10">
                
                {/* Logo and Title Side by Side */}
                <div className="flex items-center gap-4">
                    <Image
                        src="/Yanthralabs.jpg"
                        alt="Yanthra Labs Logo"
                        width={120}
                        height={160}
                        className="rounded-full border-2 border-gray-600"
                    />
                    <span className="text-xl font-bold text-gray-200">
                        Dicom Viewer
                    </span>
                </div>

                {/* View Mode Switcher */}
                <div className="flex items-center gap-3">
                    <button
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
                            viewMode === '2D' 
                                ? 'bg-blue-600 text-white shadow-md' 
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                        onClick={() => handleModeChange('2D')}
                    >
                        <View size={20} />
                        2D Viewer
                    </button>
                    <button
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
                            viewMode === 'MPR' 
                                ? 'bg-blue-600 text-white shadow-md' 
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                        onClick={() => handleModeChange('MPR')}
                    >
                        <LayoutDashboard size={20} />
                        MPR Viewer
                    </button>
                </div>
            </nav>

            {/* Viewer Section */}
            <main className="flex-1 overflow-auto bg-black">
                {viewMode === '2D' && <Dcmvi />}
                {viewMode === 'MPR' && <MprViewer />}
            </main>
        </div>
    );
}
