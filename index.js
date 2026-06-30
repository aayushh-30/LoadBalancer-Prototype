import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import ServerSpinner from "./src/servers/index.js";
import requestLogger from "./src/middleware/requestLogger.js";
import proxyForwarder from "./src/middleware/proxyForwarder.js";
import { createScheduler } from "./src/scheduling/index.js";
import SERVER_DETAILS from "./src/config/serverDetails.js";
import { createLogger } from "./src/utils/logger.js";

dotenv.config();

const log = createLogger("LOAD BALANCER");

const LOAD_BALANCER = express();
LOAD_BALANCER.use(cors());
LOAD_BALANCER.use(express.json());
LOAD_BALANCER.use(requestLogger("LOAD BALANCER"));

const LOAD_BALANCER_PORT = process.env.LOAD_BALANCER_PORT || 3000;
const SCHEDULING_ALGORITHM = process.env.SCHEDULING_ALGORITHM || "round-robin";

LOAD_BALANCER.get("/health", (req, res) => {
    res.status(200).json({ message: "Load Balancer is running" })
});

ServerSpinner()
    .then(() => {
        // Create the scheduler after all backend servers are up
        const scheduler = createScheduler(SCHEDULING_ALGORITHM, SERVER_DETAILS);

        // Catch-all: forward every request that isn't /health to a backend
        LOAD_BALANCER.use(proxyForwarder(scheduler));

        LOAD_BALANCER.listen(LOAD_BALANCER_PORT, () => {
            log.info(`LOAD BALANCER running on port ${LOAD_BALANCER_PORT}`);
            log.info(`Scheduling algorithm: ${scheduler.name}`);
        });
    })
    .catch((err) => {
        log.error("Failed to start servers", err);
        process.exit(1);
    });
