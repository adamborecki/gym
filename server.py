#!/usr/bin/env python3
"""Dev server with no-cache headers — prevents stale JS/CSS on phone after edits."""

import http.server
import socketserver

PORT = 8080


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def log_message(self, fmt, *args):
        # Quieter logging — only show non-asset requests
        path = args[0] if args else ''
        if not any(path.endswith(ext) for ext in ('.png', '.ico', '.map')):
            super().log_message(fmt, *args)


if __name__ == '__main__':
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(('', PORT), NoCacheHandler) as httpd:
        print(f'  🏋️  Gym App dev server → http://localhost:{PORT}')
        print(f'  Cache-Control: no-store (phone will always fetch fresh files)')
        print(f'  Ctrl+C to stop\n')
        httpd.serve_forever()
