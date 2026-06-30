import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import requestLogger from "../middleware/requestLogger.js";

dotenv.config();

const server_1 = express();
server_1.use(cors());
server_1.use(express.json());
server_1.use(requestLogger("SERVER 1"));

server_1.get("/health", (req, res) => {
    res.status(200).json({ message: "SERVER 1 is running" })
});

export default server_1;
