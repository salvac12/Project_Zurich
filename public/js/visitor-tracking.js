// Sistema de Tracking Optimizado - Project ZURICH
// Maneja lookup de visitantes y registro de eventos

class VisitorTracker {
  constructor() {
    this.visitorInfo = null;
    this.token = null;
    this.sessionStart = Date.now();
    this.events = [];
    this.isActive = true;
    
    this.init();
  }

  async init() {
    console.log('🚀 Initializing Visitor Tracker...');
    
    // Obtener token de la URL
    const urlParams = new URLSearchParams(window.location.search);
    this.token = urlParams.get('token');
    
    if (this.token) {
      await this.lookupVisitor();
    } else {
      this.createAnonymousVisitor();
    }
    
    this.setupEventTracking();
    this.logPageView();
  }

  async lookupVisitor() {
    try {
      console.log('🔍 Looking up visitor for token:', this.token.substring(0, 8) + '...');
      
      const response = await fetch(`/api/tables/visitors?limit=1000`);
      if (!response.ok) throw new Error('API not available');
      
      const result = await response.json();
      const foundVisitor = result.data?.find(visitor => visitor.token === this.token);
      
      if (foundVisitor) {
        this.visitorInfo = foundVisitor;
        console.log('✅ Visitor found:', this.visitorInfo.email);
        
        // Actualizar contador de acceso
        await this.updateAccessCount();
        
        // Hacer disponible globalmente
        window.visitorInfo = this.visitorInfo;
      } else {
        console.log('⚠️ Token not found, creating new visitor...');
        await this.createNewVisitor();
      }
    } catch (error) {
      console.error('Error during lookup:', error);
      this.createAnonymousVisitor();
    }
  }

  async updateAccessCount() {
    try {
      const newCount = (this.visitorInfo.access_count || 0) + 1;
      
      await fetch(`/api/tables/visitors/${this.visitorInfo.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_count: newCount,
          last_access: new Date().toISOString()
        })
      });
      
      this.visitorInfo.access_count = newCount;
      console.log('📈 Access count updated:', newCount);
    } catch (error) {
      console.error('Error updating access count:', error);
    }
  }

  async createNewVisitor() {
    try {
      const newVisitor = {
        token: this.token,
        email: `${this.token.substring(0, 8)}@unknown-visitor.com`,
        name: 'Visitante Nuevo',
        company: '',
        status: 'active',
        access_count: 1,
        first_access: new Date().toISOString(),
        last_access: new Date().toISOString()
      };

      const response = await fetch('/api/tables/visitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newVisitor)
      });

      if (response.ok) {
        this.visitorInfo = await response.json();
        console.log('✅ New visitor created:', this.visitorInfo.email);
        window.visitorInfo = this.visitorInfo;
      }
    } catch (error) {
      console.error('Error creating visitor:', error);
      this.createAnonymousVisitor();
    }
  }

  createAnonymousVisitor() {
    this.visitorInfo = {
      token: this.token || `anon_${Date.now()}`,
      email: `anonymous_${Date.now()}@temp.com`,
      name: 'Visitante Anónimo',
      company: '',
      access_count: 1
    };
    
    console.log('⚠️ Created anonymous visitor');
    window.visitorInfo = this.visitorInfo;
  }

  setupEventTracking() {
    // Tracking de clicks
    document.addEventListener('click', (event) => {
      const target = event.target.closest('a, button');
      if (target) {
        this.handleClick(target);
      }
    });

    // Tracking de scroll
    let maxScroll = 0;
    window.addEventListener('scroll', () => {
      const scrollPercent = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
      if (scrollPercent > maxScroll) {
        maxScroll = Math.min(scrollPercent, 100);
      }
    });

    // Guardar sesión al salir
    window.addEventListener('beforeunload', () => {
      this.saveSession(maxScroll);
    });
  }

  handleClick(target) {
    const text = target.textContent.toLowerCase();
    const href = target.href || target.dataset.href;
    
    // Detectar tipo de descarga
    let downloadType = null;
    if (text.includes('term sheet') || text.includes('term-sheet')) {
      downloadType = 'term-sheet';
    } else if (text.includes('teaser')) {
      downloadType = 'teaser';
    } else if (text.includes('financial model') || text.includes('modelo financiero')) {
      downloadType = 'financial-model';
    } else if (text.includes('nda') || text.includes('confidencialidad')) {
      downloadType = 'nda';
    }

    if (downloadType) {
      this.logDownload(downloadType, target.textContent);
    }

    // Detectar solicitudes de NDA
    if (target.classList.contains('nda-button') || text.includes('nda') || text.includes('solicitar acceso')) {
      this.logNDARequest();
    }

    // Log click genérico
    this.logEvent('click', {
      element: target.tagName,
      text: text.substring(0, 50),
      href: href
    });
  }

  logPageView() {
    this.logEvent('page_view', {
      page: window.location.pathname,
      url: window.location.href
    });
  }

  logDownload(type, fileName) {
    this.logEvent('download', {
      type: type,
      file: fileName,
      timestamp: new Date().toISOString()
    });
    
    this.showNotification(`📥 Descarga registrada: ${type}`);
  }

  logNDARequest() {
    this.logEvent('nda_request', {
      action: 'initiated',
      timestamp: new Date().toISOString()
    });
    
    this.showNotification('📋 Solicitud de NDA registrada');
  }

  async logEvent(eventType, data = {}) {
    const event = {
      eventType: eventType,
      visitorToken: this.visitorInfo?.token || 'unknown',
      visitor_email: this.visitorInfo?.email || 'unknown@temp.com',
      data: {
        ...data,
        page: window.location.pathname,
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent.substring(0, 100)
      }
    };

    this.events.push(event);

    try {
      await fetch('/api/tables/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      });
      
      console.log('📊 Event logged:', eventType);
    } catch (error) {
      console.warn('Failed to log event:', error);
    }
  }

  async saveSession(maxScroll = 0) {
    const duration = Math.round((Date.now() - this.sessionStart) / 1000);
    
    const sessionData = {
      visitor_token: this.visitorInfo?.token || 'unknown',
      visitor_email: this.visitorInfo?.email || 'unknown@temp.com',
      session_start: new Date(this.sessionStart).toISOString(),
      session_end: new Date().toISOString(),
      duration_seconds: duration,
      page_views: this.events.filter(e => e.eventType === 'page_view').length,
      documents_downloaded: this.events.filter(e => e.eventType === 'download').length,
      nda_initiated: this.events.some(e => e.eventType === 'nda_request'),
      max_scroll_percentage: maxScroll
    };

    try {
      await fetch('/api/tables/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData)
      });
      
      console.log('💾 Session saved:', duration + 's');
    } catch (error) {
      console.warn('Failed to save session:', error);
    }
  }

  showNotification(message) {
    // Crear notificación temporal
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed; top: 20px; right: 20px; z-index: 10000;
      background: #1e3a8a; color: white; padding: 12px 20px;
      border-radius: 8px; font-size: 14px; font-weight: 500;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
}

// CSS para animaciones
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn { 
    from { transform: translateX(100%); opacity: 0; } 
    to { transform: translateX(0); opacity: 1; } 
  }
  @keyframes slideOut { 
    from { transform: translateX(0); opacity: 1; } 
    to { transform: translateX(100%); opacity: 0; } 
  }
`;
document.head.appendChild(style);

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  window.visitorTracker = new VisitorTracker();
  console.log('✅ Visitor Tracking System Ready');
});