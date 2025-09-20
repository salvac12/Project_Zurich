#!/usr/bin/env python3
import http.server
import socketserver
import sys

PORT = 8000

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        print(f"{self.log_date_time_string()} - {format % args}")
        sys.stdout.flush()

if __name__ == "__main__":
    with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
        print(f"Server running at http://localhost:{PORT}/")
        print("Files available:")
        import os
        for f in os.listdir("."):
            if f.endswith(".html"):
                print(f"  - {f}")
        sys.stdout.flush()
        httpd.serve_forever()