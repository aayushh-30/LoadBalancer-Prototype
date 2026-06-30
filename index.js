import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import ServerSpinner from "./src/servers/index.js";

dotenv.config();

const LOAD_BALANCER = express();
LOAD_BALANCER.use(cors());
LOAD_BALANCER.use(express.json());

const LOAD_BALANCER_PORT = process.env.LOAD_BALANCER_PORT || 3000;

ServerSpinner()
    .then(() => {
        LOAD_BALANCER.listen(LOAD_BALANCER_PORT, () => {
            console.log(`LOAD BALANCER running on port ${LOAD_BALANCER_PORT}`);
        });
    });
