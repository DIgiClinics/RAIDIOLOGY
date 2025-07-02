const express = require("express");
const serveIndex = require("serve-index");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const archiver = require("archiver");
const multer = require("multer");

const upload = multer({ storage: multer.memoryStorage() });
const app = express();
const port = 8003;
const baseDirectory = path.join(__dirname, "/dicom");

const corsOptions = {
  origin: "*",
  methods: "*",
  credentials: true,
  allowedHeaders: "*",
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Utils
function getDoctorPath(doctorName) {
  return path.join(baseDirectory, sanitizeName(doctorName));
}

function getDatasetPath(doctorName, datasetName) {
  return path.join(getDoctorPath(doctorName), sanitizeName(datasetName));
}

function sanitizeName(name) {
  return name.replace(/[^a-zA-Z0-9]/g, "_");
}

// Routes

// Create doctor folder
app.post("/createFolder", (req, res) => {
  const { doctorName } = req.body;
  if (!doctorName) return res.status(400).json({ message: "Doctor name is required" });

  const folderPath = getDoctorPath(doctorName);
  if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath);

  res.status(201).json({ message: `Folder created for ${doctorName}` });
});

// Upload DICOM dataset
app.post("/uploadFolder", upload.array("dicomImages"), (req, res) => {
  const { doctorName, datasetName } = req.body;
  if (!doctorName || !datasetName || !req.files)
    return res.status(400).json({ message: "Missing required data" });

  const datasetPath = getDatasetPath(doctorName, datasetName);
  fs.mkdirSync(datasetPath, { recursive: true });

  try {
    req.files.forEach((file) => {
      const filePath = path.join(datasetPath, file.originalname);
      fs.writeFileSync(filePath, file.buffer);
    });

    res.status(201).json({
      message: "Files uploaded successfully",
      path: datasetPath,
    });
  } catch (error) {
    res.status(500).json({ message: "Error saving files", error: error.message });
  }
});

// Get all datasets for a doctor
app.get("/getFolders", (req, res) => {
  const { doctorName } = req.query;
  if (!doctorName) return res.status(400).json({ message: "Doctor name is required" });

  const folderPath = getDoctorPath(doctorName);
  if (!fs.existsSync(folderPath))
    return res.status(404).json({ message: "Doctor folder does not exist" });

  const datasets = fs
    .readdirSync(folderPath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  res.status(200).json(datasets);
});

// Get contents of a dataset
app.get("/getFolderContents", (req, res) => {
  const { doctorName, datasetName } = req.query;
  if (!doctorName || !datasetName)
    return res.status(400).json({ message: "Missing required data" });

  const folderPath = getDatasetPath(doctorName, datasetName);
  if (!fs.existsSync(folderPath))
    return res.status(404).json({ message: "Folder does not exist" });

  const files = fs.readdirSync(folderPath).map((file) => ({
    name: file,
    path: path.join(folderPath, file),
  }));

  res.status(200).json(files);
});

// Download dataset as zip
app.get("/downloadFolder/:doctorName/:datasetName", (req, res) => {
  const { doctorName, datasetName } = req.params;
  const datasetPath = getDatasetPath(doctorName, datasetName);

  if (!fs.existsSync(datasetPath)) {
    return res.status(404).json({ message: "Dataset not found" });
  }

  res.setHeader("Content-Type", "application/zip");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=${datasetName}.zip`
  );

  const zip = archiver("zip");
  zip.on("error", (err) => res.status(500).send("Zip error: " + err.message));
  zip.pipe(res);
  zip.directory(datasetPath, false);
  zip.finalize();
});

// Serve file from dataset
app.get("/getFile", (req, res) => {
  const { doctorName, datasetName, fileName } = req.query;
  if (!doctorName || !datasetName || !fileName)
    return res.status(400).json({ message: "Missing required data" });

  const filePath = path.join(getDatasetPath(doctorName, datasetName), fileName);
  if (!fs.existsSync(filePath))
    return res.status(404).json({ message: "File not found" });

  res.sendFile(filePath);
});



// Delete dataset
app.delete("/deleteFolder", (req, res) => {
  const { doctorName, datasetName } = req.body;
  if (!doctorName || !datasetName)
    return res.status(400).json({ message: "Missing required data" });

  const datasetPath = getDatasetPath(doctorName, datasetName);
  if (!fs.existsSync(datasetPath))
    return res.status(404).json({ message: "Folder not found" });

  try {
    fs.rmSync(datasetPath, { recursive: true, force: true });
    res.status(200).json({ message: "Folder deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete folder", error: err.message });
  }
});

// Serve static directory listing for debugging
app.use(
  "/files",
  express.static(baseDirectory),
  serveIndex(baseDirectory, { icons: true })
);





app.use("/nifti", express.static(path.join(__dirname, "nifti")));



// Start server
app.listen(port, () => {
  console.log(`File server running at http://localhost:${port}/`);
});
