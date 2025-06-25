const mongoose = require("mongoose");
const Counter = require("./Counter"); // Make sure this is the correct path to the Counter model

// Define User Schema
const userSchema = new mongoose.Schema({
  _id: { type: Number }, // Use Number instead of ObjectId
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ["Admin", "Radiologist", "AI Engineer"], // Only these 3 roles allowed
  },
});

// Pre-save Hook to Auto-Increment `_id`
userSchema.pre("save", async function (next) {
  if (!this.isNew) {
    return next(); // Only auto-increment for new documents
  }
  try {
    const counter = await Counter.findOneAndUpdate(
      { model: "User" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this._id = counter.seq;
    next();
  } catch (err) {
    next(err);
  }
});

const User = mongoose.model("User", userSchema);

module.exports = User;
