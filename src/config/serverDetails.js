const SERVER_1_PORT = process.env.SERVER_1_PORT || 3001;
const SERVER_2_PORT = process.env.SERVER_2_PORT || 3002;
const SERVER_3_PORT = process.env.SERVER_3_PORT || 3003;

const SERVER_DETAILS = [
    {
        "id": 1,
        "name": "SERVER 1",
        "port": SERVER_1_PORT,
        "host": "localhost",
        "url": `http://localhost:${SERVER_1_PORT}`,
        "alive": true,
        "weight": 3
    },
    {
        "id": 2,
        "name": "SERVER 2",
        "port": SERVER_2_PORT,
        "host": "localhost",
        "url": `http://localhost:${SERVER_2_PORT}`,
        "alive": true,
        "weight": 2
    },
    {
        "id": 3,
        "name": "SERVER 3",
        "port": SERVER_3_PORT,
        "host": "localhost",
        "url": `http://localhost:${SERVER_3_PORT}`,
        "alive": true,
        "weight": 1
    }
]

export default SERVER_DETAILS