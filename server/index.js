import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";
import userRouter from "./routes/user-route.js";
import authRouter from "./routes/auth-route.js";
import landRouter from "./routes/land-route.js";
import transactionRouter from "./routes/transaction-route.js";
import messageRouter from "./routes/message-route.js";
import reportRouter from "./routes/report-route.js";
import verificationRouter from "./routes/verification-route.js";
import notificationRouter from "./routes/notification-route.js";
import dashboardRouter from "./routes/dashboard-route.js";
import auditLogRouter from "./routes/audit-log-route.js";
import adminRouter from "./routes/admin-route.js";
import errorMiddleware from "./middlewares/error-Middleware.js";
import cookieParser from "cookie-parser";
import { sanitizeInput } from "./middlewares/validation-middleware.js";
import { handleFileCleanup } from "./middlewares/upload-middleware.js";
import { ensureSuperAdmin } from "./utils/admin-setup.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "https://api.mapbox.com", "https://nominatim.openstreetmap.org"],
    },
  },
}));

// Rate limiting (High limit for demo/development)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100000, // Very high limit for demo purposes
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  }
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Input sanitization
app.use(sanitizeInput);

// File cleanup middleware
app.use(handleFileCleanup);

// Serve local uploads (fallback when Firebase is not configured)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API routes
app.use("/api/user", userRouter);
app.use("/api/auth", authRouter);
app.use("/api/land", landRouter);
app.use("/api/transaction", transactionRouter);
app.use("/api/message", messageRouter);
app.use("/api/reports", reportRouter);
app.use("/api/verification", verificationRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/audit-logs", auditLogRouter);
app.use("/api/admin", adminRouter);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "LandSolutions API is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API documentation endpoint
app.get("/api/docs", (req, res) => {
  res.status(200).json({
    success: true,
    message: "LandSolutions API Documentation",
    version: "1.0.0",
    endpoints: {
      auth: {
        "POST /api/auth/register": "Register new user",
        "POST /api/auth/login": "User login",
        "POST /api/auth/logout": "User logout",
        "POST /api/auth/forgot-password": "Request password reset",
        "POST /api/auth/reset-password": "Reset password"
      },
      user: {
        "GET /api/user/profile": "Get user profile",
        "PUT /api/user/profile": "Update user profile",
        "POST /api/user/verify": "Submit verification documents",
        "GET /api/user/notifications": "Get user notifications"
      },
      land: {
        "GET /api/land": "Get land listings with filters",
        "POST /api/land": "Create new land listing",
        "GET /api/land/:landId": "Get specific land details",
        "PUT /api/land/:landId": "Update land listing",
        "POST /api/land/:landId/verify": "Verify land ownership",
        "POST /api/land/:landId/flag": "Flag land as suspicious",
        "GET /api/land/analytics": "Get land analytics (admin only)"
      }
    }
  });
});

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Error handling middleware
app.use(errorMiddleware);

const dbConnect = async () => {
  const uri = process.env.MONGODB_URI; // ✅ local MongoDB

  if (!uri) {
    throw new Error("MONGODB_URI is missing in .env");
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 2,
      maxIdleTimeMS: 30000,
    });

    console.log("✅ Database Connection Successful.");
    
    // Ensure Super Admin exists
    await ensureSuperAdmin();

    // Optional: helpful connection logs
    mongoose.connection.on("disconnected", () => {
      console.log("⚠️ MongoDB disconnected");
    });
    mongoose.connection.on("error", (err) => {
      console.log("❌ MongoDB runtime error:", err);
    });
  } catch (err) {
    console.log("❌ Database Connection Failed.");
    console.error(err);
    throw err; // let caller decide whether to continue
  }
};

const startServer = async () => {
  dotenv.config(); // Ensure dotenv is loaded before reading vars
  const port = Number(process.env.PORT) || 5005; 
  const allowNoDb = process.env.ALLOW_NO_DB === "true";
  
  console.log(`🔍 Environment Check:`);
  console.log(`   - PORT: ${port}`);
  console.log(`   - JWT_SECRET_KEY: ${process.env.JWT_SECRET_KEY ? 'Configured ✅' : 'MISSING ❌'}`);
  
  if (!process.env.JWT_SECRET_KEY) {
    console.error("🛑 FATAL: JWT_SECRET_KEY is not configured in .env");
    process.exit(1);
  }

  // ✅ Prefer connecting before listening
  try {
    await dbConnect();
  } catch (err) {
    if (!allowNoDb) {
      console.log("🛑 Exiting because database is required. Set ALLOW_NO_DB=true to bypass.");
      process.exit(1);
    }
    console.log("🔧 Continuing without database (ALLOW_NO_DB=true). Some features will not work.");
  }

  app.listen(port, () => {
    console.log(`🚀 Server is running on port ${port}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
    console.log(`💚 Health Check: http://localhost:${port}/api/health`);
  });
};

// Graceful shutdown — Mongoose v8 uses promise-based close(), no callback
const gracefulShutdown = async (signal) => {
  console.log(`${signal} received, shutting down gracefully`);
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  } catch (err) {
    console.error('Error closing MongoDB connection:', err.message);
  } finally {
    process.exit(0);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT',  () => gracefulShutdown('SIGINT'));

startServer().catch((err) => {
  console.error("❌ Fatal startup error:", err);
  process.exit(1);
});
