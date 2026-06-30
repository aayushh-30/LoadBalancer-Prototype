// ============================================================================
// weightedRoundRobin.js — Weighted Round-Robin Scheduling Algorithm
// ============================================================================
//
// An extension of Round Robin that accounts for differing server capacities.
// Each server has a `weight` property indicating its relative capacity.
// Servers with higher weights receive proportionally more requests.
//
// How it works:
//   A "rotation list" is built where each server appears a number of times
//   equal to its weight. The algorithm then cycles through this expanded list
//   just like standard Round Robin.
//
// Example with weights { S1: 3, S2: 2, S3: 1 }:
//   Rotation list: [S1, S1, S1, S2, S2, S3]  (6 slots total)
//
//   Request 1 → S1 (slot 0)
//   Request 2 → S1 (slot 1)
//   Request 3 → S1 (slot 2)
//   Request 4 → S2 (slot 3)
//   Request 5 → S2 (slot 4)
//   Request 6 → S3 (slot 5)
//   Request 7 → S1 (slot 0, wraps around)
//   ...
//
//   Result: S1 gets 50%, S2 gets 33%, S3 gets 17% of traffic
//
// Pros:
//   • Accounts for heterogeneous server capacities
//   • Still simple and predictable — no runtime metrics needed
//   • Easy to tune — just adjust the weight numbers
//
// Cons:
//   • Static weights don't adapt to real-time load changes
//   • Can create bursty traffic (one server gets N consecutive requests)
//
// When to use:
//   • Servers have different hardware specs (CPU, RAM)
//   • You want deterministic distribution with capacity awareness
// ============================================================================

import { createLogger } from "../utils/logger.js";

const log = createLogger("WeightedRoundRobin");

/**
 * Creates a Weighted Round-Robin scheduler instance.
 *
 * @param {Array} servers - Array of server detail objects (must include `weight`).
 * @returns {object} Scheduler with getNextServer, onRequestStart, onRequestEnd.
 */
export default function createWeightedRoundRobin(servers) {
    // Position in the rotation list; starts at -1 so first call picks slot 0
    let currentIndex = -1;

    // Build the initial rotation (rebuilt on each getNextServer call)
    let rotation = buildRotation(servers);

    /**
     * Builds a flat rotation array where each server appears a number
     * of times equal to its weight.
     *
     * For example, a server with weight 3 gets 3 entries in the array.
     * A server with weight 1 gets 1 entry. The algorithm then cycles
     * through this array sequentially, naturally distributing traffic
     * according to the weights.
     *
     * Only includes servers whose `alive` flag is true.
     *
     * @param {Array} serverList - Array of server detail objects.
     * @returns {Array} Expanded rotation array.
     */
    function buildRotation(serverList) {
        const alive = serverList.filter((s) => s.alive);
        const list = [];
        for (const server of alive) {
            // Default to weight 1 if no weight is specified
            const weight = server.weight ?? 1;
            // Add the server to the rotation `weight` times
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
         *
         * The rotation is rebuilt on every call to dynamically handle
         * servers going offline or coming back online. While this adds
         * a small overhead, it ensures the rotation always reflects
         * the current state of the server pool.
         *
         * @returns {object|null} The selected server, or null if none are alive.
         */
        getNextServer() {
            // Rebuild the rotation on every call so we immediately
            // stop sending traffic to servers that went offline
            rotation = buildRotation(servers);

            if (rotation.length === 0) {
                log.error("No alive servers available");
                return null;
            }

            // Advance through the rotation and wrap around
            currentIndex = (currentIndex + 1) % rotation.length;
            const server = rotation[currentIndex];

            log.info(
                `Selected ${server.name} (weight ${server.weight ?? 1}, slot ${currentIndex}/${rotation.length})`
            );
            return server;
        },

        /** No-op — Weighted Round Robin doesn't need to track active connections. */
        onRequestStart(_server) {},

        /** No-op — Weighted Round Robin doesn't need to track active connections. */
        onRequestEnd(_server) {},
    };
}
