"""簡易APIサーバー: 静的ファイル配信 + タスクCRUD API"""
import http.server
import json
import os

PORT = int(os.environ.get('PORT', 3000))
DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data')
TASKS_FILE = os.path.join(DATA_DIR, 'tasks.json')


def read_tasks():
    if os.path.exists(TASKS_FILE):
        with open(TASKS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {"categories": [], "tasks": {}}


def write_tasks(data):
    os.makedirs(DATA_DIR, exist_ok=True)
    with open(TASKS_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


class APIHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/api/tasks':
            data = read_tasks()
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))
        elif self.path == '/' or self.path.startswith('/?'):
            # index.htmlにキャッシュバスターを自動付与
            import time, re
            ts = str(int(time.time()))
            index_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'index.html')
            with open(index_path, 'r', encoding='utf-8') as f:
                html = f.read()
            html = re.sub(r'(src|href)="((?:js|css)/[^"]+)"', lambda m: f'{m.group(1)}="{m.group(2)}?t={ts}"', html)
            body = html.encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        else:
            super().do_GET()

    def do_PUT(self):
        if self.path == '/api/tasks':
            length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(length)
            try:
                data = json.loads(body.decode('utf-8'))
                write_tasks(data)
                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(b'{"ok":true}')
            except (json.JSONDecodeError, UnicodeDecodeError) as e:
                self.send_response(400)
                self.end_headers()
                self.wfile.write(f'{{"error":"{e}"}}'.encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()


if __name__ == '__main__':
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    with http.server.HTTPServer(('', PORT), APIHandler) as srv:
        print(f'サーバー起動: http://localhost:{PORT}')
        srv.serve_forever()
