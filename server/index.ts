import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import compression from "compression";
import cookieParser from "cookie-parser";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import {
  applySecurityMiddleware,
  authRateLimiter,
  apiRateLimiter,
  errorHandler,
} from "./middleware/security";
import { setupWebSocket } from "./websocket";

// Validate required environment variables at startup
const REQUIRED_ENV_VARS = ["DATABASE_URL", "JWT_SECRET"];

function validateEnv(): void {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error(
      `FATAL: Missing required environment variables: ${missing.join(", ")}`
    );
    process.exit(1);
  }
}

validateEnv();

const app = express();
const httpServer = createServer(app);

app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Apply security middleware (CSP, CORS, rate limiting, etc.)
applySecurityMiddleware(app);

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

// Health check — must be before auth middleware
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Initialize WebSocket layer (attaches to httpServer)
setupWebSocket(httpServer);

(async () => {
  await registerRoutes(httpServer, app);

  // Use security error handler
  app.use(errorHandler);

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(port, () => {
    log(`serving on port ${port}`);
  });

  // Graceful shutdown handler
  function gracefulShutdown(signal: string): void {
    log(`${signal} received — shutting down gracefully`);
    httpServer.close(() => {
      log("HTTP server closed");
      process.exit(0);
    });

    // Force exit after 10 seconds if connections won't drain
    setTimeout(() => {
      log("Forcing shutdown after timeout");
      process.exit(1);
    }, 10_000).unref();
  }

  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));

  // Catch unhandled rejections so the process doesn't crash silently
  process.on("unhandledRejection", (reason) => {
    console.error("Unhandled rejection:", reason);
  });
})();
