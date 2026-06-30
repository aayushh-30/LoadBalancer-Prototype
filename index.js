import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import ServerSpinner from "./src/servers/index.js";
import requestLogger from "./src/middleware/requestLogger.js";
import { createLogger } from "./src/utils/logger.js";

dotenv.config();

const log = createLogger("LOAD BALANCER");

const LOAD_BALANCER = express();
LOAD_BALANCER.use(cors());
LOAD_BALANCER.use(express.json());
LOAD_BALANCER.use(requestLogger("LOAD BALANCER"));

const LOAD_BALANCER_PORT = process.env.LOAD_BALANCER_PORT || 3000;

ServerSpinner()
    .then(() => {
        LOAD_BALANCER.listen(LOAD_BALANCER_PORT, () => {
            log.info(`LOAD BALANCER running on port ${LOAD_BALANCER_PORT}`);
        });
    })
    .catch((err) => {
        log.error("Failed to start servers", err);
        process.exit(1);
    });
