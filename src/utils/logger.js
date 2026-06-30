// ============================================================================
// logger.js — Centralised Logging Utility (Winston)
// ============================================================================
//
// Provides a single, shared Winston logger instance for the entire application.
// All components (load balancer, backend servers, middleware, schedulers) use
// child loggers created via `createLogger(label)` so every log line is
// tagged with the component that produced it.
//
// Two output destinations (transports):
//   1. Console — human-readable, colorized output for development
//   2. Log files — structured JSON for production analysis / parsing
//      • logs/error.log   → only error-level messages
//      • logs/combined.log → all messages at LOG_LEVEL and above
//
// Log level is controlled by the LOG_LEVEL environment variable (default: "info").
// Winston levels (from most to least severe):
//   error → warn → info → http → verbose → debug → silly
// ============================================================================

import winston from "winston";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

// Resolve the directory of this file so we can build a relative path to /logs.
// In ES modules, __dirname isn't available natively — we derive it from
// import.meta.url, which gives us the file:// URL of the current module.
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Log files are stored in a /logs directory at the project root (../../ from here).
const LOG_DIR = path.join(__dirname, "..", "..", "logs");

// Configurable log level: "info" captures info, warn, and error messages.
// Set to "debug" in .env for more verbose output during development.
const LOG_LEVEL = process.env.LOG_LEVEL || "info";

// Destructure Winston format helpers for cleaner usage below.
const { combine, timestamp, printf, colorize, errors, json } = winston.format;

// ── Console Format ──────────────────────────────────────────────────────────
// Human-readable, colorized format for terminal output.
// Example output: "2026-06-30 10:00:00 info: [LOAD BALANCER] Running on port 3000"
const consoleFormat = combine(
    colorize(),                                     // Add ANSI color codes based on level
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),  // Readable timestamp
    errors({ stack: true }),                        // Print stack traces for Error objects
    printf(({ level, message, timestamp, label, stack }) => {
        // If a label was provided via child logger, include it in brackets
        const tag = label ? `[${label}] ` : "";
        // Use the stack trace if available (for errors), otherwise use message
        return `${timestamp} ${level}: ${tag}${stack || message}`;
    })
);

// ── File Format ─────────────────────────────────────────────────────────────
// Structured JSON format for log files — easy to grep, parse, or ship to
// a log aggregation service (e.g. ELK stack, Datadog, Loki).
const fileFormat = combine(
    timestamp(),              // ISO 8601 timestamp
    errors({ stack: true }),  // Include stack traces in the JSON output
    json()                    // Output each log entry as a single JSON line
);

// ── Winston Logger Instance ─────────────────────────────────────────────────
const logger = winston.createLogger({
    level: LOG_LEVEL,
    transports: [
        // Console transport: colorized, human-readable output
        new winston.transports.Console({ format: consoleFormat }),

        // Error log file: only captures error-level messages
        new winston.transports.File({
            filename: path.join(LOG_DIR, "error.log"),
            level: "error",
            format: fileFormat,
        }),

        // Combined log file: captures all messages at LOG_LEVEL and above
        new winston.transports.File({
            filename: path.join(LOG_DIR, "combined.log"),
            format: fileFormat,
        }),
    ],
});

/**
 * Returns a child logger that tags every entry with the given label,
 * e.g. createLogger("SERVER 1").info("started") → "[SERVER 1] started".
 *
 * Using child loggers instead of a global logger ensures that every
 * component's output is clearly identifiable without passing the label
 * on every single log call.
 *
 * @param {string} label - Component name to include in log messages.
 * @returns {winston.Logger} A child logger instance.
 */
export function createLogger(label) {
    return logger.child({ label });
}

export default logger;
