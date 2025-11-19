// server/src/middleware/securityMiddleware.js
import helmet from "helmet";
import cors from "cors";
import mongoSanitize from "express-mongo-sanitize";

/**
 * Apply global security middlewares to the Express app
 * Call this once in your main server file (server.js / app.js)
 */
export const applySecurityMiddlewares = (app) => {
  /* ------------------------------------------
     1. Trust proxy (needed if behind nginx / heroku)
     ------------------------------------------ */
  app.set("trust proxy", 1);

  /* ------------------------------------------
     2. Helmet – secure HTTP headers
     ------------------------------------------ */
  app.use(
    helmet({
      crossOriginResourcePolicy: false, // allow images from your server
    })
  );

  /* ------------------------------------------
     3. CORS – restrict who can call your API
     ------------------------------------------ */
  const allowedOrigins = [
    process.env.FRONTEND_URL,           // e.g. https://smarttrack-plus.com
    "http://localhost:5173",            // Vite dev
    "http://localhost:3000",            // React dev
  ].filter(Boolean);

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow mobile apps / Postman with no Origin header
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }

        return callback(new Error("Not allowed by CORS"));
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "x-api-key",
        "x-requested-with",
      ],
    })
  );

  /* ------------------------------------------
     4. Body size limits
     ------------------------------------------ */
  app.use(
    (req, res, next) => {
      // If you already have express.json elsewhere, just add limit there
      next();
    }
  );

  // example if you want here:
  // import express from "express";
  // app.use(express.json({ limit: "1mb" }));
  // app.use(express.urlencoded({ extended: true, limit: "1mb" }));

  /* ------------------------------------------
     5. Prevent MongoDB injection
     ------------------------------------------ */
  app.use(
    mongoSanitize({
      replaceWith: "_",
    })
  );
};
