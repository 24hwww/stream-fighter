const { Server } = require("socket.io");
const http = require("http");
const Redis = require("ioredis");
const { createAdapter } = require("@socket.io/redis-adapter");

const httpServer = http.createServer();
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

// Redis clients
const pubClient = new Redis(REDIS_URL);
const subClient = pubClient.duplicate();
const redis = pubClient.duplicate();

// Health check endpoint
httpServer.on("request", (req, res) => {
    if ((req.url === "/health" || req.url === "/api/health") && req.method === "GET") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "ok", service: "stream-socket", redis: redis.status }));
        return;
    }
    res.writeHead(404);
    res.end();
});

const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    },
    adapter: createAdapter(pubClient, subClient)
});

io.on("connection", async (socket) => {
    console.log("Client connected:", socket.id);

    // Mandar el último estado conocido al conectar
    try {
        const lastPoll = await redis.get("last_poll_data");
        if (lastPoll) {
            socket.emit("poll-refresh", JSON.parse(lastPoll));
        }
    } catch (e) {
        console.error("Redis fetch error:", e);
    }

    socket.on("vote", async (data) => {
        console.log("Vote received:", data);
        // Propagar inmediatamente
        io.emit("vote-update", data);
        io.emit("poll-refresh", { type: "vote", data });

        // Registrar actividad en Redis para auditoría rápida o logs calientes
        await redis.lpush("recent_votes", JSON.stringify({ ...data, ts: Date.now() }));
        await redis.ltrim("recent_votes", 0, 99);
    });

    socket.on("poll-update", async (data) => {
        console.log("Poll update received:", data);
        // Cachear en Redis para persistencia rápida en reinicios de stream-screen
        await redis.set("last_poll_data", JSON.stringify(data), "EX", 3600); // 1h

        io.emit("poll-refresh", data);
        io.emit("vote-update", { type: "poll", data });
    });

    socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
    });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
    console.log(`Socket server running on port ${PORT} with Redis Adapter`);
});
