import winston from "winston";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_DIR = path.join(__dirname, "..", "..", "logs");

const LOG_LEVEL = process.env.LOG_LEVEL || "info";

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

// Human-readable, colorized format for the console.
const consoleFormat = combine(
    colorize(),
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    errors({ stack: true }),
    printf(({ level, message, timestamp, label, stack }) => {
        const tag = label ? `[${label}] ` : "";
        return `${timestamp} ${level}: ${tag}${stack || message}`;
    })
);

// Structured JSON format for log files (easier to parse later).
const fileFormat = combine(
    timestamp(),
    errors({ stack: true }),
    json()
);

const logger = winston.createLogger({
    level: LOG_LEVEL,
    transports: [
        new winston.transports.Console({ format: consoleFormat }),
        new winston.transports.File({
            filename: path.join(LOG_DIR, "error.log"),
            level: "error",
            format: fileFormat,
        }),
        new winston.transports.File({
            filename: path.join(LOG_DIR, "combined.log"),
            format: fileFormat,
        }),
    ],
});

/**
 * Returns a child logger that tags every entry with the given label,
 * e.g. createLogger("SERVER 1").info("started").
 *
 * @param {string} label
 */
export function createLogger(label) {
    return logger.child({ label });
}

export default logger;
