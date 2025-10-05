// Sistema de lookup de visitantes para asociar tokens con emails reales
// Este script se debe cargar ANTES de vercel-analytics.js

class VisitorLookup {
  constructor() {
    this.visitorInfo = null;
    this.token = null;
  }

  async init() {
    // Obtener token de la URL
    const urlParams = new URLSearchParams(window.location.search);
    this.token = urlParams.get('token');
    
    if (this.token) {
      await this.lookupVisitorInfo(this.token);
      this.updateAnalyticsWithRealEmail();
    }
  }

  async lookupVisitorInfo(token) {
    try {
      console.log('🔍 Looking up visitor info for token:', token.substring(0, 8) + '...');
      
      // Buscar en la tabla visitors por token específico
      const response = await fetch(`/api/tables/visitors?limit=1000`);
      
      if (response.ok) {
        const result = await response.json();
        
        // Buscar manualmente el token exacto
        const foundVisitor = result.data?.find(visitor => visitor.token === token);
        
        if (foundVisitor) {
          this.visitorInfo = foundVisitor;
          console.log('✅ Visitor found by token:', this.visitorInfo.email);
          
          // Actualizar localStorage con información real
          localStorage.setItem('visitor_info', JSON.stringify(this.visitorInfo));
          localStorage.setItem('visitor_token', this.visitorInfo.token);
          localStorage.setItem('visitor_email', this.visitorInfo.email);
          
          // Actualizar contador de acceso
          await this.updateAccessCount();
          return;
        }
      }
      
      console.log('⚠️ Token not found in database, creating new visitor');
      await this.createNewVisitor();
    } catch (error) {
      console.error('Error looking up visitor:', error);
      // Si falla el lookup, crear visitante temporal
      this.createTemporaryVisitor();
    }
  }

  async updateAccessCount() {
    try {
      const currentCount = this.visitorInfo.access_count || 0;
      const newCount = currentCount + 1;
      
      const updateResponse = await fetch(`/api/tables/visitors/${this.visitorInfo.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_count: newCount,
          last_access: new Date().toISOString()
        })
      });
      
      if (updateResponse.ok) {
        console.log(`📈 Access count updated: ${newCount}`);
        this.visitorInfo.access_count = newCount;
        this.visitorInfo.last_access = new Date().toISOString();
      }
    } catch (error) {
      console.error('Error updating access count:', error);
    }
  }

  async createNewVisitor() {
    try {
      // Crear nuevo visitante con token de la URL pero sin email real
      const newVisitor = {
        token: this.token,
        email: `${this.token.substring(0, 8)}@unknown-visitor.com`,
        name: '',
        company: '',
        status: 'active',
        access_count: 1,
        first_access: new Date().toISOString(),
        last_access: new Date().toISOString()
      };

      const response = await fetch('/api/visitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newVisitor)
      });

      if (response.ok) {
        this.visitorInfo = await response.json();
        console.log('✅ New visitor created:', this.visitorInfo.email);
        localStorage.setItem('visitor_info', JSON.stringify(this.visitorInfo));
      }
    } catch (error) {
      console.error('Error creating new visitor:', error);
      this.createTemporaryVisitor();
    }
  }

  createTemporaryVisitor() {
    // Crear visitante temporal si todo falla
    this.visitorInfo = {
      token: this.token || `temp_${Date.now()}`,
      email: `temp_${Date.now()}@temporary.com`,
      name: 'Visitante Temporal',
      company: '',
      access_count: 1
    };
    
    localStorage.setItem('visitor_info', JSON.stringify(this.visitorInfo));
    console.log('⚠️ Created temporary visitor:', this.visitorInfo.email);
  }

  updateAnalyticsWithRealEmail() {
    if (this.visitorInfo) {
      // Hacer disponible globalmente para vercel-analytics.js
      window.visitorInfo = this.visitorInfo;
      window.visitorEmail = this.visitorInfo.email;
      window.visitorToken = this.visitorInfo.token;
      
      console.log('📧 Real email set for analytics:', this.visitorInfo.email);
    }
  }

  getVisitorInfo() {
    return this.visitorInfo;
  }

  getVisitorEmail() {
    return this.visitorInfo ? this.visitorInfo.email : null;
  }

  getVisitorToken() {
    return this.visitorInfo ? this.visitorInfo.token : null;
  }

  // Método para actualizar información del visitante (nombre, empresa)
  async updateVisitorInfo(updates) {
    if (!this.visitorInfo) return false;

    try {
      const response = await fetch(`/api/tables/visitors/${this.visitorInfo.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        const updatedVisitor = await response.json();
        this.visitorInfo = { ...this.visitorInfo, ...updatedVisitor };
        localStorage.setItem('visitor_info', JSON.stringify(this.visitorInfo));
        
        console.log('✅ Visitor info updated:', updates);
        return true;
      }
    } catch (error) {
      console.error('Error updating visitor info:', error);
    }
    
    return false;
  }
}

// Inicializar lookup de visitante
let visitorLookupInstance;

document.addEventListener('DOMContentLoaded', async function() {
  visitorLookupInstance = new VisitorLookup();
  await visitorLookupInstance.init();
  
  // Hacer disponible globalmente
  window.visitorLookup = visitorLookupInstance;
  
  console.log('🚀 Visitor Lookup initialized');
});

// Exportar para uso en otros scripts
window.VisitorLookup = VisitorLookup;