"""Serve the development app on the LAN. OpenAI TTS stays on this process."""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import parse_qs, urlsplit
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
import json
import os
import ssl
import threading

ROOT = Path(__file__).resolve().parent.parent
os.chdir(ROOT)
OPENAI_TTS = 'https://api.openai.com/v1/audio/speech'
MAX_CHARS = 180


def load_local_env():
    path = ROOT / '.env'
    if not path.exists():
        return
    for raw in path.read_text(encoding='utf-8').splitlines():
        line = raw.strip()
        if not line or line.startswith('#') or '=' not in line:
            continue
        key, value = line.split('=', 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def openai_key():
    return (os.environ.get('OPENAI_API_KEY') or '').strip()


tts_lock = threading.Lock()
tts_cache = {}
last_listen_error = ''


def remember_listen_error(message=''):
    global last_listen_error
    last_listen_error = message


def allowed_listen_text(text):
    value = str(text or '').strip()
    if not value or len(value) > MAX_CHARS:
        return ''
    if not any(ch.isalpha() for ch in value):
        return ''
    return value


def request_tts(key, text):
    request = Request(
        OPENAI_TTS,
        data=json.dumps({'model': 'tts-1', 'voice': 'nova', 'input': text, 'response_format': 'mp3'}).encode('utf-8'),
        headers={'Authorization': f'Bearer {key}', 'Content-Type': 'application/json'},
        method='POST'
    )
    with urlopen(request, context=ssl.create_default_context(), timeout=30) as response:
        return response.read()


def cached_tts(key, text):
    with tts_lock:
        if text in tts_cache:
            return tts_cache[text]
        audio = request_tts(key, text)
        if len(tts_cache) >= 32:
            tts_cache.pop(next(iter(tts_cache)))
        tts_cache[text] = audio
        return audio


def json_bytes(payload, status=200):
    body = json.dumps(payload).encode('utf-8')
    return status, 'application/json; charset=utf-8', body


class DevApp(SimpleHTTPRequestHandler):
    def do_GET(self):
        parts = urlsplit(self.path)
        if parts.path.endswith('/sw.js'):
            self.send_error(404, 'Service workers are disabled on this development server')
            return
        if parts.path == '/listen/status':
            self.respond(*json_bytes({'openai': bool(openai_key()), 'error': last_listen_error}))
            return
        if parts.path == '/listen/tts':
            text = (parse_qs(parts.query).get('text') or [''])[0]
            self.handle_tts(text)
            return
        return super().do_GET()

    def do_POST(self):
        if urlsplit(self.path).path == '/listen/tts':
            length = int(self.headers.get('Content-Length') or 0)
            if length <= 0 or length > 4000:
                self.respond(*json_bytes({'error': 'A short Dutch sentence is required.'}, 400))
                return
            try:
                payload = json.loads(self.rfile.read(length) or b'{}')
            except json.JSONDecodeError:
                self.respond(*json_bytes({'error': 'Invalid JSON body.'}, 400))
                return
            self.handle_tts(payload.get('text'))
            return
        self.send_error(404, 'Not found')

    def handle_tts(self, raw_text):
        key = openai_key()
        if not key:
            remember_listen_error('OPENAI_API_KEY is not set on this development server.')
            self.respond(*json_bytes({'error': last_listen_error}, 503))
            return
        text = allowed_listen_text(raw_text)
        if not text:
            remember_listen_error('This server can only speak a short Dutch phrase.')
            self.respond(*json_bytes({'error': last_listen_error}, 400))
            return
        try:
            audio = cached_tts(key, text)
            remember_listen_error('')
            self.respond(200, 'audio/mpeg', audio)
        except HTTPError as err:
            if err.code == 401:
                remember_listen_error('OpenAI rejected the API key. Create a new key on the OpenAI site and restart this Mac server. Do not paste the key in chat.')
            else:
                remember_listen_error('OpenAI could not generate Dutch audio.')
            self.respond(*json_bytes({'error': last_listen_error}, 401 if err.code == 401 else (err.code if err.code >= 400 else 502)))
        except URLError:
            remember_listen_error('OpenAI could not be reached from this development server.')
            self.respond(*json_bytes({'error': last_listen_error}, 502))

    def respond(self, status, content_type, body):
        try:
            self.send_response(status)
            self.send_header('Content-Type', content_type)
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        except (BrokenPipeError, ConnectionResetError):
            return

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()


if __name__ == '__main__':
    load_local_env()
    print('Development app: http://192.168.0.41:8765/', flush=True)
    print(
        'OpenAI listen audio: ready' if openai_key() else
        'OpenAI listen audio: missing. Export OPENAI_API_KEY in this Terminal, then start the server again.',
        flush=True
    )
    ThreadingHTTPServer(('0.0.0.0', 8765), DevApp).serve_forever()
