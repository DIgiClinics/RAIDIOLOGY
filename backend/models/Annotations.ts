import mongoose from 'mongoose';

const AnnotationEntrySchema = new mongoose.Schema({
  fileURL: { type: String, required: true },
  data: { type: Object, required: true }
}, { _id: false });

const AnnotationSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, unique: true },
    doctorName: { type: String, required: true },
    annotations: { type: [AnnotationEntrySchema], default: [] }
  },
  { timestamps: true }
);

export default mongoose.model<any>('Annotation', AnnotationSchema);
