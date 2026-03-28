/**
 * GAi Connect - Telegram Server Validation
 * Validates Telegram WebApp authentication server-side
 */

const crypto = require('crypto');

/**
 * Validate Telegram init data from WebApp
 * @param {string} initData - Raw init data from Telegram WebApp
 * @param {string} botToken - Your bot token
 * @returns {object} Validation result
 */
function validateTelegramData(initData, botToken = process.env.BOT_TOKEN) {
  try {
    if (!initData) {
      return { valid: false, error: 'No init data provided' };
    }

    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    
    if (!hash) {
      return { valid: false, error: 'No hash provided' };
    }

    // Remove hash and sort remaining params
    params.delete('hash');
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest();

    const dataCheckString = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    // Calculate expected hash
    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    // Compare hashes (timing-safe)
    const isValid = crypto.timingSafeEqual(
      Buffer.from(hash),
      Buffer.from(calculatedHash)
    );

    if (!isValid) {
      return { valid: false, error: 'Hash mismatch - data may be tampered' };
    }

    // Get auth date and check freshness
    const authDate = parseInt(params.get('auth_date'));
    if (!authDate) {
      return { valid: false, error: 'No auth_date provided' };
    }

    const authTime = new Date(authDate * 1000);
    const now = new Date();
    const hoursOld = (now - authTime) / (1000 * 60 * 60);

    if (hoursOld > 24) {
      return { valid: false, error: 'Init data expired (older than 24 hours)' };
    }

    // Parse user data
    const userParam = params.get('user');
    let user = null;
    
    if (userParam) {
      try {
        user = JSON.parse(decodeURIComponent(userParam));
      } catch (e) {
        return { valid: false, error: 'Invalid user data' };
      }
    }

    return {
      valid: true,
      user,
      authDate: authTime,
      chatInstance: params.get('chat_instance'),
      chatType: params.get('chat_type'),
      startParam: params.get('start_param'),
      canSendAfter: parseInt(params.get('can_send_after')) || 0
    };

  } catch (error) {
    console.error('Telegram validation error:', error);
    return { valid: false, error: error.message };
  }
}

/**
 * Express middleware for Telegram authentication
 */
function telegramAuthMiddleware(req, res, next) {
  const authHeader = req.headers['x-telegram-init-data'];
  
  if (!authHeader) {
    return res.status(401).json({ error: 'No Telegram auth data' });
  }

  const result = validateTelegramData(authHeader);
  
  if (!result.valid) {
    return res.status(401).json({ error: result.error });
  }

  // Attach user to request
  req.telegramUser = result.user;
  req.telegramAuth = result;
  
  next();
}

/**
 * Generate test init data (for development only)
 */
function generateTestInitData(botToken, userData = {}) {
  const now = Math.floor(Date.now() / 1000);
  
  const data = {
    auth_date: now,
    chat_instance: 'test_instance',
    chat_type: 'private',
    user: JSON.stringify({
      id: userData.id || 123456789,
      first_name: userData.first_name || 'Test',
      last_name: userData.last_name || 'User',
      username: userData.username || 'testuser',
      language_code: 'en',
      is_premium: false
    })
  };

  // Calculate hash
  const params = new URLSearchParams(data);
  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest();

  const hash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  params.append('hash', hash);
  
  return params.toString();
}

// Export for use
module.exports = {
  validateTelegramData,
  telegramAuthMiddleware,
  generateTestInitData
};
