// ============================================================================
// ServerSpinner — Backend Server Startup Orchestrator
// ============================================================================
//
// Starts all backend Express servers on their configured ports.
// This function is called before the load balancer begins accepting traffic,
// ensuring that all backends are ready to receive forwarded requests.
//
// Each server is started sequentially using `await` so the startup logs
// appear in order and any port-conflict errors are caught immediately.
// ============================================================================

import server_1 from './server1.js';
import server_2 from './server2.js';
import server_3 from './server3.js';
import SERVER_DETAILS from '../config/serverDetails.js';
import { createLogger } from '../utils/logger.js';

const log = createLogger('ServerSpinner');

/**
 * Boots up all backend servers sequentially.
 *
 * @returns {Promise<void>} Resolves when every server is listening.
 * @throws {Error} If any server fails to bind to its port.
 */
export default async function ServerSpinner() {

    // Start Server 1 on its configured port
    await server_1.listen(SERVER_DETAILS[0].port, () => {
        log.info(`SERVER 1 running on port ${SERVER_DETAILS[0].port}`);
    });

    // Start Server 2 on its configured port
    await server_2.listen(SERVER_DETAILS[1].port, () => {
        log.info(`SERVER 2 running on port ${SERVER_DETAILS[1].port}`);
    });

    // Start Server 3 on its configured port
    await server_3.listen(SERVER_DETAILS[2].port, () => {
        log.info(`SERVER 3 running on port ${SERVER_DETAILS[2].port}`);
    });

}
