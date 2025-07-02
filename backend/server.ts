import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';

import sessionRoutes from './routes/sessionRoutes';
import annotationRoutes from './routes/annotationRoutes';
import { setupSwagger } from './swagger'; // 👈 import

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/session', sessionRoutes);
app.use('/api/annotation', annotationRoutes);

setupSwagger(app); // 👈 enable Swagger at /api-docs

mongoose.connect(process.env.MONGO_URI!)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(process.env.PORT, () => console.log("Server running on port", process.env.PORT));
  })
  .catch(err => console.error(err));
