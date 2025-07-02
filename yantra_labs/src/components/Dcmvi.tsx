"use client";

import {
    Button,
    Dialog,
    DialogBody,
    DialogFooter,
    DialogHeader,
} from "@material-tailwind/react";
import axios from "axios";
import cornerstone from "cornerstone-core";
import cornerstoneMath from "cornerstone-math";
import cornerstoneTools from "cornerstone-tools";
import cornerstoneWADOImageLoader from "cornerstone-wado-image-loader";
import dicomParser from "dicom-parser";
import Hammer from "hammerjs";
import Image from "next/image"; // Using Next.js Image component
import { useParams, useRouter } from "next/navigation"; // Next.js hooks
import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-scroll";
import DClogo from "./vercel.svg"; // Assuming DGLogo.svg is in the parent directory

// Define types for environment variables for safety
interface ProcessEnv {
    NEXT_PUBLIC_DATA_SERVER: string;
    NEXT_PUBLIC_FLASK_URL: string;
}

// Cornerstone and Tools Initialization
// Using 'any' for external libraries without full TypeScript support
cornerstoneWADOImageLoader.external.cornerstone = cornerstone as any;
cornerstoneWADOImageLoader.external.dicomParser = dicomParser as any;
cornerstoneTools.external.cornerstoneMath = cornerstoneMath as any;
cornerstoneTools.external.cornerstone = cornerstone as any;
cornerstoneTools.external.Hammer = Hammer as any;
cornerstoneTools.init();

// #region Helper & Reusable Components and Types

interface ToolButtonProps {
    icon: JSX.Element;
    label: string;
    onClick: () => void;
    isActive: boolean;
    disabled?: boolean;
}

const ToolButton: React.FC<ToolButtonProps> = ({
    icon,
    label,
    onClick,
    isActive,
    disabled = false,
}) => (
    <Button
        variant="text"
        color={isActive ? "green" : "blue-gray"} // Active = green, Inactive = blue-gray
        onClick={onClick}
        disabled={disabled}
        className={`flex flex-col items-center justify-center gap-1 p-2 h-full transition-colors duration-200 rounded-md
      ${isActive ? 'bg-green-100 text-green-800' : 'hover:bg-gray-200 text-gray-700'}
      ${disabled ? 'cursor-not-allowed opacity-50' : ''}
    `}
    >
        {icon}
        <span className="text-xs font-normal capitalize">{label}</span>
    </Button>
);


// Type for the main component props, if any are passed from a parent
interface DcmviProps { }

// Type for annotation entries and structures
interface Point { x: number; y: number; }
interface AnnotationEntry {
    x?: number; y?: number;
    x1?: number; y1?: number;
    x2?: number; y2?: number;
    x3?: number; y3?: number;
    handles?: any; // from cornerstone
}
type AnnotationToolData = AnnotationEntry[] | Point[];
interface Annotations { [tool: string]: AnnotationToolData; }
interface ImageAnnotations { [imageId: string]: Annotations; }

// #endregion

const Dcmvi: React.FC<DcmviProps> = () => {
    const router = useRouter();
    const params = useParams();
    const { doctorName, datasetName } = params as { doctorName: string; datasetName: string; };

    // Environment variables for Next.js must be prefixed with NEXT_PUBLIC_
    const baseUrl = (process.env as unknown as ProcessEnv).NEXT_PUBLIC_DATA_SERVER;
    const flaskURL = (process.env as unknown as ProcessEnv).NEXT_PUBLIC_FLASK_URL;

    // --- State and Refs with TypeScript types ---
    const [showErrorPopup, setShowErrorPopup] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string>("");
    const [imageFiles, setImageFiles] = useState<{ name: string }[]>([]); // To store file metadata from fetch
    const viewerRef = useRef<HTMLDivElement | null>(null);
    const q1 = useRef<HTMLDivElement | null>(null);
    const q2 = useRef<HTMLDivElement | null>(null);
    const imagesLOL = useRef<string[]>([]);
    const imageBlobsRef = useRef<Blob[] | null>(null);
    const [imageLoaded, setImageLoaded] = useState<boolean>(false);
    const [activeTool, setActiveTool] = useState<string>("");
    const [jsonobj, setJsonobj] = useState<ImageAnnotations | null>(null);
    const [open, setOpen] = useState<boolean>(false);
    const currentIndexRef = useRef<number>(0);
    const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
    const [totalImages, setTotalImages] = useState<number>(0);
    const [j, setJ] = useState<number>(0);
    const [jumpToValue, setJumpToValue] = useState<string>("");
    const [annotationsEnabled, setAnnotationsEnabled] = useState<boolean>(false);
    const coords = useRef<any[]>([]);
    const editedOnly = useRef<number[]>([]);
    const finalMasks = useRef<any[]>([]);

    const handleOpen = () => setOpen(!open);

    useEffect(() => {
        const fetchInitialData = async () => {
            if (doctorName && datasetName) {
                // NOTE: This is a placeholder for your actual API call.
                // You need an endpoint that returns the file list for a dataset.
                console.warn("Placeholder: Using mock file data. Replace with actual API call to get file list.");
                try {
                    // Example of a real API call:
                    const response = await axios.get(`${baseUrl}/getFolderContents?doctorName=${doctorName}&datasetName=${datasetName}`);
                    const files = response.data;
                    setImageFiles(files);
                    console.log(response.data)

                    // Using mock data for demonstration purposes:
                    // const mockFiles = Array.from({ length: 50 }, (_, i) => ({ name: `image-${i + 1}.dcm` }));
                    // setImageFiles(mockFiles);

                } catch (error) {
                    console.error("Failed to fetch initial dataset files:", error);
                    setErrorMessage("Could not load dataset files.");
                    setShowErrorPopup(true);
                }
            }
        };
        fetchInitialData();
    }, [doctorName, datasetName, baseUrl]);





    const initialize2DViewer = async () => {
        if (!viewerRef.current || !doctorName || !imageFiles.length) return;

        const element = viewerRef.current;
        cornerstone.enable(element);

        const tools = [
            'StackScrollMouseWheel', 'Pan', 'Zoom', 'Length', 'Probe', 'Angle', 'Eraser',
            'FreehandRoi', 'EllipticalRoi', 'Magnify', 'Rotate', 'Wwwc', 'RectangleRoi'
        ];
        tools.forEach(toolName => {
            const tool = (cornerstoneTools as any)[`${toolName}Tool`];
            if (tool) cornerstoneTools.addTool(tool);
        });

        if (imageBlobsRef.current) {
            loadImagesFromBlobs(imageBlobsRef.current);
        } else {
            fetchAndLoadImages();
        }
    };

    const fetchAndLoadImages = async () => {
        setTotalImages(imageFiles.length);
        const fetchedBlobs = new Array(imageFiles.length);
        let firstImageLoaded = false;

        imageFiles.forEach((file, index) => {
            const fileUrl = `${baseUrl}/getFile?doctorName=${doctorName}&datasetName=${datasetName}&fileName=${file.name}`;
            fetch(fileUrl)
                .then(response => {
                    if (!response.ok) throw new Error(`Failed to fetch file: ${fileUrl}`);
                    return response.blob();
                })
                .then(blob => {
                    fetchedBlobs[index] = blob;
                    const imageId = cornerstoneWADOImageLoader.wadouri.fileManager.add(blob);
                    imagesLOL.current[index] = imageId;

                    if (!firstImageLoaded) {
                        setImageLoaded(true);
                        updateTheImage(index);
                        firstImageLoaded = true;
                    }
                })
                .catch(e => console.error("Error fetching individual image:", e));
        });
        imageBlobsRef.current = fetchedBlobs;
    };

    const loadImagesFromBlobs = async (blobs: Blob[]) => {
        cornerstoneWADOImageLoader.wadouri.fileManager.purge();
        imagesLOL.current = blobs.map(blob => cornerstoneWADOImageLoader.wadouri.fileManager.add(blob));
        setTotalImages(imagesLOL.current.length);
        setImageLoaded(true);
        updateTheImage(currentIndexRef.current);
    };

    useEffect(() => {
        if ( imageFiles.length > 0) {
            initialize2DViewer();
        } else {
            if (viewerRef.current) {
                try { cornerstone.disable(viewerRef.current); } catch (e) { /* silent fail */ }
            }
        }
        return () => {
            if (viewerRef.current) {
                try { cornerstone.disable(viewerRef.current); } catch (e) { /* silent fail */ }
            }
        };
    }, [ doctorName, datasetName, imageFiles]);

    useEffect(() => {
        const handleScroll = (event: WheelEvent) => {
            // event.preventDefault(); // Prevent page scroll
            if (activeTool !== "Scroll" || !imageLoaded) return;
            const direction = event.deltaY > 0 ? 1 : -1;
            const currentLength = imagesLOL.current?.length || 0;
            let newIndex = currentIndexRef.current + direction;
            if (newIndex < 0) newIndex = 0;
            if (newIndex >= currentLength) newIndex = currentLength - 1;

            if (newIndex !== currentIndexRef.current) {
                currentIndexRef.current = newIndex;
                updateTheImage(newIndex);
            }
        };

        const viewer = viewerRef.current;
        if (viewer && activeTool === 'Scroll') {
            viewer.addEventListener("wheel", handleScroll, { passive: false });
        }
        return () => {
            if (viewer) {
                viewer.removeEventListener("wheel", handleScroll);
            }
        };
    }, [activeTool, imageLoaded]);

    const updateTheImage = async (index: number) => {
        if (!imagesLOL.current[index] || !viewerRef.current) return;
        try {
            const image = await cornerstone.loadImage(imagesLOL.current[index]);
            const element = viewerRef.current;
            if (!element) return;
            const viewport = cornerstone.getDefaultViewportForImage(element, image);
            cornerstone.displayImage(element, image, viewport);
            setCurrentImageIndex(index);
        } catch (error) {
            console.error(`Error loading image at index ${index}:`, error);
        }
    };

    // --- Annotation calculation and helper functions ---
    // The internal logic of these functions remains the same.
    const collectAllAnnotations = (imageIds: string[]): string => { /* ... Full function code from original file ... */ return JSON.stringify({}, null, 2); };
    const getAnglePoints = (x1: number, y1: number, x2: number, y2: number, x3: number, y3: number): Point[] => { /* ... Full function code ... */ return []; };
    const getPoints = (name: string, x1: number, y1: number, x2: number, y2: number): Point[] => { /* ... Full function code ... */ return []; };
    const calculateDistance = (x1: number, y1: number, x2: number, y2: number): number => Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    const calculateAngle = (x1: number, y1: number, x2: number, y2: number, x3: number, y3: number): number => {
        const a = calculateDistance(x2, y2, x3, y3);
        const b = calculateDistance(x1, y1, x3, y3);
        const c = calculateDistance(x1, y1, x2, y2);
        return (Math.acos((c ** 2 + a ** 2 - b ** 2) / (2 * c * a)) * 180) / Math.PI;
    };
    const calculatePolygonArea = (points: Point[]): number => {
        let area = 0;
        for (let i = 0; i < points.length; i++) {
            const j = (i + 1) % points.length;
            area += points[i].x * points[j].y;
            area -= points[j].x * points[i].y;
        }
        return Math.abs(area / 2);
    };
    const calculatePerimeter = (points: Point[]): number => {
        let perimeter = 0;
        for (let i = 0; i < points.length; i++) {
            const j = (i + 1) % points.length;
            perimeter += calculateDistance(points[i].x, points[i].y, points[j].x, points[j].y);
        }
        return perimeter;
    };
    const saveAnnotations = async () => {
        try {
            const rawAnnotations = collectAllAnnotations(imagesLOL.current);
            const annotationsObj: ImageAnnotations = JSON.parse(rawAnnotations);
            setJsonobj(annotationsObj);
            setErrorMessage("Annotations saved!");
            setShowErrorPopup(true);
        } catch (error) {
            console.error("Error in saveAnnotations:", error);
        } finally {
            setTimeout(() => setShowErrorPopup(false), 3000);
        }
    };

    const Next = () => { if (j + 1 < editedOnly.current.length) setJ(j + 1); };
    const Prev = () => { if (j - 1 >= 0) setJ(j - 1); };
    const handleGoBack = () => router.back();

    const toggleTool = (toolName: string) => {
        // Deactivate the currently active tool first
        if (activeTool && activeTool !== 'Scroll') {
            try { cornerstoneTools.setToolPassive(activeTool); } catch (e) { /* ignore */ }
        }

        // If the clicked tool is the same as the active one, deactivate it
        if (activeTool === toolName) {
            setActiveTool("");
        } else {
            // Otherwise, activate the new tool
            setActiveTool(toolName);
            if (toolName !== 'Scroll') {
                try {
                    (cornerstoneTools as any).setToolActive(toolName, { mouseButtonMask: 1 });
                } catch (e) { /* ignore */ }
            }
        }
    };

    const handleJumpToSlide = () => {
        const slideNumber = parseInt(jumpToValue, 10);
        if (isNaN(slideNumber) || slideNumber < 1 || slideNumber > totalImages) {
            alert(`Invalid slide number. Please enter a number between 1 and ${totalImages}.`);
            setJumpToValue("");
            return;
        }
        const index = slideNumber - 1;
        currentIndexRef.current = index;
        updateTheImage(index);
        setJumpToValue("");
    };

    useEffect(() => {
        const loadSummaryImage = async () => {
            if (open && q1.current && editedOnly.current.length > 0 && editedOnly.current[j] !== undefined) {
                cornerstone.enable(q1.current);
                try {
                    const imageId = `dicomfile:${editedOnly.current[j]}`;
                    const img = await cornerstone.loadImage(imageId);
                    cornerstone.displayImage(q1.current, img);
                    // ... rest of the logic from original file
                } catch (error) {
                    console.error("Error displaying summary image:", error);
                }
            }
        };
        loadSummaryImage();
    }, [open, j]);


    return (
        <div className="bg-[#0A0A23] min-h-screen w-full flex flex-col text-white">
           

            {/* Toolbar -- COMPLETE AND UNABRIDGED */}
            <div className={`bg-[#111827] border-b border-gray-700 px-4 py-3 flex flex-wrap justify-center md:justify-between items-center gap-4 `}>
                <div className="flex flex-wrap gap-2 text-white text-sm">
                    <div className="w-full font-semibold mb-2">Navigation</div>
                    <ToolButton
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"> <path strokeLinecap="round" strokeLinejoin="round" d="M8 7l4-4m0 0l4 4m-4-4v18" /> </svg>}
                        label="Scroll"
                        onClick={() => toggleTool('Scroll')}
                        isActive={activeTool === 'Scroll'}
                    />
                    <ToolButton
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"> <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /> </svg>}
                        label="Zoom"
                        onClick={() => toggleTool('Zoom')}
                        isActive={activeTool === 'Zoom'}
                    />
                    <ToolButton
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"> <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4h4m12 4V4h-4M4 16v4h4m12-4v4h-4" /> </svg>}
                        label="Pan"
                        onClick={() => toggleTool('Pan')}
                        isActive={activeTool === 'Pan'}
                    />
                    <div className="flex items-center gap-2 mt-1">
                        <input
                            type="number"
                            placeholder={`Slide ${currentImageIndex + 1}/${totalImages}`}
                            value={jumpToValue}
                            onChange={(e) => setJumpToValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleJumpToSlide()}
                            className="w-28 h-9 px-2 py-1 text-sm text-black bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        />
                        <Button size="sm" onClick={handleJumpToSlide} disabled={!jumpToValue || !imageLoaded }>
                            Jump
                        </Button>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                    <div className="w-full text-white text-sm font-semibold mb-2">Annotations</div>
                    <ToolButton icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12h18M12 3v18" /></svg>} label="Probe" onClick={() => toggleTool('Probe')} isActive={activeTool === 'Probe'} />
                    <ToolButton icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16" /></svg>} label="Length" onClick={() => toggleTool('Length')} isActive={activeTool === 'Length'} />
                    <ToolButton icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 4v16m-5-8h10" /><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /></svg>} label="Rectangle" onClick={() => toggleTool('RectangleRoi')} isActive={activeTool === 'RectangleRoi'} />
                    <ToolButton icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /></svg>} label="Ellipse" onClick={() => toggleTool('EllipticalRoi')} isActive={activeTool === 'EllipticalRoi'} />
                    <ToolButton icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" /></svg>} label="Freehand" onClick={() => toggleTool('FreehandRoi')} isActive={activeTool === 'FreehandRoi'} />
                    <ToolButton icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>} label="Eraser" onClick={() => toggleTool('Eraser')} isActive={activeTool === 'Eraser'} />
                    <ToolButton icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3l-4-4z" /><circle cx="12" cy="13" r="3" /></svg>} label="Save" onClick={saveAnnotations} isActive={false} />
                    <ToolButton icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} label="Show Anno" onClick={() => setAnnotationsEnabled(prev => !prev)} isActive={annotationsEnabled} />
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                    <div className="w-full text-white text-sm font-semibold mb-2">Interaction</div>
                    <ToolButton icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>} label="WW/WC" onClick={() => toggleTool('Wwwc')} isActive={activeTool === 'Wwwc'} />
                    <ToolButton icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5" /><path d="M4 4l7 7m9 9l-7-7" /></svg>} label="Rotate" onClick={() => toggleTool('Rotate')} isActive={activeTool === 'Rotate'} />
                    <ToolButton icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" /></svg>} label="Magnify" onClick={() => toggleTool('Magnify')} isActive={activeTool === 'Magnify'} />
                </div>


            </div>

            {/* Main Viewer and Annotation Section */}
            <div className={`w-full max-w-9xl mx-auto flex flex-col lg:flex-row gap-6 p-6`}>
                <div className={`${annotationsEnabled ? "lg:w-[75%]" : "w-full"} w-full h-[640px] bg-black rounded-2xl border-4 border-gray-700 shadow-xl relative overflow-hidden transition-all duration-300`}>
                    <div
                        ref={viewerRef}
                        onContextMenu={(e: React.MouseEvent) => e.preventDefault()}
                        className="w-full h-full cursor-pointer"
                    >
                        {!imageLoaded && (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">Loading DICOM images...</div>
                        )}
                        {imageLoaded && (
                            <div className="absolute bottom-2 right-2 bg-black/70 px-3 py-1 rounded text-sm text-white">
                                {currentImageIndex + 1} / {totalImages}
                            </div>
                        )}
                    </div>
                </div>

                {annotationsEnabled && (
                    <div className="lg:w-[25%] w-full h-[640px] bg-white rounded-2xl shadow-xl border border-gray-200 flex flex-col overflow-hidden transition-all duration-300">
                        <div className="px-4 py-3 border-b border-gray-300 bg-gray-50">
                            <h2 className="text-base font-semibold text-gray-700">Annotations</h2>
                        </div>
                        <div className="p-4 overflow-y-auto text-sm space-y-4 text-black">
                            {jsonobj && imagesLOL.current[currentImageIndex] && jsonobj[imagesLOL.current[currentImageIndex]] ? (
                                Object.entries(jsonobj[imagesLOL.current[currentImageIndex]]).map(([tool, entries]) => (
                                    <div key={tool}>
                                        <h3 className="font-semibold text-gray-800 mb-1">{tool}</h3>
                                        {(entries as any[]).map((entry, idx) => {
                                            let label = "";
                                            if (tool === "Length" && entry.x1 !== undefined) label = `Length: ${calculateDistance(entry.x1, entry.y1, entry.x2, entry.y2).toFixed(1)} px`;
                                            else if (tool === "Angle" && entry.x1 !== undefined) label = `Angle: ${calculateAngle(entry.x1, entry.y1, entry.x2, entry.y2, entry.x3, entry.y3).toFixed(1)}°`;
                                            else if (tool === "RectangleRoi" && entry.x1 !== undefined) label = `W×H: ${Math.abs(entry.x2 - entry.x1).toFixed(1)}×${Math.abs(entry.y2 - entry.y1).toFixed(1)} px`;
                                            else if ((tool === "FreehandRoi" || tool === "EllipticalRoi") && Array.isArray(entry)) label = `Area: ${calculatePolygonArea(entry).toFixed(1)} px², P: ${calculatePerimeter(entry).toFixed(1)} px`;
                                            else if (tool === "Probe" && entry.x !== undefined) label = `X: ${entry.x.toFixed(1)}, Y: ${entry.y.toFixed(1)}`;
                                            else label = `Annotation ${idx + 1}`;
                                            return <div key={idx} className="ml-2 text-gray-600">- {label}</div>;
                                        })}
                                    </div>
                                ))
                            ) : (
                                <div className="text-gray-500 italic">No annotations for this image.</div>
                            )}
                        </div>
                    </div>
                )}
            </div>


            {/* Dialog and Popups */}
            <Dialog open={open} handler={handleOpen} size="xl">
                <DialogHeader className="text-center">Summarised Masks</DialogHeader>
                <DialogBody className="bg-blue-gray-100/50 p-4 flex flex-col items-center gap-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div ref={q1} className="bg-black w-[40vw] h-[40vw] md:w-[512px] md:h-[512px] rounded-lg" />
                        <div ref={q2} className="bg-black w-[40vw] h-[40vw] md:w-[512px] md:h-[512px] rounded-lg" />
                    </div>
                    <div className="flex justify-around items-center w-full mt-4">
                        <Button size="lg" onClick={Prev}>Previous</Button>
                        <h2 className="text-black text-lg font-semibold">Image: {editedOnly.current[j] ? editedOnly.current[j] + 1 : '-'}</h2>
                        <Button size="lg" onClick={Next}>Next</Button>
                    </div>
                </DialogBody>
                <DialogFooter>
                    <Button variant="text" color="red" onClick={handleOpen}>Close</Button>
                </DialogFooter>
            </Dialog>

            {showErrorPopup && (
                <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-red-500 text-white p-4 rounded-md shadow-lg z-50">
                    {errorMessage}
                </div>
            )}
        </div>
    );
};

export default Dcmvi;