import { Request, Response } from "express";
import Annotation from "../models/Annotations";

export const saveAnnotation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId, fileURL, doctorName, data } = req.body;

    if (!sessionId || !fileURL || !doctorName || !data) {
      res.status(400).json({ success: false, message: "Missing required fields" });
      return;
    }

    const session = await Annotation.findOne({ sessionId });

    if (session) {
      const index = session.annotations.findIndex((entry: any) => entry.fileURL === fileURL);

      if (index !== -1) {
        // Update existing file annotation
        session.annotations[index].data = data;
      } else {
        // Add new annotation
        session.annotations.push({ fileURL, data });
      }

      // doctorName stays same, no need to update
      await session.save();

      res.status(200).json({ success: true, message: "Annotation updated", annotation: session });
    } else {
      // Create new session document
      const newAnnotation = await Annotation.create({
        sessionId,
        doctorName,
        annotations: [{ fileURL, data }]
      });

      res.status(200).json({ success: true, message: "Annotation created", annotation: newAnnotation });
    }
  } catch (error) {
    console.error("❌ Error saving annotation:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
export const getAnnotations = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;

    const session = await Annotation.findOne({ sessionId });

    if (!session || !session.annotations || session.annotations.length === 0) {
      res.status(200).json({
        success: true,
        message: "No annotations found for this session.",
        annotations: [],
        doctorName: session?.doctorName || ""
      });
      return;
    }

    res.status(200).json({
      success: true,
      doctorName: session.doctorName,
      annotations: session.annotations
    });
  } catch (error) {
    console.error("❌ Error fetching annotations:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

