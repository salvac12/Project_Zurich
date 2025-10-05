// Supabase helper for Vercel API functions
// Provides database persistence for analytics and visitor tracking

class SupabaseAPI {
  constructor() {
    this.url = process.env.SUPABASE_URL;
    this.key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
    
    if (!this.url || !this.key) {
      console.warn('⚠️  Supabase credentials not configured. Using in-memory fallback.');
      this.enabled = false;
    } else {
      this.enabled = true;
      console.log('✅ Supabase connected:', this.url);
    }
  }

  async request(endpoint, options = {}) {
    if (!this.enabled) {
      throw new Error('Supabase not configured');
    }

    const url = `${this.url}/rest/v1/${endpoint}`;
    
    const config = {
      headers: {
        'apikey': this.key,
        'Authorization': `Bearer ${this.key}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
        ...options.headers
      },
      ...options
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Supabase error: ${response.status} - ${error}`);
    }

    if (response.status === 204) {
      return { success: true };
    }

    return await response.json();
  }

  // Visitors table operations
  async getVisitors(filters = {}) {
    let endpoint = 'visitors?select=*&order=created_at.desc';
    
    if (filters.limit) {
      endpoint += `&limit=${filters.limit}`;
    }
    if (filters.offset) {
      endpoint += `&offset=${filters.offset}`;
    }
    if (filters.search) {
      endpoint += `&or=(email.ilike.*${filters.search}*,name.ilike.*${filters.search}*,company.ilike.*${filters.search}*)`;
    }
    
    return await this.request(endpoint);
  }

  async getVisitorByToken(token) {
    const result = await this.request(`visitors?token=eq.${token}&limit=1`);
    return result[0] || null;
  }

  async createVisitor(visitor) {
    return await this.request('visitors', {
      method: 'POST',
      body: JSON.stringify({
        ...visitor,
        created_at: new Date().toISOString()
      })
    });
  }

  async updateVisitor(id, updates) {
    return await this.request(`visitors?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
  }

  async updateVisitorByToken(token, updates) {
    return await this.request(`visitors?token=eq.${token}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
  }

  // Analytics table operations
  async getAnalytics(filters = {}) {
    let endpoint = 'analytics?select=*&order=timestamp.desc';
    
    if (filters.limit) {
      endpoint += `&limit=${filters.limit}`;
    }
    if (filters.offset) {
      endpoint += `&offset=${filters.offset}`;
    }
    if (filters.event_type) {
      endpoint += `&event_type=eq.${filters.event_type}`;
    }
    if (filters.visitor_token) {
      endpoint += `&visitor_token=eq.${filters.visitor_token}`;
    }
    
    return await this.request(endpoint);
  }

  async createEvent(event) {
    return await this.request('analytics', {
      method: 'POST',
      body: JSON.stringify({
        ...event,
        timestamp: event.timestamp || new Date().toISOString(),
        created_at: new Date().toISOString()
      })
    });
  }

  // Aggregated analytics queries
  async getVisitorCount() {
    const result = await this.request('visitors?select=count');
    return result[0]?.count || 0;
  }

  async getEventCount(eventType) {
    let endpoint = 'analytics?select=count';
    if (eventType) {
      endpoint += `&event_type=eq.${eventType}`;
    }
    const result = await this.request(endpoint);
    return result[0]?.count || 0;
  }
}

// Export singleton instance
let supabaseInstance = null;

export function getSupabase() {
  if (!supabaseInstance) {
    supabaseInstance = new SupabaseAPI();
  }
  return supabaseInstance;
}

export default getSupabase;
