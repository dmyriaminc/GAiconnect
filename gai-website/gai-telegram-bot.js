/**
 * GAi Connect Telegram Bot
 * Multi-agent AI system with Menu System and Mini App integration
 */

const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const path = require('path');

// Configuration
const BOT_TOKEN = process.env.BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE';
const MINI_APP_URL = process.env.MINI_APP_URL || 'https://your-domain.com/telegram-mini-app.html';

// Initialize bot
const bot = new TelegramBot(BOT_TOKEN, { polling: true });
const app = express();

// User sessions storage
const userSessions = new Map();

// AI Agents configuration
const agents = {
  osint: { name: 'OSINT Agent', icon: '🔍', description: 'Intelligence gathering and data analysis', color: '🔴' },
  social: { name: 'Social Agent', icon: '📱', description: 'Social media management and growth', color: '🔵' },
  content: { name: 'Content Agent', icon: '✍️', description: 'Content creation and generation', color: '🟡' },
  trading: { name: 'Trading Agent', icon: '📈', description: 'Market analysis and trading signals', color: '🟢' },
  data: { name: 'Data Agent', icon: '📊', description: 'Data analytics and reporting', color: '🔵' },
  builder: { name: 'Builder Agent', icon: '🔧', description: 'Code generation and deployment', color: '🟣' },
  security: { name: 'Security Agent', icon: '🔒', description: 'Security monitoring and alerts', color: '🟠' },
  ceo: { name: 'GAi CEO', icon: '🤖', description: 'Master AI orchestrating all agents', color: '🟡' }
};

// Activity logging
const activities = [];

/**
 * Main Menu Keyboard
 */
const mainMenu = {
  reply_markup: {
    inline_keyboard: [
      [
        { text: '🚀 Open Dashboard', callback_data: 'dashboard', web_app: { url: MINI_APP_URL } }
      ],
      [
        { text: '🤖 View Agents', callback_data: 'agents' },
        { text: '👤 My Profile', callback_data: 'profile' }
      ],
      [
        { text: '📊 Activity', callback_data: 'activity' },
        { text: '⚙️ Settings', callback_data: 'settings' }
      ],
      [
        { text: '❓ Help', callback_data: 'help' }
      ]
    ]
  }
};

/**
 * Agents Menu Keyboard
 */
const agentsMenu = {
  reply_markup: {
    inline_keyboard: [
      [
        { text: `${agents.osint.icon} OSINT`, callback_data: 'agent_osint' },
        { text: `${agents.social.icon} Social`, callback_data: 'agent_social' }
      ],
      [
        { text: `${agents.content.icon} Content`, callback_data: 'agent_content' },
        { text: `${agents.trading.icon} Trading`, callback_data: 'agent_trading' }
      ],
      [
        { text: `${agents.data.icon} Data`, callback_data: 'agent_data' },
        { text: `${agents.builder.icon} Builder`, callback_data: 'agent_builder' }
      ],
      [
        { text: `${agents.security.icon} Security`, callback_data: 'agent_security' },
        { text: `${agents.ceo.icon} GAi CEO`, callback_data: 'agent_ceo' }
      ],
      [
        { text: '« Back to Menu', callback_data: 'menu' }
      ]
    ]
  }
};

/**
 * Welcome Message
 */
function getWelcomeMessage(user) {
  const name = user.first_name || 'there';
  return `
🤖 *Welcome to GAi Connect, ${name}!*

I am your personal AI command center. With me, you can:

• Access 7 specialized AI agents
• Manage tasks and workflows
• Analyze data and markets
• Generate content
• Monitor security

Use the menu below to get started!
  `.trim();
}

/**
 * Agent Details Message
 */
function getAgentDetails(agentId) {
  const agent = agents[agentId];
  if (!agent) return 'Agent not found.';
  
  return `
${agent.icon} *${agent.name}*

${agent.description}

Status: 🟢 Online
Tasks Completed: ${Math.floor(Math.random() * 100) + 1}

Use /task to assign a task to this agent.
  `.trim();
}

/**
 * Log Activity
 */
function logActivity(userId, action) {
  const time = new Date().toISOString();
  activities.unshift({ userId, action, time });
  if (activities.length > 100) activities.pop();
}

// ==================== COMMANDS ====================

// /start command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const user = msg.from;
  
  logActivity(user.id, 'Started GAi Connect');
  
  bot.sendMessage(chatId, getWelcomeMessage(user), {
    parse_mode: 'Markdown',
    ...mainMenu
  });
});

// /menu command
bot.onText(/\/menu/, (msg) => {
  const chatId = msg.chat.id;
  
  bot.sendMessage(chatId, '📋 *Main Menu*\n\nChoose an option:', {
    parse_mode: 'Markdown',
    ...mainMenu
  });
});

// /agents command
bot.onText(/\/agents|\/agent/, (msg) => {
  const chatId = msg.chat.id;
  
  bot.sendMessage(chatId, '🤖 *AI Agents*\n\nSelect an agent to view details:', {
    parse_mode: 'Markdown',
    ...agentsMenu
  });
});

// /dashboard command
bot.onText(/\/dashboard/, (msg) => {
  const chatId = msg.chat.id;
  
  bot.sendMessage(chatId, '🚀 Opening GAi Dashboard...', {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Open Mini App', url: MINI_APP_URL }]
      ]
    }
  });
});

// /help command
bot.onText(/\/help|\/support/, (msg) => {
  const chatId = msg.chat.id;
  
  const helpText = `
❓ *GAi Connect Help*

*Commands:*
/start - Welcome menu
/menu - Main menu
/agents - View AI agents
/dashboard - Open dashboard
/profile - Your profile
/activity - View activity
/help - This help menu

*Quick Actions:*
• Use inline buttons for quick access
• Open the Mini App for full experience
• Assign tasks to specific agents

*Support:*
Need help? Contact @GAiSupport
  `.trim();
  
  bot.sendMessage(chatId, helpText, { parse_mode: 'Markdown' });
});

// /profile command
bot.onText(/\/profile/, (msg) => {
  const chatId = msg.chat.id;
  const user = msg.from;
  
  const stats = userSessions.get(user.id) || { tasks: 0, agentsUsed: [] };
  
  const profileText = `
👤 *Your Profile*

Name: ${user.first_name} ${user.last_name || ''}
Username: @${user.username || 'Not set'}
ID: \`${user.id}\`

*Stats:*
Tasks: ${stats.tasks}
Agents Used: ${stats.agentsUsed.length || 0}
Member Since: Today

*Status:* 🟢 Active
  `.trim();
  
  bot.sendMessage(chatId, profileText, { parse_mode: 'Markdown' });
});

// /activity command
bot.onText(/\/activity/, (msg) => {
  const chatId = msg.chat.id;
  
  const userActivities = activities.filter(a => a.userId === msg.from.id);
  
  if (userActivities.length === 0) {
    bot.sendMessage(chatId, '📊 No recent activity.\n\nStart using GAi to see your activity here!');
    return;
  }
  
  const activityText = userActivities.slice(0, 10).map((a, i) => {
    const time = new Date(a.time).toLocaleTimeString();
    return `${i + 1}. ${a.action}\n   └ ${time}`;
  }).join('\n\n');
  
  bot.sendMessage(chatId, `📊 *Recent Activity*\n\n${activityText}`, { parse_mode: 'Markdown' });
});

// /task command
bot.onText(/\/task (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const user = msg.from;
  const task = match[1];
  
  // Initialize user session
  if (!userSessions.has(user.id)) {
    userSessions.set(user.id, { tasks: 0, agentsUsed: [] });
  }
  const session = userSessions.get(user.id);
  session.tasks++;
  
  logActivity(user.id, `Task: ${task.substring(0, 50)}...`);
  
  bot.sendMessage(chatId, `✅ *Task Received*\n\n"${task}"\n\n🤖 GAi CEO is analyzing and routing to optimal agent(s)...`, {
    parse_mode: 'Markdown'
  });
  
  // Simulate processing
  setTimeout(() => {
    bot.sendMessage(chatId, `🔄 *Processing Complete*\n\nYour task has been assigned to:\n• Data Agent - Analysis\n• Builder Agent - Implementation\n\nCheck /activity for updates.`, { parse_mode: 'Markdown' });
  }, 2000);
});

// ==================== CALLBACK QUERIES ====================

bot.on('callback_query', (query) => {
  const chatId = query.message.chat.id;
  const user = query.from;
  const data = query.data;
  
  // Initialize user session
  if (!userSessions.has(user.id)) {
    userSessions.set(user.id, { tasks: 0, agentsUsed: [] });
  }
  
  switch(data) {
    case 'menu':
      bot.editMessageText('📋 *Main Menu*\n\nChoose an option:', {
        chat_id: chatId,
        message_id: query.message.message_id,
        parse_mode: 'Markdown',
        ...mainMenu
      });
      break;
      
    case 'dashboard':
      bot.editMessageText('🚀 *Opening Dashboard...*', {
        chat_id: chatId,
        message_id: query.message.message_id,
        reply_markup: {
          inline_keyboard: [[{ text: 'Open Mini App', url: MINI_APP_URL }]]
        }
      });
      break;
      
    case 'agents':
      bot.editMessageText('🤖 *AI Agents*\n\nSelect an agent:', {
        chat_id: chatId,
        message_id: query.message.message_id,
        parse_mode: 'Markdown',
        ...agentsMenu
      });
      break;
      
    case 'profile':
      const stats = userSessions.get(user.id);
      bot.editMessageText(`👤 *Profile*\n\nTasks: ${stats.tasks}\nAgents Used: ${stats.agentsUsed.length}`, {
        chat_id: chatId,
        message_id: query.message.message_id,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[{ text: '« Back', callback_data: 'menu' }]]
        }
      });
      break;
      
    case 'activity':
      const userActs = activities.filter(a => a.userId === user.id);
      const actText = userActs.length > 0 
        ? userActs.slice(0, 5).map((a, i) => `${i+1}. ${a.action}`).join('\n')
        : 'No recent activity';
      bot.editMessageText(`📊 *Activity*\n\n${actText}`, {
        chat_id: chatId,
        message_id: query.message.message_id,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[{ text: '« Back', callback_data: 'menu' }]]
        }
      });
      break;
      
    case 'settings':
      bot.editMessageText('⚙️ *Settings*\n\nComing soon!', {
        chat_id: chatId,
        message_id: query.message.message_id,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[{ text: '« Back', callback_data: 'menu' }]]
        }
      });
      break;
      
    case 'help':
      bot.editMessageText('❓ *Help*\n\nUse /help for full commands list.', {
        chat_id: chatId,
        message_id: query.message.message_id,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[{ text: '« Back', callback_data: 'menu' }]]
        }
      });
      break;
      
    default:
      // Agent callbacks
      if (data.startsWith('agent_')) {
        const agentId = data.replace('agent_', '');
        const session = userSessions.get(user.id);
        if (!session.agentsUsed.includes(agentId)) {
          session.agentsUsed.push(agentId);
        }
        
        logActivity(user.id, `Activated ${agents[agentId].name}`);
        
        bot.editMessageText(getAgentDetails(agentId), {
          chat_id: chatId,
          message_id: query.message.message_id,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: 'Activate Agent', callback_data: `use_${agentId}` }],
              [{ text: '« Back to Agents', callback_data: 'agents' }]
            ]
          }
        });
      }
      
      // Use agent
      if (data.startsWith('use_')) {
        const agentId = data.replace('use_', '');
        logActivity(user.id, `Using ${agents[agentId].name}`);
        
        bot.answerCallbackQuery(query.id, {
          text: `${agents[agentId].icon} ${agents[agentId].name} activated!`,
          show_alert: true
        });
      }
  }
  
  bot.answerCallbackQuery(query.id);
});

// ==================== EXPRESS SERVER ====================

// Serve Mini App
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'telegram-mini-app.html'));
});

// Webhook endpoint (for production)
app.post(`/webhook/${BOT_TOKEN}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', users: userSessions.size, activities: activities.length });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🤖 GAi Connect Bot running on port ${PORT}`);
  console.log(`📱 Mini App: http://localhost:${PORT}`);
});

// Error handling
bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});

console.log('🚀 GAi Connect Telegram Bot Started!');
console.log('Commands: /start, /menu, /agents, /dashboard, /profile, /activity, /help');
