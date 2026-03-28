/**
 * GAi Connect - Telegram Authentication Module
 * Handles Telegram WebApp authentication and integration
 */

class TelegramAuth {
  constructor() {
    this.tg = window.Telegram?.WebApp;
    this.isTelegram = !!this.tg;
    this.user = null;
  }

  /**
   * Initialize Telegram authentication
   */
  init() {
    if (!this.isTelegram) {
      console.log('Not running in Telegram');
      return false;
    }

    // Expand the webapp
    this.tg.ready();
    this.tg.expand();
    this.tg.enableClosingConfirmation();

    // Get user data
    this.user = this.tg.initDataUnsafe?.user || null;
    
    // Set theme
    this.applyTheme();

    // Store auth data
    if (this.user) {
      this.storeAuth();
    }

    return true;
  }

  /**
   * Apply Telegram theme to page
   */
  applyTheme() {
    if (!this.tg) return;

    const theme = this.tg.colorScheme || 'dark';
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);

    // Apply theme colors as CSS variables
    const root = document.documentElement;
    root.style.setProperty('--tg-bg-color', this.tg.backgroundColor || '#0e0e0f');
    root.style.setProperty('--tg-text-color', this.tg.textColor || '#ffffff');
    root.style.setProperty('--tg-button-color', this.tg.buttonColor || '#ffc563');
    root.style.setProperty('--tg-button-text-color', this.tg.buttonTextColor || '#000000');
  }

  /**
   * Store authentication data
   */
  storeAuth() {
    if (!this.user) return;

    const authData = {
      id: this.user.id,
      first_name: this.user.first_name,
      last_name: this.user.last_name,
      username: this.user.username,
      photo_url: this.user.photo_url,
      auth_date: Math.floor(Date.now() / 1000),
      hash: this.tg.initData?.split('&').find(p => p.startsWith('hash='))?.split('=')[1] || ''
    };

    localStorage.setItem('gai_telegram_auth', JSON.stringify(authData));
    return authData;
  }

  /**
   * Get stored auth data
   */
  getStoredAuth() {
    const stored = localStorage.getItem('gai_telegram_auth');
    return stored ? JSON.parse(stored) : null;
  }

  /**
   * Validate authentication with server
   */
  async validateAuth() {
    if (!this.tg?.initData) {
      return { valid: false, error: 'No init data' };
    }

    try {
      // In production, send to your backend for validation
      // For now, we'll do client-side validation
      const response = await fetch('/api/telegram/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData: this.tg.initData })
      });

      return await response.json();
    } catch (error) {
      console.error('Auth validation failed:', error);
      return { valid: false, error: error.message };
    }
  }

  /**
   * Get user display info
   */
  getUserInfo() {
    if (this.user) {
      return {
        name: `${this.user.first_name} ${this.user.last_name || ''}`.trim(),
        username: this.user.username || '',
        id: this.user.id,
        avatar: this.user.photo_url || ''
      };
    }
    return this.getStoredAuth();
  }

  /**
   * Show Telegram popup
   */
  showPopup(options) {
    if (this.tg) {
      this.tg.showPopup(options);
    }
  }

  /**
   * Show confirmation dialog
   */
  showConfirm(message) {
    if (this.tg) {
      return this.tg.showConfirm(message);
    }
    return confirm(message);
  }

  /**
   * Haptic feedback
   */
  haptic(style = 'light') {
    if (this.tg?.HapticFeedback) {
      this.tg.HapticFeedback.impactOccurred(style);
    }
  }

  /**
   * Close the webapp
   */
  close() {
    if (this.tg) {
      this.tg.close();
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!(this.user || this.getStoredAuth());
  }
}

// GAi Telegram Singleton
window.GAiTelegram = new TelegramAuth();

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  window.GAiTelegram.init();
});
