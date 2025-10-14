// Main API handler for Project Zurich - Vercel Serverless
// Handles all API routes

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

console.log('🚀 API Handler loaded', { hasSupabase: !!(SUPABASE_URL && SUPABASE_KEY) });

// Supabase helper
async function supabase(endpoint, options = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
  const res = await fetch(url, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      ...options.headers
    },
    ...options
  });
  
  if (!res.ok) throw new Error(`Supabase error: ${res.status}`);
  if (res.status === 204) return { success: true };
  return await res.json();
}

// Parse body
async function getBody(req) {
  if (req.body) return req.body;
  return new Promise((resolve) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => {
      try { resolve(data ? JSON.parse(data) : {}); }
      catch (e) { resolve({}); }
    });
  });
}

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  
  const body = await getBody(req);
  console.log(`${req.method} ${req.url}`);
  
  try {
    // POST = Create visitor OR analytics event
    if (req.method === 'POST') {
      
      // Analytics event (has eventType field)
      if (body.eventType) {
        const event = {
          id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          event_type: body.eventType,
          visitor_token: body.visitorToken || body.visitor_token || '',
          visitor_email: body.visitor_email || '',
          event_data: body.data || {},
          timestamp: new Date().toISOString()
        };
        
        const saved = await supabase('analytics', {
          method: 'POST',
          body: JSON.stringify(event)
        });
        
        console.log('✅ Analytics event:', event.event_type, event.visitor_token);
        return res.status(201).json(saved[0] || event);
      }
      
      // Visitor creation (has email field)
      const visitor = {
        id: `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        email: body.email || '',
        token: body.token || '',
        name: body.name || '',
        company: body.company || '',
        status: 'active',
        access_count: 0,
        first_access: null,
        last_access: null,
        created_at: new Date().toISOString()
      };
      
      const saved = await supabase('visitors', {
        method: 'POST',
        body: JSON.stringify(visitor)
      });
      
      console.log('✅ Visitor created:', visitor.email);
      return res.status(201).json(saved[0] || visitor);
    }
    
    // GET = List visitors or analytics
    if (req.method === 'GET') {
      // Check URL path to determine what to return
      const url = new URL(req.url, `http://${req.headers.host}`);
      const path = url.pathname;
      
      // Analytics endpoint
      if (path.includes('analytics')) {
        const events = await supabase('analytics?select=*&order=timestamp.desc&limit=1000');
        console.log('✅ Retrieved analytics events:', events.length);
        return res.status(200).json(events);
      }
      
      // Visitors endpoint (default)
      const visitors = await supabase('visitors?select=*&order=created_at.desc&limit=100');
      console.log('✅ Retrieved visitors:', visitors.length);
      return res.status(200).json({ data: visitors, source: 'supabase' });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
};
