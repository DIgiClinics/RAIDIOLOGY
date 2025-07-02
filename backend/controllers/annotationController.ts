import Annotation from "../models/Annotations";
import { Request, Response } from "express";

export const saveAnnotation = async (req: Request, res: Response) => {
  const { sessionId, fileURL, doctorName, data } = req.body;

  await Annotation.create({
    sessionId,
    fileURL,
    doctorName,
    data
  });

  res.json({ success: true });
};

export const getAnnotations = async (req: Request, res: Response) => {
  const { sessionId } = req.params;
  const annotations = await Annotation.find({ sessionId });
  res.json(annotations);
};
