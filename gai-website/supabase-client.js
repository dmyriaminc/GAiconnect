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
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1bWZodHNkcGV2Znh4eWNuam90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1OTc4MjEsImV4cCI6MjA5MDE3MzgyMX0.jKtkO_yAJKI6v2uAEYyonOGqxyNmDpXbYVvCUUqGvIU';
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
            'Prefer': 'return=representation',
            ...options.headers
        };

        try {
            const response = await fetch(url, {
                method,
                headers,
                body: data ? JSON.stringify(data) : null
            });

            const contentType = response.headers.get('content-type');
            let result = null;
            
            if (contentType && contentType.includes('application/json')) {
                result = await response.json();
            }
            
            if (!response.ok) {
                const errorMsg = result?.message || result?.error?.message || `Request failed: ${response.status}`;
                console.warn('Supabase warning:', errorMsg);
                return { data: null, error: errorMsg, status: response.status };
            }

            console.log('Supabase request success:', method, endpoint);
            return { data: result, error: null };
        } catch (error) {
            console.error('Supabase request error:', error.message);
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

    // Database methods - returns chainable object compatible with Supabase JS API
    from(table) {
        const self = this;
        
        // Helper to create a proper result object that can be awaited
        function createResult(promise) {
            return {
                then(resolve, reject) {
                    return promise.then(result => {
                        if (result.error) {
                            reject(result.error);
                        } else {
                            resolve({ data: result.data, error: result.error });
                        }
                    }).catch(err => reject(err));
                },
                async then(resolve, reject) {
                    try {
                        const result = await promise;
                        return resolve({ data: result.data, error: result.error });
                    } catch (err) {
                        return reject(err);
                    }
                },
                // Make it await-able and provide .data/.error properties
                async *[Symbol.asyncIterator]() {
                    const result = await promise;
                    yield result;
                },
                // Cache the promise result
                _promise: promise,
                get data() {
                    if (this._cached) return this._cached.data;
                    return null;
                },
                get error() {
                    if (this._cached) return this._cached.error;
                    return null;
                },
                async _ensure() {
                    if (!this._cached) {
                        this._cached = await promise;
                    }
                    return this._cached;
                },
                // Allow awaiting the result directly
                async valueOf() {
                    return (await this._ensure()).data;
                },
                toString() {
                    return '[object GAiSupabaseQuery]';
                },
                // Add .then() for Promise compatibility
                then(onFulfilled, onRejected) {
                    return promise.then(r => onFulfilled({ data: r.data, error: r.error }), onRejected);
                },
                catch(onRejected) {
                    return promise.then(r => ({ data: r.data, error: r.error })).catch(onRejected);
                },
                finally(onFinally) {
                    return promise.finally(onFinally);
                }
            };
        }
        
        return {
            select: (columns = '*') => {
                const promise = self.request('GET', `/rest/v1/${table}?select=${columns}`);
                const result = createResult(promise);
                // Add data/error getters after promise resolves
                return new Promise((resolve) => {
                    promise.then(r => {
                        resolve({ 
                            data: r.data, 
                            error: r.error,
                            // Add chainable methods
                            eq: (column, value) => {
                                const eqPromise = self.request('GET', `/rest/v1/${table}?select=${columns}&${column}=eq.${value}`);
                                return new Promise((res) => {
                                    eqPromise.then(rp => {
                                        res({ data: rp.data, error: rp.error });
                                    }).catch(err => {
                                        res({ data: null, error: err });
                                    });
                                });
                            },
                            // Add array methods for convenience
                            then: (onFulfilled, onRejected) => Promise.resolve({ data: r.data, error: r.error }).then(onFulfilled, onRejected),
                            catch: (onRejected) => Promise.resolve({ data: r.data, error: r.error }).catch(onRejected),
                            finally: (onFinally) => Promise.resolve({ data: r.data, error: r.error }).finally(onFinally)
                        });
                    }).catch(err => {
                        resolve({ data: null, error: err });
                    });
                });
            },
            insert: (data) => {
                const promise = self.request('POST', `/rest/v1/${table}`, data);
                return new Promise((resolve) => {
                    promise.then(r => {
                        resolve({ data: r.data, error: r.error });
                    }).catch(err => {
                        resolve({ data: null, error: err });
                    });
                });
            },
            update: (data, filters = {}) => {
                const query = Object.entries(filters)
                    .map(([k, v]) => `${k}=eq.${v}`)
                    .join('&');
                const promise = self.request('PATCH', `/rest/v1/${table}?${query}`, data);
                return new Promise((resolve) => {
                    promise.then(r => {
                        resolve({ data: r.data, error: r.error });
                    }).catch(err => {
                        resolve({ data: null, error: err });
                    });
                });
            },
            delete: (filters = {}) => {
                const query = Object.entries(filters)
                    .map(([k, v]) => `${k}=eq.${v}`)
                    .join('&');
                const promise = self.request('DELETE', `/rest/v1/${table}?${query}`);
                return new Promise((resolve) => {
                    promise.then(r => {
                        resolve({ data: r.data, error: r.error });
                    }).catch(err => {
                        resolve({ data: null, error: err });
                    });
                });
            },
            eq: (column, value) => ({
                single: () => {
                    const promise = self.request('GET', `/rest/v1/${table}?${column}=eq.${value}&limit=1`);
                    return new Promise((resolve) => {
                        promise.then(r => {
                            resolve({ data: r.data ? r.data[0] : null, error: r.error });
                        }).catch(err => {
                            resolve({ data: null, error: err });
                        });
                    });
                }
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
    // Demo users for testing (when Supabase not available)
    demoUsers: [
        {
            id: 'demo-001',
            user_id: 'GAi000001',
            fullname: 'Demo User',
            nickname: 'demo',
            email: 'demo@gai.connect',
            password: 'demo123',
            tier: 'Standard',
            nationality: 'US',
            location: 'New York',
            bio: 'Demo account for testing',
            verified: true,
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        },
        {
            id: 'admin-001',
            user_id: 'GAi000000',
            fullname: 'System Administrator',
            nickname: 'admin',
            email: 'admin@gai.connect',
            password: 'GAiAdmin2024!',
            tier: 'Elite',
            nationality: 'US',
            location: 'Headquarters',
            bio: 'Admin account',
            verified: true,
            status: 'active',
            is_admin: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }
    ],

    // Initialize demo users if localStorage is empty
    initDemoUsers() {
        const existingUsers = localStorage.getItem('gai_users');
        if (!existingUsers || existingUsers === '[]') {
            localStorage.setItem('gai_users', JSON.stringify(this.demoUsers));
            console.log('Demo users initialized');
        }
    },

    // Get users from localStorage or Supabase
    async getUsers() {
        // Initialize demo users if needed
        this.initDemoUsers();
        
        // Try Supabase first
        if (supabase.isConfigured) {
            try {
                const result = await supabase.from('users').select('*');
                const { data, error } = result;
                if (!error && data && data.length > 0) {
                    // Cache in localStorage
                    localStorage.setItem('gai_users', JSON.stringify(data));
                    console.log('Users loaded from Supabase:', data.length);
                    return data;
                }
            } catch (e) {
                console.warn('Supabase getUsers error:', e.message);
            }
        }
        // Fallback to localStorage
        const localUsers = JSON.parse(localStorage.getItem('gai_users') || '[]');
        console.log('Users loaded from localStorage:', localUsers.length);
        return localUsers;
    },

    // Save users to localStorage or Supabase
    async saveUsers(users) {
        // Always save to localStorage first
        localStorage.setItem('gai_users', JSON.stringify(users));
        
        if (supabase.isConfigured) {
            // Try to sync to Supabase (best effort)
            try {
                for (const user of users) {
                    const { error } = await supabase.from('users').insert(user);
                    if (error) {
                        console.warn('Supabase user sync failed:', error);
                    }
                }
            } catch (e) {
                console.warn('Supabase sync error:', e.message);
            }
        }
    },

    // User operations
    async createUser(userData) {
        const users = await this.getUsers();
        
        // Check for duplicates
        if (users.find(u => u.email === userData.email)) {
            throw new Error('Email already registered');
        }
        if (users.find(u => u.nickname && u.nickname.toLowerCase() === userData.nickname?.toLowerCase())) {
            throw new Error('Nickname already taken');
        }

        // Generate ID if not provided
        const newId = userData.id || userData.user_id || 'GAi' + String(users.length + 1001).padStart(6, '0');
        const newUser = {
            id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
            user_id: newId,
            fullname: userData.fullname || '',
            nickname: userData.nickname || '',
            email: userData.email || '',
            password: userData.password || '',
            tier: userData.tier || 'Standard',
            nationality: userData.nationality || '',
            location: userData.location || '',
            bio: userData.bio || '',
            verified: userData.verified || false,
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        // Add to local array
        users.push(newUser);
        
        // Save to localStorage
        localStorage.setItem('gai_users', JSON.stringify(users));
        
        // Sync to Supabase
        if (supabase.isConfigured) {
            try {
                const { error } = await supabase.from('users').insert(newUser);
                if (error) {
                    console.warn('Failed to create user in Supabase:', error.message);
                } else {
                    console.log('User created in Supabase');
                }
            } catch (e) {
                console.warn('Supabase createUser error:', e.message);
            }
        }
        
        return newUser;
    },

    async findUser(identifier, password = null) {
        const users = await this.getUsers();
        const normalizedId = identifier.toUpperCase();
        
        // Normalize membership ID - handle formats like "GAi000001", "GAI000001", "000001"
        let normalizedMemberId = normalizedId;
        if (!normalizedId.startsWith('GAI') && /^\d+$/.test(identifier)) {
            normalizedMemberId = 'GAI' + String(identifier).padStart(6, '0');
        }
        
        const user = users.find(u => 
            // Match by id (UUID)
            u.id === identifier || 
            u.id?.toLowerCase() === normalizedId.toLowerCase() ||
            // Match by user_id (membership ID like GAi000001)
            u.user_id === identifier ||
            u.user_id?.toUpperCase() === normalizedId ||
            u.user_id?.toUpperCase() === normalizedMemberId ||
            // Match by email
            u.email === identifier || 
            u.email?.toLowerCase() === identifier.toLowerCase() ||
            // Match by nickname
            u.nickname === identifier ||
            u.nickname?.toLowerCase() === identifier.toLowerCase()
        );

        if (!user) return null;
        
        // If password provided, verify it
        if (password && user.password) {
            // Handle base64 encoded passwords
            let storedPassword = user.password;
            if (user.password.includes('b64:')) {
                try {
                    storedPassword = atob(user.password.replace('b64:', ''));
                } catch (e) {
                    storedPassword = user.password.replace('b64:', '');
                }
            }
            if (storedPassword !== password) return null;
        }

        return user;
    },

    async updateUser(userId, updates) {
        const users = await this.getUsers();
        const index = users.findIndex(u => u.id === userId || u.user_id === userId);
        if (index === -1) throw new Error('User not found');

        users[index] = { 
            ...users[index], 
            ...updates,
            updated_at: new Date().toISOString()
        };
        
        // Update localStorage
        localStorage.setItem('gai_users', JSON.stringify(users));
        
        // Sync to Supabase
        if (supabase.isConfigured) {
            try {
                const user = users[index];
                const { error } = await supabase.from('users').update(updates).eq('id', user.id);
                if (error) {
                    console.warn('Failed to update user in Supabase:', error.message);
                } else {
                    console.log('User updated in Supabase');
                }
            } catch (e) {
                console.warn('Supabase updateUser error:', e.message);
            }
        }
        
        return users[index];
    },

    async deleteUser(userId) {
        let users = await this.getUsers();
        const userToDelete = users.find(u => u.id === userId || u.user_id === userId);
        
        users = users.filter(u => u.id !== userId && u.user_id !== userId);
        
        // Update localStorage
        localStorage.setItem('gai_users', JSON.stringify(users));
        
        // Delete from Supabase
        if (supabase.isConfigured && userToDelete) {
            try {
                const { error } = await supabase.from('users').delete().eq('id', userToDelete.id);
                if (error) {
                    console.warn('Failed to delete user from Supabase:', error.message);
                } else {
                    console.log('User deleted from Supabase');
                }
            } catch (e) {
                console.warn('Supabase deleteUser error:', e.message);
            }
        }
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
        
        // Sync to Supabase
        if (supabase.isConfigured) {
            try {
                await supabase.from('services').insert({
                    title: serviceData.title || '',
                    category: serviceData.category || 'General',
                    description: serviceData.description || '',
                    price: serviceData.price || 0,
                    price_unit: serviceData.price_unit || 'fixed',
                    location: serviceData.location || '',
                    status: 'active'
                });
                console.log('Service synced to Supabase');
            } catch (err) {
                console.warn('Failed to sync service:', err.message);
            }
        }
        
        return newService;
    },

    // Messages
    async getMessages(userId) {
        // Get local messages first
        const localMessages = JSON.parse(localStorage.getItem('gai_messages') || '[]');
        
        if (supabase.isConfigured) {
            try {
                const { data, error } = await supabase.from('messages').select('*');
                if (!error && data) {
                    // Merge with local messages
                    const localIds = new Set(localMessages.map(m => m.id));
                    const newMessages = data.filter(m => 
                        (m.sender_id === userId || m.receiver_id === userId) && 
                        !localIds.has(m.id)
                    );
                    
                    if (newMessages.length > 0) {
                        return [...localMessages, ...newMessages];
                    }
                }
            } catch (err) {
                console.warn('Failed to fetch messages from Supabase:', err.message);
            }
        }
        return localMessages;
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
    },
    
    // Connections
    async getConnections(userId) {
        const localConnections = JSON.parse(localStorage.getItem('gai_connections') || '[]');
        
        if (supabase.isConfigured) {
            try {
                const { data, error } = await supabase.from('connections').select('*');
                if (!error && data) {
                    return data;
                }
            } catch (err) {
                console.warn('Failed to fetch connections from Supabase:', err.message);
            }
        }
        return localConnections;
    },
    
    async addConnection(fromUserId, toUserId, status = 'pending') {
        const connections = JSON.parse(localStorage.getItem('gai_connections') || '[]');
        
        const newConnection = {
            id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
            from_user_id: fromUserId,
            to_user_id: toUserId,
            status: status,
            created_at: new Date().toISOString()
        };
        
        connections.push(newConnection);
        localStorage.setItem('gai_connections', JSON.stringify(connections));
        
        if (supabase.isConfigured) {
            try {
                await supabase.from('connections').insert(newConnection);
                console.log('Connection synced to Supabase');
            } catch (err) {
                console.warn('Failed to sync connection:', err.message);
            }
        }
        
        return newConnection;
    },
    
    async updateConnectionStatus(connectionId, status) {
        const connections = JSON.parse(localStorage.getItem('gai_connections') || '[]');
        const index = connections.findIndex(c => c.id === connectionId);
        
        if (index !== -1) {
            connections[index].status = status;
            localStorage.setItem('gai_connections', JSON.stringify(connections));
            
            if (supabase.isConfigured) {
                try {
                    await supabase.from('connections').update({ status }).eq('id', connectionId);
                } catch (err) {
                    console.warn('Failed to update connection in Supabase:', err.message);
                }
            }
        }
    },
    
    // Subscriptions/Memberships
    async getSubscriptions(userId) {
        const localSubs = JSON.parse(localStorage.getItem('gai_subscriptions') || '[]');
        
        if (supabase.isConfigured) {
            try {
                const { data, error } = await supabase.from('subscriptions').select('*');
                if (!error && data) {
                    return data;
                }
            } catch (err) {
                console.warn('Failed to fetch subscriptions from Supabase:', err.message);
            }
        }
        return localSubs;
    },
    
    async createSubscription(userId, plan, tier) {
        const subscriptions = JSON.parse(localStorage.getItem('gai_subscriptions') || '[]');
        
        const newSub = {
            id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
            user_id: userId,
            plan: plan,
            tier: tier,
            status: 'active',
            started_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        };
        
        subscriptions.push(newSub);
        localStorage.setItem('gai_subscriptions', JSON.stringify(subscriptions));
        
        if (supabase.isConfigured) {
            try {
                await supabase.from('subscriptions').insert(newSub);
                console.log('Subscription synced to Supabase');
            } catch (err) {
                console.warn('Failed to sync subscription:', err.message);
            }
        }
        
        return newSub;
    },
    
    // Activity logging
    async logActivity(userId, action, details = {}) {
        const activities = JSON.parse(localStorage.getItem('gai_activities') || '[]');
        
        const newActivity = {
            id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
            user_id: userId,
            action: action,
            details: details,
            created_at: new Date().toISOString()
        };
        
        activities.unshift(newActivity);
        if (activities.length > 100) activities.pop();
        localStorage.setItem('gai_activities', JSON.stringify(activities));
        
        if (supabase.isConfigured) {
            try {
                await supabase.from('activities').insert(newActivity);
            } catch (err) {
                console.warn('Failed to log activity to Supabase:', err.message);
            }
        }
        
        return newActivity;
    },
    
    // Full data sync - load all from Supabase and cache locally
    async syncAllData() {
        if (!supabase.isConfigured) {
            console.log('Supabase not configured, using local data only');
            return;
        }
        
        console.log('Syncing all data from Supabase...');
        
        try {
            // Sync users
            const { data: users } = await supabase.from('users').select('*');
            if (users && users.length > 0) {
                localStorage.setItem('gai_users', JSON.stringify(users));
                console.log('Synced', users.length, 'users');
            }
            
            // Sync services
            const { data: services } = await supabase.from('services').select('*');
            if (services && services.length > 0) {
                localStorage.setItem('gai_services', JSON.stringify(services));
                console.log('Synced', services.length, 'services');
            }
            
            // Sync messages
            const { data: messages } = await supabase.from('messages').select('*');
            if (messages && messages.length > 0) {
                localStorage.setItem('gai_messages', JSON.stringify(messages));
                console.log('Synced', messages.length, 'messages');
            }
            
            // Sync connections
            const { data: connections } = await supabase.from('connections').select('*');
            if (connections && connections.length > 0) {
                localStorage.setItem('gai_connections', JSON.stringify(connections));
                console.log('Synced', connections.length, 'connections');
            }
            
            console.log('Full sync complete!');
        } catch (err) {
            console.error('Sync error:', err.message);
        }
    }
};

// ============================================
// DATA LAYER - Stores all entities and relationships
// ============================================
const GAiDataLayer = {
    // Get all data from localStorage
    getAll() {
        return {
            users: JSON.parse(localStorage.getItem('gai_users') || '[]'),
            services: JSON.parse(localStorage.getItem('gai_services') || '[]'),
            messages: JSON.parse(localStorage.getItem('gai_messages') || '[]'),
            connections: JSON.parse(localStorage.getItem('gai_connections') || '[]'),
            subscriptions: JSON.parse(localStorage.getItem('gai_subscriptions') || '[]'),
            activities: JSON.parse(localStorage.getItem('gai_activities') || '[]'),
            posts: JSON.parse(localStorage.getItem('gai_posts') || '[]')
        };
    },
    
    // Get user by ID
    getUserById(userId) {
        const users = JSON.parse(localStorage.getItem('gai_users') || '[]');
        return users.find(u => u.id === userId || u.user_id === userId);
    },
    
    // Get user's connections
    getUserConnections(userId) {
        const connections = JSON.parse(localStorage.getItem('gai_connections') || '[]');
        return connections.filter(c => 
            c.from_user_id === userId || c.to_user_id === userId
        );
    },
    
    // Get user's messages
    getUserMessages(userId) {
        const messages = JSON.parse(localStorage.getItem('gai_messages') || '[]');
        return messages.filter(m => 
            m.sender_id === userId || m.receiver_id === userId
        );
    },
    
    // Get feed for user (posts from connections)
    getFeed(userId) {
        const connections = this.getUserConnections(userId);
        const connectionIds = connections.map(c => 
            c.from_user_id === userId ? c.to_user_id : c.from_user_id
        );
        
        const posts = JSON.parse(localStorage.getItem('gai_posts') || '[]');
        const users = JSON.parse(localStorage.getItem('gai_users') || '[]');
        
        // Get posts from connections + own posts
        return posts.filter(p => 
            connectionIds.includes(p.user_id) || p.user_id === userId
        ).map(post => {
            const user = users.find(u => u.user_id === post.user_id);
            return { ...post, user };
        }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    },
    
    // Save post
    savePost(userId, content, type = 'text') {
        const posts = JSON.parse(localStorage.getItem('gai_posts') || '[]');
        const newPost = {
            id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
            user_id: userId,
            content: content,
            type: type,
            likes: [],
            comments: [],
            created_at: new Date().toISOString()
        };
        
        posts.unshift(newPost);
        localStorage.setItem('gai_posts', JSON.stringify(posts));
        
        // Trigger event
        GAiEventSystem.emit('postCreated', newPost);
        
        return newPost;
    }
};

// ============================================
// LOGIC LAYER - Decides what to show
// ============================================
const GAiLogicLayer = {
    // Get personalized feed
    getFeedForUser(userId, options = {}) {
        const { limit = 20, offset = 0 } = options;
        
        let posts = GAiDataLayer.getFeed(userId);
        
        // Sort by recency
        posts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        // Apply pagination
        return posts.slice(offset, offset + limit);
    },
    
    // Get recommendations
    getRecommendations(userId) {
        const users = JSON.parse(localStorage.getItem('gai_users') || '[]');
        const connections = GAiDataLayer.getUserConnections(userId);
        const connectionIds = connections.map(c => 
            c.from_user_id === userId ? c.to_user_id : c.from_user_id
        );
        
        // Find users who are not connected
        const recommendations = users.filter(u => 
            u.id !== userId && 
            u.user_id !== userId && 
            !connectionIds.includes(u.id) &&
            !connectionIds.includes(u.user_id)
        );
        
        // Sort by last active
        recommendations.sort((a, b) => {
            const aTime = new Date(a.last_active || a.created_at || 0);
            const bTime = new Date(b.last_active || b.created_at || 0);
            return bTime - aTime;
        });
        
        return recommendations.slice(0, 10);
    },
    
    // Get trending services
    getTrendingServices(limit = 10) {
        const services = JSON.parse(localStorage.getItem('gai_services') || '[]');
        
        // Sort by rating
        return services
            .sort((a, b) => (b.rating || 0) - (a.rating || 0))
            .slice(0, limit);
    },
    
    // Get online members
    getOnlineMembers() {
        const users = JSON.parse(localStorage.getItem('gai_users') || '[]');
        const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
        
        return users.filter(u => {
            const lastActive = new Date(u.last_active || 0).getTime();
            return lastActive > fiveMinutesAgo;
        });
    },
    
    // Search
    search(query) {
        const data = GAiDataLayer.getAll();
        const q = query.toLowerCase();
        
        return {
            users: data.users.filter(u => 
                (u.nickname && u.nickname.toLowerCase().includes(q)) ||
                (u.fullname && u.fullname.toLowerCase().includes(q))
            ),
            services: data.services.filter(s => 
                (s.title && s.title.toLowerCase().includes(q)) ||
                (s.description && s.description.toLowerCase().includes(q)) ||
                (s.category && s.category.toLowerCase().includes(q))
            )
        };
    }
};

// ============================================
// PRESENCE SYSTEM - Tracks online status
// ============================================
const GAPresenceSystem = {
    updatePresence(userId) {
        const users = JSON.parse(localStorage.getItem('gai_users') || '[]');
        const index = users.findIndex(u => u.id === userId || u.user_id === userId);
        
        if (index !== -1) {
            users[index].last_active = new Date().toISOString();
            users[index].is_online = true;
            localStorage.setItem('gai_users', JSON.stringify(users));
            
            // Broadcast presence update
            GAiEventSystem.emit('presenceUpdated', {
                userId: userId,
                status: 'online',
                timestamp: new Date().toISOString()
            });
        }
    },
    
    getOnlineStatus(userId) {
        const user = GAiDataLayer.getUserById(userId);
        if (!user) return false;
        
        const lastActive = new Date(user.last_active || 0).getTime();
        const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
        
        return lastActive > fiveMinutesAgo;
    },
    
    getOnlineUsers() {
        const users = JSON.parse(localStorage.getItem('gai_users') || '[]');
        const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
        
        return users.filter(u => {
            const lastActive = new Date(u.last_active || 0).getTime();
            return lastActive > fiveMinutesAgo;
        });
    },
    
    // Start presence heartbeat
    startHeartbeat(userId) {
        this.updatePresence(userId);
        setInterval(() => this.updatePresence(userId), 60000); // Every minute
    }
};

// ============================================
// REAL-TIME EVENT SYSTEM
// ============================================
const GAiEventSystem = {
    listeners: {},
    
    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
        
        return () => this.off(event, callback);
    },
    
    off(event, callback) {
        if (!this.listeners[event]) return;
        this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    },
    
    emit(event, data) {
        // Store event for history
        this.storeEvent(event, data);
        
        // Notify listeners
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => {
                try {
                    callback(data);
                } catch (err) {
                    console.error('Event callback error:', err);
                }
            });
        }
        
        // Also notify global listeners
        if (this.listeners['*']) {
            this.listeners['*'].forEach(callback => {
                try {
                    callback({ event, data });
                } catch (err) {
                    console.error('Global event callback error:', err);
                }
            });
        }
    },
    
    storeEvent(event, data) {
        const events = JSON.parse(localStorage.getItem('gai_events') || '[]');
        events.unshift({
            event,
            data,
            timestamp: new Date().toISOString()
        });
        
        // Keep last 100 events
        if (events.length > 100) events.pop();
        localStorage.setItem('gai_events', JSON.stringify(events));
    },
    
    getEventHistory(limit = 50) {
        return JSON.parse(localStorage.getItem('gai_events') || '[]').slice(0, limit);
    },
    
    // Subscribe to real-time updates (polling fallback for browsers without WebSockets)
    subscribeToRealtime(userId) {
        // Listen for local events
        this.on('postCreated', (post) => {
            console.log('New post received:', post.content);
        });
        
        this.on('messageReceived', (message) => {
            if (message.receiver_id === userId) {
                this.showNotification('New message', message.content);
            }
        });
        
        this.on('connectionRequest', (connection) => {
            if (connection.to_user_id === userId) {
                this.showNotification('New connection request');
            }
        });
        
        this.on('presenceUpdated', (data) => {
            console.log('User presence updated:', data.userId);
        });
        
        // Periodic sync (simulates real-time)
        setInterval(() => {
            if (typeof GAiData !== 'undefined') {
                GAiData.syncAllData();
            }
        }, 30000); // Every 30 seconds
    },
    
    showNotification(title, body) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, { body });
        }
        
        // Also add to in-app notifications
        if (typeof GAiNotifications !== 'undefined') {
            GAiNotifications.add('info', title, body || '');
        }
    }
};

// ============================================
// NOTIFICATION SYSTEM
// ============================================
const GAiNotifications = {
    maxNotifications: 50,
    
    getAll() {
        return JSON.parse(localStorage.getItem('gai_notifications') || '[]');
    },
    
    getUnread() {
        return this.getAll().filter(n => !n.read);
    },
    
    getUnreadCount() {
        return this.getUnread().length;
    },
    
    add(type, title, message, data = {}) {
        const notifications = this.getAll();
        const newNotification = {
            id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
            type: type,
            title: title,
            message: message,
            data: data,
            read: false,
            created_at: new Date().toISOString()
        };
        notifications.unshift(newNotification);
        if (notifications.length > this.maxNotifications) notifications.pop();
        localStorage.setItem('gai_notifications', JSON.stringify(notifications));
        window.dispatchEvent(new CustomEvent('gai-notification', { detail: newNotification }));
        return newNotification;
    },
    
    markAsRead(id) {
        const notifications = this.getAll();
        const idx = notifications.findIndex(n => n.id === id);
        if (idx !== -1) { notifications[idx].read = true; localStorage.setItem('gai_notifications', JSON.stringify(notifications)); }
    },
    
    markAllAsRead() {
        const notifications = this.getAll();
        notifications.forEach(n => n.read = true);
        localStorage.setItem('gai_notifications', JSON.stringify(notifications));
    },
    
    delete(id) {
        localStorage.setItem('gai_notifications', JSON.stringify(this.getAll().filter(n => n.id !== id)));
    },
    
    clearAll() {
        localStorage.setItem('gai_notifications', JSON.stringify([]));
    },
    
    addWelcome(username) { return this.add('success', 'Welcome to GAi Connect!', `Welcome, ${username}! Complete your profile to connect with others.`); },
    addLogin(username) { return this.add('info', 'Login Successful', `Welcome back, ${username}! You are now connected to the GAi network.`); },
    addMessage(sender, preview) { return this.add('message', `New message from ${sender}`, preview.substring(0, 100)); },
    addConnectionRequest(name) { return this.add('info', 'New Connection', `${name} wants to connect with you.`); },
    addServiceRequest(service, provider) { return this.add('warning', 'New Service Request', `New request for "${service}" from ${provider}.`); }
};

// ============================================
// GAi ADMIN SYSTEM - Full CRUD Operations
// ============================================

const GAiAdmin = {
    // Analytics
    async getStats() {
        const stats = {
            users: 0,
            services: 0,
            messages: 0,
            bookings: 0,
            reviews: 0,
            revenue: 0,
            activeUsers: 0,
            pendingApprovals: 0
        };
        
        try {
            const usersRes = await supabase.from('users').select('id,status,account_status,tier');
            if (usersRes.data) {
                stats.users = usersRes.data.length;
                stats.activeUsers = usersRes.data.filter(u => u.account_status === 'active').length;
            }
            
            const servicesRes = await supabase.from('services').select('id,status,approval_status,price');
            if (servicesRes.data) {
                stats.services = servicesRes.data.length;
                stats.pendingApprovals = servicesRes.data.filter(s => s.approval_status === 'pending').length;
                stats.revenue = servicesRes.data.reduce((sum, s) => sum + (parseFloat(s.price) || 0), 0);
            }
            
            const messagesRes = await supabase.from('messages').select('id');
            if (messagesRes.data) stats.messages = messagesRes.data.length;
            
            const bookingsRes = await supabase.from('bookings').select('id,status');
            if (bookingsRes.data) {
                stats.bookings = bookingsRes.data.length;
            }
            
            const reviewsRes = await supabase.from('reviews').select('id');
            if (reviewsRes.data) stats.reviews = reviewsRes.data.length;
            
            // Get from localStorage as fallback
            const localUsers = JSON.parse(localStorage.getItem('gai_users') || '[]');
            if (stats.users === 0 && localUsers.length > 0) {
                stats.users = localUsers.length;
                stats.activeUsers = localUsers.filter(u => u.status === 'active').length;
            }
            
        } catch (e) {
            console.warn('Admin stats error:', e.message);
        }
        
        return stats;
    },

    // User Management
    async getUsers(filters = {}) {
        try {
            let query = supabase.from('users').select('*').order('created_at', { ascending: false });
            if (filters.role) query = supabase.from('users').select('*').eq('role', filters.role);
            if (filters.status) query = supabase.from('users').select('*').eq('account_status', filters.status);
            if (filters.search) {
                const search = filters.search.toLowerCase();
                const allUsers = await supabase.from('users').select('*');
                if (allUsers.data) {
                    return allUsers.data.filter(u => 
                        u.fullname?.toLowerCase().includes(search) || 
                        u.email?.toLowerCase().includes(search) ||
                        u.nickname?.toLowerCase().includes(search) ||
                        u.user_id?.toLowerCase().includes(search)
                    );
                }
            }
            const result = await query;
            return result.data || [];
        } catch (e) {
            console.warn('Get users error:', e.message);
            return [];
        }
    },

    async getUserById(id) {
        try {
            const result = await supabase.from('users').select('*').eq('id', id).single();
            return result.data;
        } catch (e) {
            console.warn('Get user error:', e.message);
            return null;
        }
    },

    async updateUser(id, data) {
        try {
            data.updated_at = new Date().toISOString();
            const result = await supabase.from('users').update(data).eq('id', id);
            if (!result.error) {
                GAiEventSystem.emit('userUpdated', { id, data });
            }
            return result;
        } catch (e) {
            console.warn('Update user error:', e.message);
            return { error: e.message };
        }
    },

    async deleteUser(id) {
        try {
            const result = await supabase.from('users').delete().eq('id', id);
            if (!result.error) {
                GAiEventSystem.emit('userDeleted', { id });
            }
            return result;
        } catch (e) {
            console.warn('Delete user error:', e.message);
            return { error: e.message };
        }
    },

    async banUser(id, reason = '') {
        return this.updateUser(id, {
            account_status: 'banned',
            banned_at: new Date().toISOString(),
            ban_reason: reason
        });
    },

    async unbanUser(id) {
        return this.updateUser(id, {
            account_status: 'active',
            banned_at: null,
            ban_reason: null
        });
    },

    async changeUserRole(id, role) {
        return this.updateUser(id, { role });
    },

    async verifyUserKYC(id, status, notes = '') {
        return this.updateUser(id, {
            kyc_status: status,
            kyc_verified_at: status === 'approved' ? new Date().toISOString() : null,
            kyc_notes: notes
        });
    },

    // User Notes
    async addUserNote(adminId, userId, note) {
        try {
            const result = await supabase.from('user_notes').insert({
                admin_id: adminId,
                user_id: userId,
                note: note
            });
            return result;
        } catch (e) {
            console.warn('Add note error:', e.message);
            return { error: e.message };
        }
    },

    async getUserNotes(userId) {
        try {
            const result = await supabase.from('user_notes').select('*').eq('user_id', userId).order('created_at', { ascending: false });
            return result.data || [];
        } catch (e) {
            console.warn('Get notes error:', e.message);
            return [];
        }
    },

    // Services Management
    async getServices(filters = {}) {
        try {
            let query = supabase.from('services').select('*').order('created_at', { ascending: false });
            if (filters.category) query = supabase.from('services').select('*').eq('category', filters.category);
            if (filters.subcategory) query = supabase.from('services').select('*').eq('subcategory', filters.subcategory);
            if (filters.approval) query = supabase.from('services').select('*').eq('approval_status', filters.approval);
            if (filters.featured) query = supabase.from('services').select('*').eq('is_featured', true);
            if (filters.search) {
                const search = filters.search.toLowerCase();
                const all = await supabase.from('services').select('*');
                if (all.data) {
                    return all.data.filter(s => 
                        s.title?.toLowerCase().includes(search) || 
                        s.description?.toLowerCase().includes(search)
                    );
                }
            }
            const result = await query;
            return result.data || [];
        } catch (e) {
            console.warn('Get services error:', e.message);
            return [];
        }
    },

    async updateService(id, data) {
        try {
            data.updated_at = new Date().toISOString();
            const result = await supabase.from('services').update(data).eq('id', id);
            if (!result.error) {
                GAiEventSystem.emit('serviceUpdated', { id, data });
            }
            return result;
        } catch (e) {
            console.warn('Update service error:', e.message);
            return { error: e.message };
        }
    },

    async deleteService(id) {
        try {
            const result = await supabase.from('services').delete().eq('id', id);
            if (!result.error) {
                GAiEventSystem.emit('serviceDeleted', { id });
            }
            return result;
        } catch (e) {
            console.warn('Delete service error:', e.message);
            return { error: e.message };
        }
    },

    async approveService(id) {
        return this.updateService(id, { approval_status: 'approved' });
    },

    async rejectService(id, reason = '') {
        return this.updateService(id, { 
            approval_status: 'rejected',
            custom_fields: { ...{}, rejection_reason: reason }
        });
    },

    async featureService(id, featured = true, boostDays = 7) {
        const boostExpires = featured ? new Date(Date.now() + boostDays * 24 * 60 * 60 * 1000).toISOString() : null;
        return this.updateService(id, { 
            is_featured: featured,
            boost_expires: boostExpires
        });
    },

    // Bookings Management
    async getBookings(filters = {}) {
        try {
            let query = supabase.from('bookings').select('*').order('created_at', { ascending: false });
            if (filters.status) query = supabase.from('bookings').select('*').eq('status', filters.status);
            if (filters.serviceId) query = supabase.from('bookings').select('*').eq('service_id', filters.serviceId);
            if (filters.providerId) query = supabase.from('bookings').select('*').eq('provider_id', filters.providerId);
            const result = await query;
            return result.data || [];
        } catch (e) {
            console.warn('Get bookings error:', e.message);
            return [];
        }
    },

    async updateBooking(id, data) {
        try {
            data.updated_at = new Date().toISOString();
            const result = await supabase.from('bookings').update(data).eq('id', id);
            if (!result.error) {
                GAiEventSystem.emit('bookingUpdated', { id, data });
            }
            return result;
        } catch (e) {
            console.warn('Update booking error:', e.message);
            return { error: e.message };
        }
    },

    async createBooking(bookingData) {
        try {
            const result = await supabase.from('bookings').insert(bookingData);
            if (!result.error) {
                GAiEventSystem.emit('bookingCreated', { booking: bookingData });
            }
            return result;
        } catch (e) {
            console.warn('Create booking error:', e.message);
            return { error: e.message };
        }
    },

    // Reviews Management
    async getReviews(filters = {}) {
        try {
            let query = supabase.from('reviews').select('*').order('created_at', { ascending: false });
            if (filters.serviceId) query = supabase.from('reviews').select('*').eq('service_id', filters.serviceId);
            if (filters.status) query = supabase.from('reviews').select('*').eq('status', filters.status);
            const result = await query;
            return result.data || [];
        } catch (e) {
            console.warn('Get reviews error:', e.message);
            return [];
        }
    },

    async createReview(reviewData) {
        try {
            const result = await supabase.from('reviews').insert(reviewData);
            if (!result.error) {
                // Update service rating
                const reviews = await this.getReviews({ serviceId: reviewData.service_id });
                const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
                await this.updateService(reviewData.service_id, { 
                    rating: avgRating.toFixed(2),
                    reviews_count: reviews.length
                });
            }
            return result;
        } catch (e) {
            console.warn('Create review error:', e.message);
            return { error: e.message };
        }
    },

    async moderateReview(id, status) {
        try {
            const result = await supabase.from('reviews').update({ status }).eq('id', id);
            return result;
        } catch (e) {
            console.warn('Moderate review error:', e.message);
            return { error: e.message };
        }
    },

    // Messaging
    async getMessages(filters = {}) {
        try {
            let query = supabase.from('messages').select('*').order('created_at', { ascending: false });
            if (filters.senderId) query = supabase.from('messages').select('*').eq('sender_id', filters.senderId);
            if (filters.receiverId) query = supabase.from('messages').select('*').eq('receiver_id', filters.receiverId);
            if (filters.flagged) query = supabase.from('messages').select('*').eq('is_flagged', true);
            if (filters.search) {
                const all = await supabase.from('messages').select('*');
                if (all.data) {
                    return all.data.filter(m => m.content?.toLowerCase().includes(filters.search.toLowerCase()));
                }
            }
            const result = await query;
            return result.data || [];
        } catch (e) {
            console.warn('Get messages error:', e.message);
            return [];
        }
    },

    async flagMessage(id, notes = '') {
        try {
            const result = await supabase.from('messages').update({ 
                is_flagged: true,
                moderation_notes: notes
            }).eq('id', id);
            return result;
        } catch (e) {
            console.warn('Flag message error:', e.message);
            return { error: e.message };
        }
    },

    async deleteMessage(id) {
        try {
            const result = await supabase.from('messages').delete().eq('id', id);
            return result;
        } catch (e) {
            console.warn('Delete message error:', e.message);
            return { error: e.message };
        }
    },

    async sendBroadcast(broadcastData) {
        try {
            const result = await supabase.from('broadcasts').insert(broadcastData);
            if (!result.error) {
                GAiEventSystem.emit('broadcastSent', broadcastData);
            }
            return result;
        } catch (e) {
            console.warn('Broadcast error:', e.message);
            return { error: e.message };
        }
    },

    // Security
    async getBlacklist() {
        try {
            const result = await supabase.from('user_blacklist').select('*').order('created_at', { ascending: false });
            return result.data || [];
        } catch (e) {
            console.warn('Get blacklist error:', e.message);
            return [];
        }
    },

    async addToBlacklist(userId, reason) {
        try {
            const result = await supabase.from('user_blacklist').insert({ user_id: userId, reason });
            return result;
        } catch (e) {
            console.warn('Add to blacklist error:', e.message);
            return { error: e.message };
        }
    },

    async removeFromBlacklist(id) {
        try {
            const result = await supabase.from('user_blacklist').delete().eq('id', id);
            return result;
        } catch (e) {
            console.warn('Remove from blacklist error:', e.message);
            return { error: e.message };
        }
    },

    async getIPBlacklist() {
        try {
            const result = await supabase.from('ip_blacklist').select('*').order('created_at', { ascending: false });
            return result.data || [];
        } catch (e) {
            console.warn('Get IP blacklist error:', e.message);
            return [];
        }
    },

    async addIPToBlacklist(ip, reason) {
        try {
            const result = await supabase.from('ip_blacklist').insert({ ip_address: ip, reason });
            return result;
        } catch (e) {
            console.warn('Add IP to blacklist error:', e.message);
            return { error: e.message };
        }
    },

    async removeIPFromBlacklist(id) {
        try {
            const result = await supabase.from('ip_blacklist').delete().eq('id', id);
            return result;
        } catch (e) {
            console.warn('Remove IP from blacklist error:', e.message);
            return { error: e.message };
        }
    },

    // Workflow Automation
    async getWorkflowTriggers() {
        try {
            const result = await supabase.from('workflow_triggers').select('*').order('created_at', { ascending: false });
            return result.data || [];
        } catch (e) {
            console.warn('Get triggers error:', e.message);
            return [];
        }
    },

    async createWorkflowTrigger(data) {
        try {
            const result = await supabase.from('workflow_triggers').insert(data);
            return result;
        } catch (e) {
            console.warn('Create trigger error:', e.message);
            return { error: e.message };
        }
    },

    async updateWorkflowTrigger(id, data) {
        try {
            data.updated_at = new Date().toISOString();
            const result = await supabase.from('workflow_triggers').update(data).eq('id', id);
            return result;
        } catch (e) {
            console.warn('Update trigger error:', e.message);
            return { error: e.message };
        }
    },

    async deleteWorkflowTrigger(id) {
        try {
            const result = await supabase.from('workflow_triggers').delete().eq('id', id);
            return result;
        } catch (e) {
            console.warn('Delete trigger error:', e.message);
            return { error: e.message };
        }
    },

    async getWorkflowActions(triggerId) {
        try {
            const result = await supabase.from('workflow_actions').select('*').eq('trigger_id', triggerId).order('created_at', { ascending: false });
            return result.data || [];
        } catch (e) {
            console.warn('Get actions error:', e.message);
            return [];
        }
    },

    async createWorkflowAction(data) {
        try {
            const result = await supabase.from('workflow_actions').insert(data);
            return result;
        } catch (e) {
            console.warn('Create action error:', e.message);
            return { error: e.message };
        }
    },

    async getWorkflowExecutions(triggerId) {
        try {
            const result = await supabase.from('workflow_executions').select('*').eq('trigger_id', triggerId).order('executed_at', { ascending: false }).limit(50);
            return result.data || [];
        } catch (e) {
            console.warn('Get executions error:', e.message);
            return [];
        }
    },

    async logWorkflowExecution(triggerId, status, result) {
        try {
            const result = await supabase.from('workflow_executions').insert({
                trigger_id: triggerId,
                status: status,
                result: result
            });
            return result;
        } catch (e) {
            console.warn('Log execution error:', e.message);
            return { error: e.message };
        }
    },

    // AI Agents
    async getAIAgents() {
        try {
            const result = await supabase.from('ai_agents').select('*').order('created_at', { ascending: false });
            return result.data || [];
        } catch (e) {
            console.warn('Get AI agents error:', e.message);
            return [];
        }
    },

    async createAIAgent(data) {
        try {
            const result = await supabase.from('ai_agents').insert(data);
            return result;
        } catch (e) {
            console.warn('Create AI agent error:', e.message);
            return { error: e.message };
        }
    },

    async updateAIAgent(id, data) {
        try {
            data.updated_at = new Date().toISOString();
            const result = await supabase.from('ai_agents').update(data).eq('id', id);
            return result;
        } catch (e) {
            console.warn('Update AI agent error:', e.message);
            return { error: e.message };
        }
    },

    async deleteAIAgent(id) {
        try {
            const result = await supabase.from('ai_agents').delete().eq('id', id);
            return result;
        } catch (e) {
            console.warn('Delete AI agent error:', e.message);
            return { error: e.message };
        }
    },

    async toggleAIAgent(id, enabled) {
        return this.updateAIAgent(id, { enabled });
    },

    async getAILogs(agentId) {
        try {
            let query = supabase.from('ai_logs').select('*').order('created_at', { ascending: false }).limit(100);
            if (agentId) query = supabase.from('ai_logs').select('*').eq('agent_id', agentId).order('created_at', { ascending: false }).limit(100);
            const result = await query;
            return result.data || [];
        } catch (e) {
            console.warn('Get AI logs error:', e.message);
            return [];
        }
    },

    async logAIAction(agentId, action, inputData, resultData) {
        try {
            const result = await supabase.from('ai_logs').insert({
                agent_id: agentId,
                action: action,
                input_data: inputData,
                result: resultData
            });
            return result;
        } catch (e) {
            console.warn('Log AI action error:', e.message);
            return { error: e.message };
        }
    },

    // Activity Log
    async logActivity(userId, action, entityType, entityId, details = {}) {
        try {
            const result = await supabase.from('activity_log').insert({
                user_id: userId,
                action: action,
                entity_type: entityType,
                entity_id: entityId,
                details: details,
                ip_address: details.ip || null
            });
            return result;
        } catch (e) {
            console.warn('Log activity error:', e.message);
            return { error: e.message };
        }
    },

    async getActivityLog(filters = {}) {
        try {
            let query = supabase.from('activity_log').select('*').order('created_at', { ascending: false }).limit(200);
            if (filters.userId) query = supabase.from('activity_log').select('*').eq('user_id', filters.userId).order('created_at', { ascending: false }).limit(200);
            if (filters.action) query = supabase.from('activity_log').select('*').eq('action', filters.action).order('created_at', { ascending: false }).limit(200);
            const result = await query;
            return result.data || [];
        } catch (e) {
            console.warn('Get activity log error:', e.message);
            return [];
        }
    },

    // GDPR / Data Export
    async exportUserData(userId) {
        try {
            const user = await this.getUserById(userId);
            const messages = await this.getMessages({ senderId: userId });
            const messages2 = await this.getMessages({ receiverId: userId });
            const bookings = await this.getBookings({ providerId: userId });
            const reviews = await this.getReviews({ serviceId: null }); // Need to filter client-side
            const notes = await this.getUserNotes(userId);
            
            return {
                user: user,
                messages: [...messages, ...messages2],
                bookings: bookings,
                reviews: reviews.filter(r => r.user_id === userId),
                notes: notes,
                exported_at: new Date().toISOString()
            };
        } catch (e) {
            console.warn('Export user data error:', e.message);
            return null;
        }
    },

    // Subscription Plans
    async getSubscriptionPlans() {
        try {
            const result = await supabase.from('subscription_plans').select('*').eq('is_active', true).order('price', { ascending: true });
            return result.data || [];
        } catch (e) {
            console.warn('Get plans error:', e.message);
            return [];
        }
    },

    // Presence / Online Users
    async getOnlineUsers() {
        try {
            const allUsers = await supabase.from('users').select('id,user_id,fullname,nickname,avatar_url,account_status').eq('account_status', 'active');
            if (allUsers.data) {
                // Check local presence data
                const presenceData = JSON.parse(localStorage.getItem('gai_presence') || '{}');
                return allUsers.data.map(u => ({
                    ...u,
                    isOnline: presenceData[u.id] && (Date.now() - presenceData[u.id].lastActive < 300000)
                }));
            }
            return [];
        } catch (e) {
            console.warn('Get online users error:', e.message);
            return [];
        }
    }
};

// Export for use
window.GAiSupabase = GAiSupabase;
window.supabase = supabase;
window.GAiData = GAiData;
window.GAiDataLayer = GAiDataLayer;
window.GAiLogicLayer = GAiLogicLayer;
window.GAPresenceSystem = GAPresenceSystem;
window.GAiEventSystem = GAiEventSystem;
window.GAiNotifications = GAiNotifications;
window.GAiAdmin = GAiAdmin;

// Export config for diagnostics
window.SUPABASE_URL = SUPABASE_URL;
window.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;

// Auto-initialize on load
document.addEventListener('DOMContentLoaded', function() {
    // Start presence system if user is logged in
    const userId = localStorage.getItem('gai_userId') || localStorage.getItem('gai_membershipId');
    if (userId) {
        GAPresenceSystem.startHeartbeat(userId);
        GAiEventSystem.subscribeToRealtime(userId);
    }
});
