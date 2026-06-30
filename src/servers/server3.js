import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import requestLogger from "../middleware/requestLogger.js";

dotenv.config();

const server_3 = express();
server_3.use(cors());
server_3.use(express.json());
server_3.use(requestLogger("SERVER 3"));

export default server_3;
