import Session from '../models/Session';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

// Start a new session
export const startSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      mrn,
      patientName,
      age,
      gender,
      consultingDoctor,
      symptoms,
      admissionDate,
      files = []
    } = req.body;

    if (!mrn || !patientName || !consultingDoctor || !symptoms || !admissionDate) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const sessionId = uuidv4();
    const now = new Date();

    const session = await Session.create({
      sessionId,
      mrn,
      patientName,
      age,
      gender,
      consultingDoctor,
      symptoms,
      admissionDate: new Date(admissionDate),
      files,
      startTime: now,
      lastActive: now,
      totalDuration: 0,
      ip: req.ip || req.headers['x-forwarded-for'] || '',
      userAgent: req.headers['user-agent'] || '',
      ended: false
    });

    res.status(201).json({ sessionId });
  } catch (err) {
    console.error('Error starting session:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update session (update lastActive and totalDuration)
export const updateSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      res.status(400).json({ error: 'Missing sessionId' });
      return;
    }

    const session = await Session.findOne({ sessionId });
    if (!session || !session.lastActive || typeof session.totalDuration !== 'number') {
      res.status(404).json({ error: 'Session not found or corrupted' });
      return;
    }

    const now = new Date();
    const duration = (now.getTime() - new Date(session.lastActive).getTime()) / 1000;

    session.lastActive = now;
    session.totalDuration += duration;

    await session.save();
    res.json({ updated: true });
  } catch (err) {
    console.error('Error updating session:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// End session
export const endSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      res.status(400).json({ error: 'sessionId required' });
      return;
    }

    const session = await Session.findOneAndUpdate(
      { sessionId },
      { ended: true, lastActive: new Date() },
      { new: true }
    );

    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    res.json({ ended: true });
  } catch (err) {
    console.error('Error ending session:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};


// Get all file URLs for a specific session
export const getFileURLsBySessionId = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      res.status(400).json({ error: 'sessionId is required' });
      return;
    }

    const session = await Session.findOne({ sessionId }, 'files');
    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    const fileURLs = session.files.map((file: any) => file.fileURL);
    res.status(200).json({ fileURLs });
  } catch (err) {
    console.error('Error fetching file URLs:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};


