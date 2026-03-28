/**
 * GAi Connect - Supabase Configuration
 * 
 * SETUP INSTRUCTIONS:
 * 1. Create a Supabase project at https://supabase.com
 * 2. Go to Settings → API and copy your:
 *    - Project URL
 *    - anon/public key
 *    - service_role key (keep secret!)
 * 3. Run the supabase-schema.sql in SQL Editor
 * 4. Replace the values below
 */

// ⚠️ IMPORTANT: Replace these with your actual Supabase credentials
const SUPABASE_URL = 'https://pumfhtsdpevfxxycnjot.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_KYiEEt0qA7gGNaVqR6-v2A_jrNQq2Kb';
const SUPABASE_SERVICE_KEY = 'YOUR_SUPABASE_SERVICE_ROLE_KEY'; // For admin operations only!

// Check if Supabase is configured (true if URL doesn't contain YOUR_ placeholder)
const IS_SUPABASE_CONFIGURED = !SUPABASE_URL.includes('YOUR_') && !SUPABASE_ANON_KEY.includes('YOUR_');

// ============================================
// SUPABASE CLIENT (Browser-safe)
// ============================================

class GAiSupabase {
    constructor() {
        this.url = SUPABASE_URL;
        this.key = SUPABASE_ANON_KEY;
        this.isConfigured = IS_SUPABASE_CONFIGURED;
    }

    // Make HTTP request to Supabase
    async request(method, endpoint, data = null, options = {}) {
        if (!this.isConfigured) {
            console.warn('Supabase not configured. Using localStorage fallback.');
            return { data: null, error: 'Supabase not configured' };
        }

        const url = `${this.url}${endpoint}`;
        const headers = {
            'apikey': this.key,
            'Authorization': `Bearer ${this.key}`,
            'Content-Type': 'application/json',
            ...options.headers
        };

        try {
            const response = await fetch(url, {
                method,
                headers,
                body: data ? JSON.stringify(data) : null
            });

            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.message || 'Request failed');
            }

            return { data: result, error: null };
        } catch (error) {
            console.error('Supabase request error:', error);
            return { data: null, error: error.message };
        }
    }

    // Auth methods
    async signUp(email, password, metadata = {}) {
        return this.request('POST', '/auth/v1/signup', {
            email,
            password,
            data: metadata
        });
    }

    async signIn(email, password) {
        return this.request('POST', '/auth/v1/token?grant_type=password', {
            email,
            password
        });
    }

    async signOut() {
        return this.request('POST', '/auth/v1/logout', {});
    }

    async getUser() {
        return this.request('GET', '/auth/v1/user', null, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('gai_supabase_token')}`
            }
        });
    }

    // Database methods
    async from(table) {
        return {
            select: (columns = '*') => this.request('GET', `/rest/v1/${table}?select=${columns}`),
            insert: (data) => this.request('POST', `/rest/v1/${table}`, data),
            update: (data, filters = {}) => {
                const query = Object.entries(filters)
                    .map(([k, v]) => `${k}=eq.${v}`)
                    .join('&');
                return this.request('PATCH', `/rest/v1/${table}?${query}`, data);
            },
            delete: (filters = {}) => {
                const query = Object.entries(filters)
                    .map(([k, v]) => `${k}=eq.${v}`)
                    .join('&');
                return this.request('DELETE', `/rest/v1/${table}?${query}`);
            },
            eq: (column, value) => ({
                single: () => this.request('GET', `/rest/v1/${table}?${column}=eq.${value}&limit=1`)
            })
        };
    }
}

// Create global instance
const supabase = new GAiSupabase();

// ============================================
// FALLBACK TO LOCALSTORAGE (if Supabase not configured)
// ============================================

const GAiData = {
    // Get users from localStorage or Supabase
    async getUsers() {
        if (supabase.isConfigured) {
            const { data, error } = await supabase.from('users').select('*');
            if (!error) return data;
        }
        return JSON.parse(localStorage.getItem('gai_users') || '[]');
    },

    // Save users to localStorage or Supabase
    async saveUsers(users) {
        if (supabase.isConfigured) {
            // Sync to Supabase (upsert)
            for (const user of users) {
                await supabase.from('users').insert(user);
            }
        }
        localStorage.setItem('gai_users', JSON.stringify(users));
    },

    // User operations
    async createUser(userData) {
        const users = await this.getUsers();
        
        // Check for duplicates
        if (users.find(u => u.email === userData.email)) {
            throw new Error('Email already registered');
        }
        if (users.find(u => u.nickname.toLowerCase() === userData.nickname.toLowerCase())) {
            throw new Error('Nickname already taken');
        }

        // Generate ID
        const newId = 'GAi' + String(users.length + 1001).padStart(6, '0');
        const newUser = {
            id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
            user_id: newId,
            ...userData,
            createdAt: new Date().toISOString(),
            status: 'active'
        };

        users.push(newUser);
        await this.saveUsers(users);
        return newUser;
    },

    async findUser(identifier, password = null) {
        const users = await this.getUsers();
        const user = users.find(u => 
            u.id === identifier || 
            u.email === identifier || 
            u.nickname === identifier ||
            u.user_id === identifier
        );

        if (!user) return null;
        
        // If password provided, verify it
        if (password && user.password) {
            // Simple comparison (use bcrypt in production)
            const storedPassword = user.password.includes('b64:') 
                ? atob(user.password.replace('b64:', '')) 
                : user.password;
            if (storedPassword !== password) return null;
        }

        return user;
    },

    async updateUser(userId, updates) {
        const users = await this.getUsers();
        const index = users.findIndex(u => u.id === userId || u.user_id === userId);
        if (index === -1) throw new Error('User not found');

        users[index] = { ...users[index], ...updates };
        await this.saveUsers(users);
        return users[index];
    },

    async deleteUser(userId) {
        let users = await this.getUsers();
        users = users.filter(u => u.id !== userId && u.user_id !== userId);
        await this.saveUsers(users);
    },

    // Services
    async getServices(filters = {}) {
        if (supabase.isConfigured) {
            const { data, error } = await supabase.from('services').select('*');
            if (!error) return data;
        }
        return JSON.parse(localStorage.getItem('gai_services') || '[]');
    },

    async createService(serviceData) {
        const services = await this.getServices();
        const newService = {
            id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
            ...serviceData,
            createdAt: new Date().toISOString()
        };
        services.push(newService);
        localStorage.setItem('gai_services', JSON.stringify(services));
        return newService;
    },

    // Messages
    async getMessages(userId) {
        if (supabase.isConfigured) {
            const { data, error } = await supabase.from('messages').select('*');
            if (!error) {
                return data.filter(m => m.sender_id === userId || m.receiver_id === userId);
            }
        }
        return JSON.parse(localStorage.getItem('gai_messages') || '[]');
    },

    async sendMessage(senderId, receiverId, content) {
        if (supabase.isConfigured) {
            await supabase.from('messages').insert({
                sender_id: senderId,
                receiver_id: receiverId,
                content
            });
        }
        
        const messages = JSON.parse(localStorage.getItem('gai_messages') || '[]');
        messages.push({
            id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
            sender_id: senderId,
            receiver_id: receiverId,
            content,
            created_at: new Date().toISOString()
        });
        localStorage.setItem('gai_messages', JSON.stringify(messages));
    }
};

// Export for use
window.GAiSupabase = GAiSupabase;
window.supabase = supabase;
window.GAiData = GAiData;
