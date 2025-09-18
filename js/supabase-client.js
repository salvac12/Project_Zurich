// Cliente Supabase para Project ZURICH - Alter5
// Funciones para interactuar con la base de datos Supabase

class SupabaseClient {
  constructor() {
    this.url = CONFIG.SUPABASE_URL;
    this.key = CONFIG.SUPABASE_ANON_KEY;
    this.headers = {
      'apikey': this.key,
      'Authorization': `Bearer ${this.key}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };
  }

  // Función genérica para hacer requests
  async request(endpoint, options = {}) {
    const url = `${this.url}/rest/v1/${endpoint}`;
    
    const config = {
      headers: this.headers,
      ...options
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Supabase devuelve array vacío para DELETE
      if (response.status === 204) {
        return { success: true };
      }

      return await response.json();
    } catch (error) {
      console.error('Supabase request error:', error);
      throw error;
    }
  }

  // Obtener visitantes con paginación
  async getVisitors(page = 1, limit = 100) {
    const offset = (page - 1) * limit;
    const endpoint = `visitors?offset=${offset}&limit=${limit}&order=created_at.desc`;
    
    const data = await this.request(endpoint);
    
    return {
      data: data,
      total: data.length, // En producción necesitarías un count separado
      page: page,
      limit: limit,
      table: 'visitors'
    };
  }

  // Obtener visitante por ID
  async getVisitor(id) {
    const data = await this.request(`visitors?id=eq.${id}`);
    return data[0] || null;
  }

  // Obtener visitante por token único
  async getVisitorByToken(token) {
    const data = await this.request(`visitors?unique_token=eq.${token}`);
    return data[0] || null;
  }

  // Crear nuevo visitante
  async createVisitor(visitorData) {
    const data = await this.request('visitors', {
      method: 'POST',
      body: JSON.stringify({
        ...visitorData,
        unique_token: visitorData.unique_token || this.generateUniqueToken(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    });
    
    return data[0];
  }

  // Actualizar visitante completo
  async updateVisitor(id, visitorData) {
    const data = await this.request(`visitors?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        ...visitorData,
        updated_at: new Date().toISOString()
      })
    });
    
    return data[0];
  }

  // Actualización parcial de visitante
  async patchVisitor(id, updates) {
    const data = await this.request(`visitors?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        ...updates,
        updated_at: new Date().toISOString()
      })
    });
    
    return data[0];
  }

  // Eliminar visitante (soft delete)
  async deleteVisitor(id) {
    await this.request(`visitors?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        is_active: false,
        updated_at: new Date().toISOString()
      })
    });
    
    return { success: true };
  }

  // Registrar evento de analytics
  async logAnalytics(analyticsData) {
    const data = await this.request('analytics', {
      method: 'POST',
      body: JSON.stringify({
        ...analyticsData,
        created_at: new Date().toISOString()
      })
    });
    
    return data[0];
  }

  // Crear sesión
  async createSession(sessionData) {
    const data = await this.request('sessions', {
      method: 'POST',
      body: JSON.stringify({
        ...sessionData,
        session_token: sessionData.session_token || this.generateSessionToken(),
        started_at: new Date().toISOString(),
        last_activity: new Date().toISOString()
      })
    });
    
    return data[0];
  }

  // Actualizar actividad de sesión
  async updateSessionActivity(sessionToken) {
    await this.request(`sessions?session_token=eq.${sessionToken}`, {
      method: 'PATCH',
      body: JSON.stringify({
        last_activity: new Date().toISOString()
      })
    });
  }

  // Generar token único
  generateUniqueToken() {
    return 'token_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Generar token de sesión
  generateSessionToken() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 12);
  }

  // Validar acceso por token
  async validateAccess(token) {
    try {
      const visitor = await this.getVisitorByToken(token);
      
      if (!visitor || !visitor.is_active) {
        return { valid: false, visitor: null };
      }

      // Actualizar contador de accesos
      await this.patchVisitor(visitor.id, {
        access_count: (visitor.access_count || 0) + 1,
        last_accessed: new Date().toISOString()
      });

      return { valid: true, visitor: visitor };
    } catch (error) {
      console.error('Error validating access:', error);
      return { valid: false, visitor: null, error: error.message };
    }
  }
}

// Crear instancia global del cliente Supabase
window.supabaseClient = new SupabaseClient();

console.log('Supabase client initialized:', CONFIG.USE_SUPABASE ? 'ENABLED' : 'DISABLED');