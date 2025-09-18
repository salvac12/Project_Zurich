// API Sessions - Sistema híbrido optimizado
// Gestiona sesiones de visitantes con duraciones y métricas

let realSessions = []; // Almacenamiento temporal en memoria

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { method, query, body } = req;

    // Sesiones demo para mostrar funcionalidad
    const demoSessions = [
      {
        id: 'demo_session_1',
        visitor_token: 'zrch_demo_001',
        visitor_email: 'juan.garcia@pension-fund.com',
        session_start: '2024-09-18T10:30:00Z',
        session_end: '2024-09-18T10:45:00Z',
        duration_seconds: 900,
        page_views: 3,
        documents_downloaded: 2,
        nda_initiated: true,
        max_scroll_percentage: 85
      },
      {
        id: 'demo_session_2',
        visitor_token: 'zrch_demo_002',
        visitor_email: 'maria.lopez@family-office.es',
        session_start: '2024-09-18T09:15:00Z',
        session_end: '2024-09-18T09:25:00Z',
        duration_seconds: 600,
        page_views: 2,
        documents_downloaded: 0,
        nda_initiated: true,
        max_scroll_percentage: 72
      }
    ];

    // Combinar sesiones demo + sesiones reales
    const allSessions = [...demoSessions, ...realSessions];

    switch (method) {
      case 'GET':
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 100;
        const search = query.search || '';
        const visitorToken = query.visitor_token;
        
        let filteredSessions = allSessions;
        
        // Aplicar filtros
        if (search) {
          filteredSessions = allSessions.filter(session =>
            session.visitor_email?.toLowerCase().includes(search.toLowerCase()) ||
            session.visitor_token?.toLowerCase().includes(search.toLowerCase())
          );
        }
        
        if (visitorToken) {
          filteredSessions = filteredSessions.filter(session => 
            session.visitor_token === visitorToken
          );
        }
        
        // Aplicar paginación
        const start = (page - 1) * limit;
        const paginatedSessions = filteredSessions.slice(start, start + limit);
        
        console.log(`📊 Returning ${paginatedSessions.length} sessions (${realSessions.length} real, ${demoSessions.length} demo)`);
        
        res.status(200).json({
          data: paginatedSessions,
          total: filteredSessions.length,
          page,
          limit,
          table: 'sessions',
          real_count: realSessions.length,
          demo_count: demoSessions.length
        });
        break;

      case 'POST':
        // Crear nueva sesión REAL
        const newSession = {
          id: `real_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          visitor_token: body.visitor_token || '',
          visitor_email: body.visitor_email || '',
          session_start: body.session_start || new Date().toISOString(),
          session_end: body.session_end || null,
          duration_seconds: parseInt(body.duration_seconds) || 0,
          page_views: parseInt(body.page_views) || 0,
          documents_downloaded: parseInt(body.documents_downloaded) || 0,
          nda_initiated: Boolean(body.nda_initiated),
          max_scroll_percentage: parseInt(body.max_scroll_percentage) || 0,
          created_at: new Date().toISOString()
        };
        
        realSessions.push(newSession);
        
        console.log('✅ New REAL session created:', {
          id: newSession.id,
          visitor: newSession.visitor_token?.substring(0, 8) + '...',
          email: newSession.visitor_email,
          duration: newSession.duration_seconds,
          total: realSessions.length
        });
        
        res.status(201).json(newSession);
        break;

      default:
        res.setHeader('Allow', ['GET', 'POST', 'OPTIONS']);
        res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: error.message 
    });
  }
}