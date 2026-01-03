import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createLogger } from './lib/logger.js';
import { PollService } from './services/PollService.js';
import { fighterStateService } from './lib/fighterStateService.js';
import { createSocketClient } from './lib/socketClient.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const log = createLogger('API_Server');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Initialize socket for server-side emits
const socket = createSocketClient();

// API Routes
app.get('/api/health', (req, res) => res.send('OK'));

// POLLS
app.get('/api/poll', async (req, res) => {
    try {
        let poll = await PollService.getCurrentPoll();

        // Auto rotation
        if (!poll || new Date() > new Date(poll.expiresAt)) {
            log.info('Rotating poll...');
            poll = await PollService.rotatePoll("General");
        }

        let combatState = null;
        if (poll) {
            combatState = await fighterStateService.updateCombat(poll.id, poll);
        }
        const previous = await PollService.getPreviousPoll();
        res.json({ current: poll, previous, combatState });
    } catch (e) {
        log.error('Poll API Error:', e.message);
        const fallbackPoll = {
            id: "fallback",
            optionA: { name: "Batman", image: "/option_a.png", _count: { votes: 0 } },
            optionB: { name: "Superman", image: "/option_b.png", _count: { votes: 0 } },
            expiresAt: new Date(Date.now() + 300000).toISOString(),
            isFallback: true
        };
        res.json({ current: fallbackPoll, previous: null });
    }
});

app.post('/api/vote', async (req, res) => {
    const { pollId, optionId } = req.body;
    if (!pollId || !optionId) return res.status(400).json({ error: "Missing data" });

    try {
        const result = await PollService.registerVote(pollId, optionId);
        res.json(result);
    } catch (e) {
        log.error("Vote API Error:", e);
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/poll/rotate', async (req, res) => {
    try {
        log.info('Manual rotation triggered via API');
        const poll = await PollService.rotatePoll("General");
        res.json({ success: true, poll });
    } catch (e) {
        log.error("Rotation API Error:", e);
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/shoutout', async (req, res) => {
    const { message, user = "ANON" } = req.body;
    if (!message) return res.status(400).json({ error: "Missing message" });

    try {
        // Emit to all clients via the socket server
        socket.emit("shoutout", {
            message: message.substring(0, 50).toUpperCase(),
            user: user.substring(0, 15).toUpperCase(),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
        res.json({ success: true });
    } catch (e) {
        log.error("Shoutout API Error:", e);
        res.status(500).json({ error: e.message });
    }
});

// AI NEWS
app.post('/api/ai/news', async (req, res) => {
    try {
        const { prompt } = req.body;
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://stream-fighter.com",
                "X-Title": "Stream Fighter",
            },
            body: JSON.stringify({
                model: process.env.OPENROUTER_MODEL?.split(',')[0] || "meta-llama/llama-3.1-8b-instruct",
                messages: [
                    {
                        "role": "user",
                        "content": prompt || "Generate a breaking news headline for a fighting game. Keep it short."
                    }
                ],
                temperature: 0.8,
                max_tokens: 50,
            })
        });

        const data = await response.json();
        const text = data.choices?.[0]?.message?.content?.trim() || "LIVE: BATTLE IN PROGRESS";
        res.json({ text });
    } catch (error) {
        log.error("AI API Error:", error);
        res.status(500).json({ text: "LIVE: SYSTEM ERROR" });
    }
});

// Serve frontend in production (optional, if we build to dist)
app.use(express.static(path.join(__dirname, '../dist')));

// Error handling middleware
app.use((err, req, res, _next) => {
    log.error('Unhandled error:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

app.get('/:path*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Global error handlers
process.on('uncaughtException', (error) => {
    log.error('Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    log.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

app.listen(PORT, () => {
    log.info(`API Server running on port ${PORT}`);
});
