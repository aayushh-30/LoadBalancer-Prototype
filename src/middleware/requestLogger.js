// ============================================================================
// requestLogger.js — HTTP Request Logging Middleware
// ============================================================================
//
// Express middleware factory that creates a per-component request logger.
// When attached to a server (load balancer or backend), it records every
// HTTP request/response cycle with:
//   • HTTP method (GET, POST, etc.)
//   • Request path
//   • Response status code
//   • Latency in milliseconds (measured via high-resolution timer)
//
// Log levels are chosen based on the response status code:
//   • 5xx → error  (server-side failures)
//   • 4xx → warn   (client errors — bad requests, not found, etc.)
//   • 1xx–3xx → info (successful or redirected responses)
//
// Usage:
//   app.use(requestLogger("SERVER 1"));
// ============================================================================

import { createLogger } from "../utils/logger.js";

/**
 * Express middleware that logs every incoming request once a response
 * finishes, including the method, path, status code and latency.
 *
 * @param {string} label - tag identifying the server/component (e.g. "SERVER 1").
 */
export default function requestLogger(label) {
    // Create a child logger tagged with the component label so log
    // output clearly shows which server/component handled the request.
    const log = createLogger(label);

    return (req, res, next) => {
        // Capture the start time using nanosecond-precision timer.
        // process.hrtime.bigint() returns a BigInt of nanoseconds elapsed
        // since an arbitrary point, perfect for measuring durations.
        const start = process.hrtime.bigint();

        // Listen for the "finish" event on the response.
        // This fires after the response headers and body have been
        // fully sent to the client, giving us the complete round-trip time.
        res.on("finish", () => {
            // Calculate duration in milliseconds:
            //   (end_ns - start_ns) / 1,000,000 = duration_ms
            const durationMs = Number(process.hrtime.bigint() - start) / 1e6;

            // Build a log line: "GET /health 200 - 1.2ms"
            const message = `${req.method} ${req.originalUrl} ${res.statusCode} - ${durationMs.toFixed(1)}ms`;

            // Route the log message to the appropriate severity level
            if (res.statusCode >= 500) {
                log.error(message);       // Server errors
            } else if (res.statusCode >= 400) {
                log.warn(message);        // Client errors
            } else {
                log.info(message);        // Success / redirects
            }
        });

        // Pass control to the next middleware in the chain.
        // The actual logging happens asynchronously when the response finishes.
        next();
    };
}
