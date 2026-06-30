// ============================================================================
// serverDetails.js — Backend Server Configuration
// ============================================================================
//
// Central registry of all backend servers that the load balancer can forward
// requests to. Each entry describes one backend server's connection details
// and scheduling metadata.
//
// Properties per server:
//   id     – Unique numeric identifier (used by Least Connections to track counts)
//   name   – Human-readable label (appears in logs)
//   port   – TCP port the server listens on (read from .env, with fallback)
//   host   – Hostname / IP address (currently always "localhost")
//   url    – Full base URL for convenience (used in log messages)
//   alive  – Whether the server should receive traffic (true = active)
//   weight – Relative capacity for Weighted Round Robin (higher = more traffic)
//
// To add a new backend server:
//   1. Add a SERVER_N_PORT variable in .env
//   2. Add a new entry to the array below
//   3. Create a new server file in src/servers/ and import it in ServerSpinner
// ============================================================================

// Read port numbers from environment variables with sensible fallbacks.
const SERVER_1_PORT = process.env.SERVER_1_PORT || 3001;
const SERVER_2_PORT = process.env.SERVER_2_PORT || 3002;
const SERVER_3_PORT = process.env.SERVER_3_PORT || 3003;

/**
 * Array of backend server detail objects.
 * The scheduling algorithms iterate over this list to pick a target server.
 *
 * Weight values (used only by Weighted Round Robin):
 *   SERVER 1: weight 3 → receives ~50% of traffic  (3 out of 6 total weight)
 *   SERVER 2: weight 2 → receives ~33% of traffic  (2 out of 6 total weight)
 *   SERVER 3: weight 1 → receives ~17% of traffic  (1 out of 6 total weight)
 */
const SERVER_DETAILS = [
    {
        "id": 1,
        "name": "SERVER 1",
        "port": SERVER_1_PORT,
        "host": "localhost",
        "url": `http://localhost:${SERVER_1_PORT}`,
        "alive": true,       // Set to false to take this server out of rotation
        "weight": 3          // Highest capacity — gets the most traffic in WRR
    },
    {
        "id": 2,
        "name": "SERVER 2",
        "port": SERVER_2_PORT,
        "host": "localhost",
        "url": `http://localhost:${SERVER_2_PORT}`,
        "alive": true,
        "weight": 2          // Medium capacity
    },
    {
        "id": 3,
        "name": "SERVER 3",
        "port": SERVER_3_PORT,
        "host": "localhost",
        "url": `http://localhost:${SERVER_3_PORT}`,
        "alive": true,
        "weight": 1          // Lowest capacity — gets the least traffic in WRR
    }
]

export default SERVER_DETAILS