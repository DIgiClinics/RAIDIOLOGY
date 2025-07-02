import mongoose from 'mongoose';

const AnnotationSchema = new mongoose.Schema({
  sessionId: String,
  fileURL: String,
  doctorName: String,
  data: Object,
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Annotation", AnnotationSchema);
