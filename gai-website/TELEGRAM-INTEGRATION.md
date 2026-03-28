# GAi Connect - Telegram Integration

## Overview

This directory contains all files needed to integrate GAi Connect with Telegram via:
- Telegram Mini Web App
- Telegram Bot with Menu System
- Telegram Authentication

## Files Included

| File | Description |
|------|-------------|
| `telegram-mini-app.html` | Standalone Telegram Mini Web App |
| `telegram-login.html` | Telegram login/authentication page |
| `telegram-auth.js` | Client-side Telegram authentication module |
| `telegram-validate.js` | Server-side validation utilities |
| `gai-telegram-bot.js` | Node.js Telegram Bot (with menu system) |
| `gai-telegram-bot.py` | Python Telegram Bot (alternative) |
| `telegram-api.js` | Express API routes for Telegram auth |
| `telegram-bot-setup.md` | Setup instructions |

## Quick Setup

### 1. Create Telegram Bot

1. Open Telegram and search for **@BotFather**
2. Send `/newbot`
3. Follow prompts:
   - Bot name: `GAi Connect`
   - Bot username: `GAiConnectBot`
4. Copy the API token provided (e.g., `123456789:ABCdef...`)

### 2. Configure Bot Token

Create a `.env` file:
```env
BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
MINI_APP_URL=https://your-domain.com/telegram-mini-app.html
PORT=3000
```

### 3. Set up Mini App URL

1. In BotFather, send `/setdomain`
2. Select your bot
3. Enter your web app URL (must be HTTPS)

### 4. Install Dependencies

```bash
npm install node-telegram-bot-api express
```

### 5. Run the Bot

```bash
node gai-telegram-bot.js
```

## Bot Commands

| Command | Description |
|---------|-------------|
| `/start` | Welcome message with menu |
| `/menu` | Open main menu |
| `/agents` | View all AI agents |
| `/dashboard` | Open mini app dashboard |
| `/profile` | View your profile |
| `/activity` | View recent activity |
| `/task <text>` | Assign task to GAi CEO |
| `/help` | Help and support |

## Mini App Features

- **User Profile**: Display Telegram user info
- **AI Agents Grid**: 7 sub-agents + GAi CEO
- **Task Input**: Command GAi directly
- **Live Activity**: Real-time activity feed
- **Navigation**: Bottom nav for mobile

## Authentication Flow

```
Telegram User → Opens Mini App → 
  ↓
Telegram WebApp SDK provides initData →
  ↓
Client sends initData to server →
  ↓
Server validates hash + expiry →
  ↓
User authenticated → Dashboard access
```

## Directory Structure

```
gai-website/
├── telegram-mini-app.html    # Main mini app
├── telegram-login.html        # Login page
├── telegram-auth.js          # Client auth
├── telegram-validate.js      # Server validation
├── telegram-api.js           # API routes
├── gai-telegram-bot.js       # Node bot
├── gai-telegram-bot.py       # Python bot
└── telegram-bot-setup.md     # Setup guide
```

## Security Notes

1. **Never expose bot token** - Use environment variables
2. **Validate all data** - Always verify hash server-side
3. **Check expiry** - Reject data older than 24 hours
4. **Use HTTPS** - Required for webhooks and mini apps
5. **Rate limiting** - Implement to prevent abuse

## Testing Locally

For local testing without a real bot:

```javascript
const { generateTestInitData } = require('./telegram-validate');

// Generate test data
const testData = generateTestInitData('YOUR_BOT_TOKEN', {
  id: 123456,
  first_name: 'Test',
  username: 'testuser'
});

// Use in frontend
window.Telegram.WebApp.initData = testData;
```

## Production Checklist

- [ ] HTTPS enabled
- [ ] Bot token in environment
- [ ] Mini app URL configured in BotFather
- [ ] Server validation implemented
- [ ] Rate limiting enabled
- [ ] Error handling complete
- [ ] Analytics/tracking set up

## Support

For issues with:
- **Bot**: Contact @BotFather
- **Mini App**: Telegram support
- **GAi Connect**: Open an issue

## License

Part of GAi Connect - All rights reserved
