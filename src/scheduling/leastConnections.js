// ============================================================================
// leastConnections.js — Least-Connections Scheduling Algorithm
// ============================================================================
//
// A dynamic, load-aware scheduling algorithm. Unlike Round Robin and
// Weighted Round Robin (which are static/predetermined), Least Connections
// makes routing decisions based on real-time server load.
//
// How it works:
//   Maintains a counter of active (in-flight) requests for each server.
//   When a new request arrives, it selects the server with the fewest
//   active connections. This naturally routes traffic away from slow or
//   overloaded servers.
//
// Example scenario:
//   Active connections: { S1: 5, S2: 2, S3: 3 }
//   → Next request goes to S2 (lowest count: 2)
//   Active connections: { S1: 5, S2: 3, S3: 3 }
//   → Next request goes to S2 again (still lowest: 3, tie broken by order)
//   Active connections: { S1: 4, S2: 3, S3: 3 }  (S1 finished a request)
//   → Next request goes to S2 or S3 (both at 3, S2 comes first)
//
// Connection tracking:
//   This algorithm REQUIRES the proxy layer to call:
//     • onRequestStart(server) — when forwarding begins (increments count)
//     • onRequestEnd(server)   — when forwarding ends   (decrements count)
//   Without these calls, the connection counts will be inaccurate.
//
// Pros:
//   • Adapts to real-time load — slow servers naturally get fewer requests
//   • Handles heterogeneous request durations well
//   • Self-correcting — no manual tuning needed
//
// Cons:
//   • Slightly more overhead (must track state per request)
//   • Ties are broken by array order, not randomly
//   • Doesn't account for server capacity (a weak server with 0 connections
//     still gets picked over a powerful server with 1 connection)
//
// When to use:
//   • Request processing times vary widely
//   • Some requests are much more expensive than others
//   • You want automatic, self-balancing load distribution
// ============================================================================

import { createLogger } from "../utils/logger.js";

const log = createLogger("LeastConnections");

/**
 * Creates a Least-Connections scheduler instance.
 *
 * @param {Array} servers - Array of server detail objects from config.
 * @returns {object} Scheduler with getNextServer, onRequestStart, onRequestEnd.
 */
export default function createLeastConnections(servers) {
    /**
     * Map of server id → number of active (in-flight) connections.
     * This is the core state that drives the scheduling decision.
     * Using a Map keyed by server ID for O(1) lookups and updates.
     */
    const activeConnections = new Map();

    // Initialise every server to 0 active connections at startup
    for (const server of servers) {
        activeConnections.set(server.id, 0);
    }

    return {
        name: "least-connections",

        /**
         * Returns the alive server with the fewest active connections.
         *
         * Iterates through all alive servers and picks the one with the
         * smallest connection count. If multiple servers are tied, the
         * first one encountered in the array wins (stable tie-breaking).
         *
         * @returns {object|null} The selected server, or null if none are alive.
         */
        getNextServer() {
            // Only consider servers that are currently alive
            const alive = servers.filter((s) => s.alive);

            if (alive.length === 0) {
                log.error("No alive servers available");
                return null;
            }

            // Linear scan to find the server with the minimum active connections
            let best = null;
            let bestCount = Infinity;

            for (const server of alive) {
                const count = activeConnections.get(server.id) ?? 0;
                if (count < bestCount) {
                    bestCount = count;
                    best = server;
                }
            }

            log.info(
                `Selected ${best.name} (active connections: ${bestCount})`
            );
            return best;
        },

        /**
         * Increments the active connection count for the given server.
         * Must be called by the proxy layer when a request starts being forwarded.
         *
         * @param {object} server - The server detail object.
         */
        onRequestStart(server) {
            const current = activeConnections.get(server.id) ?? 0;
            activeConnections.set(server.id, current + 1);
            log.debug(
                `${server.name} connections: ${current + 1}`
            );
        },

        /**
         * Decrements the active connection count for the given server.
         * Must be called by the proxy layer when a proxied request finishes
         * (whether it succeeded or failed).
         *
         * Uses Math.max(0, ...) as a safety net to prevent negative counts
         * in case of unexpected double-calls.
         *
         * @param {object} server - The server detail object.
         */
        onRequestEnd(server) {
            const current = activeConnections.get(server.id) ?? 0;
            activeConnections.set(server.id, Math.max(0, current - 1));
            log.debug(
                `${server.name} connections: ${Math.max(0, current - 1)}`
            );
        },
    };
}
