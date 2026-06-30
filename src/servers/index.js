import server_1 from './server1.js';
import server_2 from './server2.js';
import server_3 from './server3.js';
import SERVER_DETAILS from '../config/serverDetails.js';
import { createLogger } from '../utils/logger.js';

const log = createLogger('ServerSpinner');

export default async function ServerSpinner() {

    await server_1.listen(SERVER_DETAILS[0].port, () => {
        log.info(`SERVER 1 running on port ${SERVER_DETAILS[0].port}`);
    });
    await server_2.listen(SERVER_DETAILS[1].port, () => {
        log.info(`SERVER 2 running on port ${SERVER_DETAILS[1].port}`);
    });
    await server_3.listen(SERVER_DETAILS[2].port, () => {
        log.info(`SERVER 3 running on port ${SERVER_DETAILS[2].port}`);
    });

}
