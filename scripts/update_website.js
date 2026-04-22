const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ANALYTICS_DIR = path.join(process.env.HOME, '.openclaw/workspace/analytics');
const DATA_FILE = path.join(ANALYTICS_DIR, 'data/usage.json');
const REPO_URL = 'https://github.com/raymariner20/life-dashboard.git';
const REPO_DIR = '/tmp/life-dashboard-update';
const GITHUB_API_URL = 'https://api.github.com/repos/raymariner20/life-dashboard/commits?per_page=20';

function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function generateUsageHTML(data) {
  const today = new Date().toISOString().split('T')[0];
  const todayData = data.byDate[today] || { totalTokens: 0, messages: 0 };
  
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  let weekTokens = 0;
  for (const [date, d] of Object.entries(data.byDate)) {
    if (new Date(date) >= weekAgo) {
      weekTokens += d.totalTokens;
    }
  }

  const agentList = Object.entries(data.byAgent)
    .sort((a, b) => b[1].totalTokens - a[1].totalTokens);

  const dates = Object.keys(data.byDate).sort().slice(-14);
  const maxDaily = Math.max(...dates.map(d => data.byDate[d].totalTokens), 1);

  const recentSessions = data.sessions.slice(0, 20);

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Usage - AI Being Labs</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0a0a0a;
            color: #fafafa;
            line-height: 1.6;
        }
        
        .header {
            background: linear-gradient(135deg, #f97316, #f59e0b);
            padding: 20px;
            text-align: center;
        }
        .header h1 { font-size: 1.8rem; margin-bottom: 5px; }
        .header p { opacity: 0.9; }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            padding-bottom: 100px;
        }
        
        .back-link {
            display: inline-block;
            margin-bottom: 20px;
            color: #f97316;
            text-decoration: none;
        }
        .back-link:hover { text-decoration: underline; }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin-bottom: 30px;
        }
        @media (min-width: 768px) {
            .stats-grid { grid-template-columns: repeat(4, 1fr); }
        }
        
        .stat-card {
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 12px;
            padding: 20px;
            text-align: center;
        }
        .stat-number {
            font-size: 2rem;
            font-weight: bold;
            color: #f97316;
        }
        .stat-label {
            font-size: 0.85rem;
            color: #a3a3a3;
            margin-top: 5px;
        }
        
        .card {
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 20px;
        }
        .card h2 {
            color: #f97316;
            margin-bottom: 15px;
            font-size: 1.2rem;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .chart-container {
            height: 150px;
            display: flex;
            align-items: flex-end;
            gap: 4px;
            padding: 10px 0;
        }
        .chart-bar {
            flex: 1;
            background: linear-gradient(to top, #f97316, #f59e0b);
            border-radius: 4px 4px 0 0;
            min-height: 4px;
            position: relative;
            transition: opacity 0.2s;
        }
        .chart-bar:hover { opacity: 0.8; }
        .chart-bar::after {
            content: attr(data-value);
            position: absolute;
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%);
            font-size: 0.7rem;
            color: #a3a3a3;
            opacity: 0;
            transition: opacity 0.2s;
            white-space: nowrap;
        }
        .chart-bar:hover::after { opacity: 1; }
        .chart-labels {
            display: flex;
            justify-content: space-between;
            font-size: 0.75rem;
            color: #6b7280;
            margin-top: 8px;
        }
        
        .agent-table {
            width: 100%;
            border-collapse: collapse;
        }
        .agent-table th {
            text-align: left;
            padding: 12px;
            color: #a3a3a3;
            font-weight: 500;
            font-size: 0.85rem;
            border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .agent-table td {
            padding: 12px;
            border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .agent-table tr:hover td { background: rgba(255,255,255,0.02); }
        .agent-name { font-weight: 500; color: #f97316; }
        .agent-emoji { margin-right: 6px; }
        
        .progress-bar {
            height: 6px;
            background: rgba(255,255,255,0.1);
            border-radius: 3px;
            overflow: hidden;
        }
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #f97316, #f59e0b);
            border-radius: 3px;
        }
        
        .sessions-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.9rem;
        }
        .sessions-table th {
            text-align: left;
            padding: 10px;
            color: #a3a3a3;
            font-weight: 500;
            font-size: 0.8rem;
            border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .sessions-table td {
            padding: 10px;
            border-bottom: 1px solid rgba(255,255,255,0.05);
            color: #d1d5db;
        }
        .sessions-table tr:hover td { background: rgba(255,255,255,0.02); }
        .session-id { font-family: monospace; font-size: 0.8rem; color: #6b7280; }
        
        .model-tag {
            display: inline-block;
            padding: 2px 8px;
            background: rgba(249,115,22,0.2);
            color: #f97316;
            border-radius: 4px;
            font-size: 0.75rem;
        }
        
        .commits-container { max-height: 400px; overflow-y: auto; }
        .commit-item {
            display: flex;
            gap: 12px;
            padding: 12px;
            border-bottom: 1px solid rgba(255,255,255,0.05);
            transition: background 0.2s;
        }
        .commit-item:hover { background: rgba(255,255,255,0.02); }
        .commit-avatar {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: linear-gradient(135deg, #f97316, #f59e0b);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.9rem;
            flex-shrink: 0;
        }
        .commit-content { flex: 1; min-width: 0; }
        .commit-message {
            color: #fafafa;
            font-size: 0.9rem;
            margin-bottom: 4px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .commit-meta {
            display: flex;
            gap: 8px;
            font-size: 0.8rem;
            color: #6b7280;
        }
        .commit-author { color: #f97316; }
        .commit-date { color: #a3a3a3; }
        .commit-sha { font-family: monospace; font-size: 0.75rem; color: #4b5563; }
        .loading-commits { text-align: center; padding: 20px; color: #6b7280; }
        .error-commits { text-align: center; padding: 20px; color: #ef4444; }
        .refresh-btn {
            background: rgba(249,115,22,0.2);
            color: #f97316;
            border: none;
            padding: 6px 12px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.8rem;
            margin-left: auto;
        }
        .refresh-btn:hover { background: rgba(249,115,22,0.3); }
        
        .footer {
            text-align: center;
            padding: 20px;
            color: #6b7280;
            font-size: 0.85rem;
        }
        
        @media (max-width: 640px) {
            .agent-table, .sessions-table { font-size: 0.8rem; }
            .agent-table th, .agent-table td,
            .sessions-table th, .sessions-table td { padding: 8px; }
            .chart-container { height: 100px; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📊 LLM Usage Analytics</h1>
        <p>Token consumption across all OpenClaw agents</p>
    </div>
    
    <div class="container">
        <a href="index.html" class="back-link">← Back to Dashboard</a>
        
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-number">${formatNumber(data.total.totalTokens)}</div>
                <div class="stat-label">Total Tokens</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${formatNumber(todayData.totalTokens)}</div>
                <div class="stat-label">Today</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${formatNumber(weekTokens)}</div>
                <div class="stat-label">This Week</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${data.total.sessions}</div>
                <div class="stat-label">Sessions</div>
            </div>
        </div>
        
        <div class="card">
            <h2>📈 Daily Usage (Last 14 Days)</h2>
            <div class="chart-container">
                ${dates.map(date => {
                  const dayData = data.byDate[date] || { totalTokens: 0 };
                  const height = maxDaily > 0 ? (dayData.totalTokens / maxDaily * 100) : 0;
                  return `<div class="chart-bar" style="height: ${Math.max(height, 4)}%" data-value="${formatNumber(dayData.totalTokens)}"></div>`;
                }).join('')}
            </div>
            <div class="chart-labels">
                <span>${dates.length > 0 ? formatDate(dates[0]) : '-'}</span>
                <span>Today</span>
            </div>
        </div>
        
        <div class="card">
            <h2 style="display: flex; justify-content: space-between; align-items: center;">
                <span>🐙 Recent Commits</span>
                <button class="refresh-btn" onclick="fetchCommits()">↻ Refresh</button>
            </h2>
            <div id="commits-container" class="commits-container">
                <div class="loading-commits">Loading commits...</div>
            </div>
        </div>
        
        <div class="card">
            <h2>🤖 Usage by Agent</h2>
            <table class="agent-table">
                <thead>
                    <tr>
                        <th>Agent</th>
                        <th>Tokens</th>
                        <th>Sessions</th>
                        <th>Distribution</th>
                    </tr>
                </thead>
                <tbody>
                    ${agentList.map(([agent, agentData]) => {
                      const percent = data.total.totalTokens > 0 
                        ? (agentData.totalTokens / data.total.totalTokens * 100).toFixed(1) 
                        : 0;
                      const emoji = agent === 'main' ? '🦞' : 
                                   agent === 'researcher' ? '🔬' :
                                   agent === 'webmaster' ? '🌐' :
                                   agent === 'analytics' ? '📊' : '🤖';
                      return `<tr>
                        <td><span class="agent-emoji">${emoji}</span><span class="agent-name">${agent}</span></td>
                        <td>${formatNumber(agentData.totalTokens)}</td>
                        <td>${agentData.sessions}</td>
                        <td>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${percent}%"></div>
                            </div>
                            <small style="color: #6b7280;">${percent}%</small>
                        </td>
                      </tr>`;
                    }).join('')}
                </tbody>
            </table>
        </div>
        
        <div class="card">
            <h2>🧠 Usage by Model</h2>
            <table class="agent-table">
                <thead>
                    <tr>
                        <th>Model</th>
                        <th>Tokens</th>
                        <th>Messages</th>
                        <th>Cache Hit</th>
                    </tr>
                </thead>
                <tbody>
                    ${Object.entries(data.byModel).map(([model, modelData]) => {
                      const cacheHit = modelData.input + modelData.cacheRead > 0
                        ? (modelData.cacheRead / (modelData.input + modelData.cacheRead) * 100).toFixed(1)
                        : 0;
                      return `<tr>
                        <td><span class="model-tag">${model}</span></td>
                        <td>${formatNumber(modelData.totalTokens)}</td>
                        <td>${formatNumber(modelData.messages)}</td>
                        <td>${cacheHit}%</td>
                      </tr>`;
                    }).join('')}
                </tbody>
            </table>
        </div>
        
        <div class="card">
            <h2>📝 Recent Sessions</h2>
            <table class="sessions-table">
                <thead>
                    <tr>
                        <th>Time</th>
                        <th>Agent</th>
                        <th>Model</th>
                        <th>Tokens</th>
                    </tr>
                </thead>
                <tbody>
                    ${recentSessions.map(session => {
                      const time = session.date 
                        ? new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                        : '-';
                      return `<tr>
                        <td class="session-id">${time}</td>
                        <td>${session.agent}</td>
                        <td><span class="model-tag">${session.model}</span></td>
                        <td>${formatNumber(session.tokens)}</td>
                      </tr>`;
                    }).join('')}
                </tbody>
            </table>
        </div>
        
        <div class="footer">
            <p>Last updated: ${new Date().toLocaleString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              hour: '2-digit', 
              minute: '2-digit'
            })}</p>
            <p style="margin-top: 5px; font-size: 0.75rem;">OpenClaw Analytics Agent</p>
        </div>
    </div>

    <script>
        const GITHUB_API_URL = '${GITHUB_API_URL}';
        
        function formatTimeAgo(dateString) {
            const date = new Date(dateString);
            const now = new Date();
            const diffMs = now - date;
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);
            
            if (diffMins < 1) return 'just now';
            if (diffMins < 60) return diffMins + ' min ago';
            if (diffHours < 24) return diffHours + ' hour' + (diffHours > 1 ? 's' : '') + ' ago';
            if (diffDays === 1) return 'yesterday';
            if (diffDays < 7) return diffDays + ' days ago';
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
        
        function getInitials(name) {
            return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        }
        
        async function fetchCommits() {
            const container = document.getElementById('commits-container');
            container.innerHTML = '<div class="loading-commits">Loading commits...</div>';
            
            try {
                const response = await fetch(GITHUB_API_URL, {
                    headers: { 'Accept': 'application/vnd.github.v3+json' }
                });
                
                if (!response.ok) throw new Error('Failed to fetch commits');
                
                const commits = await response.json();
                
                if (!commits || commits.length === 0) {
                    container.innerHTML = '<div class="loading-commits">No commits found</div>';
                    return;
                }
                
                container.innerHTML = commits.map(commit => {
                    const message = commit.commit.message.split('\\n')[0];
                    const author = commit.commit.author.name;
                    const date = commit.commit.author.date;
                    const sha = commit.sha.slice(0, 7);
                    const url = commit.html_url;
                    
                    return \`<div class="commit-item">
                        <div class="commit-avatar">\${getInitials(author)}</div>
                        <div class="commit-content">
                            <div class="commit-message" title="\${message}">\${message}</div>
                            <div class="commit-meta">
                                <span class="commit-author">\${author}</span>
                                <span class="commit-date">\${formatTimeAgo(date)}</span>
                                <a href="\${url}" target="_blank" class="commit-sha">\${sha}</a>
                            </div>
                        </div>
                    </div>\`;
                }).join('');
                
            } catch (error) {
                container.innerHTML = \`<div class="error-commits">
                    <p>Failed to load commits</p>
                    <p style="font-size: 0.8rem; margin-top: 8px;">\${error.message}</p>
                    <button class="refresh-btn" style="margin-top: 12px;" onclick="fetchCommits()">Try Again</button>
                </div>\`;
            }
        }
        
        fetchCommits();
        setInterval(fetchCommits, 300000);
    </script>
</body>
</html>`;
}

function updateWebsite() {
  console.log('Updating website...');
  
  if (!fs.existsSync(DATA_FILE)) {
    console.error('Usage data not found. Run collect_usage.js first.');
    process.exit(1);
  }
  
  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  
  try {
    if (fs.existsSync(REPO_DIR)) {
      console.log('Updating existing repo...');
      execSync('git pull', { cwd: REPO_DIR, stdio: 'inherit' });
    } else {
      console.log('Cloning repo...');
      execSync('git clone ' + REPO_URL + ' ' + REPO_DIR, { stdio: 'inherit' });
    }
  } catch (e) {
    console.error('Git operation failed:', e.message);
    process.exit(1);
  }
  
  const html = generateUsageHTML(data);
  fs.writeFileSync(path.join(REPO_DIR, 'usage.html'), html);
  
  try {
    execSync('git add usage.html', { cwd: REPO_DIR });
    
    const status = execSync('git status --porcelain', { cwd: REPO_DIR, encoding: 'utf8' });
    if (!status.trim()) {
      console.log('No changes to commit');
      return;
    }
    
    execSync('git commit -m "Update usage data - ' + new Date().toISOString() + '"', { 
      cwd: REPO_DIR, 
      stdio: 'inherit' 
    });
    execSync('git push', { cwd: REPO_DIR, stdio: 'inherit' });
    console.log('Website updated successfully!');
    console.log('View at: https://raymariner20.github.io/life-dashboard/usage.html');
  } catch (e) {
    console.error('Git commit/push failed:', e.message);
    process.exit(1);
  }
}

updateWebsite();
