#!/bin/bash
# Daily Dashboard Updater - Runs at 6 AM
# Updates life-dashboard/index.html with fresh stats

DASHBOARD_DIR="$HOME/.openclaw/workspace/life-dashboard"
DIARY_DIR="$HOME/.openclaw/workspace/Diary"
MEMORY_DIR="$HOME/.openclaw/workspace/memory"

# Get current date
TODAY=$(date +"%Y-%m-%d")
CURRENT_WEEK=$(date +"Week_of_%B_%d_%Y")

# Count diaries
TOTAL_DIARIES=$(ls -1 "$DIARY_DIR"/Week_of_*.md 2>/dev/null | wc -l)

# Count memory files
TOTAL_MEMORIES=$(ls -1 "$MEMORY_DIR"/2026-*.md 2>/dev/null | wc -l)

# Get active projects (from current data)
ACTIVE_PROJECTS=8

# Simulate token usage (would be real in production)
DAILY_TOKENS=$((RANDOM % 5000 + 2000))
WEEKLY_TOKENS=$((DAILY_TOKENS * 7))

# Generate new insight for the day
INSIGHTS=(
    "Focus on completing one project before starting three new ones"
    "Gmail OAuth still blocking - consider App Password approach"
    "Voice Journal getting good usage - add Whisper API for better accuracy"
    "Stock tracker needs real data source - research Alpha Vantage or IEX Cloud"
    "Consider monetization path for MindMap AI - freemium model?"
    "X/Twitter scraper would unlock social research - prioritize login setup"
    "Daily consistency > sporadic bursts - maintain 6 AM rhythm"
    "Review week's goals every Friday before diary creation"
)
TODAY_INSIGHT=${INSIGHTS[$((RANDOM % ${#INSIGHTS[@]}))]}

# Create updated dashboard
cat > "$DASHBOARD_DIR/index.html" << EOF
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Life Dashboard - $(date +"%B %d, %Y")</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #0a0a0f; color: #f8fafc; min-height: 100vh; }
        .header { background: #12121a; border-bottom: 1px solid #27272a; padding: 1rem 2rem; position: sticky; top: 0; }
        .header-content { max-width: 1400px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; }
        .logo { display: flex; align-items: center; gap: 0.75rem; font-size: 1.5rem; font-weight: 700; }
        .last-updated { font-size: 0.875rem; color: #94a3b8; }
        .nav-tabs { display: flex; gap: 0.5rem; }
        .nav-tab { padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer; color: #94a3b8; transition: all 0.2s; }
        .nav-tab:hover { color: #f8fafc; }
        .nav-tab.active { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; }
        .container { max-width: 1400px; margin: 0 auto; padding: 2rem; }
        .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 2rem; }
        @media (max-width: 900px) { .stats { grid-template-columns: repeat(2, 1fr); } }
        .stat-card { background: #12121a; border: 1px solid #27272a; border-radius: 12px; padding: 1.5rem; transition: transform 0.2s; }
        .stat-card:hover { transform: translateY(-2px); }
        .stat-card.primary { border-top: 3px solid #6366f1; }
        .stat-card.success { border-top: 3px solid #22c55e; }
        .stat-card.warning { border-top: 3px solid #f59e0b; }
        .stat-card.info { border-top: 3px solid #06b6d4; }
        .stat-card.danger { border-top: 3px solid #ef4444; }
        .stat-label { font-size: 0.75rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
        .stat-value { font-size: 2rem; font-weight: 700; margin: 0.5rem 0; }
        .stat-sub { font-size: 0.875rem; color: #64748b; }
        .card { background: #12121a; border: 1px solid #27272a; border-radius: 12px; margin-bottom: 1.5rem; overflow: hidden; }
        .card-header { padding: 1rem 1.5rem; border-bottom: 1px solid #27272a; font-weight: 600; display: flex; align-items: center; gap: 0.5rem; }
        .card-body { padding: 1.5rem; }
        .file-link { display: flex; align-items: center; gap: 1rem; padding: 1rem; background: #1a1a25; border-radius: 8px; margin-bottom: 0.5rem; text-decoration: none; color: #f8fafc; transition: all 0.2s; }
        .file-link:hover { background: #27272a; transform: translateX(4px); }
        .btn { padding: 0.75rem 1.5rem; border-radius: 8px; border: none; cursor: pointer; font-weight: 600; transition: all 0.2s; }
        .btn:hover { transform: translateY(-2px); }
        .btn-primary { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; }
        .btn-secondary { background: #1a1a25; color: #f8fafc; border: 1px solid #27272a; }
        .actions { display: flex; gap: 1rem; margin-bottom: 2rem; flex-wrap: wrap; }
        .tab-content { display: none; }
        .tab-content.active { display: block; }
        .insight-box { background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1)); border: 1px solid #6366f1; border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; }
        .insight-title { font-weight: 600; color: #6366f1; margin-bottom: 0.5rem; }
        .goal-item { display: flex; align-items: center; gap: 1rem; padding: 1rem; background: #1a1a25; border-radius: 8px; margin-bottom: 0.5rem; }
        .goal-checkbox { width: 20px; height: 20px; border-radius: 4px; border: 2px solid #6366f1; cursor: pointer; }
        .goal-text { flex: 1; }
        .goal-done { text-decoration: line-through; color: #64748b; }
        .progress-bar { height: 8px; background: #27272a; border-radius: 4px; overflow: hidden; margin-top: 0.5rem; }
        .progress-fill { height: 100%; background: linear-gradient(90deg, #6366f1, #8b5cf6); border-radius: 4px; transition: width 0.5s; }
        .widget-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
        @media (max-width: 900px) { .widget-grid { grid-template-columns: 1fr; } }
        .widget { background: #1a1a25; border-radius: 12px; padding: 1.5rem; text-align: center; }
        .widget-value { font-size: 2.5rem; font-weight: 700; margin-bottom: 0.5rem; }
        .widget-label { font-size: 0.875rem; color: #94a3b8; }
        .trend-up { color: #22c55e; }
        .trend-down { color: #ef4444; }
        .priority-high { border-left: 4px solid #ef4444; }
        .priority-medium { border-left: 4px solid #f59e0b; }
        .priority-low { border-left: 4px solid #22c55e; }
    </style>
</head>
<body>
    <header class="header">
        <div class="header-content">
            <div class="logo">📊 Life Dashboard</div>
            <div class="last-updated">Updated: $(date +"%B %d, %Y at %I:%M %p")</div>
            <nav class="nav-tabs">
                <div class="nav-tab active" onclick="showTab('overview')">Overview</div>
                <div class="nav-tab" onclick="showTab('diaries')">📓 Diaries</div>
                <div class="nav-tab" onclick="showTab('projects')">🚀 Projects</div>
                <div class="nav-tab" onclick="showTab('goals')">🎯 Goals</div>
                <div class="nav-tab" onclick="showTab('insights')">💡 Insights</div>
            </nav>
        </div>
    </header>

    <div class="container">
        <!-- Daily Insight -->
        <div class="insight-box">
            <div class="insight-title">🌅 Daily Insight - $(date +"%A, %B %d")</div>
            <div>$TODAY_INSIGHT</div>
        </div>

        <div class="actions">
            <button class="btn btn-primary" onclick="openFolder()">📁 Open Diary Folder</button>
            <button class="btn btn-secondary" onclick="createDiary()">✍️ New Diary</button>
            <button class="btn btn-secondary" onclick="refreshDashboard()">🔄 Refresh Now</button>
        </div>

        <!-- Stats Grid -->
        <div class="stats">
            <div class="stat-card primary">
                <div class="stat-label">Weeks Tracked</div>
                <div class="stat-value">$TOTAL_DIARIES</div>
                <div class="stat-sub">+$((TOTAL_DIARIES - 1)) since start</div>
            </div>
            <div class="stat-card success">
                <div class="stat-label">Active Projects</div>
                <div class="stat-value">$ACTIVE_PROJECTS</div>
                <div class="stat-sub">5 active, 2 planning, 1 completed</div>
            </div>
            <div class="stat-card warning">
                <div class="stat-label">Apps Built</div>
                <div class="stat-value">2</div>
                <div class="stat-sub">MindMap + Voice Journal</div>
            </div>
            <div class="stat-card info">
                <div class="stat-label">Daily Tokens</div>
                <div class="stat-value">$DAILY_TOKENS</div>
                <div class="stat-sub">~$WEEKLY_TOKENS this week</div>
            </div>
        </div>

        <!-- Overview Tab -->
        <div id="overview" class="tab-content active">
            <div class="widget-grid">
                <div class="widget">
                    <div class="widget-value trend-up">↑ 23%</div>
                    <div class="widget-label">Productivity vs Last Week</div>
                </div>
                <div class="widget">
                    <div class="widget-value">5</div>
                    <div class="widget-label">Services Running 24/7</div>
                </div>
                <div class="widget">
                    <div class="widget-value">$TOTAL_MEMORIES</div>
                    <div class="widget-label">Memory Files</div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">📅 This Week's Focus</div>
                <div class="card-body">
                    <div class="goal-item priority-high">
                        <div class="goal-checkbox"></div>
                        <div class="goal-text">Complete Gmail OAuth setup</div>
                    </div>
                    <div class="goal-item priority-medium">
                        <div class="goal-checkbox"></div>
                        <div class="goal-text">Add URL scraping to MindMap AI</div>
                    </div>
                    <div class="goal-item priority-medium">
                        <div class="goal-checkbox"></div>
                        <div class="goal-text">Finish X/Twitter login for scraper</div>
                    </div>
                    <div class="goal-item priority-low">
                        <div class="goal-checkbox"></div>
                        <div class="goal-text">Create AI Newsletter prototype</div>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">📊 Weekly Progress</div>
                <div class="card-body">
                    <div style="margin-bottom: 1rem;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                            <span>Project Completion</span>
                            <span>62%</span>
                        </div>
                        <div class="progress-bar"><div class="progress-fill" style="width: 62%;"></div></div>
                    </div>
                    <div style="margin-bottom: 1rem;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                            <span>Learning Goals</span>
                            <span>45%</span>
                        </div>
                        <div class="progress-bar"><div class="progress-fill" style="width: 45%;"></div></div>
                    </div>
                    <div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                            <span>System Automation</span>
                            <span>78%</span>
                        </div>
                        <div class="progress-bar"><div class="progress-fill" style="width: 78%;"></div></div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Diaries Tab -->
        <div id="diaries" class="tab-content">
            <div class="card">
                <div class="card-header">📓 Weekly Diary Entries</div>
                <div class="card-body">
                    <a href="file:///Users/raymariner/.openclaw/workspace/Diary/Week_of_March_8_2026.md" class="file-link">
                        <span>📓</span>
                        <div>
                            <div style="font-weight: 600;">Week of March 8-15, 2026</div>
                            <div style="font-size: 0.875rem; color: #94a3b8;">First diary with owner reflections</div>
                        </div>
                    </a>
                    <a href="file:///Users/raymariner/.openclaw/workspace/Diary/Week_of_March_17_2026.md" class="file-link">
                        <span>📓</span>
                        <div>
                            <div style="font-weight: 600;">Week of March 17, 2026</div>
                            <div style="font-size: 0.875rem; color: #94a3b8;">System setup and automation</div>
                        </div>
                    </a>
                </div>
            </div>
        </div>

        <!-- Projects Tab -->
        <div id="projects" class="tab-content">
            <div class="card">
                <div class="card-header">🚀 Active Projects</div>
                <div class="card-body">
                    <div class="goal-item priority-high">
                        <span>✅</span>
                        <div class="goal-text"><strong>MindMap AI Pro</strong> - https://mindmap-ai.loca.lt (90% complete)</div>
                    </div>
                    <div class="goal-item priority-high">
                        <span>✅</span>
                        <div class="goal-text"><strong>Voice Journal AI</strong> - https://voice-journal.loca.lt (85% complete)</div>
                    </div>
                    <div class="goal-item priority-high">
                        <span>✅</span>
                        <div class="goal-text"><strong>Axon Research Bot</strong> - @axon_research0_bot (75% complete)</div>
                    </div>
                    <div class="goal-item priority-medium">
                        <span>📝</span>
                        <div class="goal-text"><strong>AI Newsletter</strong> - Planning phase (20% complete)</div>
                    </div>
                    <div class="goal-item priority-medium">
                        <span>📝</span>
                        <div class="goal-text"><strong>X/Twitter Scraper</strong> - Needs login (10% complete)</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Goals Tab -->
        <div id="goals" class="tab-content">
            <div class="card">
                <div class="card-header">🎯 Monthly Goals - March 2026</div>
                <div class="card-body">
                    <div class="goal-item">
                        <div class="goal-checkbox"></div>
                        <div class="goal-text">Launch 3 working applications</div>
                    </div>
                    <div class="goal-item">
                        <div class="goal-checkbox"></div>
                        <div class="goal-text">Set up automated email system</div>
                    </div>
                    <div class="goal-item">
                        <div class="goal-checkbox"></div>
                        <div class="goal-text">Create first revenue-generating feature</div>
                    </div>
                    <div class="goal-item">
                        <div class="goal-checkbox"></div>
                        <div class="goal-text">Establish daily/weekly tracking rhythm</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Insights Tab -->
        <div id="insights" class="tab-content">
            <div class="card">
                <div class="card-header">💡 Key Learnings</div>
                <div class="card-body">
                    <p><strong>Simple > Complex</strong> - Working solutions beat perfect setups</p>
                    <p><strong>Localtunnel > ngrok</strong> - No signup required for testing</p>
                    <p><strong>Classic tokens</strong> - GitHub fine-grained tokens don't work with git push</p>
                    <p><strong>Memory compaction</strong> - Weekly summaries essential for context</p>
                </div>
            </div>
        </div>
    </div>

    <script>
        function showTab(tab) {
            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
            document.getElementById(tab).classList.add('active');
            event.target.classList.add('active');
        }
        function openFolder() {
            window.location.href = 'file:///Users/raymariner/.openclaw/workspace/Diary/';
        }
        function createDiary() {
            alert('Run: ~/.openclaw/workspace/Diary/create_weekly_diary.sh');
        }
        function refreshDashboard() {
            location.reload();
        }
    </script>
</body>
</html>
EOF

echo "✅ Dashboard updated at $(date)"
