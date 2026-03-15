import "dotenv/config";
import express from "express";
import compression from "compression";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { registerRoutes } from "../server/routes";
import {
  applySecurityMiddleware,
  errorHandler,
} from "../server/middleware/security";

const app = express();

app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

applySecurityMiddleware(app);

// Register all API routes
const httpServer = createServer(app);
await registerRoutes(httpServer, app);

app.use(errorHandler);

export default app;
