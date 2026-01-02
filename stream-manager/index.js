const express = require('express');
const Docker = require('dockerode');
const cors = require('cors');

const app = express();
const docker = new Docker({ socketPath: '/var/run/docker.sock' });
const PORT = 3020;

app.use(express.json());
app.use(cors());

// Configuration constants
const NETWORK_NAME = process.env.NETWORK_NAME || 'stream-fighter_default';
const STREAMER_IMAGE = 'stream-fighter-streamer:latest'; // Image we will ensure is built and tagged

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// List active dynamic streamers
app.get('/list', async (req, res) => {
    try {
        const containers = await docker.listContainers({
            all: true,
            filters: { name: ['streamer-dynamic-'] }
        });

        const streams = containers.map(c => ({
            id: c.Id,
            name: c.Names[0].replace('/', ''),
            state: c.State,
            status: c.Status
        }));

        res.json({ streams });
    } catch (error) {
        console.error("List error:", error);
        res.status(500).json({ error: error.message });
    }
});

const axios = require('axios');
const SCREEN_API_URL = process.env.SCREEN_API_URL || 'http://stream-screen:3000/api/stream';

// Start a dynamic streamer
app.post('/start', async (req, res) => {
    const { streamKey, screenId } = req.body;

    if (!streamKey || !screenId) {
        return res.status(400).json({ error: 'Missing streamKey or screenId' });
    }

    try {
        console.log(`Forwarding start request to ${SCREEN_API_URL} for ${streamKey}`);
        const response = await axios.post(SCREEN_API_URL, {
            screenId: screenId,
            streamKey: streamKey
        });

        res.json(response.data);
    } catch (error) {
        console.error("Start error:", error.response?.data || error.message);
        res.status(500).json({
            error: 'Failed to start stream in stream-screen',
            details: error.response?.data || error.message
        });
    }
});


// Stop a dynamic streamer
app.post('/stop', async (req, res) => {
    const { streamKey } = req.body;

    if (!streamKey) {
        return res.status(400).json({ error: 'Missing streamKey' });
    }

    try {
        console.log(`Forwarding stop request for ${streamKey}`);
        const response = await axios.delete(`${SCREEN_API_URL}?streamKey=${streamKey}`);
        res.json(response.data);
    } catch (error) {
        console.error("Stop error:", error.response?.data || error.message);
        res.status(500).json({
            error: 'Failed to stop stream in stream-screen',
            details: error.response?.data || error.message
        });
    }
});


app.listen(PORT, () => {
    console.log(`Stream Manager running on port ${PORT}`);
});
