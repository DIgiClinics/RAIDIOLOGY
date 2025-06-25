const mongoose = require("mongoose");

// Define the Counter Schema
const counterSchema = new mongoose.Schema({
  model: { type: String, required: true, unique: true }, // The model name (e.g., "Doctor")
  seq: { type: Number, default: 0 }, // The sequence number for auto-incrementing
});

// Counter Model
const Counter = mongoose.model("Counter", counterSchema);

module.exports = Counter;
