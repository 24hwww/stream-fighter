#!/usr/bin/env node

/**
 * Force Port 3000 Script
 * Kills any process using port 3000 and ensures it's free for stream-screen
 */

import { execSync } from 'child_process';

const TARGET_PORT = 3000;

function log(message) {
    console.log(`[ForcePort] ${message}`);
}

function findProcessOnPort(port) {
    try {
        // Use lsof to find process using the port
        const output = execSync(`lsof -ti:${port}`, { encoding: 'utf8' });
        return output.trim().split('\n').filter(pid => pid);
    } catch (error) {
        // No process found on port (lsof returns exit code 1)
        return [];
    }
}

function killProcess(pid) {
    try {
        log(`Killing process ${pid}...`);
        execSync(`kill -9 ${pid}`);
        log(`Process ${pid} terminated`);
        return true;
    } catch (error) {
        log(`Failed to kill process ${pid}: ${error.message}`);
        return false;
    }
}

function forcePort(port) {
    log(`Checking port ${port}...`);

    const pids = findProcessOnPort(port);

    if (pids.length === 0) {
        log(`Port ${port} is free ✓`);
        return true;
    }

    log(`Found ${pids.length} process(es) using port ${port}`);

    let allKilled = true;
    for (const pid of pids) {
        if (!killProcess(pid)) {
            allKilled = false;
        }
    }

    // Wait a moment for processes to fully terminate
    const sleep = (ms) => execSync(`sleep ${ms / 1000}`);
    sleep(500);

    // Verify port is now free
    const remainingPids = findProcessOnPort(port);
    if (remainingPids.length > 0) {
        log(`ERROR: Port ${port} still in use by process(es): ${remainingPids.join(', ')}`);
        return false;
    }

    log(`Port ${port} is now free ✓`);
    return true;
}

// Main execution
const success = forcePort(TARGET_PORT);
process.exit(success ? 0 : 1);
