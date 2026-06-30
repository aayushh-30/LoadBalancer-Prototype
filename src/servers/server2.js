import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import requestLogger from "../middleware/requestLogger.js";

dotenv.config();

const server_2 = express();
server_2.use(cors());
server_2.use(express.json());
server_2.use(requestLogger("SERVER 2"));

server_2.get("/health", (req, res) => {
    res.status(200).json({ message: "SERVER 2 is running" })
});

export default server_2;
