# Auto-Blog System

Automatically generates blog posts from research data and publishes to GitHub Pages.

## How It Works

1. **Monitors** `/Users/raymariner/.openclaw/workspace/researcher/research/` for new JSON files
2. **Generates** blog posts from research data using AI-powered content analysis
3. **Updates** `blog-data.js` with new articles
4. **Commits & pushes** changes to GitHub automatically

## Files

- `auto_blog.sh` — Main monitoring script (runs every 5 minutes via LaunchAgent)
- `generate_blog.py` — Python script that converts research JSON to blog posts
- `processed_blogs.json` — Tracks which files have been processed
- `com.aibeinglabs.autoblog.plist` — macOS LaunchAgent configuration

## Manual Usage

```bash
# Run the auto-blog script manually
./auto_blog.sh

# Generate a blog post from specific research file
python3 generate_blog.py /path/to/research.json topic-name 2026-04-07
```

## Managing the Service

```bash
# Check if service is running
launchctl list | grep com.aibeinglabs.autoblog

# Stop the service
launchctl unload ~/Library/LaunchAgents/com.aibeinglabs.autoblog.plist

# Start the service
launchctl load ~/Library/LaunchAgents/com.aibeinglabs.autoblog.plist

# View logs
tail -f /Users/raymariner/.openclaw/workspace/webmaster/logs/autoblog.out
tail -f /Users/raymariner/.openclaw/workspace/webmaster/logs/autoblog.err
```

## Blog Generation Features

- **Automatic title generation** based on topic and content analysis
- **Category detection** from research topics
- **Key statistics extraction** from research data
- **Read time estimation** based on content length
- **Proper HTML formatting** with sections for industry analysis and community perspectives
- **Emoji selection** based on topic category

## Adding New Research

Simply add a new JSON file to the research folder:
```
~/.openclaw/workspace/researcher/research/topic-name-YYYY-MM-DD.json
```

The system will automatically:
1. Detect the new file within 5 minutes
2. Generate a blog post
3. Update the blog
4. Push to GitHub

## Logs

- Standard output: `logs/autoblog.out`
- Errors: `logs/autoblog.err`
