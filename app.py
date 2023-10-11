from flask import Flask, render_template, make_response
import uuid

app = Flask(__name__)

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

app.run(port=8000)
