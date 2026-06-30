import { createLogger } from "../utils/logger.js";

const log = createLogger("RoundRobin");

/**
 * Round-Robin scheduling algorithm.
 *
 * Cycles through the list of alive servers sequentially:
 *   Server 1 → Server 2 → Server 3 → Server 1 → …
 *
 * @param {Array} servers - Array of server detail objects from config.
 */
export default function createRoundRobin(servers) {
    let currentIndex = -1;

    return {
        name: "round-robin",

        /**
         * Returns the next alive server in sequence.
         * Skips servers whose `alive` flag is false.
         *
         * @returns {object|null} The selected server, or null if none are alive.
         */
        getNextServer() {
            const aliveServers = servers.filter((s) => s.alive);
            if (aliveServers.length === 0) {
                log.error("No alive servers available");
                return null;
            }

            currentIndex = (currentIndex + 1) % aliveServers.length;
            const server = aliveServers[currentIndex];
            log.info(`Selected ${server.name} (index ${currentIndex})`);
            return server;
        },

        /** No-op — Round Robin doesn't track connections. */
        onRequestStart(_server) {},

        /** No-op — Round Robin doesn't track connections. */
        onRequestEnd(_server) {},
    };
}
