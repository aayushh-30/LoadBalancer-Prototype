import server_1 from './server1.js';
import server_2 from './server2.js';
import server_3 from './server3.js';

const SERVER_1_PORT = process.env.SERVER_1_PORT || 3001;
const SERVER_2_PORT = process.env.SERVER_2_PORT || 3002;
const SERVER_3_PORT = process.env.SERVER_3_PORT || 3003;

const SERVER_DETAILS = [
    {
        "id": 1,
        "name": "SERVER 1",
        "port": SERVER_1_PORT,
        "url": `http://localhost:${SERVER_1_PORT}`
    },
    {
        "id": 2,
        "name": "SERVER 2",
        "port": SERVER_2_PORT,
        "url": `http://localhost:${SERVER_2_PORT}`
    },
    {
        "id": 3,
        "name": "SERVER 3",
        "port": SERVER_3_PORT,
        "url": `http://localhost:${SERVER_3_PORT}`
    }
]


export default async function ServerSpinner() {

    await server_1.listen(SERVER_DETAILS[0].port, () => {
        console.log(`SERVER 1 running on port ${SERVER_1_PORT}`);
    });
    await server_2.listen(SERVER_DETAILS[1].port, () => {
        console.log(`SERVER 2 running on port ${SERVER_2_PORT}`);
    });
    await server_3.listen(SERVER_DETAILS[2].port, () => {
        console.log(`SERVER 3 running on port ${SERVER_3_PORT}`);
    });

}