const { execSync } = require('child_process');
try {
  const out = execSync('netstat -ano', { encoding: 'utf8' });
  const lines = out.split(/\r?\n/);
  const pids = new Set();
  for (const line of lines) {
    if (line.includes(':5001')) {
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (/^\d+$/.test(pid)) pids.add(pid);
    }
  }
  if (pids.size === 0) {
    console.log('No process found on port 5001');
    process.exit(0);
  }
  for (const pid of pids) {
    try {
      console.log('Killing PID', pid);
      execSync(`taskkill /PID ${pid} /F`, { stdio: 'inherit' });
    } catch (e) {
      console.error('Failed to kill', pid, e.message);
    }
  }
} catch (e) {
  console.error('Error running netstat:', e.message);
  process.exit(1);
}
