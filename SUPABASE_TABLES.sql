-- SQL para crear tablas en Supabase para Project ZURICH
-- Copia y pega todo este código en el SQL Editor de Supabase

-- ============================================
-- TABLA: visitors
-- Almacena información de visitantes únicos
-- ============================================
CREATE TABLE IF NOT EXISTS visitors (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  name TEXT,
  company TEXT,
  status TEXT DEFAULT 'active',
  access_count INTEGER DEFAULT 0,
  first_access TIMESTAMP,
  last_access TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- TABLA: analytics
-- Almacena eventos de tracking
-- ============================================
CREATE TABLE IF NOT EXISTS analytics (
  id TEXT PRIMARY KEY,
  visitor_token TEXT NOT NULL,
  visitor_email TEXT,
  event_type TEXT NOT NULL,
  event_data JSONB,
  session_id TEXT,
  page_url TEXT,
  user_agent TEXT,
  ip_address TEXT,
  timestamp TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- ÍNDICES para consultas rápidas
-- ============================================
CREATE INDEX IF NOT EXISTS idx_visitors_token ON visitors(token);
CREATE INDEX IF NOT EXISTS idx_visitors_email ON visitors(email);
CREATE INDEX IF NOT EXISTS idx_analytics_visitor ON analytics(visitor_token);
CREATE INDEX IF NOT EXISTS idx_analytics_type ON analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_timestamp ON analytics(timestamp DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- Permitir acceso anónimo para las APIs
-- ============================================
ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;

-- Política: Permitir todas las operaciones a usuarios con service_role key
CREATE POLICY "Allow service role full access on visitors" 
  ON visitors FOR ALL 
  USING (true);

CREATE POLICY "Allow service role full access on analytics" 
  ON analytics FOR ALL 
  USING (true);

-- ============================================
-- ✅ LISTO - Las tablas están creadas
-- ============================================
