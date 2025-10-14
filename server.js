const http = require('http');
const fs = require('fs');
const path = require('path');

const port = 8000;
const host = '0.0.0.0';

// MIME types
const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf'
};

const server = http.createServer((req, res) => {
    let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
    const extname = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                // 404 - File not found
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 - Page Not Found</h1><p>Available pages:</p><ul><li><a href="/equity_investment.html">Equity Investment</a></li><li><a href="/debt_investment.html">Debt Investment</a></li></ul>');
            } else {
                // 500 - Internal Server Error
                res.writeHead(500);
                res.end(`Server Error: ${err.code}`);
            }
        } else {
            // Success
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        }
    });
});

server.listen(port, host, () => {
    console.log(`✅ HTTP Server running at http://${host}:${port}/`);
    console.log('📄 Available pages:');
    
    // List available HTML files
    fs.readdir(__dirname, (err, files) => {
        if (!err) {
            files.filter(file => file.endsWith('.html')).forEach(file => {
                console.log(`   - http://${host}:${port}/${file}`);
            });
        }
    });
});

// Handle server errors
server.on('error', (err) => {
    console.error('❌ Server error:', err);
});

process.on('SIGTERM', () => {
    console.log('🔄 Server shutting down...');
    server.close();
});

process.on('SIGINT', () => {
    console.log('🔄 Server shutting down...');
    server.close();
    process.exit(0);
});