import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.js';
import routineRoutes from './routes/routines.js';
import completionRoutes from './routes/completions.js';
import templateRoutes from './routes/templates.js';
import gamificationRoutes from './routes/gamification.js';
import feedbackRoutes from './routes/feedback.js';
import { errorHandler } from './middleware/errorHandler.js';
import { startDailyResetJob } from './jobs/dailyReset.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map(s => s.trim());
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/routines', routineRoutes);
app.use('/api/completions', completionRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/feedback', feedbackRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`RoutineForge server running on http://localhost:${PORT}`);
  startDailyResetJob();
}).on('error', (err) => {
  console.error('Server failed to start:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
});
