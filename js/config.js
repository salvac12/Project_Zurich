// Configuración para deployment con Supabase
const CONFIG = {
  // Supabase Configuration - Las reemplazarás con tus valores reales
  SUPABASE_URL: process.env.SUPABASE_URL || 'https://tu-proyecto.supabase.co',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || 'tu-anon-key',
  
  // Configuración del proyecto
  PROJECT_NAME: 'Project ZURICH - Alter5',
  CONTACT_EMAIL: 'investment@alter-5.com',
  
  // URLs base
  API_BASE_URL: window.location.origin,
  SITE_URL: window.location.origin
};

// Auto-detectar entorno
CONFIG.IS_PRODUCTION = window.location.hostname !== 'localhost';
CONFIG.USE_SUPABASE = CONFIG.IS_PRODUCTION && CONFIG.SUPABASE_URL && CONFIG.SUPABASE_ANON_KEY;

// Determinar endpoint de API
if (CONFIG.USE_SUPABASE) {
  CONFIG.API_ENDPOINT = `${CONFIG.SUPABASE_URL}/rest/v1`;
} else {
  CONFIG.API_ENDPOINT = CONFIG.IS_PRODUCTION ? '/api/tables' : '/tables';
}

console.log('Config loaded:', CONFIG.IS_PRODUCTION ? 'PRODUCTION' : 'DEVELOPMENT');