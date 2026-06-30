import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const server_2 = express();
server_2.use(cors());
server_2.use(express.json());

export default server_2;