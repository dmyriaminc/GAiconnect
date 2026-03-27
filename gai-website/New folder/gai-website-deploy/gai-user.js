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
    this.updateUI();
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
    this.updateUI();
  },

  logout() {
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
