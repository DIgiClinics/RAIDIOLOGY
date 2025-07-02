import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';

import sessionRoutes from './routes/sessionRoutes';
import annotationRoutes from './routes/annotationRoutes';
import { setupSwagger } from './swagger';

dotenv.config();
const app = express();  

// ✅ Set allowed origin (your frontend domain)
const corsOptions = {
  origin: [
    'http://localhost:3006',
    'https://dicomviewer.digitalclinics.ai',
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
};

app.use(cors(corsOptions));

app.use(express.json());

app.use('/api/session', sessionRoutes);
app.use('/api/annotation', annotationRoutes);

setupSwagger(app); // Swagger at /api-docs

mongoose.connect(process.env.MONGO_URI!)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(process.env.PORT, () => console.log("Server running on port", process.env.PORT));
  })
  .catch(err => console.error(err));
