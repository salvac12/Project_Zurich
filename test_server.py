#!/usr/bin/env python3
import http.server
import socketserver
import threading
import os

PORT = 9000

class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        pass  # Disable logging to avoid conflicts

def start_server():
    os.chdir('/home/user/webapp')
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Server running at port {PORT}")
        httpd.serve_forever()

if __name__ == "__main__":
    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()
    
    import time
    time.sleep(3600)  # Keep running for 1 hour