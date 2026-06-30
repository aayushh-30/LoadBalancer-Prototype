// ============================================================================
// index.js — Load Balancer Entry Point
// ============================================================================
//
// This is the main entry point for the LoadBalancer-Prototype application.
// It sets up an Express server that acts as a reverse proxy / load balancer,
// sitting in front of multiple backend servers and distributing incoming
// client requests across them using a configurable scheduling algorithm.
//
// Startup flow:
//   1. Load environment variables from .env
//   2. Configure Express middleware (CORS, JSON parsing, request logging)
//   3. Register the load balancer's own /health endpoint
//   4. Spin up all backend servers (ServerSpinner)
//   5. Initialise the scheduling algorithm (round-robin, weighted, etc.)
//   6. Mount the proxy forwarder as a catch-all for all other routes
//   7. Start listening for client connections
// ============================================================================

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import ServerSpinner from "./src/servers/index.js";
import requestLogger from "./src/middleware/requestLogger.js";
import proxyForwarder from "./src/middleware/proxyForwarder.js";
import { createScheduler } from "./src/scheduling/index.js";
import SERVER_DETAILS from "./src/config/serverDetails.js";
import { createLogger } from "./src/utils/logger.js";

// Load environment variables from .env file into process.env
dotenv.config();

// Create a labelled logger for load balancer messages
const log = createLogger("LOAD BALANCER");

// ── Express App Setup ───────────────────────────────────────────────────────

const LOAD_BALANCER = express();

// Enable Cross-Origin Resource Sharing so clients on different origins can
// send requests to the load balancer without being blocked by the browser.
LOAD_BALANCER.use(cors());

// Parse incoming JSON request bodies so req.body is available downstream.
LOAD_BALANCER.use(express.json());

// Log every request that hits the load balancer (method, path, status, latency).
LOAD_BALANCER.use(requestLogger("LOAD BALANCER"));

// ── Configuration ───────────────────────────────────────────────────────────

// Port the load balancer listens on (default: 3000)
const LOAD_BALANCER_PORT = process.env.LOAD_BALANCER_PORT || 3000;

// Which scheduling algorithm to use for distributing requests.
// Accepted values: "round-robin" | "weighted-round-robin" | "least-connections"
const SCHEDULING_ALGORITHM = process.env.SCHEDULING_ALGORITHM || "round-robin";

// ── Routes ──────────────────────────────────────────────────────────────────

// Health-check endpoint for the load balancer itself.
// This is NOT forwarded to backend servers — it responds directly so
// monitoring tools can verify the load balancer process is alive.
LOAD_BALANCER.get("/health", (req, res) => {
    res.status(200).json({ message: "Load Balancer is running" })
});

// ── Startup Sequence ────────────────────────────────────────────────────────

// First, spin up all backend servers, then wire the scheduler + proxy.
ServerSpinner()
    .then(() => {
        // All backend servers are now listening on their respective ports.
        // Create the scheduler instance based on the chosen algorithm.
        const scheduler = createScheduler(SCHEDULING_ALGORITHM, SERVER_DETAILS);

        // Mount the proxy forwarder as catch-all middleware.
        // Any request that didn't match /health above will be forwarded
        // to one of the backend servers chosen by the scheduler.
        LOAD_BALANCER.use(proxyForwarder(scheduler));

        // Start accepting client connections on the load balancer port.
        LOAD_BALANCER.listen(LOAD_BALANCER_PORT, () => {
            log.info(`LOAD BALANCER running on port ${LOAD_BALANCER_PORT}`);
            log.info(`Scheduling algorithm: ${scheduler.name}`);
        });
    })
    .catch((err) => {
        // If any backend server fails to start, log the error and exit
        // with a non-zero code so process managers know startup failed.
        log.error("Failed to start servers", err);
        process.exit(1);
    });
