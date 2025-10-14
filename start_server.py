#!/usr/bin/env python3

import http.server
import socketserver
import os
import sys

# Ensure we're in the correct directory
os.chdir('/home/user/webapp')

PORT = 8000

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        # Log to stdout for visibility
        sys.stdout.write(f"{self.address_string()} - {format % args}\n")
        sys.stdout.flush()

def start_server():
    try:
        # Create server
        with socketserver.TCPServer(("0.0.0.0", PORT), CustomHandler) as httpd:
            print(f"✅ Server running on port {PORT}")
            print(f"📂 Serving from: {os.getcwd()}")
            print("📄 Available HTML files:")
            for f in sorted(os.listdir('.')):
                if f.endswith('.html'):
                    print(f"   - {f}")
            print(f"\n🌐 Server URL: http://0.0.0.0:{PORT}")
            sys.stdout.flush()
            httpd.serve_forever()
    except Exception as e:
        print(f"❌ Server error: {e}")
        sys.stdout.flush()

if __name__ == "__main__":
    start_server()