import { createLogger } from "../utils/logger.js";

const log = createLogger("LeastConnections");

/**
 * Least-Connections scheduling algorithm.
 *
 * Tracks the number of in-flight (active) requests per server and always
 * selects the alive server with the fewest active connections. Ties are
 * broken by picking the first server found.
 *
 * Requires the proxy layer to call `onRequestStart` / `onRequestEnd`
 * so the connection counts stay accurate.
 *
 * @param {Array} servers - Array of server detail objects from config.
 */
export default function createLeastConnections(servers) {
    /** Map of server id → number of active connections */
    const activeConnections = new Map();

    // Initialise every server to 0 active connections
    for (const server of servers) {
        activeConnections.set(server.id, 0);
    }

    return {
        name: "least-connections",

        /**
         * Returns the alive server with the fewest active connections.
         *
         * @returns {object|null} The selected server, or null if none are alive.
         */
        getNextServer() {
            const alive = servers.filter((s) => s.alive);
            if (alive.length === 0) {
                log.error("No alive servers available");
                return null;
            }

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
         * Must be called when a request starts being proxied.
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
         * Must be called when a proxied request finishes (success or error).
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
