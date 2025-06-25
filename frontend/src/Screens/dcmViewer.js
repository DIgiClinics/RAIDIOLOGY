import {
    Button,
    Dialog,
    DialogBody,
    DialogFooter,
    DialogHeader,
    Input,
} from "@material-tailwind/react";
import axios from "axios";
import cornerstone from "cornerstone-core";
import cornerstoneMath from "cornerstone-math";
import cornerstoneTools from "cornerstone-tools";
import cornerstoneWADOImageLoader from "cornerstone-wado-image-loader";
import dicomParser from "dicom-parser";
import Hammer from "hammerjs";
import React, { useEffect, useRef, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { Link } from "react-scroll";
import DClogo from "../DGLogo.svg";
import PapayaViewer from './PapayaViewer';

// Cornerstone and Tools Initialization
cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
cornerstoneWADOImageLoader.external.dicomParser = dicomParser;
cornerstoneTools.external.cornerstoneMath = cornerstoneMath;
cornerstoneTools.external.cornerstone = cornerstone;
cornerstoneTools.external.Hammer = Hammer;
cornerstoneTools.init();

// #region Helper & Reusable Components

/**
 * A reusable, labeled button for the toolbar.
 * @param {{icon: JSX.Element, label: string, onClick: function, isActive: boolean, disabled: boolean}} props
 */
const ToolButton = ({ icon, label, onClick, isActive, disabled = false }) => (
    <Button
        variant="text"
        color={isActive ? "green" : "blue-gray"}
        onClick={onClick}
        disabled={disabled}
        className={`flex flex-col items-center justify-center gap-1 p-2 h-full ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
    >
        {icon}
        <span className="text-xs font-normal capitalize">{label}</span>
    </Button>
);
// #endregion

const Dcmvi = (props) => {
    const location = useLocation();
    const baseUrl = process.env.REACT_APP_DataServer;
    const { doctorName, datasetName } = useParams();
    let ass = location.state;
    let res;
    const mode = useRef(0);
    let finalDirName;

    const [viewMode, setViewMode] = useState("2D");
    const [showErrorPopup, setShowErrorPopup] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [dirname, setDirname] = useState("");
    const viewerRef = useRef(null);
    const q1 = useRef(null);
    const q2 = useRef(null);
    const wid = useRef(0);
    const hei = useRef(0);
    const finalMasks = useRef([]);
    const coords = useRef([]);
    let editedOnly = useRef([]);
    const imagesLOL = useRef([]);
    const imageBlobsRef = useRef(null); // Ref to store fetched blobs
    const [imageLoaded, setImageLoaded] = useState(false);
    const [activeTool, setActiveTool] = useState("");
    const [jsonobj, setJsonobj] = useState("");
    const [open, setOpen] = React.useState(false);
    const currentIndexRef = useRef(0);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [totalImages, setTotalImages] = useState(0);
    const [j, setJ] = useState(0);
    const [jumpToValue, setJumpToValue] = useState("");
    const [fileName, setFileName] = useState(null);
    const [annotationsEnabled, setAnnotationsEnabled] = useState(false);


    const handleOpen = () => setOpen(!open);

    useEffect(() => {
        if (ass && ass[1] !== finalDirName) {
            res = ass[0];
            setDirname(ass[1]);
            finalDirName = ass[1];
            mode.current = ass[2];
        }
    }, [ass]);

    const flaskURL = process.env.REACT_APP_FLASK_URL;

    const handleMPRClick = async () => {
        try {
            const res = await axios.get(`${flaskURL}/generate_nifty`, {
                params: { doctorName, datasetName },
            });
            const name = res.data?.path?.split("/").pop();
            if (!name) throw new Error("No file name from Flask");
            setFileName(name);
            setViewMode("MPR");
        } catch (err) {
            console.error("❌ Error generating NIfTI:", err);
        }
    };

    // Function to initialize the 2D viewer
    const initialize2DViewer = async () => {
        if (!viewerRef.current || !doctorName || !ass) return;

        // Enable cornerstone and add tools
        const element = viewerRef.current;
        cornerstone.enable(element);

        const tools = [
            'StackScrollMouseWheel', 'Pan', 'Zoom', 'Length', 'Probe', 'Angle', 'Eraser',
            'FreehandRoi', 'EllipticalRoi', 'Magnify', 'Rotate', 'Wwwc', 'RectangleRoi'
        ];
        tools.forEach(toolName => {
            const tool = cornerstoneTools[`${toolName}Tool`];
            if (tool) {
                cornerstoneTools.addTool(tool);
            }
        });

        // Load images
        if (imageBlobsRef.current) {
            // If blobs are already fetched, just load them
            loadImagesFromBlobs(imageBlobsRef.current);
        } else {
            // Otherwise, fetch them
            fetchAndLoadImages();
        }
    };

    const fetchAndLoadImages = async () => {
        finalDirName = ass[1];
        res = ass[0];
        const negate = res.length;
        setTotalImages(res.length);
        const fetchedBlobs = new Array(res.length);

        let firstImageLoaded = false;

        res.forEach((file, index) => {
            let fileUrl;
            if (mode.current === 1) {
                fileUrl = `${baseUrl}/getFile?doctorName=${doctorName}&datasetName=${datasetName}&fileName=${file.name}`;
            }
            fetch(fileUrl)
                .then(response => {
                    if (!response.ok) throw new Error(`Failed to fetch file: ${fileUrl}`);
                    return response.blob();
                })
                .then(blob => {
                    fetchedBlobs[index] = blob;
                    const imageId = cornerstoneWADOImageLoader.wadouri.fileManager.add(blob);
                    imagesLOL.current[index] = imageId;

                    // Display the first image as soon as it's ready
                    if (!firstImageLoaded) {
                        setImageLoaded(true);
                        updateTheImage(index);
                        firstImageLoaded = true;
                    }
                })
                .catch(e => console.error("Error fetching individual image:", e));
        });

        imageBlobsRef.current = fetchedBlobs; // Store blobs for later use
    };

    const loadImagesFromBlobs = async (blobs) => {
        cornerstoneWADOImageLoader.wadouri.fileManager.purge();
        imagesLOL.current = blobs.map(blob => cornerstoneWADOImageLoader.wadouri.fileManager.add(blob));
        setTotalImages(imagesLOL.current.length);
        setImageLoaded(true);
        updateTheImage(currentIndexRef.current); // Display the last viewed image
    };


    // Effect to handle viewer mode changes
    useEffect(() => {
        if (viewMode === '2D') {
            initialize2DViewer();
        } else {
            // Cleanup for 2D viewer when switching away
            if (viewerRef.current) {
                try {
                    cornerstone.disable(viewerRef.current);
                } catch (e) {
                    console.warn("Cornerstone disable failed, element might not be enabled.", e);
                }
            }
        }

        return () => {
            if (viewerRef.current) {
                try {
                    cornerstone.disable(viewerRef.current);
                } catch (e) {
                    // silent fail
                }
            }
        };
    }, [viewMode, doctorName, datasetName]);


    // Wheel scroll effect
    useEffect(() => {
        const handleScroll = (event) => {
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
            viewer.addEventListener("wheel", handleScroll);
        }
        return () => {
            if (viewer) {
                viewer.removeEventListener("wheel", handleScroll);
            }
        };
    }, [activeTool, imageLoaded]);


    const updateTheImage = async (index) => {
        if (!imagesLOL.current[index] || !viewerRef.current) return;
        try {
            const image = await cornerstone.loadImage(imagesLOL.current[index]);
            const element = viewerRef.current;
            if (!element) {
                console.error("viewerRef.current is null or undefined.");
                return;
            }

            const { columns, rows } = image;
            hei.current = rows;
            wid.current = columns;

            const viewport = cornerstone.getDefaultViewportForImage(element, image);
            cornerstone.displayImage(element, image, viewport);
            setCurrentImageIndex(index);
        } catch (error) {
            console.error(`Error loading image at index ${index}:`, error);
        }
    };

    // --- Annotation and helper functions (COLLAPSED) ---
    function collectAllAnnotations(imageIds) {
        const allAnnotations = {};
        let lmao = {};
        imageIds.forEach((imageId) => {
            const toolState =
                cornerstoneTools.globalImageIdSpecificToolStateManager.saveImageIdToolState(
                    imageId
                );
            if (toolState) {
                const keys = Object.keys(toolState);
                allAnnotations[imageId] = {};
                lmao[imageId] = [];
                for (let i = 0; i < keys.length; i++) {
                    const inner = toolState[keys[i]].data;
                    if (keys[i] == "Probe") {
                        allAnnotations[imageId][keys[i]] = [];
                        for (let j = 0; j < inner.length; j++) {
                            if (inner[j].handles && inner[j].handles.end) {
                                allAnnotations[imageId][keys[i]].push({
                                    x: inner[j].handles.end.x,
                                    y: inner[j].handles.end.y,
                                });
                                lmao[imageId].push([
                                    {
                                        x: inner[j].handles.end.x,
                                        y: inner[j].handles.end.y,
                                    },
                                ]);
                            }
                        }
                    } else if (keys[i] == "Angle") {
                        allAnnotations[imageId][keys[i]] = [];
                        for (let j = 0; j < inner.length; j++) {
                            if (
                                inner[j].handles &&
                                inner[j].handles.start &&
                                inner[j].handles.middle &&
                                inner[j].handles.end
                            ) {
                                allAnnotations[imageId][keys[i]].push({
                                    x1: inner[j].handles.start.x,
                                    y1: inner[j].handles.start.y,
                                    x2: inner[j].handles.middle.x,
                                    y2: inner[j].handles.middle.y,
                                    x3: inner[j].handles.end.x,
                                    y3: inner[j].handles.end.y,
                                });
                                lmao[imageId].push(
                                    getAnglePoints(
                                        inner[j].handles.start.x,
                                        inner[j].handles.start.y,
                                        inner[j].handles.middle.x,
                                        inner[j].handles.middle.y,
                                        inner[j].handles.end.x,
                                        inner[j].handles.end.y
                                    )
                                );
                            }
                        }
                    } else if (keys[i] == "FreehandRoi") {
                        allAnnotations[imageId][keys[i]] = [];
                        for (let j = 0; j < inner.length; j++) {
                            let nig = [];
                            for (let k = 0; k < inner[j].handles.points.length; k++) {
                                nig.push({
                                    x: inner[j].handles.points[k].x,
                                    y: inner[j].handles.points[k].y,
                                });
                            }
                            lmao[imageId].push(nig);
                            allAnnotations[imageId][keys[i]].push(nig);
                        }
                    } else if (keys[i] == "EllipticalRoi") {
                        allAnnotations[imageId][keys[i]] = [];
                        for (let j = 0; j < inner.length; j++) {
                            if (
                                inner[j].handles &&
                                inner[j].handles.start &&
                                inner[j].handles.end
                            ) {
                                let points = [];
                                const h =
                                    (inner[j].handles.start.x + inner[j].handles.end.x) / 2;
                                const k =
                                    (inner[j].handles.start.y + inner[j].handles.end.y) / 2;
                                const a = inner[j].handles.start.x - h;
                                const b = inner[j].handles.start.y - k;
                                const minDistance = 0.5;
                                let theta = 0;
                                let deltaTheta = 0.18;

                                let xPrev = h + a * Math.cos(theta);
                                let yPrev = k + b * Math.sin(theta);
                                points.push({ x: xPrev, y: yPrev });

                                while (theta <= 2 * Math.PI) {
                                    const x = h + a * Math.cos(theta);
                                    const y = k + b * Math.sin(theta);
                                    const distance = Math.sqrt(
                                        (x - xPrev) ** 2 + (y - yPrev) ** 2
                                    );

                                    if (distance >= minDistance) {
                                        points.push({ x, y });
                                        xPrev = x;
                                        yPrev = y;
                                    }
                                    theta += deltaTheta;
                                }
                                allAnnotations[imageId][keys[i]].push(points);
                                lmao[imageId].push(points);
                            }
                        }
                    } else {
                        allAnnotations[imageId][keys[i]] = [];
                        for (let j = 0; j < inner.length; j++) {
                            if (
                                inner[j].handles &&
                                inner[j].handles.start &&
                                inner[j].handles.end
                            ) {
                                allAnnotations[imageId][keys[i]].push({
                                    x1: inner[j].handles.start.x,
                                    y1: inner[j].handles.start.y,
                                    x2: inner[j].handles.end.x,
                                    y2: inner[j].handles.end.y,
                                });
                                lmao[imageId].push(
                                    getPoints(
                                        keys[i],
                                        inner[j].handles.start.x,
                                        inner[j].handles.start.y,
                                        inner[j].handles.end.x,
                                        inner[j].handles.end.y
                                    )
                                );
                            }
                        }
                    }
                }
            } else {
                lmao[imageId] = [];
            }
        });
        coords.current[0] = lmao;
        editedOnly.current = [];
        for (let i = 0; i < imagesLOL.current.length; i++) {
            if (coords.current[0][`dicomfile:${i}`] && coords.current[0][`dicomfile:${i}`].length != 0) {
                if (editedOnly.current.indexOf(i) == -1) {
                    editedOnly.current.push(i);
                }
            }
        }
        return JSON.stringify(allAnnotations, null, 2);
    }
    const getAnglePoints = (x1, y1, x2, y2, x3, y3) => {
        let lool = [];
        const addUniquePoint = (x, y) => {
            if (!lool.some((point) => point.x === x && point.y === y)) {
                lool.push({ x, y });
            }
        };
        const addLinePoints = (xStart, yStart, xEnd, yEnd, step = 1) => {
            const dx = xEnd - xStart;
            const dy = yEnd - yStart;
            const steps = Math.max(Math.abs(dx), Math.abs(dy));
            if (steps === 0) {
                addUniquePoint(xStart, yStart);
                return;
            }
            for (let i = 0; i <= steps; i++) {
                const x = xStart + (dx * i) / steps;
                const y = yStart + (dy * i) / steps;
                addUniquePoint(Math.round(x), Math.round(y));
            }
        };
        addLinePoints(x1, y1, x2, y2);
        addLinePoints(x2, y2, x3, y3);
        return lool;
    };
    const getPoints = (name, x1, y1, x2, y2) => {
        let lool = [];
        if (name === "RectangleRoi") {
            const minX = Math.min(x1, x2);
            const maxX = Math.max(x1, x2);
            const minY = Math.min(y1, y2);
            const maxY = Math.max(y1, y2);
            for (let x = minX; x <= maxX; x += 1) lool.push({ x, y: minY });
            for (let y = minY + 1; y <= maxY; y += 1) lool.push({ x: maxX, y });
            for (let x = maxX - 1; x >= minX; x -= 1) lool.push({ x, y: maxY });
            for (let y = maxY - 1; y > minY; y -= 1) lool.push({ x: minX, y });
        } else if (name === "Length") {
            const dx = x2 - x1;
            const dy = y2 - y1;
            const steps = Math.max(Math.abs(dx), Math.abs(dy));
            if (steps === 0) {
                lool.push({ x: x1, y: y1 });
                return lool;
            }
            for (let i = 0; i <= steps; i++) {
                const x = x1 + (dx * i) / steps;
                const y = y1 + (dy * i) / steps;
                lool.push({ x, y });
            }
        }
        return lool;
    };


    const calculateDistance = (x1, y1, x2, y2) => {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    };

    const calculateAngle = (x1, y1, x2, y2, x3, y3) => {
        const a = calculateDistance(x2, y2, x3, y3);
        const b = calculateDistance(x1, y1, x3, y3);
        const c = calculateDistance(x1, y1, x2, y2);
        const angle = Math.acos((c ** 2 + a ** 2 - b ** 2) / (2 * c * a));
        return (angle * 180) / Math.PI;
    };

    const calculatePolygonArea = (points) => {
        let area = 0;
        const n = points.length;
        for (let i = 0; i < n; i++) {
            const j = (i + 1) % n;
            area += points[i].x * points[j].y;
            area -= points[j].x * points[i].y;
        }
        return Math.abs(area / 2);
    };

    const calculatePerimeter = (points) => {
        let perimeter = 0;
        const n = points.length;
        for (let i = 0; i < n; i++) {
            const j = (i + 1) % n;
            perimeter += calculateDistance(points[i].x, points[i].y, points[j].x, points[j].y);
        }
        return perimeter;
    };

    // ... (calculateAngle, calculatePolygonArea)
    const saveAnnotations = async () => {
        try {
            const rawAnnotations = collectAllAnnotations(imagesLOL.current);
            const annotationsObj = typeof rawAnnotations === "string" ? JSON.parse(rawAnnotations) : rawAnnotations;
            const cleanAnnotationsJSON = JSON.stringify(annotationsObj, null, 2);
            setJsonobj(JSON.parse(cleanAnnotationsJSON));

            if (finalDirName) finalDirName = dirname;
            setErrorMessage("Annotations saved!");
            setShowErrorPopup(true);
        } catch (error) {
            console.error("Error in saveAnnotations:", error);
        } finally {
            setTimeout(() => setShowErrorPopup(false), 3000);
        }
    };
    const Next = () => {
        if (j + 1 < editedOnly.current.length) setJ(j + 1);
    };
    const Prev = () => {
        if (j - 1 >= 0) setJ(j - 1);
    };
    const handleGoBack = () => window.history.back();
    // --- END of collapsed functions ---


    const toggleTool = (toolName) => {
        if (activeTool === toolName) {
            // Deactivate the tool if it's already active
            if (toolName === 'Scroll') {
                setActiveTool("");
            } else {
                try { cornerstoneTools.setToolPassive(toolName); } catch (e) { }
                setActiveTool("");
            }
        } else {
            // Deactivate the old tool
            if (activeTool && activeTool !== 'Scroll') {
                try { cornerstoneTools.setToolPassive(activeTool); } catch (e) { }
            }

            // Activate the new tool
            if (toolName === 'Scroll') {
                setActiveTool('Scroll');
                // Deactivate other mouse-based tools
                try {
                    cornerstoneTools.setToolPassive('Zoom');
                    cornerstoneTools.setToolPassive('Pan');
                } catch (e) { }
            } else {
                setActiveTool(toolName);
                try {
                    cornerstoneTools.setToolActive(toolName, { mouseButtonMask: 1 });
                } catch (e) { }
            }
        }
    };

    /**
     * Handles the logic for the "Jump to Slide" feature.
     */
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
        setJumpToValue(""); // Clear input after jump
    };

    useEffect(() => {
        const loadImage = async () => {
            if (q1.current && editedOnly.current.length > 0 && editedOnly.current[j] !== undefined) {
                cornerstone.enable(q1.current);
                try {
                    const img = await cornerstone.loadImage(`dicomfile:${editedOnly.current[j]}`);
                    cornerstone.displayImage(q1.current, img);

                    if (q2.current) {
                        q2.current.innerHTML = "";
                        const canvasToShow = finalMasks.current[editedOnly.current[j]];
                        if (canvasToShow instanceof HTMLCanvasElement) {
                            const clonedCanvas = canvasToShow.cloneNode(true);
                            clonedCanvas.getContext('2d').drawImage(canvasToShow, 0, 0);
                            q2.current.appendChild(clonedCanvas);
                        }
                    }
                } catch (error) {
                    console.error("Error displaying summary image:", error);
                }
            }
        };

        if (open) loadImage();
    }, [open, j, q1.current]);


    const isToolbarDisabled = viewMode === 'MPR';

    return (
        <div className="bg-[#0A0A23] min-h-screen w-full flex flex-col text-white">
            {/* Navbar */}
            <nav className="bg-black/30 backdrop-blur-sm shadow-md px-4 py-3 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <img src={DClogo} alt="Logo" className="h-12" />
                    <Link
                        to="Hero"
                        smooth={true}
                        duration={500}
                        className="text-xl font-bold cursor-pointer hover:text-gray-300 flex items-center"
                    >
                        R.<span className="text-red-600">AI</span>.DIOLOGY
                    </Link>
                </div>
                <Button color="red" size="sm" onClick={handleGoBack}>Back</Button>
            </nav>

            {/* Toolbar */}
            <div className={`bg-[#111827] border-b border-gray-700 px-4 py-3 flex flex-wrap justify-center md:justify-between items-center gap-4 ${isToolbarDisabled ? 'opacity-50' : ''}`}>
                {/* Navigation Section */}
                <div className="flex flex-wrap gap-2 text-white text-sm">
                    <div className="w-full font-semibold mb-2">Navigation</div>
                    <ToolButton
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"> <path strokeLinecap="round" strokeLinejoin="round" d="M8 7l4-4m0 0l4 4m-4-4v18m0-18l-4 4m4-4l4 4" /> <path strokeLinecap="round" strokeLinejoin="round" d="M8 17l4 4m0 0l4-4m-4 4V1m0 18l-4-4m4 4l4-4" /> </svg>}
                        label="Scroll"
                        onClick={() => toggleTool('Scroll')}
                        isActive={activeTool === 'Scroll'}
                        disabled={isToolbarDisabled}
                    />
                    <ToolButton
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"> <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /> </svg>}
                        label="Zoom"
                        onClick={() => toggleTool('Zoom')}
                        isActive={activeTool === 'Zoom'}
                        disabled={isToolbarDisabled}
                    />
                    <ToolButton
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"> <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4h4m12 4V4h-4M4 16v4h4m12-4v4h-4M9 12l-4 4m14-4l-4-4m-6 0l4-4m-4 4l-4-4m4 4l4 4" /> </svg>}
                        label="Pan"
                        onClick={() => toggleTool('Pan')}
                        isActive={activeTool === 'Pan'}
                        disabled={isToolbarDisabled}
                    />
                    <div className="flex items-center gap-2 mt-1">
                        <input
                            type="number"
                            placeholder={`Slide ${currentImageIndex + 1}/${totalImages}`}
                            value={jumpToValue}
                            onChange={(e) => setJumpToValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleJumpToSlide()}
                            disabled={!imageLoaded || isToolbarDisabled}
                            className="w-28 h-9 px-2 py-1 text-sm text-black bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                        />

                        <Button
                            size="sm"
                            onClick={handleJumpToSlide}
                            disabled={!jumpToValue || !imageLoaded || isToolbarDisabled}
                        >
                            Jump
                        </Button>
                    </div>

                </div>

                {/* Annotations Section */}
                <div className="flex flex-wrap gap-2 mt-4">
                    <div className="w-full text-white text-sm font-semibold mb-2">Annotations</div>
                    <ToolButton
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12h18M12 3v18" /></svg>}
                        label="Probe"
                        onClick={() => toggleTool('Probe')}
                        isActive={activeTool === 'Probe'}
                        disabled={isToolbarDisabled}
                    />
                    <ToolButton
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 18h10M3 6h18M3 12h18" /><path d="M4 6v12m16-12v12" /></svg>}
                        label="Length"
                        onClick={() => toggleTool('Length')}
                        isActive={activeTool === 'Length'}
                        disabled={isToolbarDisabled}
                    />
                    <ToolButton
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 4v16M4 9h16" /><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /></svg>}
                        label="Rectangle"
                        onClick={() => toggleTool('RectangleRoi')}
                        isActive={activeTool === 'RectangleRoi'}
                        disabled={isToolbarDisabled}
                    />
                    <ToolButton
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /></svg>}
                        label="Ellipse"
                        onClick={() => toggleTool('EllipticalRoi')}
                        isActive={activeTool === 'EllipticalRoi'}
                        disabled={isToolbarDisabled}
                    />
                    <ToolButton
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" /></svg>}
                        label="Freehand"
                        onClick={() => toggleTool('FreehandRoi')}
                        isActive={activeTool === 'FreehandRoi'}
                        disabled={isToolbarDisabled}
                    />
                    <ToolButton
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>}
                        label="Eraser"
                        onClick={() => toggleTool('Eraser')}
                        isActive={activeTool === 'Eraser'}
                        disabled={isToolbarDisabled}
                    />
                    <ToolButton
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3l-4-4z" /><circle cx="12" cy="13" r="3" /></svg>}
                        label="Save"
                        onClick={saveAnnotations}
                        isActive={false}
                        disabled={isToolbarDisabled}
                    />
                    <ToolButton
                        icon={
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3l-4-4z" />
                                <circle cx="12" cy="13" r="3" />
                            </svg>
                        }
                        label=" Show anno"
                        onClick={() => setAnnotationsEnabled(prev => !prev)}
                        isActive={annotationsEnabled}
                        disabled={isToolbarDisabled}
                    />

                </div>

                {/* Interaction Section */}
                <div className="flex flex-wrap gap-2 mt-4">
                    <div className="w-full text-white text-sm font-semibold mb-2">Interaction</div>
                    <ToolButton
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
                        label="WW/WC"
                        onClick={() => toggleTool('Wwwc')}
                        isActive={activeTool === 'Wwwc'}
                        disabled={isToolbarDisabled}
                    />
                    <ToolButton
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5" /><path strokeLinecap="round" strokeLinejoin="round" d="M4 4l7 7m9 9l-7-7" /></svg>}
                        label="Rotate"
                        onClick={() => toggleTool('Rotate')}
                        isActive={activeTool === 'Rotate'}
                        disabled={isToolbarDisabled}
                    />
                    <ToolButton
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" /></svg>}
                        label="Magnify"
                        onClick={() => toggleTool('Magnify')}
                        isActive={activeTool === 'Magnify'}
                        disabled={isToolbarDisabled}
                    />
                </div>

                {/* Viewer Mode Section */}
                <div className="flex flex-wrap gap-2 mt-4">
                    <div className="w-full text-white text-sm font-semibold mb-2">Viewer Mode</div>
                    <ToolButton
                        label="2D Viewer"
                        onClick={() => setViewMode('2D')}
                        isActive={viewMode === '2D'}
                        icon={<svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M4 4h16v16H4z" /></svg>}
                    />
                    <ToolButton
                        label="MPR Viewer"
                        onClick={handleMPRClick}
                        isActive={viewMode === 'MPR'}
                        icon={<svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l-10 6v8l10 6 10-6v-8l-10-6zm0 2.236L19.535 9 12 13.764 4.465 9 12 4.236zM3 10.09v6.82l8 4.8v-6.82L3 10.09zm18 0l-8 4.8v6.82l8-4.8v-6.82z" /></svg>}
                    />
                </div>
            </div>

            {/* Main Viewer and Annotation Section */}
            {viewMode === '2D' && (
                <div className={`w-full max-w-9xl flex flex-col lg:flex-row gap-6 p-6`}>
                    {/* Viewer */}
                    <div className={`${annotationsEnabled ? "lg:w-[75%]" : "w-full"} w-full h-[640px] bg-black rounded-2xl border-4 border-green-200 shadow-xl relative overflow-hidden transition-all duration-300`}>
                        <div ref={viewerRef} onContextMenu={(e) => e.preventDefault()} className="w-full h-full">
                            {!imageLoaded ? (
                                <div className="w-full h-full flex items-center justify-center">...</div>
                            ) : (
                                <div className="absolute bottom-2 right-2 bg-black/70 px-3 py-1 rounded text-sm text-white">
                                    {currentImageIndex + 1} / {totalImages}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Annotations Panel */}
                    {annotationsEnabled && (
                        <div className="lg:w-[25%] w-full h-[640px] bg-white rounded-2xl shadow-xl border border-gray-200 flex flex-col overflow-hidden transition-all duration-300">
                            <div className="px-4 py-3 border-b border-gray-300 bg-gray-50">
                                <h2 className="text-base font-semibold text-gray-700">Annotations</h2>
                            </div>
                            <div className="p-4 overflow-y-auto text-sm space-y-4 text-black">
                                {jsonobj?.[imagesLOL.current[currentImageIndex]] ? (
                                    Object.entries(jsonobj[imagesLOL.current[currentImageIndex]]).map(([tool, entries]) => (
                                        <div key={tool}>
                                            <h3 className="font-semibold text-gray-800 mb-1">{tool}</h3>
                                            {entries.map((entry, idx) => {
                                                let label = "";

                                                if (tool === "Length" && entry.x1 !== undefined) {
                                                    label = `Length: ${calculateDistance(entry.x1, entry.y1, entry.x2, entry.y2).toFixed(1)} px`;
                                                } else if (tool === "Angle" && entry.x1 !== undefined) {
                                                    label = `Angle: ${calculateAngle(entry.x1, entry.y1, entry.x2, entry.y2, entry.x3, entry.y3).toFixed(1)}°`;
                                                } else if (tool === "RectangleRoi" && entry.x1 !== undefined) {
                                                    const width = Math.abs(entry.x2 - entry.x1);
                                                    const height = Math.abs(entry.y2 - entry.y1);
                                                    label = `W × H: ${width.toFixed(1)} × ${height.toFixed(1)} px`;
                                                } else if ((tool === "FreehandRoi" || tool === "EllipticalRoi") && Array.isArray(entry)) {
                                                    const area = calculatePolygonArea(entry).toFixed(1);
                                                    const perimeter = calculatePerimeter(entry).toFixed(1);
                                                    label = `Area: ${area} px², Perimeter: ${perimeter} px`;
                                                } else if (tool === "Probe" && entry.x !== undefined) {
                                                    label = `X: ${entry.x.toFixed(1)}, Y: ${entry.y.toFixed(1)}`;
                                                } else {
                                                    label = `Annotation ${idx + 1}`;
                                                }

                                                return (
                                                    <div key={idx} className="ml-2 text-gray-600">
                                                        - {label}
                                                    </div>
                                                );
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

            )}



            {viewMode === 'MPR' && (
                <PapayaViewer
                    doctorName={doctorName}
                    datasetName={datasetName}
                    fileName={fileName}
                />
            )}
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
                        <h2 className="text-black text-lg font-semibold">Image: {editedOnly.current[j] + 1}</h2>
                        <Button size="lg" onClick={Next}>Next</Button>
                    </div>
                </DialogBody>
                <DialogFooter>
                    <Button variant="text" color="red" onClick={handleOpen}>Close</Button>
                </DialogFooter>
            </Dialog>

            {showErrorPopup && (
                <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-green-500 text-white p-4 rounded-md shadow-lg z-50">
                    {errorMessage}
                </div>
            )}
        </div>
    );
};

export default Dcmvi;





