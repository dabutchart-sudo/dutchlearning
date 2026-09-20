"""Serve the isolated listen/speak test area. OpenAI stays on this process."""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlsplit
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
import json
import os
import ssl
import threading

ROOT = Path(__file__).resolve().parent.parent
os.chdir(ROOT)
SAMPLE_NL = 'Ik drink koffie.'
OPENAI_TTS = 'https://api.openai.com/v1/audio/speech'
OPENAI_STT = 'https://api.openai.com/v1/audio/transcriptions'


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
tts_audio = None


def request_tts(key):
    request = Request(
        OPENAI_TTS,
        data=json.dumps({'model': 'tts-1', 'voice': 'nova', 'input': SAMPLE_NL, 'response_format': 'mp3'}).encode('utf-8'),
        headers={'Authorization': f'Bearer {key}', 'Content-Type': 'application/json'},
        method='POST'
    )
    with urlopen(request, context=ssl.create_default_context(), timeout=30) as response:
        return response.read()


def cached_tts(key):
    global tts_audio
    with tts_lock:
        if tts_audio:
            return tts_audio
        tts_audio = request_tts(key)
        return tts_audio


def request_stt(key, audio, model):
    boundary = '----zinpreview'
    body = (
        f'--{boundary}\r\nContent-Disposition: form-data; name="model"\r\n\r\n{model}\r\n'
        f'--{boundary}\r\nContent-Disposition: form-data; name="language"\r\n\r\nnl\r\n'
        f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="speech.webm"\r\nContent-Type: audio/webm\r\n\r\n'
    ).encode('utf-8') + audio + f'\r\n--{boundary}--\r\n'.encode('utf-8')
    request = Request(
        OPENAI_STT,
        data=body,
        headers={'Authorization': f'Bearer {key}', 'Content-Type': f'multipart/form-data; boundary={boundary}'},
        method='POST'
    )
    with urlopen(request, context=ssl.create_default_context(), timeout=30) as response:
        return json.loads(response.read().decode('utf-8'))


def prefetch_tts():
    key = openai_key()
    if not key:
        return
    try:
        cached_tts(key)
    except (HTTPError, URLError, TimeoutError):
        return


def json_bytes(payload, status=200):
    body = json.dumps(payload).encode('utf-8')
    return status, 'application/json; charset=utf-8', body


def read_multipart_audio(handler):
    ctype = handler.headers.get('Content-Type', '')
    if 'multipart/form-data' not in ctype or 'boundary=' not in ctype:
        return b''
    boundary = ctype.split('boundary=', 1)[1].strip().encode('utf-8')
    length = int(handler.headers.get('Content-Length') or 0)
    if length <= 0 or length > 4_000_000:
        return b''
    data = handler.rfile.read(length)
    marker = b'--' + boundary
    for part in data.split(marker):
        if b'name="audio"' not in part:
            continue
        head, _, blob = part.partition(b'\r\n\r\n')
        if not blob:
            continue
        return blob.rstrip(b'\r\n').removesuffix(b'--')
    return b''


class Preview(SimpleHTTPRequestHandler):
    def do_GET(self):
        path = urlsplit(self.path).path
        if path in ('/', '/index.html'):
            self.send_response(302)
            self.send_header('Location', '/preview/listen-speak.html')
            self.end_headers()
            return
        if path.endswith('/sw.js'):
            self.send_error(404, 'Service workers are disabled in the isolated preview')
            return
        if path == '/preview/status':
            self.respond(*json_bytes({'openai': bool(openai_key()), 'audioReady': bool(tts_audio)}))
            return
        return super().do_GET()

    def do_POST(self):
        path = urlsplit(self.path).path
        if path == '/preview/tts':
            self.handle_tts()
            return
        if path == '/preview/stt':
            self.handle_stt()
            return
        self.send_error(404, 'Not found')

    def handle_tts(self):
        key = openai_key()
        if not key:
            self.respond(*json_bytes({'error': 'OPENAI_API_KEY is not set on this preview server.'}, 503))
            return
        length = int(self.headers.get('Content-Length') or 0)
        try:
            payload = json.loads(self.rfile.read(length) or b'{}')
        except json.JSONDecodeError:
            self.respond(*json_bytes({'error': 'Invalid JSON body.'}, 400))
            return
        text = str(payload.get('text') or '').strip()
        if text != SAMPLE_NL:
            self.respond(*json_bytes({'error': 'This test area can only speak the sample sentence.'}, 400))
            return
        try:
            self.respond(200, 'audio/mpeg', cached_tts(key))
        except HTTPError as err:
            self.respond(*json_bytes({'error': 'OpenAI could not generate Dutch audio.'}, err.code if err.code >= 400 else 502))
        except URLError:
            self.respond(*json_bytes({'error': 'OpenAI could not be reached from this preview server.'}, 502))

    def handle_stt(self):
        key = openai_key()
        if not key:
            self.respond(*json_bytes({'error': 'OPENAI_API_KEY is not set on this preview server.'}, 503))
            return
        audio = read_multipart_audio(self)
        if not audio:
            self.respond(*json_bytes({'error': 'A spoken recording is required.'}, 400))
            return
        try:
            payload = request_stt(key, audio, 'gpt-4o-mini-transcribe')
        except HTTPError as err:
            if err.code in (400, 404):
                try:
                    payload = request_stt(key, audio, 'whisper-1')
                except (HTTPError, URLError):
                    self.respond(*json_bytes({'error': 'OpenAI could not transcribe the recording.'}, 502))
                    return
            else:
                self.respond(*json_bytes({'error': 'OpenAI could not transcribe the recording.'}, err.code if err.code >= 400 else 502))
                return
        except URLError:
            self.respond(*json_bytes({'error': 'OpenAI could not be reached from this preview server.'}, 502))
            return
        self.respond(*json_bytes({'text': str(payload.get('text') or '').strip()}))

    def respond(self, status, content_type, body):
        self.send_response(status)
        self.send_header('Content-Type', content_type)
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        self.send_header(
            "Content-Security-Policy",
            "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; media-src 'self' blob:; connect-src 'self'; worker-src 'none'; object-src 'none'"
        )
        super().end_headers()


if __name__ == '__main__':
    load_local_env()
    prefetch_tts()
    print('Listen/speak preview: http://127.0.0.1:19086/preview/listen-speak.html', flush=True)
    ThreadingHTTPServer(('127.0.0.1', 19086), Preview).serve_forever()
