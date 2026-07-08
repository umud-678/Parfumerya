#!/usr/bin/env node

const { execSync } = require('child_process');

// Arqument verilsə yalnız o portlar təmizlənir: node stop-dev.js 5005
const argPorts = process.argv.slice(2).map(Number).filter((p) => p > 0);
const ports = argPorts.length
  ? argPorts
  : [5005, 3000, 3001, 5173, 5174, 5175, 5176, 5177, 5178];
const isWindows = process.platform === 'win32';

function pidsOnPort(port) {
  try {
    if (isWindows) {
      const out = execSync(`netstat -ano -p tcp | findstr LISTENING | findstr :${port}`, {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      });
      const pids = new Set();
      for (const line of out.split('\n')) {
        const cols = line.trim().split(/\s+/);
        // netstat sütunları: Proto, Local Address, Foreign Address, State, PID
        if (cols.length >= 5 && cols[1].endsWith(`:${port}`)) {
          pids.add(cols[cols.length - 1]);
        }
      }
      return [...pids];
    }
    const out = execSync(`lsof -ti :${port}`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    return out ? out.split('\n').filter(Boolean) : [];
  } catch {
    return []; // portda proses yoxdur
  }
}

function killPid(pid) {
  try {
    if (isWindows) {
      execSync(`taskkill /PID ${pid} /T /F`, { stdio: 'ignore' });
    } else {
      process.kill(Number(pid), 'SIGKILL');
    }
    return true;
  } catch {
    return false; // proses artıq çıxıb
  }
}

let killed = 0;

for (const port of ports) {
  for (const pid of pidsOnPort(port)) {
    if (Number(pid) === process.pid) continue;
    if (killPid(pid)) {
      killed += 1;
      console.log(`Stopped process ${pid} on port ${port}`);
    }
  }
}

if (killed === 0) {
  console.log('No dev servers were running.');
} else {
  console.log(`Stopped ${killed} process(es).`);
}
