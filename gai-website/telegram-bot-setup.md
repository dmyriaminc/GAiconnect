# GAi Connect Telegram Bot Configuration

## Bot Setup Instructions

### 1. Create Telegram Bot
1. Open Telegram and search for @BotFather
2. Send `/newbot` command
3. Follow prompts to set bot name and username
4. Copy the API token provided

### 2. Configure Bot Token
Replace `YOUR_BOT_TOKEN` in the code below with your actual bot token.

### 3. Set WebApp URL
Configure your Mini App URL in BotFather using:
```
/setdomain
```
Select your bot and enter your web app URL.

## Bot Features

### Menu System
- `/start` - Welcome message with inline keyboard
- `/menu` - Main menu with all options
- `/agents` - View all AI agents
- `/dashboard` - Open mini app dashboard
- `/help` - Help and support

### Inline Buttons
- "Open Dashboard" - Opens Telegram Mini App
- "View Agents" - Shows AI agent list
- "My Profile" - User profile info
- "Activity" - Recent activity feed

## Deployment

### Using Node.js (Recommended)

```bash
# Install dependencies
npm install node-telegram-bot-api express

# Run bot
node gai-telegram-bot.js
```

### Python Version (Alt)

```bash
# Install python-telegram-bot
pip install python-telegram-bot

# Run bot
python gai-telegram-bot.py
```

## Webhook Setup (Production)

```javascript
// Set webhook for production
bot.setWebHook('https://your-domain.com/webhook/' + BOT_TOKEN);
```

## Security Notes

- Keep your bot token secure
- Validate all incoming requests
- Use HTTPS for webhooks
- Implement rate limiting
- Store user data securely
