// Main API handler for Project Zurich - Vercel Serverless
// Single entry point for all API routes

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
const SUPABASE_ENABLED = !!(SUPABASE_URL && SUPABASE_KEY);

console.log('🚀 API Handler initialized', {
  supabase: SUPABASE_ENABLED ? 'ENABLED' : 'DISABLED',
  url: SUPABASE_URL ? SUPABASE_URL.substring(0, 30) + '...' : 'NOT_SET'
});

// Supabase client
async function supabaseRequest(endpoint, options = {}) {
  if (!SUPABASE_ENABLED) {
    throw new Error('Supabase not configured - missing environment variables');
  }

  const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
  
  const response = await fetch(url, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      ...options.headers
    },
    ...options
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Supabase error:', response.status, errorText);
    throw new Error(`Supabase error: ${response.status} - ${errorText}`);
  }

  if (response.status === 204) {
    return { success: true };
  }

  return await response.json();
}

// Parse request body
async function parseBody(req) {
  if (req.body) return req.body;
  
  return new Promise((resolve) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => {
      try {
        const parsed = data ? JSON.parse(data) : {};
        resolve(parsed);
      } catch (e) {
        console.error('❌ Body parse error:', e.message);
        resolve({});
      }
    });
  });
}

// Main handler
module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { url, method } = req;
  const path = url?.split('?')[0] || '/';
  
  console.log('📨 API Request:', { method, path, url });

  try {
    // Parse query params
    const urlObj = new URL(url || '/', 'https://dummy.com');
    const query = urlObj.searchParams;

    // =========================================
    // ROUTE: /api/visitors or /api (with visitors in path)
    // =========================================
    if (path.includes('/visitors') || path === '/api/visitors' || path === '/api') {
      if (path.includes('/visitors') || query.get('route') === 'visitors') {
        const body = await parseBody(req);

        // GET /api/visitors - List visitors
        if (method === 'GET') {
          console.log('📊 GET /api/visitors');
          
          const limit = parseInt(query.get('limit')) || 100;
          const offset = parseInt(query.get('offset')) || 0;
          
          const visitors = await supabaseRequest(
            `visitors?select=*&order=created_at.desc&limit=${limit}&offset=${offset}`
          );
          
          console.log('✅ Retrieved visitors:', visitors.length);
          
          return res.status(200).json({
            data: visitors,
            total: visitors.length,
            table: 'visitors',
            source: 'supabase'
          });
        }

        // POST /api/visitors - Create visitor
        if (method === 'POST') {
          console.log('➕ POST /api/visitors', { email: body.email });
          
          const newVisitor = {
            id: `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            email: body.email || '',
            token: body.token || '',
            name: body.name || '',
            company: body.company || '',
            status: body.status || 'active',
            access_count: parseInt(body.access_count) || 0,
            first_access: body.first_access || null,
            last_access: body.last_access || null,
            created_at: new Date().toISOString()
          };

          const saved = await supabaseRequest('visitors', {
            method: 'POST',
            body: JSON.stringify(newVisitor)
          });

          console.log('✅ Visitor created:', newVisitor.email);
          
          return res.status(201).json(saved[0] || newVisitor);
        }
      }
    }

    // =========================================
    // ROUTE: /api/analytics-events or /api/analytics
    // =========================================
    if (path.includes('/analytics')) {
      const body = await parseBody(req);

      // GET - List analytics events
      if (method === 'GET') {
        console.log('📊 GET /api/analytics-events');
        
        const limit = parseInt(query.get('limit')) || 100;
        const offset = parseInt(query.get('offset')) || 0;
        const eventType = query.get('event_type');
        
        let endpoint = `analytics?select=*&order=timestamp.desc&limit=${limit}&offset=${offset}`;
        if (eventType) endpoint += `&event_type=eq.${eventType}`;
        
        const events = await supabaseRequest(endpoint);
        
        console.log('✅ Retrieved events:', events.length);
        
        return res.status(200).json({
          data: events,
          total: events.length,
          table: 'analytics',
          source: 'supabase'
        });
      }

      // POST - Create analytics event
      if (method === 'POST') {
        console.log('➕ POST /api/analytics-events', { type: body.eventType || body.event_type });
        
        const newEvent = {
          id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          visitor_token: body.visitorToken || body.visitor_token || '',
          visitor_email: body.visitor_email || '',
          event_type: body.eventType || body.event_type || '',
          event_data: body.data || body.event_data || {},
          page_url: body.page_url || (body.data && body.data.page) || '',
          timestamp: body.timestamp || new Date().toISOString(),
          created_at: new Date().toISOString()
        };

        const saved = await supabaseRequest('analytics', {
          method: 'POST',
          body: JSON.stringify(newEvent)
        });

        console.log('✅ Event created:', newEvent.event_type);
        
        return res.status(201).json(saved[0] || newEvent);
      }
    }

    // =========================================
    // Default: Route not found
    // =========================================
    console.log('❌ Route not found:', path);
    return res.status(404).json({ 
      error: 'Route not found',
      path,
      available: ['/api/visitors', '/api/analytics-events']
    });

  } catch (error) {
    console.error('💥 API Error:', error);
    return res.status(500).json({ 
      error: 'Internal Server Error',
      message: error.message,
      supabase: SUPABASE_ENABLED
    });
  }
};
