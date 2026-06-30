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
        const server = scheduler.getNextServer();

        if (!server) {
            log.error("No servers available to handle the request");
            return res
                .status(503)
                .json({ error: "Service Unavailable — no backend servers online" });
        }

        scheduler.onRequestStart(server);

        const options = {
            hostname: server.host,
            port: server.port,
            path: req.originalUrl,
            method: req.method,
            headers: {
                ...req.headers,
                // Override the Host header so the backend sees its own host
                host: `${server.host}:${server.port}`,
            },
        };

        log.info(
            `Forwarding ${req.method} ${req.originalUrl} → ${server.name} (${server.url})`
        );

        const proxyReq = http.request(options, (proxyRes) => {
            // Copy upstream status and headers to the client response
            res.writeHead(proxyRes.statusCode, proxyRes.headers);
            // Pipe the upstream body straight through
            proxyRes.pipe(res, { end: true });

            proxyRes.on("end", () => {
                scheduler.onRequestEnd(server);
            });
        });

        proxyReq.on("error", (err) => {
            scheduler.onRequestEnd(server);
            log.error(
                `Proxy error for ${server.name}: ${err.message}`
            );

            // Only send a response if headers haven't been sent yet
            if (!res.headersSent) {
                res.status(502).json({
                    error: "Bad Gateway",
                    message: `Failed to reach ${server.name}`,
                });
            }
        });

        // Forward the request body (if any) to the upstream server
        req.pipe(proxyReq, { end: true });
    };
}
