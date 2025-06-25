const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const authRoutes = require("./Routes/authRoutes");
const app = express();

const gridfsStream = require("gridfs-stream");
const fs = require("fs");
const path = require("path");
require('dotenv').config();
// Middleware to parse JSON and handle CORS
app.use(express.json());
const corsOptions = {
  origin: [process.env.FRONTEND_URL, "http://localhost:3005"],
  methods: 'GET, POST, PUT, DELETE',
  credentials: true,
  allowedHeaders: 'Content-Type, Authorization',
};
app.use(cors(corsOptions));
app.use("/auth", authRoutes);
// MongoDB connection
const dbURI = process.env.mongodb_uri;

mongoose
  .connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB!"))
  .catch((err) => console.log("Failed to connect to MongoDB:", err));

const connection = mongoose.connection;
let gfs;
connection.once("open", () => {
  gfs = gridfsStream(connection.db, mongoose.mongo);
  gfs.collection("dicomFiles");
});
// Example route

app.get("/api/status", (req, res) => {
  res.json({
    mongoConnected: mongoose.connection.readyState === 1,
    gfsInitialized: !!gfs,
  });
});

app.get("/", (req, res) => {
  res.send("Hello from the backend!");
});

app.listen(process.env.PORT, "0.0.0.0", () => {
  console.log(`Server is running on http://localhost:${process.env.PORT}`);
});
