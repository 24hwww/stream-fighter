const { Server } = require("socket.io");
const http = require("http");
const Redis = require("ioredis");
const { createAdapter } = require("@socket.io/redis-adapter");
const { createLogger } = require("./lib/logger");

const log = createLogger('SocketEngine');
const REDIS_URL = process.env.REDIS_URL || "redis://redis:6379";
const SCREEN_API_URL = process.env.INTERNAL_SCREEN_URL || "http://stream-screen:3000";

const pubClient = new Redis(REDIS_URL);
const subClient = pubClient.duplicate();
const redis = pubClient.duplicate();

const httpServer = http.createServer((req, res) => {
    if (req.url === "/health") {
        res.writeHead(200);
        return res.end("OK");
    }
});

const io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] },
    adapter: createAdapter(pubClient, subClient)
});

let rotationLock = false;

// GAMING ENGINE: Heartbeat & State Ticker (5 FPS)
async function tick() {
    try {
        let pollId = await redis.get("current_poll_id");

        // --- BOOTSTRAP: Look for active poll if none in Redis ---
        if (!pollId) {
            const pollData = await fetchInternalPoll();
            if (pollData && pollData.current) {
                pollId = pollData.current.id;
                await redis.set("current_poll_id", pollId, "EX", 3600);
                log.info(`Found active poll via API: ${pollId}`);
            } else {
                return; // No active poll to tick
            }
        }

        const stateKey = `fighter:${pollId}`;
        const rawState = await redis.get(stateKey);
        if (!rawState) return;

        const state = JSON.parse(rawState);
        const now = Date.now();
        const lastUpdate = state.lastUpdate || now;
        const delta = (now - lastUpdate) / 1000;

        // --- TIMER LOGIC ---
        if (!state.combatOver) {
            state.timer = Math.max(0, (state.timer || 180) - delta);
            rotationLock = false; // Reset lock for new match
            if (state.timer <= 0) {
                state.combatOver = true;
                state.winner = state.fighterA.hp > state.fighterB.hp ? 'A' : 'B';
                log.info(`Time Over! Winner: ${state.winner}`);
            }
        }

        // Passive Damage Decay
        const decay = 0.0005 * delta;
        state.fighterA.hp = Math.max(0, state.fighterA.hp - decay);
        state.fighterB.hp = Math.max(0, state.fighterB.hp - decay);

        if (state.fighterA.animation !== 'idle' && (now - (state.fighterA.lastActionTime || 0)) > 600) {
            state.fighterA.animation = 'idle';
        }
        if (state.fighterB.animation !== 'idle' && (now - (state.fighterB.lastActionTime || 0)) > 600) {
            state.fighterB.animation = 'idle';
        }

        state.lastUpdate = now;

        // Check for KO
        if (!state.combatOver && (state.fighterA.hp <= 0 || state.fighterB.hp <= 0)) {
            state.combatOver = true;
            state.winner = state.fighterA.hp <= 0 ? 'B' : 'A';
            log.info(`KO Detected! Winner: ${state.winner}`);
        }

        // --- AUTOMATIC ROTATION TRIGGER ---
        if (state.combatOver && !rotationLock) {
            rotationLock = true;
            log.info('Match ended. Triggering rotation in 8s...');
            setTimeout(() => {
                triggerRotation();
            }, 8000);
        }

        await redis.set(stateKey, JSON.stringify(state), 'EX', 3600);

        io.emit("heartbeat", {
            pollId,
            combatState: state,
            ts: now
        });

    } catch (e) {
        // Silent error
    }
}

function triggerRotation() {
    const url = new URL("/api/poll/rotate", SCREEN_API_URL);
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        }
    };

    const req = http.request(url, options, (res) => {
        let body = '';
        res.on('data', (d) => body += d);
        res.on('end', () => log.info(`Rotation API Response: ${body}`));
    });

    req.on('error', (e) => log.error(`Rotation API Error: ${e.message}`, e));
    req.end();
}

async function fetchInternalPoll() {
    return new Promise((resolve) => {
        const url = new URL("/api/poll", SCREEN_API_URL);
        http.get(url, (res) => {
            let body = '';
            res.on('data', (d) => body += d);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(body));
                } catch (e) {
                    resolve(null);
                }
            });
        }).on('error', () => resolve(null));
    });
}

setInterval(tick, 200);

io.on("connection", async (socket) => {
    log.info(`Remote Node connected: ${socket.id}`);
    const lastPoll = await redis.get("current_poll_full");
    if (lastPoll) socket.emit("poll-update", JSON.parse(lastPoll));

    socket.on("vote", (data) => io.emit("vote", data));
    socket.on("poll-update", async (data) => {
        rotationLock = false; // Important: Unlock when a new poll starts
        if (data && data.id) await redis.set("current_poll_id", data.id, "EX", 3600);
        io.emit("poll-update", data);
    });
    socket.on("shoutout", (data) => io.emit("shoutout", data));
    socket.on("disconnect", () => log.info(`Remote Node disconnected: ${socket.id}`));
});

const PORT = 3001;
httpServer.listen(PORT, () => log.info(`Gaming Engine Pulse active on port ${PORT}`));
