import { createLogger } from "../utils/logger.js";

const log = createLogger("WeightedRoundRobin");

/**
 * Weighted Round-Robin scheduling algorithm.
 *
 * Servers with a higher `weight` property receive proportionally more
 * requests. A rotation list is built where each server appears `weight`
 * times, and requests cycle through that list sequentially.
 *
 * Example with weights [3, 2, 1]:
 *   S1, S1, S1, S2, S2, S3, S1, S1, S1, S2, S2, S3, …
 *
 * @param {Array} servers - Array of server detail objects (must include `weight`).
 */
export default function createWeightedRoundRobin(servers) {
    let currentIndex = -1;
    let rotation = buildRotation(servers);

    /**
     * Builds a flat rotation array where each server appears
     * a number of times equal to its weight.
     */
    function buildRotation(serverList) {
        const alive = serverList.filter((s) => s.alive);
        const list = [];
        for (const server of alive) {
            const weight = server.weight ?? 1;
            for (let i = 0; i < weight; i++) {
                list.push(server);
            }
        }
        return list;
    }

    return {
        name: "weighted-round-robin",

        /**
         * Returns the next server from the weighted rotation.
         * Rebuilds the rotation on each call to account for servers
         * that may have gone offline.
         *
         * @returns {object|null} The selected server, or null if none are alive.
         */
        getNextServer() {
            // Rebuild to pick up alive-status changes
            rotation = buildRotation(servers);

            if (rotation.length === 0) {
                log.error("No alive servers available");
                return null;
            }

            currentIndex = (currentIndex + 1) % rotation.length;
            const server = rotation[currentIndex];
            log.info(
                `Selected ${server.name} (weight ${server.weight ?? 1}, slot ${currentIndex}/${rotation.length})`
            );
            return server;
        },

        /** No-op — Weighted Round Robin doesn't track connections. */
        onRequestStart(_server) {},

        /** No-op — Weighted Round Robin doesn't track connections. */
        onRequestEnd(_server) {},
    };
}
