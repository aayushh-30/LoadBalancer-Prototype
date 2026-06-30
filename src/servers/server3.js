import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const server_3 = express();
server_3.use(cors());
server_3.use(express.json());

export default server_3;