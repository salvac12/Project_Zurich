// API Analytics - Sistema híbrido optimizado
// Registra eventos reales de tracking de visitantes

let realEvents = []; // Almacenamiento temporal en memoria

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

    // Eventos demo para mostrar funcionalidad
    const demoEvents = [
      {
        id: 'demo_event_1',
        visitor_token: 'zrch_demo_001',
        visitor_email: 'juan.garcia@pension-fund.com',
        event_type: 'page_view',
        event_data: { page: '/index.html' },
        page_url: 'https://project-zurich-alter5.vercel.app/index.html',
        timestamp: '2024-09-18T10:30:00Z'
      },
      {
        id: 'demo_event_2',
        visitor_token: 'zrch_demo_001',
        visitor_email: 'juan.garcia@pension-fund.com',
        event_type: 'download',
        event_data: { type: 'term-sheet', file: 'Project-ZURICH-TermSheet.docx' },
        page_url: 'https://project-zurich-alter5.vercel.app/index.html',
        timestamp: '2024-09-18T10:35:00Z'
      },
      {
        id: 'demo_event_3',
        visitor_token: 'zrch_demo_002',
        visitor_email: 'maria.lopez@family-office.es',
        event_type: 'page_view',
        event_data: { page: '/index.html' },
        page_url: 'https://project-zurich-alter5.vercel.app/index.html',
        timestamp: '2024-09-18T09:15:00Z'
      },
      {
        id: 'demo_event_4',
        visitor_token: 'zrch_demo_002',
        visitor_email: 'maria.lopez@family-office.es',
        event_type: 'nda_request',
        event_data: { action: 'initiated' },
        page_url: 'https://project-zurich-alter5.vercel.app/index.html',
        timestamp: '2024-09-18T09:20:00Z'
      }
    ];

    // Combinar eventos demo + eventos reales
    const allEvents = [...demoEvents, ...realEvents];

    switch (method) {
      case 'GET':
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 100;
        const search = query.search || '';
        const eventType = query.event_type;
        const visitorToken = query.visitor_token;
        
        let filteredEvents = allEvents;
        
        // Aplicar filtros
        if (search) {
          filteredEvents = allEvents.filter(event =>
            event.visitor_email?.toLowerCase().includes(search.toLowerCase()) ||
            event.event_type?.toLowerCase().includes(search.toLowerCase()) ||
            event.page_url?.toLowerCase().includes(search.toLowerCase())
          );
        }
        
        if (eventType) {
          filteredEvents = filteredEvents.filter(event => 
            event.event_type === eventType
          );
        }
        
        if (visitorToken) {
          filteredEvents = filteredEvents.filter(event => 
            event.visitor_token === visitorToken
          );
        }
        
        // Aplicar paginación
        const start = (page - 1) * limit;
        const paginatedEvents = filteredEvents.slice(start, start + limit);
        
        console.log(`📊 Returning ${paginatedEvents.length} events (${realEvents.length} real, ${demoEvents.length} demo)`);
        
        res.status(200).json({
          data: paginatedEvents,
          total: filteredEvents.length,
          page,
          limit,
          table: 'analytics',
          real_count: realEvents.length,
          demo_count: demoEvents.length
        });
        break;

      case 'POST':
        // Crear nuevo evento REAL
        const newEvent = {
          id: `real_event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          visitor_token: body.visitorToken || body.visitor_token || '',
          visitor_email: body.visitor_email || '',
          event_type: body.eventType || body.event_type || '',
          event_data: body.data || body.event_data || {},
          session_id: body.session_id || body.data?.session || '',
          page_url: body.page_url || body.data?.page || '',
          user_agent: body.user_agent || body.data?.user_agent || '',
          ip_address: req.headers['x-forwarded-for'] || req.connection.remoteAddress || '',
          timestamp: body.timestamp || new Date().toISOString(),
          created_at: new Date().toISOString()
        };
        
        realEvents.push(newEvent);
        
        console.log('📊 New REAL event recorded:', {
          id: newEvent.id,
          type: newEvent.event_type,
          visitor: newEvent.visitor_token?.substring(0, 8) + '...',
          email: newEvent.visitor_email,
          total: realEvents.length
        });
        
        res.status(201).json(newEvent);
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