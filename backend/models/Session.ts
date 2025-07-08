import mongoose, { Document, Schema } from 'mongoose';

interface FileEntry {
  fileName: string;
  fileType: string[];
  fileURL: string;
  remarks?: string;
}

export interface SessionDocument extends Document {
  sessionId: string;
  mrn: string;
  patientName: string;
  age: number;
  gender: string;
  consultingDoctor: string;
  symptoms: string;
  admissionDate: Date;
  files: FileEntry[];
  startTime: Date;
  lastActive: Date;
  totalDuration: number;
  ip: string;
  userAgent: string;
  ended: boolean;
  niftyFileNames: string[]; // ✅ Changed to array
}

const FileEntrySchema = new Schema<FileEntry>(
  {
    fileName: { type: String, required: true },
    fileType: { type: [String], required: true },
    fileURL: { type: String, required: true },
    remarks: { type: String }
  },
  { _id: false }
);

const SessionSchema = new Schema<SessionDocument>(
  {
    sessionId: { type: String, required: true, unique: true },
    mrn: { type: String, required: true },
    patientName: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String, required: true },
    consultingDoctor: { type: String, required: true },
    symptoms: { type: String, required: true },
    admissionDate: { type: Date, required: true },
    files: { type: [FileEntrySchema], required: true },
    startTime: { type: Date, required: true },
    lastActive: { type: Date, required: true },
    totalDuration: { type: Number, default: 0 },
    ip: { type: String },
    userAgent: { type: String },
    ended: { type: Boolean, default: false },
    niftyFileNames: { type: [String], default: [] } // ✅ New field as array
  },
  { timestamps: true }
);

export default mongoose.model<SessionDocument>('Session', SessionSchema);
