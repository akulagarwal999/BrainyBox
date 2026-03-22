import os
import time
import json
import uuid
import posixpath
from http.server import SimpleHTTPRequestHandler, HTTPServer
from socketserver import ThreadingMixIn

PORT = 3000
UPLOAD_DIR = 'uploads'

if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

class CORSRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE')
        self.send_header("Access-Control-Allow-Headers", "x-api-key,Content-Type,Authorization")
        SimpleHTTPRequestHandler.end_headers(self)

    def do_OPTIONS(self):
        self.send_response(200, "ok")
        self.end_headers()

    def do_DELETE(self):
        if self.path.startswith('/upload/'):
            filename = self.path.split('/upload/')[-1]
            if '/' in filename or '\\' in filename or '..' in filename:
                self.send_response(400)
                self.end_headers()
                self.wfile.write(b'{"error":"Invalid filename"}')
                return
            
            filepath = os.path.join(UPLOAD_DIR, filename)
            if os.path.exists(filepath):
                try:
                    os.remove(filepath)
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(b'{"success":true,"message":"File deleted"}')
                    return
                except Exception as e:
                    self.send_response(500)
                    self.end_headers()
                    return
            else:
                self.send_response(404)
                self.end_headers()
                return
        
        self.send_response(404)
        self.end_headers()

    def do_POST(self):
        if self.path == '/upload':
            content_type = self.headers.get('Content-Type', '')
            if 'multipart/form-data' in content_type:
                try:
                    boundary = content_type.split("boundary=")[1].encode()
                    content_length = int(self.headers.get('Content-Length', '0'))
                    body = self.rfile.read(content_length)
                    
                    parts = body.split(b'--' + boundary)
                    for part in parts:
                        if b'filename="' in part:
                            header, content = part.split(b'\r\n\r\n', 1)
                            content = content.rstrip(b'\r\n')
                            header_str = header.decode('utf-8', errors='ignore')
                            
                            filename_parts = header_str.split('filename="')
                            if len(filename_parts) > 1:
                                original_filename = filename_parts[1].split('"')[0]
                            else:
                                original_filename = 'upload.bin'
                            
                            ext = os.path.splitext(original_filename)[1]
                            unique_name = f"{int(time.time() * 1000)}{ext}"
                            filepath = os.path.join(UPLOAD_DIR, unique_name)
                            
                            with open(filepath, 'wb') as f:
                                f.write(content)
                            
                            self.send_response(200)
                            self.send_header('Content-Type', 'application/json')
                            self.end_headers()
                            response = {"url": f"/uploads/{unique_name}", "filename": unique_name}
                            self.wfile.write(json.dumps(response).encode('utf-8'))
                            return
                except Exception as e:
                    self.send_response(500)
                    self.end_headers()
                    self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
                    return
                
                self.send_response(400)
                self.end_headers()
                self.wfile.write(b'{"error": "No file uploaded"}')
                return

        elif self.path == '/login':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            if data.get('username') == 'admin' and data.get('password') == 'admin123':
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"success": True, "token": f"brbox_token_{uuid.uuid4().hex}"}).encode("utf-8"))
            else:
                self.send_response(401)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"success": False, "error": "Invalid credentials"}).encode("utf-8"))
            return

        elif self.path == '/validateToken':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            token = data.get('token', '')
            if token and token.startswith('brbox_token_'):
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"valid": True}).encode("utf-8"))
            else:
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"valid": False}).encode("utf-8"))
            return

        self.send_response(404)
        self.end_headers()

class ThreadedHTTPServer(ThreadingMixIn, HTTPServer):
    pass

if __name__ == '__main__':
    server_address = ('', PORT)
    httpd = ThreadedHTTPServer(server_address, CORSRequestHandler)
    print(f"Serving at http://localhost:{PORT}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    httpd.server_close()
