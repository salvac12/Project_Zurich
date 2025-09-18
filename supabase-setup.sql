-- Supabase SQL Setup para Project ZURICH - Alter5
-- Ejecuta estos comandos en el SQL Editor de Supabase

-- 1. Crear tabla de visitantes
CREATE TABLE visitors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    phone VARCHAR(50),
    company VARCHAR(255),
    project_type VARCHAR(100) DEFAULT 'senior_financing',
    unique_token VARCHAR(255) UNIQUE,
    invited_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_accessed TIMESTAMP WITH TIME ZONE,
    access_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true
);

-- 2. Crear tabla de analytics
CREATE TABLE analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    visitor_id UUID REFERENCES visitors(id),
    project_type VARCHAR(100),
    page_visited VARCHAR(255),
    action VARCHAR(100),
    ip_address INET,
    user_agent TEXT,
    referrer VARCHAR(500),
    session_duration INTEGER, -- en segundos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Crear tabla de sessions
CREATE TABLE sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    visitor_id UUID REFERENCES visitors(id),
    session_token VARCHAR(255) UNIQUE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    ip_address INET,
    user_agent TEXT
);

-- 4. Crear índices para mejorar rendimiento
CREATE INDEX idx_visitors_email ON visitors(email);
CREATE INDEX idx_visitors_token ON visitors(unique_token);
CREATE INDEX idx_visitors_project_type ON visitors(project_type);
CREATE INDEX idx_analytics_visitor_id ON analytics(visitor_id);
CREATE INDEX idx_analytics_created_at ON analytics(created_at);
CREATE INDEX idx_sessions_visitor_id ON sessions(visitor_id);
CREATE INDEX idx_sessions_token ON sessions(session_token);

-- 5. Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. Crear triggers para actualizar timestamps
CREATE TRIGGER update_visitors_updated_at 
    BEFORE UPDATE ON visitors 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 7. Habilitar Row Level Security (RLS)
ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- 8. Crear políticas de seguridad básicas (ajusta según tus necesidades)
-- Permitir lectura y escritura a usuarios autenticados
CREATE POLICY "Allow all operations for authenticated users" ON visitors
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON analytics
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" on sessions
    FOR ALL USING (auth.role() = 'authenticated');

-- 9. Insertar datos de ejemplo (opcional)
INSERT INTO visitors (email, name, company, project_type, unique_token) VALUES
('demo@alter5.com', 'Usuario Demo', 'Alter5 Demo', 'senior_financing', 'demo-token-12345'),
('equity@alter5.com', 'Equity Demo', 'Alter5 Equity', 'equity_investment', 'equity-demo-54321');