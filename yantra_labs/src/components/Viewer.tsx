"use client";

import {
    Button,
    Dialog,
    DialogBody,
    DialogFooter,
    DialogHeader,
    Menu,
    MenuHandler,
    MenuItem,
    MenuList,
} from "@material-tailwind/react";
import axios from "axios";
import cornerstone from "cornerstone-core";
import cornerstoneMath from "cornerstone-math";
import cornerstoneTools from "cornerstone-tools";
import cornerstoneWADOImageLoader from "cornerstone-wado-image-loader";
import dicomParser from "dicom-parser";
import Hammer from "hammerjs";
import {
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    User,
    MousePointer,
    ZoomIn,
    Move,
    Ruler,
    ALargeSmall,
    Square,
    Circle,
    Eraser,
    Save,
    AreaChart,
    RotateCcw,
    Search,
    Sun,
    Layers,
    Move3d
} from 'lucide-react';
import { useParams } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";

// #region Types and Environment Variables
interface ProcessEnv {
    NEXT_PUBLIC_DATA_SERVER: string;
    NEXT_PUBLIC_FLASK_URL: string;
    NEXT_PUBLIC_SERVER_URL: string;
}

interface Point { x: number; y: number; }
interface AnnotationEntry {
    handles?: any;
    cachedStats?: {
        area?: number;
        perimeter?: number;
    };
}
type AnnotationToolData = { data: AnnotationEntry[] };
interface Annotations { [tool: string]: AnnotationToolData; }
interface ImageAnnotations { [imageId: string]: Annotations; }

interface SessionMeta {
    mrn: string;
    patientName: string;
    age: number;
    gender: string;
    consultingDoctor: string;
    symptoms: string;
    admissionDate: string;
}
// #endregion

// #region Cornerstone Initialization
cornerstoneWADOImageLoader.external.cornerstone = cornerstone as any;
cornerstoneWADOImageLoader.external.dicomParser = dicomParser as any;
cornerstoneTools.external.cornerstoneMath = cornerstoneMath as any;
cornerstoneTools.external.cornerstone = cornerstone as any;
cornerstoneTools.external.Hammer = Hammer as any;
cornerstoneTools.init();
// #endregion

// #region Reusable UI Components
const Loader: React.FC<{ text: string }> = ({ text }) => (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-400">
        <svg aria-hidden="true" className="w-10 h-10 animate-spin fill-blue-500" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
            <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
        </svg>
        <p>{text}</p>
    </div>
);
// #endregion

const Viewer: React.FC = () => {
    // #region Hooks and State
    const params = useParams();
    const { sessionId } = params as { sessionId: string };
    const serverURL = (process.env as unknown as ProcessEnv).NEXT_PUBLIC_SERVER_URL;

    // Refs
    const viewerRef = useRef<HTMLDivElement | null>(null);
    const imagesLOL = useRef<string[]>([]);
    const currentIndexRef = useRef<number>(0);

    // UI State
    const [showErrorPopup, setShowErrorPopup] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string>("");
    const [imageLoaded, setImageLoaded] = useState<boolean>(false);
    const [activeTool, setActiveTool] = useState<string>("Scroll");
    const [isSidebarVisible, setIsSidebarVisible] = useState<boolean>(true);
    const [jumpToValue, setJumpToValue] = useState<string>("");

    // Data State
    const [dicomMap, setDicomMap] = useState<Record<string, string[]>>({});
    const [selectedSubTest, setSelectedSubTest] = useState<string>("");
    const [imageFiles, setImageFiles] = useState<{ name: string, fileURL: string }[]>([]);
    const [sessionMeta, setSessionMeta] = useState<SessionMeta | null>(null);
    const [annotations, setAnnotations] = useState<ImageAnnotations | null>(null);
    const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
    const [totalImages, setTotalImages] = useState<number>(0);

    // Dialog State
    const [open, setOpen] = useState<boolean>(false);
    const q1 = useRef<HTMLDivElement | null>(null);
    const q2 = useRef<HTMLDivElement | null>(null);
    const editedOnly = useRef<number[]>([]);
    const [j, setJ] = useState<number>(0);
    const handleOpen = () => setOpen(!open);
    const Next = () => { if (j + 1 < editedOnly.current.length) setJ(j + 1); };
    const Prev = () => { if (j - 1 >= 0) setJ(j - 1); };
    // #endregion

    // #region Data Fetching and Initialization
    useEffect(() => {
        cornerstoneWADOImageLoader.webWorkerManager.initialize({
            webWorkerPath: '/cornerstoneWADOImageLoaderWebWorker.js',
            taskConfiguration: {
                decodeTask: { codecsPath: '/cornerstoneWADOImageLoaderCodecs.js' }
            }
        });

        const fetchSessionData = async () => {
            if (!sessionId) return;
            try {
                const [metaRes, filesRes] = await Promise.all([
                    axios.get(`${serverURL}/api/session/metadata/${sessionId}`),
                    axios.get(`${serverURL}/api/session/files/${sessionId}`)
                ]);

                setSessionMeta(metaRes.data);
                const map: Record<string, string[]> = filesRes.data.dicomMap;
                setDicomMap(map);
                const subTests = Object.keys(map);
                if (subTests.length > 0) {
                    const defaultSubTest = subTests[0];
                    setSelectedSubTest(defaultSubTest);
                    updateImageFiles(map[defaultSubTest]);
                }
                await loadAnnotations();
            } catch (error) {
                console.error("Failed to fetch initial session data:", error);
                setErrorMessage("Could not load session data.");
                setShowErrorPopup(true);
            }
        };

        fetchSessionData();
    }, [sessionId, serverURL]);

    const updateImageFiles = (urls: string[]) => {
        setImageFiles(urls.map(url => ({
            name: url.split("/").pop() || "unnamed.dcm",
            fileURL: url,
        })));
    };

    useEffect(() => {
        if (imageFiles.length > 0 && viewerRef.current) {
            initialize2DViewer();
        }
        return () => {
            if (viewerRef.current) {
                try { cornerstone.disable(viewerRef.current); } catch (e) { /* silent */ }
            }
        };
    }, [imageFiles]);
    // #endregion

    // #region Cornerstone Viewer Logic
    const initialize2DViewer = async () => {
        if (!viewerRef.current) return;
        const element = viewerRef.current;
        cornerstone.enable(element);

        const tools = ['Pan', 'Zoom', 'Length', 'Probe', 'Angle', 'Eraser', 'FreehandRoi', 'EllipticalRoi', 'Magnify', 'Rotate', 'Wwwc', 'RectangleRoi'];
        tools.forEach(toolName => {
            const tool = (cornerstoneTools as any)[`${toolName}Tool`];
            if (tool) cornerstoneTools.addTool(tool);
        });

        toggleTool('Scroll');
        await fetchAndLoadImages();
    };

    const fetchAndLoadImages = async () => {
        setTotalImages(imageFiles.length);
        imagesLOL.current = imageFiles.map(file => `wadouri:${file.fileURL}`);
        if (imagesLOL.current.length > 0) {
            setImageLoaded(true);
            updateTheImage(0);
        } else {
            setImageLoaded(false);
        }
    };

    const updateTheImage = (index: number) => {
        const element = viewerRef.current;
        if (!element || !imagesLOL.current[index]) return;
        const imageId = imagesLOL.current[index];
        cornerstone.loadAndCacheImage(imageId).then(image => {
            cornerstone.displayImage(element, image);
            setCurrentImageIndex(index);
            currentIndexRef.current = index;
            if (annotations && annotations[imageId]) {
                cornerstoneTools.globalImageIdSpecificToolStateManager.restoreImageIdToolState(imageId, annotations[imageId]);
            }
            cornerstone.updateImage(element);
        }).catch(err => {
            console.error(`Error loading image ${imageId}:`, err);
        });
    };
    // #endregion

    // #region Annotation Handling
    const collectAllAnnotations = (): ImageAnnotations => {
        const toolState = cornerstoneTools.globalImageIdSpecificToolStateManager.saveToolState();
        const relevantAnnotations: ImageAnnotations = {};
        imagesLOL.current.forEach(imageId => {
            if (toolState && toolState[imageId]) {
                relevantAnnotations[imageId] = toolState[imageId];
            }
        });
        return relevantAnnotations;
    };

    const saveAnnotations = async () => {
        try {
            const annotationsObj = collectAllAnnotations();
            setAnnotations(annotationsObj);
            const savePromises = Object.entries(annotationsObj).map(
                ([imageId, data]) => axios.post(`${serverURL}/api/annotation/save`, {
                    sessionId,
                    fileURL: imageId.replace(/^wadouri:/, ""),
                    doctorName: "Dr. User",
                    data
                })
            );
            await Promise.all(savePromises);
            setErrorMessage("Annotations saved!");
            setShowErrorPopup(true);
        } catch (error) {
            console.error("Error saving annotations:", error);
            setErrorMessage("Failed to save annotations.");
            setShowErrorPopup(true);
        } finally {
            setTimeout(() => setShowErrorPopup(false), 3000);
        }
    };

    const loadAnnotations = async () => {
        if (!sessionId) return;
        try {
            const response = await axios.get(`${serverURL}/api/annotation/${sessionId}`);
            if (response.data.success && response.data.annotations.length > 0) {
                const restoredState: ImageAnnotations = {};
                for (const entry of response.data.annotations) {
                    if (entry.fileURL && entry.data) {
                        restoredState[`wadouri:${entry.fileURL}`] = entry.data;
                    }
                }
                setAnnotations(restoredState);
                applyAnnotationsToCornerstone(restoredState);
            }
        } catch (error) { console.error("Error fetching annotations:", error); }
    };

    const applyAnnotationsToCornerstone = (toolState: ImageAnnotations) => {
        if (!viewerRef.current || !toolState) return;

        const element = viewerRef.current;

        // ✅ Ensure the element is enabled
        if (!cornerstone.getEnabledElement(element)) {
            cornerstone.enable(element); // enable if not already
        }

        cornerstoneTools.globalImageIdSpecificToolStateManager.restoreToolState(toolState);

        const image = cornerstone.getImage(element);
        if (image) {
            cornerstone.updateImage(element);
        }
    };

    // #endregion

    // #region User Interaction and Tools
    useEffect(() => {
        const handleScroll = (event: WheelEvent) => {
            if (activeTool !== "Scroll" || !imageLoaded) return;
            const direction = event.deltaY > 0 ? 1 : -1;
            const newIndex = Math.min(Math.max(currentIndexRef.current + direction, 0), totalImages - 1);
            if (newIndex !== currentIndexRef.current) updateTheImage(newIndex);
        };
        const viewer = viewerRef.current;
        if (viewer && activeTool === 'Scroll') {
            viewer.addEventListener("wheel", handleScroll, { passive: true });
        }
        return () => viewer?.removeEventListener("wheel", handleScroll);
    }, [activeTool, imageLoaded, totalImages]);

    const toggleTool = (toolName: string) => {
        setActiveTool(toolName);
        const allTools = ['Pan', 'Zoom', 'Length', 'Probe', 'Angle', 'Eraser', 'FreehandRoi', 'EllipticalRoi', 'Magnify', 'Rotate', 'Wwwc', 'RectangleRoi'];
        allTools.forEach(t => cornerstoneTools.setToolPassive(t));
        if (toolName !== 'Scroll') {
            cornerstoneTools.setToolActive(toolName, { mouseButtonMask: 1 });
        }
    };

    const handleJumpToSlide = () => {
        const slideNumber = parseInt(jumpToValue, 10);
        if (!isNaN(slideNumber) && slideNumber >= 1 && slideNumber <= totalImages) {
            updateTheImage(slideNumber - 1);
        } else {
            setErrorMessage(`Invalid slide number. Must be 1 to ${totalImages}.`);
            setShowErrorPopup(true);
            setTimeout(() => setShowErrorPopup(false), 3000);
        }
        setJumpToValue("");
    };
    // #endregion

    // #region Annotation Calculation Helpers
    const calculateDistance = (p1: Point, p2: Point): number => Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
    const calculateAngle = (p1: Point, p2: Point, p3: Point): number => {
        const a = calculateDistance(p2, p3);
        const b = calculateDistance(p1, p3);
        const c = calculateDistance(p1, p2);
        return (Math.acos((c ** 2 + a ** 2 - b ** 2) / (2 * c * a)) * 180) / Math.PI;
    };
    // #endregion

    // Helper to generate menu item classes
    const menuItemClass = (toolName: string) =>
        `flex items-center gap-3 hover:bg-gray-700 ${activeTool === toolName ? 'bg-blue-600/80' : ''}`;


    return (
        <div className="flex h-screen bg-gray-900 text-white font-sans">
            {/* --- Integrated Sidebar --- */}
            <aside className={`flex-shrink-0 bg-gray-800 transition-all duration-300 ease-in-out ${isSidebarVisible ? "w-80" : "w-0"} overflow-hidden h-full flex flex-col`}>
                <div className="flex-grow overflow-y-auto p-6 space-y-8">
                    {/* Patient Information Section */}
                    <div>
                        <h2 className="text-xl font-bold mb-6 flex items-center text-gray-200"><User className="mr-3" size={24} /> Patient Information</h2>
                        {sessionMeta ? (
                            <div className="space-y-4 text-sm">
                                <div><label className="font-semibold text-gray-400">MRN</label><p className="text-gray-300">{sessionMeta.mrn}</p></div>
                                <div><label className="font-semibold text-gray-400">Patient Name</label><p className="text-gray-300">{sessionMeta.patientName}</p></div>
                                <div><label className="font-semibold text-gray-400">Age & Gender</label><p className="text-gray-300">{sessionMeta.age}, {sessionMeta.gender}</p></div>
                                <div><label className="font-semibold text-gray-400">Consulting Doctor</label><p className="text-gray-300">{sessionMeta.consultingDoctor}</p></div>
                                <div><label className="font-semibold text-gray-400">Admission Date</label><p className="text-gray-300">{new Date(sessionMeta.admissionDate).toLocaleDateString()}</p></div>
                                <div><label className="font-semibold text-gray-400">Symptoms</label><p className="whitespace-pre-wrap text-gray-300">{sessionMeta.symptoms}</p></div>
                            </div>
                        ) : <p className="text-gray-400">Loading details...</p>}
                    </div>

                    {/* Annotations Section */}
                    <div>
                        <h2 className="text-xl font-bold mb-6 text-gray-200">Annotations</h2>
                        <div className="space-y-4 text-sm">
                            {annotations && imagesLOL.current[currentImageIndex] && annotations[imagesLOL.current[currentImageIndex]] ? (
                                Object.entries(annotations[imagesLOL.current[currentImageIndex]]).map(([tool, toolData]) => (
                                    <div key={tool}>
                                        <h3 className="font-semibold text-blue-400 uppercase tracking-wider">{tool}</h3>
                                        {(toolData.data).map((entry, idx) => {
                                            let label = `Data Error`;
                                            const { handles, cachedStats } = entry;
                                            try {
                                                if (tool === "Length" && handles?.start && handles?.end) {
                                                    label = `Length: ${calculateDistance(handles.start, handles.end).toFixed(1)} px`;
                                                } else if (tool === "Angle" && handles?.start && handles?.middle && handles?.end) {
                                                    label = `Angle: ${calculateAngle(handles.start, handles.middle, handles.end).toFixed(1)}°`;
                                                } else if ((tool === "RectangleRoi" || tool === "FreehandRoi" || tool === "EllipticalRoi") && cachedStats?.area) {
                                                    label = `Area: ${cachedStats.area.toFixed(1)} px²`;
                                                } else if (tool === "Probe" && handles?.start) {
                                                    label = `X: ${handles.start.x.toFixed(1)}, Y: ${handles.start.y.toFixed(1)}`;
                                                }
                                            } catch (e) { /* silent fail on calculation */ }
                                            return <div key={idx} className="ml-2 text-gray-300">- {label}</div>;
                                        })}
                                    </div>
                                ))
                            ) : <div className="text-gray-500 italic">No annotations for this image.</div>}
                        </div>
                    </div>
                </div>
            </aside>

            {/* --- Main Content: Viewer and Toolbar --- */}
            <main className="flex-1 flex flex-col min-w-0">
                <header className="flex-shrink-0 bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 p-2 flex flex-wrap justify-between items-center gap-4 z-10">
                    {/* Left side: Panel Toggle and Series Selector */}
                    <div className="flex items-center gap-3">
                        <button onClick={() => setIsSidebarVisible(!isSidebarVisible)} className="bg-gray-800 p-2 rounded-full hover:bg-gray-700 transition-colors" title={isSidebarVisible ? "Hide Panel" : "Show Panel"}>
                            {isSidebarVisible ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
                        </button>
                        <div className="flex items-center gap-2">
                            <label htmlFor="subtestSelect" className="text-sm font-medium text-gray-300 hidden sm:block">Series:</label>
                            <select id="subtestSelect" value={selectedSubTest} onChange={(e) => { setSelectedSubTest(e.target.value); updateImageFiles(dicomMap[e.target.value]); }} className="bg-gray-700 text-white border border-gray-600 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                {Object.keys(dicomMap).map(name => <option key={name} value={name}>{name}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Right side: Tool Menus */}
                    <div className="flex items-center flex-wrap gap-2">
                        {/* Navigation Menu */}
                        <Menu>
                            <MenuHandler>
                                <Button variant="text" className="text-white flex items-center gap-2">Navigation <ChevronDown /></Button>
                            </MenuHandler>
                            <MenuList className="bg-gray-800 border-gray-700 text-gray-200">
                                <MenuItem className={menuItemClass('Scroll')} onClick={() => toggleTool('Scroll')}><Layers size={18} /> Scroll</MenuItem>
                                <MenuItem className={menuItemClass('Pan')} onClick={() => toggleTool('Pan')}><Move size={18} /> Pan</MenuItem>
                                <MenuItem className={menuItemClass('Zoom')} onClick={() => toggleTool('Zoom')}><ZoomIn size={18} /> Zoom</MenuItem>
                                <div className="p-2 flex items-center gap-2 border-t border-gray-700 mt-1">
                                    <input type="number" placeholder="Go to..." value={jumpToValue} onChange={(e) => setJumpToValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleJumpToSlide()} className="w-24 px-2 py-1 text-sm text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none" />
                                    <Button size="sm" onClick={handleJumpToSlide} disabled={!jumpToValue} className="bg-blue-600">Jump</Button>
                                </div>
                            </MenuList>
                        </Menu>

                        {/* Annotation Menu */}
                        <Menu>
                            <MenuHandler>
                                <Button variant="text" className="text-white flex items-center gap-2">Annotation <ChevronDown /></Button>
                            </MenuHandler>
                            <MenuList className="bg-gray-800 border-gray-700 text-gray-200">
                                <MenuItem className={menuItemClass('Probe')} onClick={() => toggleTool('Probe')}><MousePointer size={18} /> Probe</MenuItem>
                                <MenuItem className={menuItemClass('Length')} onClick={() => toggleTool('Length')}><Ruler size={18} /> Length</MenuItem>
                                <MenuItem className={menuItemClass('Angle')} onClick={() => toggleTool('Angle')}><Move3d size={18} /> Angle</MenuItem>
                                <MenuItem className={menuItemClass('RectangleRoi')} onClick={() => toggleTool('RectangleRoi')}><Square size={18} /> Rectangle</MenuItem>
                                <MenuItem className={menuItemClass('EllipticalRoi')} onClick={() => toggleTool('EllipticalRoi')}><Circle size={18} /> Ellipse</MenuItem>
                                <MenuItem className={menuItemClass('FreehandRoi')} onClick={() => toggleTool('FreehandRoi')}><Move3d size={18} /> Freehand</MenuItem>
                                <MenuItem className={menuItemClass('Eraser')} onClick={() => toggleTool('Eraser')}><Eraser size={18} /> Eraser</MenuItem>
                                <hr className="my-2 border-gray-700" />
                                <MenuItem className="flex items-center gap-3 hover:bg-gray-700" onClick={saveAnnotations}><Save size={18} /> Save Annotations</MenuItem>
                            </MenuList>
                        </Menu>

                        {/* Interaction Menu */}
                        <Menu>
                            <MenuHandler>
                                <Button variant="text" className="text-white flex items-center gap-2">Interaction <ChevronDown /></Button>
                            </MenuHandler>
                            <MenuList className="bg-gray-800 border-gray-700 text-gray-200">
                                <MenuItem className={menuItemClass('Wwwc')} onClick={() => toggleTool('Wwwc')}><Sun size={18} /> WW/WC</MenuItem>
                                <MenuItem className={menuItemClass('Rotate')} onClick={() => toggleTool('Rotate')}><RotateCcw size={18} /> Rotate</MenuItem>
                                <MenuItem className={menuItemClass('Magnify')} onClick={() => toggleTool('Magnify')}><Search size={18} /> Magnify</MenuItem>
                            </MenuList>
                        </Menu>
                    </div>
                </header>

                {/* Viewer Canvas */}
                <div className="bg-black flex items-center justify-center p-2 md:p-8">
                    <div className="w-full max-w-full h-[550px] relative rounded-lg border border-gray-800 overflow-hidden">
                        <div
                            ref={viewerRef}
                            onContextMenu={(e) => e.preventDefault()}
                            className="w-full h-full cursor-pointer"
                        />

                        {!imageLoaded && <Loader text="Loading DICOM images..." />}

                        {imageLoaded && (
                            <div className="absolute bottom-2 right-2 bg-black/70 px-3 py-1 rounded text-sm font-mono text-white">
                                Image: {currentImageIndex + 1} / {totalImages}
                            </div>
                        )}
                    </div>
                </div>

            </main>

            {/* Popups and Dialogs */}
            {showErrorPopup && <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-md shadow-lg z-50">{errorMessage}</div>}


        </div>
    );
};

export default Viewer;