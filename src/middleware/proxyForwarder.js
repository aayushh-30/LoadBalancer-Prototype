// ============================================================================
// proxyForwarder.js — Reverse Proxy Middleware
// ============================================================================
//
// The core of the load balancer: an Express middleware that intercepts
// incoming client requests, picks a backend server via the scheduler, and
// forwards the full HTTP request (method, headers, body) to that backend.
// The backend's response (status, headers, body) is then piped straight
// back to the original client — the client never knows it talked to a proxy.
//
// How it works (step by step):
//   1. scheduler.getNextServer() → selects a backend based on the active
//      scheduling algorithm (round-robin, weighted, least-connections).
//   2. scheduler.onRequestStart(server) → notifies the scheduler that a
//      new connection has started (used by Least Connections for counting).
//   3. An outgoing HTTP request is created via Node's built-in `http.request`
//      with the same method, path, and headers as the original request.
//   4. The client request body is piped into the proxy request.
//   5. The backend response is piped back to the client response.
//   6. scheduler.onRequestEnd(server) → notifies the scheduler the
//      connection has ended.
//
// Error handling:
//   • If no servers are alive → 503 Service Unavailable
//   • If the backend connection fails → 502 Bad Gateway
// ============================================================================

import http from "node:http";
import { createLogger } from "../utils/logger.js";

const log = createLogger("ProxyForwarder");

/**
 * Express middleware that forwards every incoming request to a backend
 * server selected by the provided scheduler.
 *
 * The full request (method, path, headers, body) is forwarded, and the
 * upstream response (status, headers, body) is piped back to the client.
 *
 * Connection lifecycle hooks (`onRequestStart` / `onRequestEnd`) are
 * called so that connection-aware schedulers (e.g. Least Connections)
 * can keep accurate counts.
 *
 * @param {object} scheduler - A scheduler instance from `createScheduler`.
 * @returns {Function} Express middleware.
 */
export default function proxyForwarder(scheduler) {
    return (req, res) => {
        // ── Step 1: Ask the scheduler which backend should handle this request ──
        const server = scheduler.getNextServer();

        // If all servers are down, we can't forward — return 503
        if (!server) {
            log.error("No servers available to handle the request");
            return res
                .status(503)
                .json({ error: "Service Unavailable — no backend servers online" });
        }

        // ── Step 2: Notify the scheduler a new request is starting ──────────────
        // This is critical for Least Connections, which tracks active counts.
        // For Round Robin and Weighted RR, this is a no-op.
        scheduler.onRequestStart(server);

        // ── Step 3: Build the outgoing HTTP request options ─────────────────────
        const options = {
            hostname: server.host,                // Backend hostname (e.g. "localhost")
            port: server.port,                    // Backend port (e.g. 4000)
            path: req.originalUrl,                // Preserve the original path + query string
            method: req.method,                   // Preserve the HTTP method (GET, POST, etc.)
            headers: {
                ...req.headers,                   // Forward all original headers
                // Override the Host header so the backend sees its own host:port
                // instead of the load balancer's host:port
                host: `${server.host}:${server.port}`,
            },
        };

        log.info(
            `Forwarding ${req.method} ${req.originalUrl} → ${server.name} (${server.url})`
        );

        // ── Step 4: Create the proxy request and handle the backend response ────
        const proxyReq = http.request(options, (proxyRes) => {
            // Copy the backend's status code and headers to the client response
            res.writeHead(proxyRes.statusCode, proxyRes.headers);

            // Pipe the backend response body straight to the client.
            // { end: true } ensures the client response is ended when the
            // backend response stream finishes.
            proxyRes.pipe(res, { end: true });

            // When the backend response is fully received, notify the scheduler
            // that this connection is complete (decrements active count).
            proxyRes.on("end", () => {
                scheduler.onRequestEnd(server);
            });
        });

        // ── Error handling: backend is unreachable ──────────────────────────────
        proxyReq.on("error", (err) => {
            // Always decrement the connection count, even on error
            scheduler.onRequestEnd(server);
            log.error(
                `Proxy error for ${server.name}: ${err.message}`
            );

            // Only send a response if headers haven't been sent yet.
            // If we already started piping the backend response, it's too
            // late to send a JSON error — the client will see a broken response.
            if (!res.headersSent) {
                res.status(502).json({
                    error: "Bad Gateway",
                    message: `Failed to reach ${server.name}`,
                });
            }
        });

        // ── Step 5: Pipe the client request body to the backend ────────────────
        // This handles POST/PUT/PATCH bodies, streaming them without
        // buffering the entire body in memory.
        req.pipe(proxyReq, { end: true });
    };
}
