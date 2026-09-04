from flask import Flask, request, render_template_string, redirect, make_response, jsonify
import sqlite3

app = Flask(__name__)

# Initialize in-memory SQLite demo database
def init_db():
    conn = sqlite3.connect(":memory:", check_same_thread=False)
    c = conn.cursor()
    c.execute("CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT, role TEXT, secret_data TEXT)")
    c.execute("INSERT INTO users VALUES (1, 'admin', 'administrator', 'FLAG{cyvera_admin_secret_token_2025}')")
    c.execute("INSERT INTO users VALUES (2, 'john_doe', 'user', 'john.doe@company.internal')")
    c.execute("INSERT INTO users VALUES (3, 'alice', 'developer', 'alice.dev@company.internal')")
    conn.commit()
    return conn

db_conn = init_db()

INDEX_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <title>Insecure Demo Portal - Authorized Target</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 40px; background: #0f172a; color: #f8fafc; }
        .card { background: #1e293b; padding: 25px; border-radius: 8px; max-width: 650px; margin-bottom: 20px; border: 1px solid #334155; }
        input[type=text] { width: 80%; padding: 8px 12px; background: #0f172a; border: 1px solid #475569; color: white; border-radius: 4px; }
        button { padding: 8px 16px; background: #0284c7; color: white; border: none; border-radius: 4px; cursor: pointer; }
        .banner { background: #dc2626; color: white; padding: 10px; border-radius: 4px; margin-bottom: 20px; font-weight: bold; }
    </style>
</head>
<body>
    <div class="banner">⚠️ WARNING: Deliberately Vulnerable Application for Authorized Security Testing Only</div>
    
    <div class="card">
        <h2>Reflected XSS Test Endpoint</h2>
        <form action="/search" method="GET">
            <input type="text" name="q" placeholder="Enter search query..." value="<script>alert('Cyvera-XSS-Test')</script>" />
            <button type="submit">Search</button>
        </form>
    </div>

    <div class="card">
        <h2>SQL Injection Test Endpoint</h2>
        <form action="/api/user" method="GET">
            <input type="text" name="id" value="1 OR 1=1" />
            <button type="submit">Query User</button>
        </form>
    </div>

    <div class="card">
        <h2>Open Redirect Endpoint</h2>
        <p><a href="/redirect?url=https://example.com" style="color: #38bdf8;">Test Open Redirect to example.com</a></p>
    </div>
</body>
</html>
"""

@app.route("/")
def index():
    resp = make_response(render_template_string(INDEX_TEMPLATE))
    # Insecure Cookie missing HttpOnly & Secure flags
    resp.set_cookie("session_token", "DEMO_SESSION_COOKIE_SECRET_12345", samesite="None", secure=False)
    # Exposing server version
    resp.headers["Server"] = "Apache/2.4.41 (Ubuntu) mod_wsgi/4.6.8 Python/3.8"
    # Intentionally omitted: Content-Security-Policy, X-Frame-Options, X-Content-Type-Options
    return resp

@app.route("/search")
def search():
    # Intentionally vulnerable to Reflected XSS (raw string formatting without escaping)
    query = request.args.get("q", "")
    template = f"""
    <!DOCTYPE html>
    <html>
    <head><title>Search Results</title></head>
    <body style="background:#0f172a; color:white; font-family:sans-serif; margin:40px;">
        <h2>Search Results for: {query}</h2>
        <p>No records matched your search query.</p>
        <p><a href="/" style="color:#38bdf8;">← Back to Portal</a></p>
    </body>
    </html>
    """
    resp = make_response(template)
    resp.headers["Server"] = "Apache/2.4.41 (Ubuntu)"
    return resp

@app.route("/api/user")
def get_user():
    # Intentionally vulnerable to SQL Injection
    user_id = request.args.get("id", "1")
    cursor = db_conn.cursor()
    query = f"SELECT id, username, role FROM users WHERE id = {user_id}"
    try:
        cursor.execute(query)
        rows = cursor.fetchall()
        users = [{"id": r[0], "username": r[1], "role": r[2]} for r in rows]
        return jsonify({"query": query, "results": users})
    except Exception as e:
        return jsonify({"error": str(e), "executed_query": query}), 500

@app.route("/redirect")
def open_redirect():
    target = request.args.get("url", "/")
    return redirect(target)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
