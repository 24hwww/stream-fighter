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

// Start a dynamic streamer
app.post('/start', async (req, res) => {
    const { streamKey, targetUrl } = req.body;

    if (!streamKey || !targetUrl) {
        return res.status(400).json({ error: 'Missing streamKey or targetUrl' });
    }

    const containerName = `streamer-dynamic-${streamKey}`;

    try {
        // Check if already running
        const existing = await docker.listContainers({ filters: { name: [containerName] } });
        if (existing.length > 0) {
            return res.status(409).json({ error: 'Streamer for this key already exists', containerId: existing[0].Id });
        }

        // Get network ID to connect (using the first network of the manager usually works if in same compose)
        // Or we rely on the hardcoded network name. 
        // Better: inspect self to find network? For simplicity, we use the predictable compose network name.

        // Get environment variables passed from this manager or defaults
        // We need: RTMP_URL (usually internal restreamer URL)
        const RTMP_URL = process.env.RTMP_URL || 'rtmp://restreamer:1935/live';

        const container = await docker.createContainer({
            Image: STREAMER_IMAGE,
            name: containerName,
            Env: [
                `STREAM_KEY=${streamKey}`,
                `TARGET_URL=${targetUrl}`,
                `RTMP_URL=${RTMP_URL}`,
                // Pass other necessary secrets if needed, but for now we assume they are baked or standard
            ],
            HostConfig: {
                NetworkMode: NETWORK_NAME, // Important to connect to webapp and restreamer
                AutoRemove: true, // Ephemeral: remove when stopped
                ShmSize: 268435456, // 256MB SHM for Chrome
                Memory: 1024 * 1024 * 1024, // 1GB Limit
            }
        });

        await container.start();
        console.log(`Started container ${containerName}`);

        res.json({ status: 'started', containerId: container.id, name: containerName });

    } catch (error) {
        console.error("Start error:", error);
        res.status(500).json({ error: error.message });
    }
});

// Stop a dynamic streamer
app.post('/stop', async (req, res) => {
    const { streamKey } = req.body;

    if (!streamKey) {
        return res.status(400).json({ error: 'Missing streamKey' });
    }

    const containerName = `streamer-dynamic-${streamKey}`;

    try {
        const container = docker.getContainer(containerName);

        // Inspect checks if it exists
        try {
            await container.inspect();
        } catch (e) {
            return res.status(404).json({ error: 'Container not found' });
        }

        await container.stop(); // AutoRemove will handle deletion

        res.json({ status: 'stopped', name: containerName });

    } catch (error) {
        console.error("Stop error:", error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Stream Manager running on port ${PORT}`);
});
