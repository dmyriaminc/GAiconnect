"""
GAi Connect Telegram Bot - Python Version
Multi-agent AI system with Menu System and Mini App integration
"""

import os
import logging
from datetime import datetime
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from telegram.ext import (
    Application,
    CommandHandler,
    CallbackQueryHandler,
    ContextTypes,
    MessageHandler,
    filters
)

# Configuration
BOT_TOKEN = os.getenv("BOT_TOKEN", "YOUR_BOT_TOKEN_HERE")
MINI_APP_URL = os.getenv("MINI_APP_URL", "https://your-domain.com/telegram-mini-app.html")

# Enable logging
logging.basicConfig(format='%(asctime)s - %(name)s - %(levelname)s - %(message)s', level=logging.INFO)
logger = logging.getLogger(__name__)

# User sessions storage
user_sessions = {}

# AI Agents configuration
AGENTS = {
    'osint': {'name': 'OSINT Agent', 'icon': '🔍', 'description': 'Intelligence gathering and data analysis', 'color': '🔴'},
    'social': {'name': 'Social Agent', 'icon': '📱', 'description': 'Social media management and growth', 'color': '🔵'},
    'content': {'name': 'Content Agent', 'icon': '✍️', 'description': 'Content creation and generation', 'color': '🟡'},
    'trading': {'name': 'Trading Agent', 'icon': '📈', 'description': 'Market analysis and trading signals', 'color': '🟢'},
    'data': {'name': 'Data Agent', 'icon': '📊', 'description': 'Data analytics and reporting', 'color': '🔵'},
    'builder': {'name': 'Builder Agent', 'icon': '🔧', 'description': 'Code generation and deployment', 'color': '🟣'},
    'security': {'name': 'Security Agent', 'icon': '🔒', 'description': 'Security monitoring and alerts', 'color': '🟠'},
    'ceo': {'name': 'GAi CEO', 'icon': '🤖', 'description': 'Master AI orchestrating all agents', 'color': '🟡'}
}

# Activity logging
activities = []


def log_activity(user_id: int, action: str):
    """Log user activity"""
    activities.insert(0, {'user_id': user_id, 'action': action, 'time': datetime.now().isoformat()})
    if len(activities) > 100:
        activities.pop()


def init_user_session(user_id: int):
    """Initialize user session"""
    if user_id not in user_sessions:
        user_sessions[user_id] = {'tasks': 0, 'agents_used': []}


def get_main_menu():
    """Main menu keyboard"""
    return InlineKeyboardMarkup([
        [
            InlineKeyboardButton("🚀 Open Dashboard", web_app=WebAppInfo(url=MINI_APP_URL))
        ],
        [
            InlineKeyboardButton("🤖 View Agents", callback_data="agents"),
            InlineKeyboardButton("👤 My Profile", callback_data="profile")
        ],
        [
            InlineKeyboardButton("📊 Activity", callback_data="activity"),
            InlineKeyboardButton("⚙️ Settings", callback_data="settings")
        ],
        [
            InlineKeyboardButton("❓ Help", callback_data="help")
        ]
    ])


def get_agents_menu():
    """Agents menu keyboard"""
    keyboard = []
    row = []
    for i, (agent_id, agent) in enumerate(AGENTS.items(), 1):
        row.append(InlineKeyboardButton(f"{agent['icon']} {agent['name'].split()[0]}", callback_data=f"agent_{agent_id}"))
        if i % 2 == 0:
            keyboard.append(row)
            row = []
    if row:
        keyboard.append(row)
    keyboard.append([InlineKeyboardButton("« Back to Menu", callback_data="menu")])
    return InlineKeyboardMarkup(keyboard)


def get_welcome_message(user) -> str:
    """Get welcome message"""
    name = user.first_name or 'there'
    return f"""
🤖 *Welcome to GAi Connect, {name}!*

I am your personal AI command center. With me, you can:

• Access 7 specialized AI agents
• Manage tasks and workflows
• Analyze data and markets
• Generate content
• Monitor security

Use the menu below to get started!
    """.strip()


def get_agent_details(agent_id: str) -> str:
    """Get agent details"""
    agent = AGENTS.get(agent_id)
    if not agent:
        return 'Agent not found.'
    return f"""
{agent['icon']} *{agent['name']}*

{agent['description']}

Status: 🟢 Online
Tasks Completed: {user_sessions.get(agent_id, {}).get('tasks', 0)}

Use /task to assign a task to this agent.
    """.strip()


# ==================== COMMAND HANDLERS ====================

async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /start command"""
    user = update.effective_user
    log_activity(user.id, 'Started GAi Connect')
    init_user_session(user.id)
    
    await update.message.reply_text(
        get_welcome_message(user),
        parse_mode='Markdown',
        reply_markup=get_main_menu()
    )


async def menu_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /menu command"""
    await update.message.reply_text(
        '📋 *Main Menu*\n\nChoose an option:',
        parse_mode='Markdown',
        reply_markup=get_main_menu()
    )


async def agents_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /agents command"""
    await update.message.reply_text(
        '🤖 *AI Agents*\n\nSelect an agent to view details:',
        parse_mode='Markdown',
        reply_markup=get_agents_menu()
    )


async def dashboard_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /dashboard command"""
    await update.message.reply_text(
        '🚀 Opening GAi Dashboard...',
        reply_markup=InlineKeyboardMarkup([
            [InlineKeyboardButton("Open Mini App", url=MINI_APP_URL)]
        ])
    )


async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /help command"""
    help_text = """
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
    """.strip()
    
    await update.message.reply_text(help_text, parse_mode='Markdown')


async def profile_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /profile command"""
    user = update.effective_user
    init_user_session(user.id)
    session = user_sessions[user.id]
    
    profile_text = f"""
👤 *Your Profile*

Name: {user.first_name} {user.last_name or ''}
Username: @{user.username or 'Not set'}
ID: `{user.id}`

*Stats:*
Tasks: {session['tasks']}
Agents Used: {len(session['agents_used'])}
Member Since: Today

*Status:* 🟢 Active
    """.strip()
    
    await update.message.reply_text(profile_text, parse_mode='Markdown')


async def activity_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /activity command"""
    user = update.effective_user
    user_activities = [a for a in activities if a['user_id'] == user.id]
    
    if not user_activities:
        await update.message.reply_text('📊 No recent activity.\n\nStart using GAi to see your activity here!')
        return
    
    activity_text = '\n\n'.join([
        f"{i+1}. {a['action']}\n   └ {a['time'][11:16]}"
        for i, a in enumerate(user_activities[:10])
    ])
    
    await update.message.reply_text(f"📊 *Recent Activity*\n\n{activity_text}", parse_mode='Markdown')


async def task_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /task command"""
    user = update.effective_user
    init_user_session(user.id)
    
    if not context.args:
        await update.message.reply_text('Usage: /task <your task description>')
        return
    
    task = ' '.join(context.args)
    session = user_sessions[user.id]
    session['tasks'] += 1
    
    log_activity(user.id, f"Task: {task[:50]}...")
    
    await update.message.reply_text(
        f"✅ *Task Received*\n\n\"{task}\"\n\n🤖 GAi CEO is analyzing and routing to optimal agent(s)...",
        parse_mode='Markdown'
    )


# ==================== CALLBACK HANDLERS ====================

async def button_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle callback queries"""
    query = update.callback_query
    await query.answer()
    
    user = query.from_user
    data = query.data
    init_user_session(user.id)
    
    if data == 'menu':
        await query.edit_message_text(
            '📋 *Main Menu*\n\nChoose an option:',
            parse_mode='Markdown',
            reply_markup=get_main_menu()
        )
    
    elif data == 'dashboard':
        await query.edit_message_text(
            '🚀 *Opening Dashboard...*',
            reply_markup=InlineKeyboardMarkup([
                [InlineKeyboardButton("Open Mini App", url=MINI_APP_URL)]
            ])
        )
    
    elif data == 'agents':
        await query.edit_message_text(
            '🤖 *AI Agents*\n\nSelect an agent:',
            parse_mode='Markdown',
            reply_markup=get_agents_menu()
        )
    
    elif data == 'profile':
        session = user_sessions[user.id]
        await query.edit_message_text(
            f"👤 *Profile*\n\nTasks: {session['tasks']}\nAgents Used: {len(session['agents_used'])}",
            parse_mode='Markdown',
            reply_markup=InlineKeyboardMarkup([
                [InlineKeyboardButton("« Back", callback_data="menu")]
            ])
        )
    
    elif data == 'activity':
        user_activities = [a for a in activities if a['user_id'] == user.id]
        act_text = '\n'.join([f"{i+1}. {a['action']}" for i, a in enumerate(user_activities[:5])]) or 'No recent activity'
        await query.edit_message_text(
            f"📊 *Activity*\n\n{act_text}",
            parse_mode='Markdown',
            reply_markup=InlineKeyboardMarkup([
                [InlineKeyboardButton("« Back", callback_data="menu")]
            ])
        )
    
    elif data == 'settings':
        await query.edit_message_text(
            '⚙️ *Settings*\n\nComing soon!',
            parse_mode='Markdown',
            reply_markup=InlineKeyboardMarkup([
                [InlineKeyboardButton("« Back", callback_data="menu")]
            ])
        )
    
    elif data == 'help':
        await query.edit_message_text(
            '❓ *Help*\n\nUse /help for full commands list.',
            parse_mode='Markdown',
            reply_markup=InlineKeyboardMarkup([
                [InlineKeyboardButton("« Back", callback_data="menu")]
            ])
        )
    
    elif data.startswith('agent_'):
        agent_id = data.replace('agent_', '')
        keyboard = InlineKeyboardMarkup([
            [InlineKeyboardButton("Activate Agent", callback_data=f"use_{agent_id}")],
            [InlineKeyboardButton("« Back to Agents", callback_data="agents")]
        ])
        await query.edit_message_text(
            get_agent_details(agent_id),
            parse_mode='Markdown',
            reply_markup=keyboard
        )
    
    elif data.startswith('use_'):
        agent_id = data.replace('use_', '')
        session = user_sessions[user.id]
        if agent_id not in session['agents_used']:
            session['agents_used'].append(agent_id)
        log_activity(user.id, f"Activated {AGENTS[agent_id]['name']}")
        await query.answer(f"{AGENTS[agent_id]['icon']} {AGENTS[agent_id]['name']} activated!", show_alert=True)


# ==================== MAIN ====================

def main():
    """Run the bot"""
    application = Application.builder().token(BOT_TOKEN).build()
    
    # Command handlers
    application.add_handler(CommandHandler("start", start_command))
    application.add_handler(CommandHandler("menu", menu_command))
    application.add_handler(CommandHandler("agents", agents_command))
    application.add_handler(CommandHandler("agent", agents_command))
    application.add_handler(CommandHandler("dashboard", dashboard_command))
    application.add_handler(CommandHandler("help", help_command))
    application.add_handler(CommandHandler("profile", profile_command))
    application.add_handler(CommandHandler("activity", activity_command))
    application.add_handler(CommandHandler("task", task_command))
    
    # Callback handler
    application.add_handler(CallbackQueryHandler(button_callback))
    
    # Start the bot
    print("🚀 GAi Connect Telegram Bot Starting...")
    print(f"📱 Mini App URL: {MINI_APP_URL}")
    application.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()
