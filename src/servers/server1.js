// ============================================================================
// server1.js — Backend Server 1
// ============================================================================
//
// One of the backend application servers that the load balancer distributes
// traffic to. In a real-world setup each server would run as a separate
// process (possibly on different machines); here they run in the same
// Node.js process for simplicity.
//
// The server registers its own middleware (CORS, JSON parsing, request
// logging) so each backend can be observed independently in the logs.
// ============================================================================

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import requestLogger from "../middleware/requestLogger.js";

dotenv.config();

// Create an Express app representing backend server 1
const server_1 = express();

// Enable CORS for cross-origin requests forwarded by the load balancer
server_1.use(cors());

// Parse JSON bodies so route handlers can access req.body
server_1.use(express.json());

// Log every request that arrives at this specific backend
server_1.use(requestLogger("SERVER 1"));

// Health-check endpoint — confirms this backend server is alive
server_1.get("/health", (req, res) => {
    res.status(200).json({ message: "SERVER 1 is running" })
});

export default server_1;
