-- Actualización de Analytics para Project ZURICH - Alter5
-- Sistema avanzado de seguimiento de comportamiento de usuarios

-- 1. Actualizar tabla de analytics existente
ALTER TABLE analytics ADD COLUMN IF NOT EXISTS file_downloaded VARCHAR(255);
ALTER TABLE analytics ADD COLUMN IF NOT EXISTS download_type VARCHAR(100); -- 'term-sheet', 'teaser', 'financial-model', 'nda'
ALTER TABLE analytics ADD COLUMN IF NOT EXISTS nda_requested BOOLEAN DEFAULT false;
ALTER TABLE analytics ADD COLUMN IF NOT EXISTS nda_signed BOOLEAN DEFAULT false;
ALTER TABLE analytics ADD COLUMN IF NOT EXISTS time_on_page INTEGER; -- en segundos
ALTER TABLE analytics ADD COLUMN IF NOT EXISTS scroll_depth INTEGER; -- porcentaje scrolleado
ALTER TABLE analytics ADD COLUMN IF NOT EXISTS clicks_count INTEGER DEFAULT 0;
ALTER TABLE analytics ADD COLUMN IF NOT EXISTS section_viewed VARCHAR(255); -- qué sección vio más tiempo

-- 2. Crear tabla específica para descargas
CREATE TABLE IF NOT EXISTS file_downloads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    visitor_id UUID REFERENCES visitors(id),
    session_id UUID REFERENCES sessions(id),
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL, -- 'term-sheet', 'teaser', 'financial-model', 'nda'
    project_type VARCHAR(100), -- 'senior_financing', 'equity_investment'
    download_url VARCHAR(500),
    file_size INTEGER, -- en bytes
    download_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    referrer VARCHAR(500)
);

-- 3. Crear tabla para solicitudes de NDA
CREATE TABLE IF NOT EXISTS nda_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    visitor_id UUID REFERENCES visitors(id),
    session_id UUID REFERENCES sessions(id),
    project_type VARCHAR(100),
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    signed_at TIMESTAMP WITH TIME ZONE,
    is_signed BOOLEAN DEFAULT false,
    nda_version VARCHAR(50) DEFAULT '1.0',
    ip_address INET,
    contact_info JSONB, -- información adicional del contacto
    notes TEXT
);

-- 4. Crear tabla para seguimiento de tiempo en página
CREATE TABLE IF NOT EXISTS page_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    visitor_id UUID REFERENCES visitors(id),
    session_id UUID REFERENCES sessions(id),
    page_url VARCHAR(500),
    page_title VARCHAR(255),
    entry_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    exit_time TIMESTAMP WITH TIME ZONE,
    total_time INTEGER, -- tiempo total en segundos
    active_time INTEGER, -- tiempo activo (sin idle) en segundos
    scroll_depth INTEGER DEFAULT 0, -- máximo % scrolleado
    clicks_count INTEGER DEFAULT 0,
    sections_viewed JSONB, -- {section: time_spent}
    device_info JSONB, -- información del dispositivo
    is_mobile BOOLEAN DEFAULT false,
    browser VARCHAR(100),
    screen_resolution VARCHAR(50)
);

-- 5. Crear tabla para eventos específicos
CREATE TABLE IF NOT EXISTS user_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    visitor_id UUID REFERENCES visitors(id),
    session_id UUID REFERENCES sessions(id),
    event_type VARCHAR(100), -- 'click', 'scroll', 'download', 'nda_request', 'form_submit', 'video_play', etc.
    event_target VARCHAR(255), -- elemento específico
    event_value VARCHAR(500), -- valor del evento
    page_url VARCHAR(500),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB -- información adicional del evento
);

-- 6. Crear índices para mejorar performance de consultas
CREATE INDEX IF NOT EXISTS idx_file_downloads_visitor_id ON file_downloads(visitor_id);
CREATE INDEX IF NOT EXISTS idx_file_downloads_file_type ON file_downloads(file_type);
CREATE INDEX IF NOT EXISTS idx_file_downloads_project_type ON file_downloads(project_type);
CREATE INDEX IF NOT EXISTS idx_file_downloads_download_time ON file_downloads(download_time);

CREATE INDEX IF NOT EXISTS idx_nda_requests_visitor_id ON nda_requests(visitor_id);
CREATE INDEX IF NOT EXISTS idx_nda_requests_project_type ON nda_requests(project_type);
CREATE INDEX IF NOT EXISTS idx_nda_requests_requested_at ON nda_requests(requested_at);

CREATE INDEX IF NOT EXISTS idx_page_sessions_visitor_id ON page_sessions(visitor_id);
CREATE INDEX IF NOT EXISTS idx_page_sessions_page_url ON page_sessions(page_url);
CREATE INDEX IF NOT EXISTS idx_page_sessions_entry_time ON page_sessions(entry_time);

CREATE INDEX IF NOT EXISTS idx_user_events_visitor_id ON user_events(visitor_id);
CREATE INDEX IF NOT EXISTS idx_user_events_event_type ON user_events(event_type);
CREATE INDEX IF NOT EXISTS idx_user_events_timestamp ON user_events(timestamp);

-- 7. Crear vistas para informes rápidos
CREATE OR REPLACE VIEW visitor_summary AS
SELECT 
    v.id,
    v.email,
    v.name,
    v.company,
    v.project_type,
    v.created_at,
    v.access_count,
    v.last_accessed,
    COUNT(DISTINCT fd.id) as total_downloads,
    COUNT(DISTINCT CASE WHEN fd.file_type = 'term-sheet' THEN fd.id END) as termsheet_downloads,
    COUNT(DISTINCT CASE WHEN fd.file_type = 'teaser' THEN fd.id END) as teaser_downloads,
    COUNT(DISTINCT CASE WHEN fd.file_type = 'financial-model' THEN fd.id END) as financial_downloads,
    COUNT(DISTINCT nr.id) as nda_requests,
    COUNT(DISTINCT CASE WHEN nr.is_signed = true THEN nr.id END) as nda_signed,
    AVG(ps.total_time) as avg_time_on_site,
    MAX(ps.scroll_depth) as max_scroll_depth,
    SUM(ps.clicks_count) as total_clicks
FROM visitors v
LEFT JOIN file_downloads fd ON v.id = fd.visitor_id
LEFT JOIN nda_requests nr ON v.id = nr.visitor_id
LEFT JOIN page_sessions ps ON v.id = ps.visitor_id
WHERE v.is_active = true
GROUP BY v.id, v.email, v.name, v.company, v.project_type, v.created_at, v.access_count, v.last_accessed;

-- 8. Crear vista para análisis por proyecto
CREATE OR REPLACE VIEW project_analytics AS
SELECT 
    COALESCE(v.project_type, 'unknown') as project_type,
    COUNT(DISTINCT v.id) as total_visitors,
    COUNT(DISTINCT fd.visitor_id) as visitors_with_downloads,
    COUNT(DISTINCT nr.visitor_id) as visitors_with_nda_requests,
    COUNT(fd.id) as total_downloads,
    COUNT(CASE WHEN fd.file_type = 'term-sheet' THEN 1 END) as termsheet_downloads,
    COUNT(CASE WHEN fd.file_type = 'teaser' THEN 1 END) as teaser_downloads,
    COUNT(CASE WHEN fd.file_type = 'financial-model' THEN 1 END) as financial_downloads,
    COUNT(nr.id) as total_nda_requests,
    COUNT(CASE WHEN nr.is_signed = true THEN 1 END) as signed_ndas,
    AVG(ps.total_time) as avg_session_time,
    AVG(ps.scroll_depth) as avg_scroll_depth
FROM visitors v
LEFT JOIN file_downloads fd ON v.id = fd.visitor_id
LEFT JOIN nda_requests nr ON v.id = nr.visitor_id  
LEFT JOIN page_sessions ps ON v.id = ps.visitor_id
GROUP BY v.project_type;

-- 9. Habilitar RLS en nuevas tablas
ALTER TABLE file_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE nda_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_events ENABLE ROW LEVEL SECURITY;

-- 10. Crear políticas de seguridad
CREATE POLICY "Allow all operations for authenticated users" ON file_downloads
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON nda_requests
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON page_sessions
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON user_events
    FOR ALL USING (auth.role() = 'authenticated');

-- 11. Insertar datos de ejemplo para testing
INSERT INTO file_downloads (visitor_id, file_name, file_type, project_type) 
SELECT 
    v.id,
    'Project_ZURICH_TermSheet.pdf',
    'term-sheet',
    v.project_type
FROM visitors v 
WHERE v.email = 'demo@alter5.com'
ON CONFLICT DO NOTHING;

COMMENT ON TABLE file_downloads IS 'Registro de descargas de archivos por visitante';
COMMENT ON TABLE nda_requests IS 'Solicitudes y firmas de NDA por proyecto';
COMMENT ON TABLE page_sessions IS 'Seguimiento detallado de tiempo en páginas';
COMMENT ON TABLE user_events IS 'Eventos específicos de interacción del usuario';