// ============================================================================
// scheduling/index.js — Scheduler Factory
// ============================================================================
//
// Central entry point for the scheduling module. Provides a factory function
// that creates the correct scheduling strategy based on a string identifier
// (typically read from the SCHEDULING_ALGORITHM environment variable).
//
// This uses the Strategy Pattern: all three algorithms implement the same
// interface, so the rest of the application doesn't need to know which
// algorithm is active — it just calls getNextServer().
//
// Scheduler Interface (every algorithm returns an object with these methods):
//   ┌────────────────────┬─────────────────────────────────────────────────┐
//   │ Method             │ Description                                     │
//   ├────────────────────┼─────────────────────────────────────────────────┤
//   │ name               │ Human-readable algorithm name (for logging)     │
//   │ getNextServer()    │ Returns the next server to forward a request to │
//   │ onRequestStart(s)  │ Called when a request begins (for conn. tracking│
//   │ onRequestEnd(s)    │ Called when a request ends (for conn. tracking) │
//   └────────────────────┴─────────────────────────────────────────────────┘
// ============================================================================

import createRoundRobin from "./roundRobin.js";
import createWeightedRoundRobin from "./weightedRoundRobin.js";
import createLeastConnections from "./leastConnections.js";
import { createLogger } from "../utils/logger.js";

const log = createLogger("Scheduler");

/**
 * Supported algorithm identifiers.
 * These are the valid values for the SCHEDULING_ALGORITHM environment variable.
 */
export const ALGORITHMS = {
    ROUND_ROBIN: "round-robin",
    WEIGHTED_ROUND_ROBIN: "weighted-round-robin",
    LEAST_CONNECTIONS: "least-connections",
};

/**
 * Factory that instantiates the correct scheduling strategy.
 *
 * Uses a switch statement to map the algorithm string to its constructor.
 * If an unrecognised algorithm is provided, an error is thrown immediately
 * at startup (fail-fast) rather than silently defaulting to something else.
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
            // Fail fast with a helpful message listing valid options
            throw new Error(
                `Unknown scheduling algorithm: "${algorithm}". ` +
                `Supported values: ${Object.values(ALGORITHMS).join(", ")}`
            );
    }
}
