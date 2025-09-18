// Analytics para Vercel (Sin base de datos externa)
// Sistema de tracking optimizado para funciones serverless

class VercelAnalytics {
  constructor() {
    this.visitorId = null;
    this.sessionId = null;
    this.pageStartTime = Date.now();
    this.lastActivityTime = Date.now();
    this.scrollDepth = 0;
    this.clicksCount = 0;
    this.isActive = true;
    this.analyticsData = this.loadStoredAnalytics();
    
    this.init();
  }

  init() {
    this.setupVisitorTracking();
    this.setupTimeTracking();
    this.setupScrollTracking();
    this.setupClickTracking();
    this.setupDownloadTracking();
    this.setupNDATracking();
    this.setupVisibilityTracking();
    this.startPeriodicSync();
  }

  // Configurar tracking de visitante
  setupVisitorTracking() {
    // Usar información real del visitante si está disponible
    if (window.visitorInfo) {
      this.visitorToken = window.visitorInfo.token;
      this.visitorEmail = window.visitorInfo.email;
      this.visitorName = window.visitorInfo.name;
      console.log('✅ Using real visitor info:', this.visitorEmail);
    } else {
      // Fallback al método anterior
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      
      if (token) {
        this.visitorToken = token;
        localStorage.setItem('visitor_token', token);
      } else {
        this.visitorToken = localStorage.getItem('visitor_token') || this.generateVisitorId();
      }
      
      // Intentar obtener email real del localStorage
      const storedInfo = localStorage.getItem('visitor_info');
      if (storedInfo) {
        try {
          const parsedInfo = JSON.parse(storedInfo);
          this.visitorEmail = parsedInfo.email;
          this.visitorName = parsedInfo.name;
        } catch (e) {
          console.warn('Error parsing stored visitor info');
        }
      }
    }

    this.sessionId = this.generateSessionId();
    this.logEvent('page_visit', { 
      page: window.location.pathname,
      visitor_email: this.visitorEmail,
      visitor_name: this.visitorName 
    });
    
    console.log('Vercel Analytics initialized:', {
      visitor: this.visitorToken,
      email: this.visitorEmail,
      session: this.sessionId
    });
  }

  // Tracking de tiempo y actividad
  setupTimeTracking() {
    window.addEventListener('beforeunload', () => {
      this.saveSessionData();
    });

    // Tracking de inactividad
    let inactivityTimer;
    const resetTimer = () => {
      this.lastActivityTime = Date.now();
      this.isActive = true;
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        this.isActive = false;
      }, 30000);
    };

    ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
      document.addEventListener(event, resetTimer, true);
    });
  }

  // Tracking de scroll
  setupScrollTracking() {
    window.addEventListener('scroll', () => {
      const scrollTop = window.pageYOffset;
      const docHeight = document.body.offsetHeight;
      const winHeight = window.innerHeight;
      const scrollPercent = Math.round(scrollTop / (docHeight - winHeight) * 100);
      
      if (scrollPercent > this.scrollDepth) {
        this.scrollDepth = Math.min(scrollPercent, 100);
      }
    });
  }

  // Tracking de clicks
  setupClickTracking() {
    document.addEventListener('click', (event) => {
      this.clicksCount++;
      
      const target = event.target;
      const elementInfo = {
        tag: target.tagName,
        id: target.id,
        class: target.className,
        text: target.textContent?.slice(0, 50)
      };

      this.logEvent('click', elementInfo);
    });
  }

  // Tracking de descargas
  setupDownloadTracking() {
    document.addEventListener('click', (event) => {
      const target = event.target.closest('a, button');
      
      if (target) {
        const href = target.href || target.dataset.href;
        const text = target.textContent.toLowerCase();
        
        let fileType = null;
        if (text.includes('term sheet') || text.includes('term-sheet')) {
          fileType = 'term-sheet';
        } else if (text.includes('teaser')) {
          fileType = 'teaser';
        } else if (text.includes('financial model') || text.includes('modelo financiero')) {
          fileType = 'financial-model';
        } else if (text.includes('nda') || text.includes('confidencialidad')) {
          fileType = 'nda';
        }

        if (fileType) {
          this.logDownload(fileType, target.textContent);
        }
      }
    });
  }

  // Tracking de solicitudes de NDA
  setupNDATracking() {
    const ndaButtons = document.querySelectorAll('[data-nda], .nda-button, .solicitar-nda');
    
    ndaButtons.forEach(button => {
      button.addEventListener('click', () => {
        this.logNDARequest();
      });
    });
  }

  // Tracking de visibilidad
  setupVisibilityTracking() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.isActive = false;
        this.saveSessionData();
      } else {
        this.isActive = true;
        this.lastActivityTime = Date.now();
      }
    });
  }

  // Registrar descarga
  logDownload(fileType, fileName) {
    const downloadData = {
      file_type: fileType,
      file_name: fileName,
      project_type: this.getProjectType(),
      timestamp: new Date().toISOString()
    };

    this.logEvent('download', downloadData);
    this.updateAnalyticsData('downloads', downloadData);

    // Mostrar notificación de tracking
    this.showTrackingNotification(`📥 Descarga registrada: ${fileType}`);
  }

  // Registrar solicitud de NDA
  logNDARequest(signed = false) {
    const ndaData = {
      project_type: this.getProjectType(),
      signed: signed,
      timestamp: new Date().toISOString()
    };

    this.logEvent('nda_request', ndaData);
    this.updateAnalyticsData('nda_requests', ndaData);

    this.showTrackingNotification(`📋 NDA ${signed ? 'firmado' : 'solicitado'}`);
  }

  // Registrar evento general
  logEvent(eventType, data = {}) {
    const event = {
      visitor: this.visitorToken,
      visitor_email: this.visitorEmail || `${this.visitorToken.substring(0, 8)}@unknown.com`,
      visitor_name: this.visitorName || '',
      session: this.sessionId,
      type: eventType,
      data: data,
      timestamp: new Date().toISOString(),
      page: window.location.pathname,
      user_agent: navigator.userAgent.slice(0, 100)
    };

    // Guardar localmente
    this.storeEvent(event);
    
    // Enviar a Vercel API (async, no bloquea UI)
    this.sendEventToAPI(event).catch(console.error);
  }

  // Sincronización periódica con API
  startPeriodicSync() {
    // Sync cada 2 minutos
    setInterval(() => {
      if (this.isActive) {
        this.syncWithAPI();
      }
    }, 120000);

    // Sync al cargar
    setTimeout(() => this.syncWithAPI(), 5000);
  }

  // Enviar evento a API de Vercel
  async sendEventToAPI(event) {
    try {
      const response = await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: event.type,
          visitorToken: event.visitor,
          data: event
        })
      });

      if (response.ok) {
        console.log('✅ Event synced with API:', event.type);
      }
    } catch (error) {
      console.warn('⚠️ API sync failed (continuing offline):', error.message);
    }
  }

  // Sincronizar datos locales con API
  async syncWithAPI() {
    const unsyncedEvents = this.getUnsyncedEvents();
    
    if (unsyncedEvents.length > 0) {
      try {
        for (const event of unsyncedEvents) {
          await this.sendEventToAPI(event);
          this.markEventSynced(event.id);
        }
      } catch (error) {
        console.warn('Sync error:', error);
      }
    }
  }

  // Almacenamiento local de eventos
  storeEvent(event) {
    event.id = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    event.synced = false;
    
    const events = JSON.parse(localStorage.getItem('analytics_events') || '[]');
    events.push(event);
    
    // Mantener solo los últimos 100 eventos localmente
    if (events.length > 100) {
      events.splice(0, events.length - 100);
    }
    
    localStorage.setItem('analytics_events', JSON.stringify(events));
  }

  // Obtener eventos no sincronizados
  getUnsyncedEvents() {
    const events = JSON.parse(localStorage.getItem('analytics_events') || '[]');
    return events.filter(event => !event.synced);
  }

  // Marcar evento como sincronizado
  markEventSynced(eventId) {
    const events = JSON.parse(localStorage.getItem('analytics_events') || '[]');
    const event = events.find(e => e.id === eventId);
    if (event) {
      event.synced = true;
      localStorage.setItem('analytics_events', JSON.stringify(events));
    }
  }

  // Cargar datos de analytics almacenados
  loadStoredAnalytics() {
    return JSON.parse(localStorage.getItem('visitor_analytics') || JSON.stringify({
      downloads: [],
      nda_requests: [],
      sessions: [],
      total_time: 0,
      total_visits: 0
    }));
  }

  // Actualizar datos de analytics
  updateAnalyticsData(type, data) {
    this.analyticsData[type].push(data);
    this.saveAnalyticsData();
  }

  // Guardar datos de analytics
  saveAnalyticsData() {
    localStorage.setItem('visitor_analytics', JSON.stringify(this.analyticsData));
  }

  // Guardar datos de sesión
  saveSessionData() {
    const currentTime = Date.now();
    const totalTime = Math.round((currentTime - this.pageStartTime) / 1000);
    
    const sessionData = {
      session_id: this.sessionId,
      total_time: totalTime,
      scroll_depth: this.scrollDepth,
      clicks_count: this.clicksCount,
      page: window.location.pathname,
      timestamp: new Date().toISOString()
    };

    this.updateAnalyticsData('sessions', sessionData);
    this.logEvent('session_end', sessionData);
  }

  // Funciones auxiliares
  getProjectType() {
    const path = window.location.pathname;
    if (path.includes('equity')) return 'equity_investment';
    return 'senior_financing';
  }

  generateVisitorId() {
    return 'visitor_' + Date.now() + '_' + Math.random().toString(36).substr(2, 12);
  }

  generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Mostrar notificación de tracking (opcional)
  showTrackingNotification(message) {
    if (!this.notificationContainer) {
      this.createNotificationContainer();
    }

    const notification = document.createElement('div');
    notification.className = 'analytics-notification';
    notification.textContent = message;
    notification.style.cssText = `
      background: #1e3a8a; color: white; padding: 8px 16px; border-radius: 4px;
      font-size: 12px; margin-bottom: 4px; animation: slideIn 0.3s ease;
    `;

    this.notificationContainer.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 2000);
  }

  createNotificationContainer() {
    this.notificationContainer = document.createElement('div');
    this.notificationContainer.style.cssText = `
      position: fixed; top: 20px; right: 20px; z-index: 10000;
      pointer-events: none; max-width: 300px;
    `;
    document.body.appendChild(this.notificationContainer);

    // Añadir CSS animations
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
      @keyframes slideOut { from { transform: translateX(0); } to { transform: translateX(100%); } }
    `;
    document.head.appendChild(style);
  }

  // Obtener resumen de analytics
  getAnalyticsSummary() {
    return {
      visitor: this.visitorToken,
      totalDownloads: this.analyticsData.downloads.length,
      totalNDAs: this.analyticsData.nda_requests.length,
      totalSessions: this.analyticsData.sessions.length,
      currentSession: {
        duration: Math.round((Date.now() - this.pageStartTime) / 1000),
        scrollDepth: this.scrollDepth,
        clicks: this.clicksCount
      }
    };
  }

  // Limpiar recursos
  destroy() {
    this.saveSessionData();
    if (this.notificationContainer) {
      this.notificationContainer.remove();
    }
  }
}

// Inicializar analytics
let vercelAnalyticsInstance;

document.addEventListener('DOMContentLoaded', function() {
  vercelAnalyticsInstance = new VercelAnalytics();
  
  // Hacer disponible globalmente
  window.analytics = vercelAnalyticsInstance;
  
  console.log('🚀 Vercel Analytics initialized');
});

// Limpiar al salir
window.addEventListener('beforeunload', () => {
  if (vercelAnalyticsInstance) {
    vercelAnalyticsInstance.destroy();
  }
});