from flask import Flask, render_template, make_response, redirect, request
import uuid
import os

app = Flask(__name__)

def sanitize(s):
    ok = ""
    for c in s:
        if (c >= '0' and c <= '9') or (c >= 'A' and c <= 'Z') or (c >= 'a' and c <= 'z'):

            ok += c
    return ok

@app.get("/<path>.js")
def any_js(path):
    resp = make_response(render_template(f"{path}.js"))
    resp.headers["Content-Type"] = "text/javascript"
    return resp

@app.get("/")
def index():
    return render_template("index.html")

@app.get("/<path:path>")
def board(path):
    return render_template("board.html")

@app.post("/new")
def new_board():
    print(request.form)
    board_id = request.form.get("board_id")
    board_id = sanitize(board_id)

    if not board_id.strip():
        board_id = uuid.uuid4().hex
    return redirect(f"/{board_id}")

local = os.getenv("BOARD_LOCAL")
cert_dir = os.getenv("BOARD_CERT_DIR")
if local == "false":
    context = (f"{cert_dir}/fullchain.pem", f"{cert_dir}/privkey.pem")
    app.run(host="0.0.0.0", port=8080, ssl_context=context)
else:
    app.run(port=8080)

