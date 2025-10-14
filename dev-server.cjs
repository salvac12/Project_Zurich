const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;

// MIME types
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf'
};

// In-memory data stores
let visitors = [];
let analytics = [];
let sessions = [];

// Helper to generate demo data (disabled - start with empty data)
function generateDemoData() {
  return { visitors: [], analytics: [] };
}

// Initialize with empty data
const demoData = generateDemoData();
visitors = [...demoData.visitors];
analytics = [...demoData.analytics];

// API Handlers
const apiHandlers = {
  '/api/tables/visitors': (req, res, parsedUrl) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    if (req.method === 'GET') {
      const token = parsedUrl.query.token;
      if (token) {
        const visitor = visitors.find(v => v.token === token);
        res.writeHead(visitor ? 200 : 404);
        res.end(JSON.stringify(visitor || { error: 'Visitor not found' }));
      } else {
        res.writeHead(200);
        res.end(JSON.stringify(visitors));
      }
    } else if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk.toString());
      req.on('end', () => {
        try {
          const newVisitor = JSON.parse(body);
          newVisitor.id = `real_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          newVisitor.access_count = 0;
          newVisitor.last_access = new Date().toISOString();
          visitors.push(newVisitor);
          res.writeHead(201);
          res.end(JSON.stringify(newVisitor));
        } catch (e) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Invalid JSON' }));
        }
      });
    } else {
      res.writeHead(405);
      res.end(JSON.stringify({ error: 'Method not allowed' }));
    }
  },

  '/api/tables/analytics': (req, res, parsedUrl) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    if (req.method === 'GET') {
      const token = parsedUrl.query.visitor_token;
      if (token) {
        const events = analytics.filter(a => a.visitor_token === token);
        res.writeHead(200);
        res.end(JSON.stringify(events));
      } else {
        res.writeHead(200);
        res.end(JSON.stringify(analytics));
      }
    } else if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk.toString());
      req.on('end', () => {
        try {
          const newEvent = JSON.parse(body);
          newEvent.id = `real_event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          newEvent.timestamp = new Date().toISOString();
          analytics.push(newEvent);
          
          // Update visitor access count
          const visitor = visitors.find(v => v.token === newEvent.visitor_token);
          if (visitor) {
            visitor.last_access = new Date().toISOString();
          }
          
          res.writeHead(201);
          res.end(JSON.stringify(newEvent));
        } catch (e) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Invalid JSON' }));
        }
      });
    } else {
      res.writeHead(405);
      res.end(JSON.stringify({ error: 'Method not allowed' }));
    }
  },

  '/api/tables/sessions': (req, res, parsedUrl) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    if (req.method === 'GET') {
      res.writeHead(200);
      res.end(JSON.stringify(sessions));
    } else if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk.toString());
      req.on('end', () => {
        try {
          const newSession = JSON.parse(body);
          newSession.id = `real_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          sessions.push(newSession);
          res.writeHead(201);
          res.end(JSON.stringify(newSession));
        } catch (e) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Invalid JSON' }));
        }
      });
    } else {
      res.writeHead(405);
      res.end(JSON.stringify({ error: 'Method not allowed' }));
    }
  },

  '/api/analytics-real': (req, res, parsedUrl) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk.toString());
      req.on('end', () => {
        try {
          const payload = JSON.parse(body);
          const { eventType, visitorToken, data } = payload;
          
          // Look up visitor by token to get email
          const visitor = visitors.find(v => v.token === visitorToken);
          const visitorEmail = visitor ? visitor.email : `${visitorToken}@unknown.com`;
          
          const newEvent = {
            id: `real_event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            visitor_token: visitorToken,
            visitor_email: visitorEmail,
            event_type: eventType,
            event_data: data || {},
            timestamp: new Date().toISOString()
          };
          
          analytics.push(newEvent);
          console.log(`📊 Analytics event: ${eventType} from ${visitorEmail} on page ${data?.page || 'unknown'}`);
          
          res.writeHead(201);
          res.end(JSON.stringify({ success: true, event: newEvent }));
        } catch (e) {
          console.error('Error processing analytics event:', e);
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Invalid JSON' }));
        }
      });
    } else if (req.method === 'GET') {
      // Return all analytics events
      res.writeHead(200);
      res.end(JSON.stringify(analytics));
    } else {
      res.writeHead(405);
      res.end(JSON.stringify({ error: 'Method not allowed' }));
    }
  }
};

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  let pathname = parsedUrl.pathname;

  console.log(`[${new Date().toISOString()}] ${req.method} ${pathname}`);

  // Handle API routes
  if (pathname.startsWith('/api/')) {
    const handler = apiHandlers[pathname];
    if (handler) {
      handler(req, res, parsedUrl);
      return;
    }
  }

  // Serve static files
  if (pathname === '/') {
    pathname = '/index.html';
  }

  const filePath = path.join(__dirname, pathname);
  
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      res.writeHead(404);
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath);
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(500);
        res.end('500 Internal Server Error');
        return;
      }

      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    });
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Development Server Running!`);
  console.log(`📍 Local: http://localhost:${PORT}`);
  console.log(`📍 Network: http://0.0.0.0:${PORT}`);
  console.log(`\n✅ API Endpoints:`);
  console.log(`   GET  /api/tables/visitors`);
  console.log(`   POST /api/tables/visitors`);
  console.log(`   GET  /api/tables/analytics`);
  console.log(`   POST /api/tables/analytics`);
  console.log(`   GET  /api/tables/sessions`);
  console.log(`   POST /api/tables/sessions`);
  console.log(`\n📄 Pages:`);
  console.log(`   / (index.html) - Main landing page`);
  console.log(`   /admin-simple.html - Admin panel`);
  console.log(`   /analytics-dashboard.html - Analytics dashboard`);
  console.log(`\n⏱️  Server started at: ${new Date().toLocaleString()}`);
  console.log(`\nPress Ctrl+C to stop\n`);
});
