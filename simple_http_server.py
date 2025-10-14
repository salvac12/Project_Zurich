#!/usr/bin/env python3

import http.server
import socketserver
import os
import sys

# Cambiar al directorio correcto
os.chdir('/home/user/webapp')

PORT = 8000

class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        pass

print(f"Starting HTTP server on port {PORT}")
print("Available pages:")
for f in sorted(os.listdir('.')):
    if f.endswith('.html'):
        print(f"  - {f}")

try:
    with socketserver.TCPServer(("", PORT), QuietHandler) as httpd:
        print(f"\nServer running at http://localhost:{PORT}/")
        httpd.serve_forever()
except KeyboardInterrupt:
    print("\nServer stopped.")
except Exception as e:
    print(f"Error: {e}")