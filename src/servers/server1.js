import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const server_1 = express();
server_1.use(cors());
server_1.use(express.json());

export default server_1;