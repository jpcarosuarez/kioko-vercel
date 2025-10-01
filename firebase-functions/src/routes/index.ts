/**
 * Main API Router
 * Consolidates all routes into a single Express application
 */

import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { specs } from "../config/swagger";
import { authRouter } from "./auth";
import { validationRouter } from "./validation";
import { maintenanceRouter } from "./maintenance";
import { notificationRouter } from "./notifications";

const app = express();

// Middleware
app.use(cors({ 
  origin: [
    'https://kioko-vercel-snss.vercel.app',
    'https://kioko-vercel.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());

/**
 * @swagger
 * /:
 *   get:
 *     summary: API Health Check
 *     description: Check if the API is running and get basic information
 *     tags: [System]
 *     responses:
 *       200:
 *         description: API is running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "ok"
 *                 message:
 *                   type: string
 *                   example: "Kiosko Inmobiliario API is running"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 *                 documentation:
 *                   type: string
 *                   example: "/docs"
 */
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "Kiosko Inmobiliario API is running",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    documentation: "/docs"
  });
});

// Swagger Documentation
app.use("/docs", swaggerUi.serve, swaggerUi.setup(specs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "Kiosko Inmobiliario API Documentation",
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: "none",
    filter: true,
    showExtensions: true,
    showCommonExtensions: true
  }
}));

// Swagger JSON endpoint
app.get("/docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(specs);
});

// Route handlers
app.use("/auth", authRouter);
app.use("/validation", validationRouter);
app.use("/maintenance", maintenanceRouter);
app.use("/notifications", notificationRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Endpoint not found",
    path: req.originalUrl,
    method: req.method
  });
});

// Error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("API Error:", error);
  res.status(500).json({
    error: "Internal server error",
    message: error.message
  });
});

export { app };