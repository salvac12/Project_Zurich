// Sistema Avanzado de Analytics para Project ZURICH - Alter5
// Tracking completo de comportamiento de usuarios

class AdvancedAnalytics {
  constructor() {
    this.visitorId = null;
    this.sessionId = null;
    this.pageStartTime = Date.now();
    this.lastActivityTime = Date.now();
    this.scrollDepth = 0;
    this.clicksCount = 0;
    this.sectionsViewed = {};
    this.isActive = true;
    this.heartbeatInterval = null;
    
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
    this.startHeartbeat();
  }

  // Configurar ID de visitante desde URL o localStorage
  setupVisitorTracking() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (token) {
      this.visitorToken = token;
      localStorage.setItem('visitor_token', token);
    } else {
      this.visitorToken = localStorage.getItem('visitor_token');
    }

    // Generar ID de sesión único
    this.sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 12);
    
    console.log('Analytics initialized:', {
      token: this.visitorToken,
      session: this.sessionId
    });
  }

  // Tracking de tiempo en página
  setupTimeTracking() {
    // Registrar entrada a la página
    this.logPageEntry();

    // Tracking cuando sale de la página
    window.addEventListener('beforeunload', () => {
      this.logPageExit();
    });

    // Tracking de tiempo inactivo
    let inactivityTimer;
    const resetInactivityTimer = () => {
      this.lastActivityTime = Date.now();
      this.isActive = true;
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        this.isActive = false;
      }, 30000); // 30 segundos de inactividad
    };

    ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
      document.addEventListener(event, resetInactivityTimer, true);
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

      // Tracking de secciones vistas
      this.trackSectionViewing();
    });
  }

  // Tracking de secciones específicas
  trackSectionViewing() {
    const sections = document.querySelectorAll('section, .hero, .metrics, .description, .investment-details');
    
    sections.forEach(section => {
      const rect = section.getBoundingClientRect();
      const sectionId = section.id || section.className || 'unnamed-section';
      
      if (rect.top <= window.innerHeight && rect.bottom >= 0) {
        if (!this.sectionsViewed[sectionId]) {
          this.sectionsViewed[sectionId] = Date.now();
        }
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
        text: target.textContent?.slice(0, 100),
        href: target.href
      };

      this.logEvent('click', target, elementInfo);
    });
  }

  // Tracking de descargas
  setupDownloadTracking() {
    // Interceptar clicks en enlaces de descarga
    document.addEventListener('click', (event) => {
      const target = event.target.closest('a, button');
      
      if (target) {
        const href = target.href || target.dataset.href;
        const text = target.textContent.toLowerCase();
        
        // Detectar tipos de archivos
        let fileType = null;
        if (text.includes('term sheet') || text.includes('term-sheet') || href?.includes('termsheet')) {
          fileType = 'term-sheet';
        } else if (text.includes('teaser') || href?.includes('teaser')) {
          fileType = 'teaser';
        } else if (text.includes('financial model') || text.includes('modelo financiero') || href?.includes('financial')) {
          fileType = 'financial-model';
        } else if (text.includes('nda') || text.includes('confidencialidad')) {
          fileType = 'nda';
        }

        if (fileType) {
          this.logDownload(fileType, href, target.textContent);
        }
      }
    });
  }

  // Tracking de solicitudes de NDA
  setupNDATracking() {
    // Buscar botones de NDA
    const ndaButtons = document.querySelectorAll('[data-nda], .nda-button, .solicitar-nda');
    
    ndaButtons.forEach(button => {
      button.addEventListener('click', () => {
        this.logNDARequest();
      });
    });

    // Interceptar envíos de formularios de NDA
    document.addEventListener('submit', (event) => {
      const form = event.target;
      if (form.classList.contains('nda-form') || form.dataset.type === 'nda') {
        this.logNDARequest(true); // true = firmado
      }
    });
  }

  // Tracking de visibilidad de página
  setupVisibilityTracking() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.isActive = false;
      } else {
        this.isActive = true;
        this.lastActivityTime = Date.now();
      }
    });
  }

  // Envío periódico de datos (heartbeat)
  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, 30000); // cada 30 segundos
  }

  // Registrar entrada a página
  async logPageEntry() {
    const pageData = {
      visitor_token: this.visitorToken,
      session_id: this.sessionId,
      page_url: window.location.href,
      page_title: document.title,
      entry_time: new Date().toISOString(),
      device_info: this.getDeviceInfo(),
      is_mobile: this.isMobile(),
      browser: this.getBrowser(),
      screen_resolution: `${screen.width}x${screen.height}`
    };

    try {
      await this.sendAnalyticsData('page_sessions', pageData);
    } catch (error) {
      console.error('Error logging page entry:', error);
    }
  }

  // Registrar salida de página
  async logPageExit() {
    const currentTime = Date.now();
    const totalTime = Math.round((currentTime - this.pageStartTime) / 1000);
    const activeTime = Math.round((this.lastActivityTime - this.pageStartTime) / 1000);

    const exitData = {
      session_id: this.sessionId,
      exit_time: new Date().toISOString(),
      total_time: totalTime,
      active_time: activeTime,
      scroll_depth: this.scrollDepth,
      clicks_count: this.clicksCount,
      sections_viewed: JSON.stringify(this.sectionsViewed)
    };

    try {
      // Usar sendBeacon para envío garantizado al salir
      if (navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify(exitData)], { type: 'application/json' });
        navigator.sendBeacon('/api/analytics/page-exit', blob);
      } else {
        await this.updatePageSession(exitData);
      }
    } catch (error) {
      console.error('Error logging page exit:', error);
    }
  }

  // Registrar descarga de archivo
  async logDownload(fileType, fileUrl, fileName) {
    const downloadData = {
      visitor_token: this.visitorToken,
      session_id: this.sessionId,
      file_name: fileName || `${fileType}.pdf`,
      file_type: fileType,
      project_type: this.getProjectType(),
      download_url: fileUrl,
      download_time: new Date().toISOString(),
      ip_address: await this.getClientIP(),
      user_agent: navigator.userAgent,
      referrer: document.referrer
    };

    try {
      await this.sendAnalyticsData('file_downloads', downloadData);
      
      // También registrar como evento
      this.logEvent('download', null, {
        file_type: fileType,
        file_name: fileName
      });

      console.log('📥 Download tracked:', fileType, fileName);
    } catch (error) {
      console.error('Error logging download:', error);
    }
  }

  // Registrar solicitud de NDA
  async logNDARequest(signed = false) {
    const ndaData = {
      visitor_token: this.visitorToken,
      session_id: this.sessionId,
      project_type: this.getProjectType(),
      requested_at: new Date().toISOString(),
      signed_at: signed ? new Date().toISOString() : null,
      is_signed: signed,
      nda_version: '1.0',
      ip_address: await this.getClientIP()
    };

    try {
      await this.sendAnalyticsData('nda_requests', ndaData);
      
      // También registrar como evento
      this.logEvent('nda_request', null, {
        signed: signed,
        project_type: this.getProjectType()
      });

      console.log('📋 NDA request tracked:', signed ? 'SIGNED' : 'REQUESTED');
    } catch (error) {
      console.error('Error logging NDA request:', error);
    }
  }

  // Registrar evento general
  async logEvent(eventType, target, metadata) {
    const eventData = {
      visitor_token: this.visitorToken,
      session_id: this.sessionId,
      event_type: eventType,
      event_target: target?.tagName || metadata?.target || 'unknown',
      event_value: JSON.stringify(metadata),
      page_url: window.location.href,
      timestamp: new Date().toISOString(),
      metadata: JSON.stringify(metadata)
    };

    try {
      await this.sendAnalyticsData('user_events', eventData);
    } catch (error) {
      console.error('Error logging event:', error);
    }
  }

  // Enviar heartbeat periódico
  async sendHeartbeat() {
    if (!this.isActive) return;

    const currentTime = Date.now();
    const sessionTime = Math.round((currentTime - this.pageStartTime) / 1000);

    const heartbeatData = {
      session_id: this.sessionId,
      total_time: sessionTime,
      scroll_depth: this.scrollDepth,
      clicks_count: this.clicksCount,
      is_active: this.isActive
    };

    try {
      await this.updatePageSession(heartbeatData);
    } catch (error) {
      console.error('Error sending heartbeat:', error);
    }
  }

  // Funciones auxiliares
  getProjectType() {
    const path = window.location.pathname;
    if (path.includes('equity')) return 'equity_investment';
    return 'senior_financing';
  }

  getDeviceInfo() {
    return {
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine
    };
  }

  isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  getBrowser() {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  async getClientIP() {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  }

  // Envío de datos a la API
  async sendAnalyticsData(table, data) {
    const url = `/api/analytics/${table}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Actualizar sesión existente
  async updatePageSession(data) {
    const url = `/api/analytics/page_sessions/${this.sessionId}`;
    
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Limpiar recursos al destruir
  destroy() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
  }
}

// Inicializar analytics cuando cargue la página
let analyticsInstance;

document.addEventListener('DOMContentLoaded', function() {
  analyticsInstance = new AdvancedAnalytics();
  
  // Hacer disponible globalmente para debugging
  window.analytics = analyticsInstance;
  
  console.log('🚀 Advanced Analytics initialized for Project ZURICH - Alter5');
});

// Limpiar al salir
window.addEventListener('beforeunload', () => {
  if (analyticsInstance) {
    analyticsInstance.destroy();
  }
});