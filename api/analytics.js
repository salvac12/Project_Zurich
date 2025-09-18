// Analytics API para Vercel
// Sistema de tracking sin base de datos externa

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { method, query, body } = req;
  
  try {
    switch (method) {
      case 'GET':
        return handleGetAnalytics(req, res, query);
      case 'POST':
        return handlePostAnalytics(req, res, body);
      default:
        res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Analytics API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Obtener analytics (simulado con datos en localStorage del cliente)
async function handleGetAnalytics(req, res, query) {
  const { type } = query;
  
  // En un entorno real, aquí consultarías una base de datos
  // Por ahora devolvemos datos de ejemplo estructurados
  
  const mockData = {
    summary: {
      totalVisitors: 23,
      totalDownloads: 47,
      totalNDARequests: 8,
      avgTimeOnSite: 263, // segundos
      lastUpdated: new Date().toISOString()
    },
    
    downloads: [
      { type: 'term-sheet', count: 15, percentage: 32 },
      { type: 'teaser', count: 20, percentage: 43 },
      { type: 'financial-model', count: 8, percentage: 17 },
      { type: 'nda', count: 4, percentage: 8 }
    ],
    
    visitors: [
      {
        id: 'visitor_1',
        email: 'j.garcia@***.com',
        name: 'Juan García',
        company: 'InvestCorp',
        project: 'senior_financing',
        lastAccess: '2024-01-15T14:30:00Z',
        downloads: {
          'term-sheet': 2,
          'teaser': 1,
          'financial-model': 1,
          'nda': 0
        },
        ndaStatus: 'signed',
        totalTime: 1530, // segundos
        visits: 3,
        scrollDepth: 85,
        clicks: 23
      },
      {
        id: 'visitor_2', 
        email: 'm.lopez@***.com',
        name: 'María López',
        company: 'Capital Partners',
        project: 'equity_investment',
        lastAccess: '2024-01-14T16:45:00Z',
        downloads: {
          'term-sheet': 1,
          'teaser': 2,
          'financial-model': 0,
          'nda': 1
        },
        ndaStatus: 'pending',
        totalTime: 1102,
        visits: 2,
        scrollDepth: 72,
        clicks: 18
      }
    ],
    
    recentEvents: [
      {
        timestamp: new Date(Date.now() - 300000).toISOString(), // 5 min ago
        type: 'download',
        file: 'term-sheet',
        visitor: 'j.garcia@***.com'
      },
      {
        timestamp: new Date(Date.now() - 900000).toISOString(), // 15 min ago
        type: 'nda_request',
        visitor: 'm.lopez@***.com'
      },
      {
        timestamp: new Date(Date.now() - 1800000).toISOString(), // 30 min ago
        type: 'page_visit',
        page: 'equity',
        visitor: 'p.martin@***.com'
      }
    ],
    
    dailyStats: generateDailyStats(30)
  };
  
  if (type && mockData[type]) {
    res.status(200).json(mockData[type]);
  } else {
    res.status(200).json(mockData);
  }
}

// Registrar eventos de analytics
async function handlePostAnalytics(req, res, body) {
  const { eventType, visitorToken, data } = body;
  
  // En producción, aquí guardarías en una base de datos
  // Por ahora solo loggeamos y confirmamos recepción
  
  console.log('📊 Analytics Event:', {
    type: eventType,
    visitor: visitorToken,
    timestamp: new Date().toISOString(),
    data: data
  });
  
  // Simular guardado exitoso
  const eventId = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  res.status(201).json({
    success: true,
    eventId: eventId,
    message: 'Event recorded successfully'
  });
}

// Generar estadísticas diarias simuladas
function generateDailyStats(days) {
  const stats = [];
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    stats.push({
      date: date.toISOString().split('T')[0],
      visitors: Math.floor(Math.random() * 8) + 1,
      downloads: Math.floor(Math.random() * 12) + 2,
      ndaRequests: Math.floor(Math.random() * 3)
    });
  }
  
  return stats;
}