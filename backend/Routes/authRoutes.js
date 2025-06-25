// routes/authRoutes.js
const express = require("express");
const bcrypt = require("bcrypt");
const User = require("../Models/Users");
const Doctor = require("../Models/Doctors"); // Import Doctors model
const jwt = require("jsonwebtoken");
const router = express.Router();

const multer = require("multer"); // Add this line

// Set up multer for file uploads
const storage = multer.memoryStorage(); // Store files in memory as Buffers
const upload = multer({ storage: storage });

// Signup Route
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: "Email already exists!" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role,
    });

    // If user is a Radiologist, save to Doctors collection as well
    if (role === "Radiologist") {
      const doctor = new Doctor({
        name,
        email,
        role,
      });
      await doctor.save();
    }

    await user.save();

    res.status(201).json({
      message: "User created successfully!",
      user: { name, email, role },
    });
  } catch (error) {
    console.error("Error during signup:", error);
    res.status(500).json({ error: "Error signing up user!" });
  }
});

// Login Route
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found!" });

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ error: "Invalid credentials!" });
    // Generate a JWT token
    const token = jwt.sign(
      { email: user.email, role: user.role }, // Payload
      "your-secret-key", // Replace with a secure secret in .env
      { expiresIn: "5h" } // Token expiry
    );

    // Send back user data including role
    if (user.role == "Admin") {
      res.status(200).json({
        message: "Logged in successfully!",
        user: {
          identifier: user._id,
          name: user.name,
          email: user.email, // Include the email as well
          role: user.role,
        },
        token,
      });
    } else if (user.role == "Radiologist") {
      const dumb_B = await Doctor.findOne({ email });
      res.status(200).json({
        message: "Logged in successfully!",
        user: {
          identifier: dumb_B._id,
          name: user.name,
          email: user.email, // Include the email as well
          role: user.role,
        },
        token,
      });
    } else {
      res.status(200).json({
        message: "Logged in successfully!",
        user: {
          identifier: user._id,
          name: user.name,
          email: user.email, // Include the email as well
          role: user.role,
        },
        token,
      });
    }
  } catch (error) {
    res.status(500).json({ error: "Error logging in!" });
  }
});

router.get("/radiologists", async (req, res) => {
  try {
    const radiologists = await Doctor.find();
    res.status(200).json(radiologists);
  } catch (error) {
    console.error("Error fetching radiologists:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/doctor/:email", async (req, res) => {
  const { email } = req.params;

  try {
    const doctor = await Doctor.findOne({ email });

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    res.status(200).json(doctor);
  } catch (error) {
    console.error("Error fetching doctor information:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// router.post(
//   "/uploadDicomFolder",
//   upload.array("dicomImages", 500),
//   async (req, res) => {
//     const { docId, folderName } = req.body; // Get docId and folderName from the body
//     const files = req.files; // Get uploaded files
//     console.log(1);
//     if (!docId || !folderName || !files) {
//       return res.status(400).send("Missing required fields.");
//     }
//     console.log(2);
//     // Prepare DICOM images for MongoDB
//     const dicomImages = files.map((file) => ({
//       filename: file.originalname,
//       contentType: file.mimetype,
//       data: file.buffer, // Store DICOM data as Buffer
//     }));
//     console.log(3);
//     // Create the request document
//     const newRequest = new Request({
//       docId: parseInt(docId), // Ensure docId is a number
//       folderName: folderName,
//       dicomImages: dicomImages,
//     });
//     console.log(4);
//     try {
//       // Save the request document to MongoDB
//       const savedRequest = await newRequest.save();
//       res.status(200).send(savedRequest);
//     } catch (err) {
//       console.error("Error saving DICOM folder:", err);
//       res.status(500).send("Server Error.");
//     }
//   }
// );

module.exports = router;
