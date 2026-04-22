const fs = require('fs');
const path = require('path');

const OPENCLAW_DIR = path.join(process.env.HOME, '.openclaw');
const AGENTS_DIR = path.join(OPENCLAW_DIR, 'agents');
const OUTPUT_DIR = path.join(process.env.HOME, '.openclaw/workspace/analytics/data');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'usage.json');
const HISTORY_FILE = path.join(OUTPUT_DIR, 'history.json');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readSessionFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.trim().split('\n').filter(line => line.trim());
    return lines.map(line => {
      try {
        return JSON.parse(line);
      } catch (e) {
        return null;
      }
    }).filter(Boolean);
  } catch (e) {
    return [];
  }
}

function extractUsageFromEntry(entry) {
  if (!entry) return null;
  
  if (entry.type === 'message' && entry.message) {
    const usage = entry.message.usage;
    if (!usage) return null;
    
    return {
      input: usage.input || 0,
      output: usage.output || 0,
      cacheRead: usage.cacheRead || 0,
      cacheWrite: usage.cacheWrite || 0,
      totalTokens: usage.totalTokens || (usage.input + usage.output) || 0,
      cost: usage.cost?.total || 0
    };
  }
  
  return null;
}

function getModelFromEntry(entry) {
  if (entry.type === 'message' && entry.message) {
    return entry.message.model || entry.message.providerModel || 'unknown';
  }
  return 'unknown';
}

function getTimestamp(entry) {
  return entry.timestamp || Date.now();
}

function formatDate(timestamp) {
  const date = new Date(timestamp);
  return date.toISOString().split('T')[0];
}

function collectUsage() {
  const usage = {
    total: {
      input: 0,
      output: 0,
      cacheRead: 0,
      cacheWrite: 0,
      totalTokens: 0,
      cost: 0,
      sessions: 0,
      messages: 0
    },
    byAgent: {},
    byModel: {},
    byDate: {},
    sessions: [],
    lastUpdated: new Date().toISOString()
  };

  if (!fs.existsSync(AGENTS_DIR)) {
    console.error('Agents directory not found:', AGENTS_DIR);
    return usage;
  }

  const agents = fs.readdirSync(AGENTS_DIR).filter(name => {
    return fs.statSync(path.join(AGENTS_DIR, name)).isDirectory();
  });

  console.log('Found ' + agents.length + ' agents: ' + agents.join(', '));

  for (const agent of agents) {
    const sessionsDir = path.join(AGENTS_DIR, agent, 'sessions');
    if (!fs.existsSync(sessionsDir)) {
      continue;
    }

    const sessionFiles = fs.readdirSync(sessionsDir).filter(f => f.endsWith('.jsonl'));
    
    for (const sessionFile of sessionFiles) {
      const sessionPath = path.join(sessionsDir, sessionFile);
      const entries = readSessionFile(sessionPath);
      
      if (entries.length === 0) continue;

      const sessionId = sessionFile.replace('.jsonl', '');
      let sessionTokens = 0;
      let sessionCost = 0;
      let sessionModel = 'unknown';
      let sessionDate = null;

      for (const entry of entries) {
        const entryUsage = extractUsageFromEntry(entry);
        if (entryUsage) {
          sessionTokens += entryUsage.totalTokens;
          sessionCost += entryUsage.cost;
          
          usage.total.input += entryUsage.input;
          usage.total.output += entryUsage.output;
          usage.total.cacheRead += entryUsage.cacheRead;
          usage.total.cacheWrite += entryUsage.cacheWrite;
          usage.total.totalTokens += entryUsage.totalTokens;
          usage.total.cost += entryUsage.cost;
          usage.total.messages++;

          const model = getModelFromEntry(entry);
          const timestamp = getTimestamp(entry);
          const date = formatDate(timestamp);
          
          if (model !== 'unknown') sessionModel = model;
          if (!sessionDate) sessionDate = date;

          if (!usage.byModel[model]) {
            usage.byModel[model] = {
              input: 0, output: 0, cacheRead: 0, cacheWrite: 0,
              totalTokens: 0, cost: 0, messages: 0
            };
          }
          usage.byModel[model].input += entryUsage.input;
          usage.byModel[model].output += entryUsage.output;
          usage.byModel[model].cacheRead += entryUsage.cacheRead;
          usage.byModel[model].cacheWrite += entryUsage.cacheWrite;
          usage.byModel[model].totalTokens += entryUsage.totalTokens;
          usage.byModel[model].cost += entryUsage.cost;
          usage.byModel[model].messages++;

          if (!usage.byDate[date]) {
            usage.byDate[date] = {
              input: 0, output: 0, cacheRead: 0, cacheWrite: 0,
              totalTokens: 0, cost: 0, messages: 0
            };
          }
          usage.byDate[date].input += entryUsage.input;
          usage.byDate[date].output += entryUsage.output;
          usage.byDate[date].cacheRead += entryUsage.cacheRead;
          usage.byDate[date].cacheWrite += entryUsage.cacheWrite;
          usage.byDate[date].totalTokens += entryUsage.totalTokens;
          usage.byDate[date].cost += entryUsage.cost;
          usage.byDate[date].messages++;
        }
      }

      usage.total.sessions++;
      usage.sessions.push({
        id: sessionId,
        agent: agent,
        model: sessionModel,
        date: sessionDate,
        tokens: sessionTokens,
        cost: sessionCost,
        messages: entries.length
      });

      if (!usage.byAgent[agent]) {
        usage.byAgent[agent] = {
          input: 0, output: 0, cacheRead: 0, cacheWrite: 0,
          totalTokens: 0, cost: 0, sessions: 0, messages: 0
        };
      }
      usage.byAgent[agent].input += sessionTokens;
      usage.byAgent[agent].totalTokens += sessionTokens;
      usage.byAgent[agent].cost += sessionCost;
      usage.byAgent[agent].sessions++;
      usage.byAgent[agent].messages += entries.length;
    }
  }

  usage.sessions.sort((a, b) => new Date(b.date) - new Date(a.date));

  return usage;
}

function updateHistory(usage) {
  let history = {};
  if (fs.existsSync(HISTORY_FILE)) {
    try {
      history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
    } catch (e) {
      history = {};
    }
  }

  const today = new Date().toISOString().split('T')[0];
  history[today] = {
    totalTokens: usage.total.totalTokens,
    cost: usage.total.cost,
    sessions: usage.total.sessions,
    timestamp: new Date().toISOString()
  };

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);
  
  const filtered = {};
  for (const [date, data] of Object.entries(history)) {
    if (new Date(date) >= cutoff) {
      filtered[date] = data;
    }
  }

  fs.writeFileSync(HISTORY_FILE, JSON.stringify(filtered, null, 2));
  return filtered;
}

function main() {
  console.log('Collecting token usage data...');
  
  ensureDir(OUTPUT_DIR);
  
  const usage = collectUsage();
  const history = updateHistory(usage);
  
  usage.history = history;
  
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(usage, null, 2));
  
  console.log('\nUsage Summary:');
  console.log('  Total Tokens: ' + usage.total.totalTokens.toLocaleString());
  console.log('  Input: ' + usage.total.input.toLocaleString());
  console.log('  Output: ' + usage.total.output.toLocaleString());
  console.log('  Cache Read: ' + usage.total.cacheRead.toLocaleString());
  console.log('  Sessions: ' + usage.total.sessions);
  console.log('  Messages: ' + usage.total.messages);
  console.log('  Cost: $' + usage.total.cost.toFixed(4));
  console.log('\n  By Agent:');
  for (const [agent, data] of Object.entries(usage.byAgent)) {
    console.log('    ' + agent + ': ' + data.totalTokens.toLocaleString() + ' tokens, ' + data.sessions + ' sessions');
  }
  console.log('\n  By Model:');
  for (const [model, data] of Object.entries(usage.byModel)) {
    console.log('    ' + model + ': ' + data.totalTokens.toLocaleString() + ' tokens');
  }
  
  console.log('\nData saved to ' + OUTPUT_FILE);
}

main();
