// GAi User State Management
const GAiUser = {
  state: {
    isLoggedIn: localStorage.getItem('gai_isLoggedIn') === 'true',
    isVerified: localStorage.getItem('gai_isVerified') === 'true',
    userTier: localStorage.getItem('gai_userTier') || 'guest',
    username: localStorage.getItem('gai_username') || localStorage.getItem('gai_reg_nickname') || '',
    userLocation: localStorage.getItem('gai_userLocation') || null,
    locationCoords: JSON.parse(localStorage.getItem('gai_locationCoords') || 'null')
  },

  // User Status Management
  onlineMembers: JSON.parse(localStorage.getItem('gai_online_members') || '[]'),
  sessionTimeout: null,

  // Activity Feed System
  maxActivities: 50,

  recordActivity(type, username, details = {}) {
    const activities = JSON.parse(localStorage.getItem('gai_activities') || '[]');
    const newActivity = {
      id: Date.now(),
      type: type,
      username: username,
      details: details,
      timestamp: new Date().toISOString()
    };
    activities.unshift(newActivity);
    if (activities.length > this.maxActivities) {
      activities.pop();
    }
    localStorage.setItem('gai_activities', JSON.stringify(activities));
    return newActivity;
  },

  getActivities(limit = 20) {
    const activities = JSON.parse(localStorage.getItem('gai_activities') || '[]');
    return activities.slice(0, limit);
  },

  getActivityIcon(type) {
    const icons = {
      'register': 'person_add',
      'login': 'login',
      'logout': 'logout',
      'connect': 'handshake',
      'post_service': 'work',
      'profile_update': 'edit',
      'upgrade': 'workspace_premium',
      'verify': 'verified'
    };
    return icons[type] || 'circle';
  },

  getActivityColor(type) {
    const colors = {
      'register': 'bg-green-500/20 text-green-400',
      'login': 'bg-blue-500/20 text-blue-400',
      'logout': 'bg-zinc-500/20 text-zinc-400',
      'connect': 'bg-amber-500/20 text-amber-400',
      'post_service': 'bg-purple-500/20 text-purple-400',
      'profile_update': 'bg-cyan-500/20 text-cyan-400',
      'upgrade': 'bg-pink-500/20 text-pink-400',
      'verify': 'bg-emerald-500/20 text-emerald-400'
    };
    return colors[type] || 'bg-zinc-500/20 text-zinc-400';
  },

  getActivityText(activity) {
    const texts = {
      'register': `joined GAi Connect`,
      'login': `came online`,
      'logout': `went offline`,
      'connect': `connected with ${activity.details.target || 'someone'}`,
      'post_service': `posted a new service: ${activity.details.service || 'Service'}`,
      'profile_update': `updated their profile`,
      'upgrade': `upgraded to ${activity.details.tier || 'Premium'}`,
      'verify': `completed verification`
    };
    return texts[activity.type] || 'performed an action';
  },

  setOnline() {
    if (!this.state.isLoggedIn) return;
    const username = this.state.username;
    const now = Date.now();
    
    // Add or update user in online list
    this.onlineMembers = this.onlineMembers.filter(m => m.username !== username);
    this.onlineMembers.push({
      username: username,
      displayName: this.getDisplayName(),
      tier: this.state.userTier,
      lastSeen: now,
      status: 'online'
    });
    
    localStorage.setItem('gai_online_members', JSON.stringify(this.onlineMembers));
    
    // Record login activity
    this.recordActivity('login', username);
    
    // Set inactive after 5 minutes of no activity
    this.resetInactivityTimer();
  },

  setOffline() {
    if (!this.state.isLoggedIn) return;
    const username = this.state.username;
    
    this.onlineMembers = this.onlineMembers.map(m => 
      m.username === username ? { ...m, status: 'offline', lastSeen: Date.now() } : m
    );
    
    localStorage.setItem('gai_online_members', JSON.stringify(this.onlineMembers));
    
    // Record logout activity
    this.recordActivity('logout', username);
  },

  resetInactivityTimer() {
    if (this.sessionTimeout) clearTimeout(this.sessionTimeout);
    
    this.sessionTimeout = setTimeout(() => {
      this.setOffline();
    }, 5 * 60 * 1000); // 5 minutes
  },

  getOnlineMembers() {
    // Filter to only show members active in last 5 minutes
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    return this.onlineMembers.filter(m => 
      m.status === 'online' || (m.status === 'offline' && m.lastSeen > fiveMinutesAgo)
    );
  },

  refreshOnlineStatus() {
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    this.onlineMembers = this.onlineMembers.map(m => 
      (m.status === 'offline' && m.lastSeen < fiveMinutesAgo) ? { ...m, status: 'away' } : m
    );
    localStorage.setItem('gai_online_members', JSON.stringify(this.onlineMembers));
  },


  // Get display name - prioritizes nickname
  getDisplayName() {
    return localStorage.getItem('gai_display_name') || localStorage.getItem('gai_reg_nickname') || localStorage.getItem('gai_username') || 'User';
  },

  // Get user profile data
  getProfile() {
    return {
      fullName: localStorage.getItem('gai_reg_fullname') || '',
      nickname: localStorage.getItem('gai_reg_nickname') || localStorage.getItem('gai_username') || '',
      dob: localStorage.getItem('gai_reg_dob') || '',
      nationality: localStorage.getItem('gai_reg_nationality') || '',
      location: localStorage.getItem('gai_reg_location') || localStorage.getItem('gai_userLocation') || '',
      lat: localStorage.getItem('gai_user_lat') || null,
      lng: localStorage.getItem('gai_user_lng') || null
    };
  },

  init() {
    this.loadState();
    this.refreshOnlineStatus();
    if (this.state.isLoggedIn) {
      this.setOnline();
    }
    this.updateUI();
    
    // Track user activity
    ['click', 'mousemove', 'keypress'].forEach(event => {
      document.addEventListener(event, () => this.resetInactivityTimer(), { passive: true });
    });
    
    // Track when user leaves
    window.addEventListener('beforeunload', () => this.setOffline());
  },

  loadState() {
    this.state.isLoggedIn = localStorage.getItem('gai_isLoggedIn') === 'true';
    this.state.isVerified = localStorage.getItem('gai_isVerified') === 'true';
    this.state.userTier = localStorage.getItem('gai_userTier') || 'guest';
    this.state.username = localStorage.getItem('gai_username') || '';
    this.state.userLocation = localStorage.getItem('gai_userLocation') || null;
    this.state.locationCoords = JSON.parse(localStorage.getItem('gai_locationCoords') || 'null');
  },

  login(username, tier = 'Standard', verified = false) {
    this.state.isLoggedIn = true;
    this.state.isVerified = verified;
    this.state.userTier = tier;
    this.state.username = username;
    localStorage.setItem('gai_isLoggedIn', 'true');
    localStorage.setItem('gai_isVerified', verified.toString());
    localStorage.setItem('gai_userTier', tier);
    localStorage.setItem('gai_username', username);
    this.setOnline();
    this.updateUI();
  },

  logout() {
    this.setOffline();
    this.state.isLoggedIn = false;
    this.state.isVerified = false;
    this.state.userTier = 'guest';
    this.state.username = '';
    localStorage.setItem('gai_isLoggedIn', 'false');
    localStorage.setItem('gai_isVerified', 'false');
    localStorage.setItem('gai_userTier', 'guest');
    localStorage.setItem('gai_username', '');
    this.updateUI();
  },

  setLocation(locationName, coords) {
    this.state.userLocation = locationName;
    this.state.locationCoords = coords;
    localStorage.setItem('gai_userLocation', locationName);
    localStorage.setItem('gai_locationCoords', JSON.stringify(coords));
  },

  canAccessMembers() {
    return this.state.isLoggedIn && this.state.isVerified;
  },

  updateUI() {
    document.querySelectorAll('.gai-members-link').forEach(el => {
      el.style.display = this.canAccessMembers() ? '' : 'none';
    });
    document.querySelectorAll('.gai-guest-only').forEach(el => {
      el.style.display = this.state.isLoggedIn ? 'none' : '';
    });
    document.querySelectorAll('.gai-logged-in-only').forEach(el => {
      el.style.display = this.state.isLoggedIn ? '' : 'none';
    });
  }
};

// Geolocation / Nearby Functions
const GAiNearby = {
  async requestLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          GAiUser.setLocation('Nearby', coords);
          resolve(coords);
        },
        (error) => {
          reject(error);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  },

  async init() {
    try {
      const coords = await this.requestLocation();
      console.log('Location enabled:', coords);
      this.updateNearbyContent();
    } catch (error) {
      console.log('Location access denied or unavailable');
    }
  },

  updateNearbyContent() {
    document.querySelectorAll('.nearby-content').forEach(el => {
      el.classList.add('location-enabled');
    });
  },

  getDistanceFromUser(lat, lng) {
    if (!GAiUser.state.locationCoords) return null;
    const R = 6371; // Earth's radius in km
    const dLat = (lat - GAiUser.state.locationCoords.lat) * Math.PI / 180;
    const dLng = (lng - GAiUser.state.locationCoords.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(GAiUser.state.locationCoords.lat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  },

  sortByDistance(items) {
    if (!GAiUser.state.locationCoords) return items;
    return items.sort((a, b) => {
      const distA = this.getDistanceFromUser(a.lat, a.lng) || 99999;
      const distB = this.getDistanceFromUser(b.lat, b.lng) || 99999;
      return distA - distB;
    });
  }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', function() {
  GAiUser.init();
});
