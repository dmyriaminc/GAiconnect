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
        
        const user = users.find(u => 
            u.id === identifier || 
            u.id?.toLowerCase() === normalizedId.toLowerCase() ||
            u.email === identifier || 
            u.email?.toLowerCase() === identifier.toLowerCase() ||
            u.nickname === identifier ||
            u.nickname?.toLowerCase() === identifier.toLowerCase() ||
            u.user_id === identifier ||
            u.user_id?.toUpperCase() === normalizedId
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
    }
};

// Export for use
window.GAiSupabase = GAiSupabase;
window.supabase = supabase;
window.GAiData = GAiData;
