// Sistema mejorado de lookup de visitantes v2.0
// Más robusto y con mejor manejo de errores

class VisitorLookupV2 {
  constructor() {
    this.visitorInfo = null;
    this.token = null;
    this.isInitialized = false;
    this.debug = true; // Activar debug
  }

  log(message, data = null) {
    if (this.debug) {
      console.log(`🔍 [VisitorLookup] ${message}`, data || '');
    }
  }

  async init() {
    this.log('Inicializando Visitor Lookup V2...');
    
    // 1. Obtener token de la URL
    const urlParams = new URLSearchParams(window.location.search);
    this.token = urlParams.get('token');
    this.log('Token desde URL:', this.token);

    if (!this.token) {
      // Buscar token en localStorage como fallback
      this.token = localStorage.getItem('visitor_token');
      this.log('Token desde localStorage:', this.token);
    }

    if (this.token) {
      await this.findVisitorByToken(this.token);
    } else {
      this.log('⚠️ No se encontró token, creando visitante temporal');
      this.createTemporaryVisitor();
    }

    this.isInitialized = true;
    this.updateGlobalVariables();
  }

  async findVisitorByToken(token) {
    this.log('Buscando visitante por token:', token);
    
    try {
      // Método 1: Buscar directamente con filtro específico
      let found = await this.searchByTokenDirect(token);
      
      if (!found) {
        // Método 2: Obtener todos y filtrar localmente
        found = await this.searchByTokenFull(token);
      }
      
      if (!found) {
        // Método 3: Crear nuevo visitante con el token
        this.log('Token no encontrado en BD, creando nuevo visitante');
        await this.createVisitorWithToken(token);
      }
      
    } catch (error) {
      this.log('❌ Error en búsqueda:', error);
      this.createTemporaryVisitor();
    }
  }

  async searchByTokenDirect(token) {
    try {
      this.log('Método 1: Búsqueda directa por token...');
      
      // Usar parámetro de filtro específico si la API lo soporta
      const url = `/tables/visitors?token=${encodeURIComponent(token)}&limit=1`;
      const response = await fetch(url);
      
      if (response.ok) {
        const result = await response.json();
        this.log('Resultado búsqueda directa:', result);
        
        if (result.data && result.data.length > 0) {
          const visitor = result.data[0];
          if (visitor.token === token) {
            this.setVisitorInfo(visitor);
            return true;
          }
        }
      }
    } catch (error) {
      this.log('Error en búsqueda directa:', error);
    }
    
    return false;
  }

  async searchByTokenFull(token) {
    try {
      this.log('Método 2: Búsqueda completa y filtrado local...');
      
      const response = await fetch('/tables/visitors?limit=1000&sort=created_at:desc');
      
      if (response.ok) {
        const result = await response.json();
        this.log(`Visitantes obtenidos para filtrar: ${result.data?.length || 0}`);
        
        if (result.data && Array.isArray(result.data)) {
          // Buscar el token exacto
          const visitor = result.data.find(v => v.token === token);
          
          if (visitor) {
            this.log('✅ Visitante encontrado por filtrado local:', visitor);
            this.setVisitorInfo(visitor);
            return true;
          } else {
            this.log('❌ Token no encontrado en filtrado local');
            // Log de todos los tokens para debug
            const tokens = result.data.map(v => v.token).filter(Boolean);
            this.log('Tokens existentes:', tokens.slice(0, 10));
          }
        }
      }
    } catch (error) {
      this.log('Error en búsqueda completa:', error);
    }
    
    return false;
  }

  async createVisitorWithToken(token) {
    try {
      this.log('Creando nuevo visitante con token:', token);
      
      const newVisitor = {
        token: token,
        email: `${token.substring(0, 8)}@pending-identification.com`,
        name: `Visitante ${token.substring(0, 6).toUpperCase()}`,
        company: 'Pendiente de identificación',
        status: 'active',
        access_count: 1,
        first_access: new Date().toISOString(),
        last_access: new Date().toISOString()
      };

      const response = await fetch('/tables/visitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newVisitor)
      });

      if (response.ok) {
        const createdVisitor = await response.json();
        this.log('✅ Visitante creado:', createdVisitor);
        this.setVisitorInfo(createdVisitor);
        return true;
      } else {
        this.log('❌ Error al crear visitante:', response.status);
      }
    } catch (error) {
      this.log('❌ Error creando visitante:', error);
    }
    
    return false;
  }

  setVisitorInfo(visitor) {
    this.visitorInfo = visitor;
    this.log('✅ Información de visitante establecida:', {
      email: visitor.email,
      token: visitor.token?.substring(0, 8) + '...',
      name: visitor.name,
      company: visitor.company
    });
    
    // Guardar en localStorage
    localStorage.setItem('visitor_info', JSON.stringify(visitor));
    localStorage.setItem('visitor_token', visitor.token);
    localStorage.setItem('visitor_email', visitor.email);
    
    // Actualizar contador de acceso
    this.updateAccessCount();
  }

  async updateAccessCount() {
    if (!this.visitorInfo) return;
    
    try {
      const currentCount = this.visitorInfo.access_count || 0;
      const newCount = currentCount + 1;
      
      const response = await fetch(`/tables/visitors/${this.visitorInfo.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_count: newCount,
          last_access: new Date().toISOString()
        })
      });
      
      if (response.ok) {
        this.log(`📈 Contador de accesos actualizado: ${newCount}`);
        this.visitorInfo.access_count = newCount;
        this.visitorInfo.last_access = new Date().toISOString();
      }
    } catch (error) {
      this.log('Error actualizando contador:', error);
    }
  }

  createTemporaryVisitor() {
    const tempId = `temp_${Date.now()}`;
    this.visitorInfo = {
      id: tempId,
      token: this.token || tempId,
      email: `${tempId}@temporary-visitor.com`,
      name: 'Visitante Temporal',
      company: 'Temporal',
      access_count: 1
    };
    
    this.log('⚠️ Visitante temporal creado:', this.visitorInfo);
    localStorage.setItem('visitor_info', JSON.stringify(this.visitorInfo));
  }

  updateGlobalVariables() {
    if (this.visitorInfo) {
      window.visitorInfo = this.visitorInfo;
      window.visitorEmail = this.visitorInfo.email;
      window.visitorToken = this.visitorInfo.token;
      window.visitorName = this.visitorInfo.name || '';
      
      this.log('🌍 Variables globales actualizadas:', {
        email: window.visitorEmail,
        token: window.visitorToken?.substring(0, 8) + '...',
        name: window.visitorName
      });
    }
  }

  // Métodos públicos
  getVisitorInfo() {
    return this.visitorInfo;
  }

  getVisitorEmail() {
    return this.visitorInfo ? this.visitorInfo.email : null;
  }

  getVisitorToken() {
    return this.visitorInfo ? this.visitorInfo.token : null;
  }

  isReady() {
    return this.isInitialized && this.visitorInfo !== null;
  }

  // Método para actualizar información manualmente
  async updateVisitorInfo(updates) {
    if (!this.visitorInfo || !this.visitorInfo.id) return false;

    try {
      const response = await fetch(`/tables/visitors/${this.visitorInfo.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        const updatedVisitor = await response.json();
        this.setVisitorInfo(updatedVisitor);
        this.updateGlobalVariables();
        this.log('✅ Información actualizada:', updates);
        return true;
      }
    } catch (error) {
      this.log('❌ Error actualizando info:', error);
    }
    
    return false;
  }

  // Debug: Mostrar estado completo
  getDebugInfo() {
    return {
      token: this.token,
      visitorInfo: this.visitorInfo,
      isInitialized: this.isInitialized,
      globalVars: {
        visitorInfo: window.visitorInfo,
        visitorEmail: window.visitorEmail,
        visitorToken: window.visitorToken
      }
    };
  }
}

// Inicialización
let visitorLookupV2Instance;

document.addEventListener('DOMContentLoaded', async function() {
  console.log('🚀 Inicializando Visitor Lookup V2...');
  
  visitorLookupV2Instance = new VisitorLookupV2();
  await visitorLookupV2Instance.init();
  
  // Hacer disponible globalmente
  window.visitorLookup = visitorLookupV2Instance;
  window.visitorLookupV2 = visitorLookupV2Instance;
  
  console.log('✅ Visitor Lookup V2 inicializado');
  
  // Función de debug mejorada
  window.debugVisitorV2 = function() {
    const info = visitorLookupV2Instance.getDebugInfo();
    console.log('=== VISITOR DEBUG V2 ===');
    console.table(info);
    console.log('========================');
    return info;
  };
});

// Exportar clase
window.VisitorLookupV2 = VisitorLookupV2;