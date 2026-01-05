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
    // If running in Docker, we might want to be less aggressive or skip
    // because each service has its own container network
    if (process.env.IS_DOCKER || process.env.NODE_ENV === 'production') {
        // Still, some users want it, so let's try but be very careful
    }

    try {
        // Use lsof to find process using the port
        // -t: terse output (PIDs only)
        // -i: select by ip
        const output = execSync(`lsof -ti:${port}`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });

        // Robust split and filter:
        // 1. Split by any whitespace or newline
        // 2. Trim each part
        // 3. Keep only parts that are composed purely of digits
        // 4. Ensure uniqueness
        const pids = output.split(/[\s\n]+/)
            .map(p => p.trim())
            .filter(p => /^\d+$/.test(p));

        return [...new Set(pids)];
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
    if (process.env.SKIP_FORCE_PORT === 'true') {
        log(`Skipping port forcing as SKIP_FORCE_PORT is set.`);
        return true;
    }

    log(`Checking port ${port}...`);

    const pids = findProcessOnPort(port);
    const selfPid = process.pid.toString();

    // Filter out PID 1, PID 0, and itself to avoid container crash or self-termination
    const pidsToKill = pids.filter(pid => pid !== "1" && pid !== "0" && pid !== selfPid);

    if (pidsToKill.length === 0) {
        if (pids.includes("1")) {
            log(`Port ${port} is used by PID 1 (Init). Skipping to avoid container crash.`);
            return true;
        }
        log(`Port ${port} is free or managed by Init ✓`);
        return true;
    }

    log(`Found ${pidsToKill.length} killable process(es) using port ${port}`);

    let allKilled = true;
    for (const pid of pidsToKill) {
        if (!killProcess(pid)) {
            allKilled = false;
        }
    }

    // Wait a moment for processes to fully terminate
    const sleep = (ms) => {
        const start = Date.now();
        while (Date.now() - start < ms) {
            // sync sleep
        }
    };
    sleep(500);

    // Verify port is now free (excluding PID 1)
    const remainingPids = findProcessOnPort(port).filter(pid => pid !== "1" && pid !== selfPid);
    if (remainingPids.length > 0) {
        log(`ERROR: Port ${port} still in use by process(es): ${remainingPids.join(', ')}`);
        return false;
    }

    log(`Port ${port} is now free (or managed by Init) ✓`);
    return true;
}

// Main execution
const portArg = process.argv[2];
const portToForce = portArg ? parseInt(portArg, 10) : TARGET_PORT;

if (isNaN(portToForce)) {
    log(`ERROR: Invalid port argument: ${portArg}`);
    process.exit(1);
}

const success = forcePort(portToForce);
process.exit(success ? 0 : 1);
