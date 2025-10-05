// Main API router for Project Zurich
// Handles all API routes in a single function

// Supabase configuration
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

// Helper to make Supabase requests
async function supabaseRequest(endpoint, options = {}) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error('Supabase not configured');
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
    throw new Error(`Supabase error: ${response.status}`);
  }

  if (response.status === 204) {
    return { success: true };
  }

  return await response.json();
}

// Helper to parse body
async function parseBody(req) {
  if (req.body) return req.body;
  return new Promise((resolve) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => {
      try {
        resolve(JSON.parse(data));
      } catch (e) {
        resolve({});
      }
    });
  });
}

// CORS headers
function setCORS(res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

module.exports = async (req, res) => {
  setCORS(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { url, method } = req;
  const path = url.split('?')[0];

  try {
    // Route: /api/visitors
    if (path.includes('/visitors')) {
      const body = await parseBody(req);
      const query = new URL(`https://dummy.com${url}`).searchParams;

      if (method === 'GET') {
        const limit = parseInt(query.get('limit')) || 100;
        const offset = parseInt(query.get('offset')) || 0;
        
        const visitors = await supabaseRequest(`visitors?order=created_at.desc&limit=${limit}&offset=${offset}`);
        
        return res.status(200).json({
          data: visitors,
          total: visitors.length,
          table: 'visitors',
          source: 'supabase'
        });
      }

      if (method === 'POST') {
        const newVisitor = {
          id: `real_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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

        console.log('✅ Visitor saved:', newVisitor.email);
        return res.status(201).json(saved[0] || newVisitor);
      }
    }

    // Route: /api/analytics-events
    if (path.includes('/analytics-events') || path.includes('/analytics')) {
      const body = await parseBody(req);
      const query = new URL(`https://dummy.com${url}`).searchParams;

      if (method === 'GET') {
        const limit = parseInt(query.get('limit')) || 100;
        const offset = parseInt(query.get('offset')) || 0;
        const eventType = query.get('event_type');
        
        let endpoint = `analytics?order=timestamp.desc&limit=${limit}&offset=${offset}`;
        if (eventType) endpoint += `&event_type=eq.${eventType}`;
        
        const events = await supabaseRequest(endpoint);
        
        return res.status(200).json({
          data: events,
          total: events.length,
          table: 'analytics',
          source: 'supabase'
        });
      }

      if (method === 'POST') {
        const newEvent = {
          id: `real_event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          visitor_token: body.visitorToken || body.visitor_token || '',
          visitor_email: body.visitor_email || '',
          event_type: body.eventType || body.event_type || '',
          event_data: body.data || body.event_data || {},
          page_url: body.page_url || body.data?.page || '',
          timestamp: body.timestamp || new Date().toISOString(),
          created_at: new Date().toISOString()
        };

        const saved = await supabaseRequest('analytics', {
          method: 'POST',
          body: JSON.stringify(newEvent)
        });

        console.log('📊 Event saved:', newEvent.event_type);
        return res.status(201).json(saved[0] || newEvent);
      }
    }

    // Default response
    return res.status(404).json({ error: 'Route not found', path });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: 'Internal Server Error',
      message: error.message 
    });
  }
};
