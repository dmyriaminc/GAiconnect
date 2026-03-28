// GAi CEO Agent Management System
// Multi-Agent AI Control System

const GAiCEO = {
  // Agent Registry
  agents: {
    osint: {
      id: 'osint',
      name: 'OSINT Agent',
      icon: 'search',
      color: '#ff6b6b',
      colorClass: 'red',
      status: 'idle',
      tasks: [],
      capabilities: ['Search by name', 'Phone lookup', 'Email lookup', 'Reverse image', 'Social tracking', 'IP/domain lookup'],
      tools: ['Maltego', 'SpiderFoot', 'Sherlock', 'theHarvester', 'Shodan'],
      stats: { queries: 0, accuracy: 0, lastRun: null }
    },
    social: {
      id: 'social',
      name: 'Social Media Agent',
      icon: 'share',
      color: '#4ecdc4',
      colorClass: 'cyan',
      status: 'idle',
      tasks: [],
      capabilities: ['Auto post', 'Account management', 'Growth strategy', 'Engagement', 'Trend analysis', 'Analytics'],
      tools: ['Hootsuite', 'Ocoya', 'Predis', 'Buffer', 'Later'],
      stats: { posts: 0, engagement: 0, followers: 0, lastRun: null }
    },
    content: {
      id: 'content',
      name: 'Content Generator',
      icon: 'edit_note',
      color: '#ffc563',
      colorClass: 'amber',
      status: 'idle',
      tasks: [],
      capabilities: ['Blog posts', 'Ads & captions', 'Images', 'Videos', 'Website content', 'SEO optimization'],
      tools: ['ChatGPT', 'Midjourney', 'Runway', 'Ollama', 'DALL-E'],
      stats: { generated: 0, quality: 0, types: {}, lastRun: null }
    },
    trading: {
      id: 'trading',
      name: 'Trading Agent',
      icon: 'trending_up',
      color: '#a8e6cf',
      colorClass: 'green',
      status: 'idle',
      tasks: [],
      capabilities: ['Market analysis', 'Signal generation', 'Predictions', 'Risk management', 'Auto trading', 'Portfolio'],
      tools: ['TradingView', 'MetaTrader', 'Alpha Vantage', 'CoinGecko', 'Yahoo Finance'],
      stats: { trades: 0, success: 0, profit: 0, lastRun: null }
    },
    data: {
      id: 'data',
      name: 'Data Analyst',
      icon: 'analytics',
      color: '#6e9bff',
      colorClass: 'blue',
      status: 'idle',
      tasks: [],
      capabilities: ['Forecasting', 'Pattern detection', 'User tracking', 'Reports', 'Visualization', 'Insights'],
      tools: ['Power BI', 'Tableau', 'Python Pandas', 'Prophet', 'TensorFlow'],
      stats: { analyses: 0, predictions: 0, accuracy: 0, lastRun: null }
    },
    builder: {
      id: 'builder',
      name: 'Builder Agent',
      icon: 'build',
      color: '#cb7bff',
      colorClass: 'purple',
      status: 'idle',
      tasks: [],
      capabilities: ['Create tools', 'Write code', 'Deploy features', 'Fix bugs', 'API integration', 'Testing'],
      tools: ['GitHub Copilot', 'AutoGPT', 'LangChain', 'Docker', 'AWS'],
      stats: { projects: 0, commits: 0, bugs: 0, lastRun: null }
    },
    security: {
      id: 'security',
      name: 'Security Agent',
      icon: 'security',
      color: '#ff8c42',
      colorClass: 'orange',
      status: 'idle',
      tasks: [],
      capabilities: ['Fraud detection', 'Identity verification', 'Risk alerts', 'Monitoring', 'Penetration testing', 'Compliance'],
      tools: ['CrowdStrike', 'Darktrace', 'Qualys', 'Nessus', 'Splunk'],
      stats: { threats: 0, blocked: 0, alerts: 0, lastRun: null }
    },
    news: {
      id: 'news',
      name: 'News Agent',
      icon: 'newspaper',
      color: '#ff4757',
      colorClass: 'red',
      status: 'idle',
      tasks: [],
      capabilities: ['Football news', 'Tennis updates', 'Basketball scores', 'Sports predictions', 'Live match tracking', 'Transfer news'],
      tools: ['ESPN API', 'FlashScore', 'The Athletic', 'Opta', 'Sportradar'],
      stats: { articles: 0, predictions: 0, accuracy: 0, lastRun: null }
    }
  },

  // CEO Brain - Task distribution and coordination
  ceoBrain: {
    active: true,
    tasks: [],
    completedTasks: [],
    strategy: 'profit-maximization',
    
    // Distribute task to appropriate agent
    distributeTask(task) {
      const taskType = task.type || this.classifyTask(task.description);
      const agent = this.selectAgent(taskType);
      
      if (agent) {
        const agentTask = {
          id: Date.now(),
          ...task,
          assignedTo: agent.id,
          status: 'assigned',
          createdAt: new Date().toISOString()
        };
        
        agent.tasks.push(agentTask);
        this.tasks.push(agentTask);
        
        // Activate agent
        this.activateAgent(agent.id);
        
        return { success: true, agent: agent.name, task: agentTask };
      }
      
      return { success: false, error: 'No suitable agent found' };
    },
    
    classifyTask(description) {
      const desc = description.toLowerCase();
      
      if (desc.includes('find') || desc.includes('search') || desc.includes('lookup') || desc.includes('track') || desc.includes('email') || desc.includes('phone') || desc.includes('social')) {
        return 'osint';
      }
      if (desc.includes('post') || desc.includes('social') || desc.includes('share') || desc.includes('twitter') || desc.includes('instagram') || desc.includes('facebook')) {
        return 'social';
      }
      if (desc.includes('create') || desc.includes('write') || desc.includes('generate') || desc.includes('blog') || desc.includes('content') || desc.includes('image') || desc.includes('video')) {
        return 'content';
      }
      if (desc.includes('trade') || desc.includes('stock') || desc.includes('crypto') || desc.includes('forex') || desc.includes('market') || desc.includes('invest')) {
        return 'trading';
      }
      if (desc.includes('analyze') || desc.includes('data') || desc.includes('report') || desc.includes('forecast') || desc.includes('predict')) {
        return 'data';
      }
      if (desc.includes('build') || desc.includes('code') || desc.includes('develop') || desc.includes('deploy') || desc.includes('fix') || desc.includes('debug')) {
        return 'builder';
      }
      if (desc.includes('security') || desc.includes('protect') || desc.includes('scan') || desc.includes('threat') || desc.includes('fraud')) {
        return 'security';
      }
      
      return 'content'; // Default
    },
    
    selectAgent(taskType) {
      return GAiCEO.agents[taskType] || null;
    },
    
    activateAgent(agentId) {
      const agent = GAiCEO.agents[agentId];
      if (agent && agent.status === 'idle') {
        agent.status = 'active';
        this.log(`Agent ${agent.name} activated for new task`);
      }
    },
    
    completeTask(taskId, result) {
      const task = this.tasks.find(t => t.id === taskId);
      if (task) {
        task.status = 'completed';
        task.completedAt = new Date().toISOString();
        task.result = result;
        this.completedTasks.push(task);
        
        const agent = this.agents[task.assignedTo];
        if (agent) {
          agent.status = 'idle';
          this.updateAgentStats(agent.id);
        }
        
        this.log(`Task completed by ${agent?.name}: ${task.description}`);
      }
    },
    
    updateAgentStats(agentId) {
      const agent = GAiCEO.agents[agentId];
      if (agent) {
        agent.stats.lastRun = new Date().toISOString();
        
        switch(agentId) {
          case 'osint':
            agent.stats.queries++;
            break;
          case 'social':
            agent.stats.posts++;
            break;
          case 'content':
            agent.stats.generated++;
            break;
          case 'trading':
            agent.stats.trades++;
            break;
          case 'data':
            agent.stats.analyses++;
            break;
          case 'builder':
            agent.stats.commits++;
            break;
          case 'security':
            agent.stats.threats++;
            break;
        }
      }
    },
    
    log(message) {
      const logEntry = {
        timestamp: new Date().toISOString(),
        message: message
      };
      
      // Store in localStorage
      const logs = JSON.parse(localStorage.getItem('gai_logs') || '[]');
      logs.unshift(logEntry);
      if (logs.length > 100) logs.pop();
      localStorage.setItem('gai_logs', JSON.stringify(logs));
      
      // Dispatch event for UI update
      window.dispatchEvent(new CustomEvent('gai-log-update', { detail: logEntry }));
    },
    
    getLogs() {
      return JSON.parse(localStorage.getItem('gai_logs') || '[]');
    },
    
    clearLogs() {
      localStorage.setItem('gai_logs', '[]');
    }
  },

  // Initialize the CEO system
  init() {
    this.loadState();
    this.bindEvents();
    this.updateUI();
    this.ceoBrain.log('GAi CEO System initialized. All agents ready.');
  },

  loadState() {
    // Load any saved state
    const savedTasks = localStorage.getItem('gai_tasks');
    if (savedTasks) {
      this.ceoBrain.tasks = JSON.parse(savedTasks);
    }
  },

  saveState() {
    localStorage.setItem('gai_tasks', JSON.stringify(this.ceoBrain.tasks));
  },

  bindEvents() {
    // Listen for log updates
    window.addEventListener('gai-log-update', (e) => {
      this.updateLogsUI();
    });
  },

  // Execute a task through the CEO brain
  executeTask(taskDescription, priority = 'normal') {
    const result = this.ceoBrain.distributeTask({
      description: taskDescription,
      priority: priority
    });
    
    if (result.success) {
      this.saveState();
      this.updateUI();
    }
    
    return result;
  },

  // Get agent status
  getAgentStatus(agentId) {
    const agent = this.agents[agentId];
    return {
      id: agent.id,
      name: agent.name,
      status: agent.status,
      activeTasks: agent.tasks.filter(t => t.status !== 'completed').length,
      stats: agent.stats
    };
  },

  // Get all agents status
  getAllAgentsStatus() {
    return Object.values(this.agents).map(agent => ({
      id: agent.id,
      name: agent.name,
      icon: agent.icon,
      color: agent.color,
      colorClass: agent.colorClass,
      status: agent.status,
      activeTasks: agent.tasks.filter(t => t.status !== 'completed').length,
      capabilities: agent.capabilities,
      tools: agent.tools,
      stats: agent.stats
    }));
  },

  // Complete task with result
  completeAgentTask(agentId, taskDescription, result) {
    const agent = this.agents[agentId];
    const task = agent.tasks.find(t => t.description === taskDescription && t.status !== 'completed');
    
    if (task) {
      this.ceoBrain.completeTask(task.id, result);
      this.saveState();
      this.updateUI();
    }
  },

  // Update UI elements
  updateUI() {
    // Update all agent cards
    Object.values(this.agents).forEach(agent => {
      this.updateAgentCard(agent.id);
    });
    
    // Update CEO stats
    this.updateCEOStats();
  },

  updateAgentCard(agentId) {
    const agent = this.agents[agentId];
    const card = document.querySelector(`[data-agent="${agentId}"]`);
    
    if (card) {
      const statusDot = card.querySelector('.agent-status-dot');
      const statusText = card.querySelector('.agent-status-text');
      const taskCount = card.querySelector('.agent-task-count');
      
      if (statusDot) {
        statusDot.className = `agent-status-dot w-3 h-3 rounded-full ${agent.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-zinc-500'}`;
      }
      
      if (statusText) {
        statusText.textContent = agent.status === 'active' ? 'Active' : 'Idle';
        statusText.className = `agent-status-text text-xs ${agent.status === 'active' ? 'text-green-400' : 'text-zinc-500'}`;
      }
      
      if (taskCount) {
        const activeTasks = agent.tasks.filter(t => t.status !== 'completed').length;
        taskCount.textContent = activeTasks > 0 ? `${activeTasks} tasks` : 'Ready';
      }
    }
  },

  updateCEOStats() {
    const totalAgents = Object.keys(this.agents).length;
    const activeAgents = Object.values(this.agents).filter(a => a.status === 'active').length;
    const totalTasks = this.ceoBrain.tasks.length;
    const completedTasks = this.ceoBrain.completedTasks.length;
    
    const statsElements = {
      'ceo-active-agents': activeAgents,
      'ceo-total-tasks': totalTasks,
      'ceo-completed-tasks': completedTasks
    };
    
    Object.entries(statsElements).forEach(([id, value]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    });
  },

  updateLogsUI() {
    const logsContainer = document.getElementById('ceo-logs');
    if (logsContainer) {
      const logs = this.ceoBrain.getLogs().slice(0, 20);
      
      logsContainer.innerHTML = logs.map(log => {
        const date = new Date(log.timestamp);
        const time = date.toLocaleTimeString();
        
        return `
          <div class="flex gap-3 py-2 border-b border-white/5">
            <div class="w-1 h-1 rounded-full bg-amber-400 mt-2 flex-shrink-0"></div>
            <div class="flex-1">
              <p class="text-sm text-white">${log.message}</p>
              <span class="text-[10px] text-zinc-500">${time}</span>
            </div>
          </div>
        `;
      }).join('');
    }
  },

  // Execute workflow
  executeWorkflow(workflowType, params = {}) {
    this.ceoBrain.log(`Starting ${workflowType} workflow...`);
    
    switch(workflowType) {
      case 'find-promote-connect':
        // OSINT → Content → Social
        this.executeTask(`Find information about: ${params.target || 'target'}`, 'high');
        setTimeout(() => {
          this.executeTask(`Create promotional content about: ${params.target || 'target'}`, 'high');
        }, 2000);
        setTimeout(() => {
          this.executeTask(`Post to social media: ${params.target || 'target'}`, 'high');
        }, 4000);
        break;
        
      case 'analyze-deploy':
        // Data → Builder
        this.executeTask(`Analyze data for insights: ${params.subject || 'project'}`, 'normal');
        setTimeout(() => {
          this.executeTask(`Build tool for: ${params.subject || 'project'}`, 'normal');
        }, 2000);
        break;
        
      case 'monitor-secure':
        // Security → Data
        this.executeTask(`Run security scan on: ${params.target || 'system'}`, 'high');
        setTimeout(() => {
          this.executeTask(`Generate security report and analysis`, 'normal');
        }, 3000);
        break;
        
      case 'market-research':
        // OSINT → Data → Content → Trading
        this.executeTask(`Research market: ${params.market || 'market'}`, 'normal');
        setTimeout(() => {
          this.executeTask(`Analyze trends for: ${params.market || 'market'}`, 'normal');
        }, 2000);
        setTimeout(() => {
          this.executeTask(`Create content about market analysis`, 'normal');
        }, 4000);
        break;
        
      default:
        this.ceoBrain.log(`Unknown workflow type: ${workflowType}`);
    }
  }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname.includes('ceo-dashboard')) {
    GAiCEO.init();
  }
});
