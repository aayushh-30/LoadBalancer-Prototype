// ============================================================================
// server3.js — Backend Server 3
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

// Create an Express app representing backend server 3
const server_3 = express();

// Enable CORS for cross-origin requests forwarded by the load balancer
server_3.use(cors());

// Parse JSON bodies so route handlers can access req.body
server_3.use(express.json());

// Log every request that arrives at this specific backend
server_3.use(requestLogger("SERVER 3"));

// Health-check endpoint — confirms this backend server is alive
server_3.get("/health", (req, res) => {
    res.status(200).json({ message: "SERVER 3 is running" })
});

export default server_3;
