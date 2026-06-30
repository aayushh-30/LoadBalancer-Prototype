import { createLogger } from "../utils/logger.js";

/**
 * Express middleware that logs every incoming request once a response
 * finishes, including the method, path, status code and latency.
 *
 * @param {string} label - tag identifying the server/component (e.g. "SERVER 1").
 */
export default function requestLogger(label) {
    const log = createLogger(label);

    return (req, res, next) => {
        const start = process.hrtime.bigint();

        res.on("finish", () => {
            const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
            const message = `${req.method} ${req.originalUrl} ${res.statusCode} - ${durationMs.toFixed(1)}ms`;

            if (res.statusCode >= 500) {
                log.error(message);
            } else if (res.statusCode >= 400) {
                log.warn(message);
            } else {
                log.info(message);
            }
        });

        next();
    };
}
