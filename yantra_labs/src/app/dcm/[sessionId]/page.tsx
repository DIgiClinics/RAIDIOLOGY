'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useMemo } from 'react';

const Dcmvi = dynamic(() => import('../../../components/Viewer'), { ssr: false });
const MprViewer = dynamic(() => import('../../../components/MprViewer'), { ssr: false });

export default function ViewerPage() {
    

    const searchParams = useSearchParams();
    const modeParam = searchParams?.get('mode');
    const viewMode = useMemo(() => (modeParam === 'MPR' ? 'MPR' : '2D'), [modeParam]);


    return (
        <div className="bg-[#0A0A23] min-h-screen w-full flex flex-col text-white">
            {/* Navbar */}
            <nav className="bg-black/30 backdrop-blur-sm shadow-md px-4 py-3 flex justify-between items-center">
                {/* Clickable logo/name leading to `/` */}
                <Link href="/" className="text-xl font-bold hover:underline">
                    🧠 R.AI.DIOLOGY Viewer
                </Link>
                <div className="flex gap-4">
                    <button
                        className={`px-4 py-2 rounded ${viewMode === '2D' ? 'bg-blue-600' : 'bg-gray-700'}`}
                        onClick={() => {
                            const url = new URL(window.location.href);
                            url.searchParams.set('mode', '2D');
                            window.location.href = url.toString();
                        }}
                    >
                        2D Viewer
                    </button>
                    <button
                        className={`px-4 py-2 rounded ${viewMode === 'MPR' ? 'bg-blue-600' : 'bg-gray-700'}`}
                        onClick={() => {
                            const url = new URL(window.location.href);
                            url.searchParams.set('mode', 'MPR');
                            window.location.href = url.toString();
                        }}
                    >
                        MPR Viewer
                    </button>
                </div>
            </nav>

            {/* Viewer Section */}
            <div className="flex-1 overflow-auto">
                {viewMode === '2D' && <Dcmvi />}
                {viewMode === 'MPR' &&  <MprViewer />}
            </div>
        </div>
    );
}
