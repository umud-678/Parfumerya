#!/usr/bin/env node

const { execSync } = require('child_process');

const ports = [5005, 3000, 3001, 5173, 5174, 5175, 5176, 5177, 5178];
let killed = 0;

for (const port of ports) {
  try {
    const pids = execSync(`lsof -ti :${port}`, { encoding: 'utf8' }).trim();
    if (!pids) continue;

    for (const pid of pids.split('\n').filter(Boolean)) {
      try {
        process.kill(Number(pid), 'SIGKILL');
        killed += 1;
        console.log(`Stopped process ${pid} on port ${port}`);
      } catch {
        // process already exited
      }
    }
  } catch {
    // no process on this port
  }
}

if (killed === 0) {
  console.log('No dev servers were running.');
} else {
  console.log(`Stopped ${killed} process(es).`);
}
