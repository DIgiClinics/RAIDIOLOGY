const mongoose = require("mongoose");
const Counter = require("./Counter"); // Make sure this is the correct path to the Counter model

// Define Doctors Schema
const doctorSchema = new mongoose.Schema({
  _id: { type: Number }, // Use Number for auto-incrementing ID
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: {
    type: String,
    enum: ["Radiologist"], // Only Radiologist role should be stored here
    required: true,
  },
  // Add any additional fields if necessary for the doctor
  specialization: { type: String }, // Example: specialization for the doctor
  contact: { type: String }, // Example: contact number for the doctor
});

// Pre-save Hook for Auto-Incrementing `_id`
doctorSchema.pre("save", async function (next) {
  if (!this.isNew) {
    return next(); // Only auto-increment for new documents
  }

  try {
    // Find and update the counter for Doctors model
    const counter = await Counter.findOneAndUpdate(
      { model: "Doctor" }, // Specify that this counter is for "Doctor"
      { $inc: { seq: 1 } }, // Increment the seq value by 1
      { new: true, upsert: true } // If no counter, create a new one
    );

    // Assign the new incremented ID to the doctor document
    this._id = counter.seq;
    next(); // Proceed with saving the doctor document
  } catch (err) {
    next(err); // Pass any error to the next middleware
  }
});

const Doctor = mongoose.model("Doctor", doctorSchema);

module.exports = Doctor;
