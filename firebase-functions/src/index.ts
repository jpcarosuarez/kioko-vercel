/**
 * Firebase Cloud Functions Entry Point
 * TypeScript implementation for Kiosko Inmobiliario Document Management System
 */

import { initializeApp } from "firebase-admin/app";
import { onRequest } from "firebase-functions/v2/https";
import { app } from "./routes";

// Initialize Firebase Admin
initializeApp();

// Main API endpoint - consolidates all routes
export const api = onRequest({
  region: "us-central1",
  memory: "256MiB",
  timeoutSeconds: 60,
  maxInstances: 10,
}, app);

// Keep user lifecycle triggers as separate functions (they need to be triggers, not HTTP endpoints)
export {
  onUserCreated,
  onUserDeleted,
} from "./triggers/userLifecycle";