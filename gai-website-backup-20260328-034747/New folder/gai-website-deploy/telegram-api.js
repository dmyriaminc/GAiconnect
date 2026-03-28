/**
 * GAi Connect - Telegram API Routes
 * Server-side validation for Telegram authentication
 */

const express = require('express');
const crypto = require('crypto');
const path = require('path');

const router = express.Router();

// Your bot token (keep secret!)
const BOT_TOKEN = process.env.BOT_TOKEN || 'YOUR_BOT_TOKEN';

/**
 * Validate Telegram init data
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
function validateTelegramData(initData) {
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    params.delete('hash');

    // Sort parameters alphabetically
    const dataCheckString = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    // Create secret key
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(BOT_TOKEN)
      .digest();

    // Calculate hash
    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    // Compare hashes
    return hash === calculatedHash;
  } catch (error) {
    console.error('Validation error:', error);
    return false;
  }
}

/**
 * Parse user data from init data
 */
function parseUserData(initData) {
  const params = new URLSearchParams(initData);
  const userParam = params.get('user');
  
  if (userParam) {
    try {
      return JSON.parse(decodeURIComponent(userParam));
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * POST /api/telegram/validate
 * Validate Telegram authentication
 */
router.post('/validate', (req, res) => {
  try {
    const { initData } = req.body;

    if (!initData) {
      return res.status(400).json({ valid: false, error: 'No init data provided' });
    }

    // Validate data
    const isValid = validateTelegramData(initData);
    
    if (!isValid) {
      return res.status(401).json({ valid: false, error: 'Invalid init data' });
    }

    // Get user data
    const user = parseUserData(initData);

    // Get auth date
    const params = new URLSearchParams(initData);
    const authDate = parseInt(params.get('auth_date')) * 1000;

    // Check if auth date is too old (24 hours)
    const isExpired = Date.now() - authDate > 24 * 60 * 60 * 1000;

    if (isExpired) {
      return res.status(401).json({ valid: false, error: 'Auth data expired' });
    }

    // Return success with user data
    res.json({
      valid: true,
      user: {
        id: user?.id,
        first_name: user?.first_name,
        last_name: user?.last_name,
        username: user?.username,
        language_code: user?.language_code,
        is_premium: user?.is_premium
      }
    });

  } catch (error) {
    console.error('Validation error:', error);
    res.status(500).json({ valid: false, error: 'Server error' });
  }
});

/**
 * POST /api/telegram/login
 * Login/register user with Telegram
 */
router.post('/login', async (req, res) => {
  try {
    const { initData, redirect } = req.body;

    if (!initData) {
      return res.status(400).json({ error: 'No init data' });
    }

    // Validate
    const isValid = validateTelegramData(initData);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid authentication' });
    }

    // Get user
    const user = parseUserData(initData);
    
    if (!user) {
      return res.status(400).json({ error: 'No user data' });
    }

    // Here you would:
    // 1. Check if user exists in database
    // 2. Create user if not exists
    // 3. Generate session token
    // 4. Return success

    const sessionToken = crypto.randomBytes(32).toString('hex');

    res.json({
      success: true,
      token: sessionToken,
      user: {
        id: user.id,
        name: `${user.first_name} ${user.last_name || ''}`.trim(),
        username: user.username
      },
      redirect: redirect || '/dashboard.html'
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * GET /api/telegram/me
 * Get current user info (requires auth)
 */
router.get('/me', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.substring(7);
  
  // Validate token and get user from database
  // For demo, return mock data
  res.json({
    id: '123456',
    name: 'Telegram User',
    platform: 'telegram'
  });
});

module.exports = router;
