import createRoundRobin from "./roundRobin.js";
import createWeightedRoundRobin from "./weightedRoundRobin.js";
import createLeastConnections from "./leastConnections.js";
import { createLogger } from "../utils/logger.js";

const log = createLogger("Scheduler");

/**
 * Supported algorithm identifiers (used in .env / SCHEDULING_ALGORITHM).
 */
export const ALGORITHMS = {
    ROUND_ROBIN: "round-robin",
    WEIGHTED_ROUND_ROBIN: "weighted-round-robin",
    LEAST_CONNECTIONS: "least-connections",
};

/**
 * Factory that instantiates the correct scheduling strategy.
 *
 * @param {string} algorithm - One of the ALGORITHMS values.
 * @param {Array}  servers   - Server detail objects from config.
 * @returns {{ name: string, getNextServer: Function, onRequestStart: Function, onRequestEnd: Function }}
 * @throws {Error} If the algorithm string is unrecognised.
 */
export function createScheduler(algorithm, servers) {
    switch (algorithm) {
        case ALGORITHMS.ROUND_ROBIN:
            log.info("Initialising Round-Robin scheduler");
            return createRoundRobin(servers);

        case ALGORITHMS.WEIGHTED_ROUND_ROBIN:
            log.info("Initialising Weighted Round-Robin scheduler");
            return createWeightedRoundRobin(servers);

        case ALGORITHMS.LEAST_CONNECTIONS:
            log.info("Initialising Least-Connections scheduler");
            return createLeastConnections(servers);

        default:
            throw new Error(
                `Unknown scheduling algorithm: "${algorithm}". ` +
                `Supported values: ${Object.values(ALGORITHMS).join(", ")}`
            );
    }
}
