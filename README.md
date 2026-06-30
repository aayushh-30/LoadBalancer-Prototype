# LoadBalancer-Prototype

A fully functional **Layer 7 (HTTP) Load Balancer** built from scratch with Node.js and Express. This project demonstrates how load balancers distribute incoming network traffic across multiple backend servers to ensure no single server becomes overwhelmed — improving reliability, scalability, and performance.

---

## Table of Contents

- [What is a Load Balancer?](#what-is-a-load-balancer)
- [Why Do We Need Load Balancing?](#why-do-we-need-load-balancing)
- [Scheduling Algorithms](#scheduling-algorithms)
  - [1. Round Robin](#1-round-robin)
  - [2. Weighted Round Robin](#2-weighted-round-robin)
  - [3. Least Connections](#3-least-connections)
  - [Algorithm Comparison](#algorithm-comparison)
- [Project Structure](#project-structure)
- [File-by-File Explanation](#file-by-file-explanation)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [How It Works](#how-it-works)
- [Tech Stack](#tech-stack)

---

## What is a Load Balancer?

A **load balancer** is a server that sits between clients and a group of backend servers, acting as a **reverse proxy**. When a client sends a request, it goes to the load balancer first — not directly to a backend server. The load balancer then decides which backend server should handle the request and forwards it there.

```
                          ┌──────────────┐
                     ┌───►│  Server 1    │
                     │    │  (port 4000) │
┌─────────┐    ┌─────┴──────┐    └──────────────┘
│  Client  │───►│    Load     │
│          │    │  Balancer   │───►┌──────────────┐
└─────────┘    │  (port 3000)│    │  Server 2    │
               └─────┬──────┘    │  (port 4001) │
                     │    └──────────────┘
                     │
                     └───►┌──────────────┐
                          │  Server 3    │
                          │  (port 4002) │
                          └──────────────┘
```

The client only talks to the load balancer — it has no idea that multiple servers exist behind it. The load balancer transparently forwards requests and returns responses.

---

## Why Do We Need Load Balancing?

| Problem | How Load Balancing Solves It |
|---------|---------------------------|
| **Single point of failure** | If one server goes down, others can still handle traffic |
| **Server overload** | Traffic is spread across multiple servers instead of hitting one |
| **Scalability** | New servers can be added without changing client configuration |
| **Uneven performance** | Smarter algorithms route traffic away from slow/busy servers |
| **High latency** | Parallel processing across servers reduces average response time |

In production systems, load balancers like **NGINX**, **HAProxy**, and **AWS ALB** handle millions of requests per second. This project implements the same core concepts at a smaller scale to understand the fundamentals.

---

## Scheduling Algorithms

The **scheduling algorithm** is the brain of the load balancer — it decides which server handles each incoming request. This project implements three classic algorithms:

### 1. Round Robin

**The simplest algorithm.** Distributes requests in a fixed, repeating cycle.

```
Request 1  →  Server 1
Request 2  →  Server 2
Request 3  →  Server 3
Request 4  →  Server 1  (wraps around)
Request 5  →  Server 2
Request 6  →  Server 3
...
```

**How it works internally:**
- Maintains a single counter (`currentIndex`)
- On each request: `currentIndex = (currentIndex + 1) % numberOfServers`
- Picks the server at that index

**✅ Pros:** Simple, predictable, zero overhead, perfectly even distribution  
**❌ Cons:** Ignores server capacity and current load  
**📌 Best for:** Identical servers with uniform request processing times

---

### 2. Weighted Round Robin

**Round Robin with capacity awareness.** Servers with higher "weight" receive more requests proportionally.

Each server has a `weight` property. The algorithm builds a rotation list where each server appears `weight` times, then cycles through that list.

**Example with weights: Server 1 = 3, Server 2 = 2, Server 3 = 1:**

```
Rotation list: [S1, S1, S1, S2, S2, S3]

Request 1  →  Server 1  (slot 0)
Request 2  →  Server 1  (slot 1)
Request 3  →  Server 1  (slot 2)
Request 4  →  Server 2  (slot 3)
Request 5  →  Server 2  (slot 4)
Request 6  →  Server 3  (slot 5)
Request 7  →  Server 1  (slot 0, wraps around)
...

Traffic split: S1 = 50%, S2 = 33%, S3 = 17%
```

**✅ Pros:** Accounts for different server capacities, easy to tune  
**❌ Cons:** Static weights don't adapt to real-time load, can be bursty  
**📌 Best for:** Servers with different hardware specs where you know relative capacity

---

### 3. Least Connections

**The smartest algorithm.** Makes real-time decisions based on current server load.

Tracks the number of active (in-flight) requests on each server. New requests are always sent to the server with the **fewest active connections**.

```
State: { S1: 5 active, S2: 2 active, S3: 3 active }
→ New request goes to S2 (fewest: 2)

State: { S1: 5 active, S2: 3 active, S3: 3 active }
→ New request goes to S2 (tie broken by order: 3)

State: { S1: 1 active, S2: 3 active, S3: 3 active }  (S1 finished several requests)
→ New request goes to S1 (fewest: 1)
```

**✅ Pros:** Self-balancing, adapts to real-time load, handles variable request durations  
**❌ Cons:** Requires connection tracking (small overhead), doesn't consider server capacity  
**📌 Best for:** Requests with variable processing times (some fast, some slow)

---

### Algorithm Comparison

| Feature | Round Robin | Weighted Round Robin | Least Connections |
|---------|:-----------:|:-------------------:|:-----------------:|
| Complexity | ⭐ Simple | ⭐⭐ Medium | ⭐⭐⭐ Dynamic |
| Considers server capacity | ❌ | ✅ (via weights) | ❌ |
| Considers current load | ❌ | ❌ | ✅ |
| Overhead | None | Minimal | Low (tracks counts) |
| Distribution | Even | Proportional | Adaptive |
| Configuration | None | Set weights | None |

---

## Project Structure

```
LoadBalancer-Prototype/
├── index.js                          # 🚀 Entry point — sets up LB + starts everything
├── .env                              # ⚙️ Environment config (ports, algorithm, log level)
├── .gitignore                        # Git ignore rules
├── package.json                      # NPM dependencies & scripts
│
└── src/
    ├── config/
    │   └── serverDetails.js          # 📋 Backend server registry (ports, weights, alive status)
    │
    ├── middleware/
    │   ├── proxyForwarder.js         # 🔀 Core proxy — forwards requests to backend servers
    │   └── requestLogger.js          # 📝 HTTP request/response logging middleware
    │
    ├── scheduling/
    │   ├── index.js                  # 🏭 Scheduler factory — creates the right algorithm
    │   ├── roundRobin.js             # 🔄 Round Robin algorithm
    │   ├── weightedRoundRobin.js     # ⚖️ Weighted Round Robin algorithm
    │   └── leastConnections.js       # 📊 Least Connections algorithm
    │
    ├── servers/
    │   ├── index.js                  # 🔌 ServerSpinner — boots up all backend servers
    │   ├── server1.js                # Backend server 1 (Express app)
    │   ├── server2.js                # Backend server 2 (Express app)
    │   └── server3.js                # Backend server 3 (Express app)
    │
    └── utils/
        └── logger.js                 # 🪵 Winston logger setup (console + file output)
```

---

## File-by-File Explanation

### `index.js` — Entry Point
The main file that orchestrates everything. It:
1. Loads environment variables from `.env`
2. Creates the Express load balancer app with middleware (CORS, JSON parsing, logging)
3. Registers the load balancer's own `/health` endpoint
4. Calls `ServerSpinner()` to start all 3 backend servers
5. Creates the scheduler based on `SCHEDULING_ALGORITHM` from `.env`
6. Mounts the proxy forwarder as a catch-all — any request that doesn't match `/health` gets forwarded to a backend server

### `src/config/serverDetails.js` — Server Registry
A centralized array of all backend servers with their connection details:
- `id` — Unique identifier (used by Least Connections for tracking)
- `name` — Human-readable label for logs
- `port` — TCP port the server listens on
- `host` — Hostname (always `localhost` in this prototype)
- `url` — Full base URL for convenience
- `alive` — Whether this server should receive traffic
- `weight` — Relative capacity for Weighted Round Robin (S1=3, S2=2, S3=1)

### `src/scheduling/index.js` — Scheduler Factory
Uses the **Strategy Pattern** to create the right algorithm based on a string identifier. All three algorithms share the same interface: `getNextServer()`, `onRequestStart()`, `onRequestEnd()`.

### `src/scheduling/roundRobin.js`
Implements Round Robin with a simple counter and modulo operation.

### `src/scheduling/weightedRoundRobin.js`
Builds an expanded rotation list based on weights, then cycles through it. Rebuilds the list on every call to handle servers going offline.

### `src/scheduling/leastConnections.js`
Uses a `Map` to track active connections per server. Scans all alive servers to find the one with the minimum count.

### `src/middleware/proxyForwarder.js` — Reverse Proxy
The core of the load balancer. Uses Node.js built-in `http.request` to:
1. Forward the client's full HTTP request (method, headers, body) to the selected backend
2. Pipe the backend's response back to the client
3. Track connection lifecycle for the scheduler
4. Return `503` if no servers are alive, `502` on proxy errors

### `src/middleware/requestLogger.js` — Request Logger
Logs every HTTP request/response with method, path, status code, and latency. Uses high-resolution timers (`process.hrtime.bigint()`) for accurate timing.

### `src/servers/index.js` — ServerSpinner
Starts all three backend Express servers sequentially on their configured ports.

### `src/servers/server[1-3].js` — Backend Servers
Simple Express apps representing backend application servers. Each has its own middleware stack and a `/health` endpoint.

### `src/utils/logger.js` — Logger
Centralized Winston logger with:
- **Console transport** — colorized, human-readable output
- **File transports** — JSON format written to `logs/error.log` and `logs/combined.log`
- **Child loggers** — each component gets a tagged logger via `createLogger(label)`

---

## Getting Started

### Prerequisites

- **Node.js** v18+ installed
- **npm** (comes with Node.js)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/LoadBalancer-Prototype.git
cd LoadBalancer-Prototype

# Install dependencies
npm install
```

### Running

```bash
npm start
```

This starts:
- **Load Balancer** on port `3000`
- **Server 1** on port `4000`
- **Server 2** on port `4001`
- **Server 3** on port `4002`

### Testing

Send requests to the load balancer and watch them get distributed:

```bash
# Hit the load balancer's own health check
curl http://localhost:3000/health

# Hit any other path — it gets forwarded to a backend server
curl http://localhost:3000/some-path
```

---

## Configuration

All settings are in the `.env` file:

| Variable | Default | Description |
|----------|---------|-------------|
| `LOAD_BALANCER_PORT` | `3000` | Port the load balancer listens on |
| `LOG_LEVEL` | `info` | Minimum log level (`error`, `warn`, `info`, `debug`, etc.) |
| `SERVER_1_PORT` | `4000` | Port for backend server 1 |
| `SERVER_2_PORT` | `4001` | Port for backend server 2 |
| `SERVER_3_PORT` | `4002` | Port for backend server 3 |
| `SCHEDULING_ALGORITHM` | `round-robin` | Algorithm: `round-robin`, `weighted-round-robin`, or `least-connections` |

To switch algorithms, edit `.env` and restart:

```env
SCHEDULING_ALGORITHM = weighted-round-robin
```

---

## How It Works

```
Client Request
      │
      ▼
┌─────────────────────────────────────────────┐
│            LOAD BALANCER (:3000)             │
│                                             │
│  1. CORS middleware                         │
│  2. JSON body parser                        │
│  3. Request logger                          │
│  4. /health route (responds directly)       │
│  5. Proxy forwarder (catch-all)             │
│     │                                       │
│     ├─ scheduler.getNextServer()            │
│     │   ├─ Round Robin: next in cycle       │
│     │   ├─ Weighted RR: next in weighted    │
│     │   │   rotation                        │
│     │   └─ Least Conn: server with fewest   │
│     │       active requests                 │
│     │                                       │
│     ├─ Forward request via http.request()   │
│     └─ Pipe response back to client         │
└──────────────────┬──────────────────────────┘
                   │
        ┌──────────┼──────────┐
        ▼          ▼          ▼
   ┌─────────┐ ┌─────────┐ ┌─────────┐
   │Server 1 │ │Server 2 │ │Server 3 │
   │ (:4000) │ │ (:4001) │ │ (:4002) │
   └─────────┘ └─────────┘ └─────────┘
```

---

## Tech Stack

| Technology | Purpose |
|-----------|---------|
| **Node.js** | JavaScript runtime |
| **Express** | HTTP server framework |
| **Winston** | Structured logging (console + file) |
| **dotenv** | Environment variable management |
| **cors** | Cross-Origin Resource Sharing middleware |

---

## License

ISC
