/**
 * @file index.ts
 * @description Main entry point for the backend server. Sets up Express,
 * standard middleware, and defines the API routing structure.
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import authRoutes from './routes/auth';
import examRoutes from './routes/exams';
import attemptRoutes from './routes/attempts';
import dashboardRoutes from './routes/annotator';
import adminRoutes from './routes/admin';

import { errorHandler } from './middleware/errorHandler';

const app = express();
const PORT = process.env.PORT || 1000;

/**
 * Standard Middleware Configuration
 * -------------------------------
 */

// Configure Cross-Origin Resource Sharing (CORS)
// Allows the frontend to interact with the backend from a different origin
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true, // Allows sending cookies and authorization headers
}));

// Parse incoming request bodies as JSON
app.use(express.json());

// Parse URL-encoded bodies (from forms)
app.use(express.urlencoded({ extended: true }));

/**
 * Health Endpoints
 * ----------------
 */

// Simple health check route to verify server status
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

/**
 * API Routes
 * ----------
 * Mounted under the /api prefix
 */

app.use('/api/auth', authRoutes);       // Authentication (Login, Register, Logout)
app.use('/api/exams', examRoutes);     // Exam management and retrieval
app.use('/api/attempts', attemptRoutes); // Tracking user test submissions
app.use('/api/annotator', dashboardRoutes); // User-specific statistics
app.use('/api/admin', adminRoutes);     // Administrative controls and reports

// Serve static files from the 'uploads' directory
app.use('/uploads', express.static('uploads'));


/**
 * Error Handling Logic
 * --------------------
 */

// Handle global application errors (any uncaught errors in routes)
app.use(errorHandler);

// Catch-all for undefined routes (404 Not Found)
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

/**
 * Server Lifecycle
 * ----------------
 */

// Start listening for incoming HTTP requests
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;

