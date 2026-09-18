"""Serve an isolated local preview without enabling service workers or live entry points."""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlsplit
import os
os.chdir(Path(__file__).resolve().parent.parent)
class Preview(SimpleHTTPRequestHandler):
    def do_GET(self):
        path=urlsplit(self.path).path
        if path in ('/', '/index.html'):
            self.send_response(302)
            self.send_header('Location', '/preview/course-progress.html')
            self.end_headers()
            return
        if path.endswith('/sw.js'):
            self.send_error(404, 'Service workers are disabled in the isolated preview')
            return
        return super().do_GET()
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        self.send_header('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; worker-src 'none'; object-src 'none'")
        super().end_headers()
if __name__=='__main__':
    print('Course preview: http://127.0.0.1:19085/preview/course-progress.html', flush=True)
    ThreadingHTTPServer(('127.0.0.1',19085),Preview).serve_forever()
