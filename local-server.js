// Local development server for Project Zurich
// Simulates Vercel serverless functions locally

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Load environment variables from .env file
const envFile = fs.readFileSync('.env', 'utf8');
envFile.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length) {
    process.env[key.trim()] = valueParts.join('=').trim();
  }
});

const PORT = 35000;

// Import the API handler
const apiHandler = require('./api/handler.js');

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
  '.ico': 'image/x-icon'
};

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  console.log(`${req.method} ${pathname}`);

  // Handle API routes
  if (pathname.startsWith('/api/')) {
    console.log('→ Routing to API handler');
    
    // Make res compatible with Vercel API format
    res.status = function(code) {
      this.statusCode = code;
      return this;
    };
    res.json = function(data) {
      this.setHeader('Content-Type', 'application/json');
      this.end(JSON.stringify(data));
      return this;
    };
    
    try {
      await apiHandler(req, res);
    } catch (error) {
      console.error('API Error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
    return;
  }

  // Serve static files
  let filePath = '.' + pathname;
  if (filePath === './') {
    filePath = './index.html';
  }

  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1>', 'utf-8');
      } else {
        res.writeHead(500);
        res.end('Server Error: ' + error.code);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 Local server started!');
  console.log(`📍 Server running at: http://localhost:${PORT}`);
  console.log('');
  console.log('📄 Pages:');
  console.log(`   Home: http://localhost:${PORT}/index.html`);
  console.log(`   Generate Links: http://localhost:${PORT}/unique_links.html`);
  console.log(`   Analytics: http://localhost:${PORT}/analytics-dashboard.html`);
  console.log('');
  console.log('🔌 API Endpoints:');
  console.log(`   Test: http://localhost:${PORT}/api/handler`);
  console.log(`   Visitors: http://localhost:${PORT}/api/visitors`);
  console.log(`   Analytics: http://localhost:${PORT}/api/analytics-events`);
  console.log('');
  console.log('✅ Supabase configured:', !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY));
  console.log('');
  console.log('Press Ctrl+C to stop the server');
});
