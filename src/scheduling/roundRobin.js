// ============================================================================
// roundRobin.js — Round-Robin Scheduling Algorithm
// ============================================================================
//
// The simplest load balancing algorithm. Distributes requests evenly across
// all alive servers by cycling through them in a fixed, repeating order:
//
//   Request 1 → Server 1
//   Request 2 → Server 2
//   Request 3 → Server 3
//   Request 4 → Server 1   (wraps around)
//   Request 5 → Server 2
//   ...
//
// Pros:
//   • Dead simple to implement and understand
//   • Perfectly even distribution when all servers have equal capacity
//   • Zero overhead — no state to track beyond a single counter
//
// Cons:
//   • Ignores server capacity — a weak server gets the same traffic as a strong one
//   • Ignores current load — doesn't know if a server is overloaded
//
// When to use:
//   • All servers are identical (same hardware, same software)
//   • Request processing time is roughly uniform across requests
// ============================================================================

import { createLogger } from "../utils/logger.js";

const log = createLogger("RoundRobin");

/**
 * Creates a Round-Robin scheduler instance.
 *
 * @param {Array} servers - Array of server detail objects from config.
 * @returns {object} Scheduler with getNextServer, onRequestStart, onRequestEnd.
 */
export default function createRoundRobin(servers) {
    // Index of the last server that was selected.
    // Starts at -1 so the first call to getNextServer() picks index 0.
    let currentIndex = -1;

    return {
        name: "round-robin",

        /**
         * Returns the next alive server in the rotation.
         *
         * Only considers servers with `alive: true`, so if a server is
         * taken offline, it's automatically skipped without breaking
         * the cycle.
         *
         * @returns {object|null} The selected server, or null if none are alive.
         */
        getNextServer() {
            // Filter out any servers that have been marked as down
            const aliveServers = servers.filter((s) => s.alive);

            if (aliveServers.length === 0) {
                log.error("No alive servers available");
                return null;
            }

            // Advance the index and wrap around using modulo.
            // e.g. with 3 servers: 0, 1, 2, 0, 1, 2, 0, ...
            currentIndex = (currentIndex + 1) % aliveServers.length;
            const server = aliveServers[currentIndex];

            log.info(`Selected ${server.name} (index ${currentIndex})`);
            return server;
        },

        /** No-op — Round Robin doesn't need to track active connections. */
        onRequestStart(_server) {},

        /** No-op — Round Robin doesn't need to track active connections. */
        onRequestEnd(_server) {},
    };
}
