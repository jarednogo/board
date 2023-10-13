import { Board } from './board.js';

const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function get_bgcolor() {
}

function add_style() {
    let style = document.createElement("style");
    style.type = "text/css";
    style.innerHTML = `
    .wide-button {display: block; width: 100%;}
    `;
    document.getElementsByTagName("head")[0].appendChild(style);
}

function new_fa(cls, handler) {
    let button = document.createElement("button");
    button.setAttribute("class", "wide-button");
    button.onclick = handler;
    let obj = document.createElement("i");
    obj.setAttribute("class", cls);
    button.appendChild(obj);
    return button;
}

class BoardGraphics {
    constructor(shared, url) {
        this.shared = shared;
        if (shared) {
            this.socket = new WebSocket(url);
            this.socket.onmessage = function (orig) {
                function inner(event) {
                    return orig.onmessage(event);
                }
                return inner;
            }(this);
        }
        let review = document.getElementById("review");
        let size = review.getAttribute("size");
        this.bgcolor = "#f2cb63";
        this.width = parseInt(review.offsetWidth) * 9/10;
        this.size = size;
        this.side = this.width/(this.size-1);
        this.pad = this.side;
        this.canvases = new Map();
        this.color = 1;
        this.saved_color = 1;
        this.toggling = true;
        this.mark = "";
        this.letter = 0;
        this.board = new Board(size);
        this.new_canvas("board", 0);
        this.new_canvas("lines", 10);
        this.new_canvas("coords", 20);
        this.new_canvas("ghost", 50);
        // stones are on 900
        this.new_canvas("marks", 1000);
        this.new_canvas("ghost-marks", 1000);
        this.new_canvas("current", 950);
        this.buttons();
    }

    buttons() {
        let review = document.getElementById("review");
        let column = document.createElement("div");
        let row = document.createElement("div")
        let color_picker = document.createElement("input");
        color_picker.setAttribute("type", "color");
        // look, a closure
        color_picker.onchange = function(orig) {
            function inner() {
                orig.draw_board(this.value);
            }
            return inner;
        }(this)
        column.appendChild(color_picker);

        column.appendChild(new_fa("fa-solid fa-circle-half-stroke fa-rotate-90", function(orig) {function inner() {orig.set_toggle()}; return inner;}(this)));
        column.appendChild(new_fa("fa-solid fa-circle", function(orig) {function inner() {orig.set_black()}; return inner;}(this)));
        column.appendChild(new_fa("fa-regular fa-circle", function(orig) {function inner() {orig.set_white()}; return inner;}(this)));
        column.appendChild(new_fa("fa-solid fa-play fa-rotate-270", function(orig) {function inner() {orig.set_triangle()}; return inner;}(this)));
        column.appendChild(new_fa("fa-solid fa-a", function(orig) {function inner() {orig.set_letter()}; return inner;}(this)));
        column.appendChild(new_fa("fa-solid fa-angles-right", function(orig) {function inner() {orig.set_pass()}; return inner;}(this)));

        // upload button
        let inp = document.createElement("input");
        inp.id = "myfile";
        inp.setAttribute("style", "display:none;");
        inp.setAttribute("type", "file");
        inp.onclick = function(orig) {function inner() {orig.upload()}; return inner;}(this);
        let button = new_fa("fa-solid fa-upload", function() {document.getElementById("myfile").click()});
        column.appendChild(inp);
        column.appendChild(button);

        // download button
        column.appendChild(new_fa("fa-solid fa-download", function(orig) {function inner() {orig.download()}; return inner;}(this)));

        row.appendChild(new_fa("fa-solid fa-backward-fast"));
        row.appendChild(new_fa("fa-solid fa-caret-left", function(orig) {function inner() {orig.left()}; return inner;}(this)));
        row.appendChild(new_fa("fa-solid fa-caret-right", function(orig) {function inner() {orig.right()}; return inner;}(this)));
        row.appendChild(new_fa("fa-solid fa-forward-fast"));

        let style = "position: absolute; ";
        style += "left: " + (this.width + this.pad*2).toString() + "px; top: 0;";
        column.setAttribute("style", style);

        //style += ((this.width + this.pad*2)/2).toString() + "px; top: ";
        style = "position: absolute; bottom: -20px; left: 0; right: 0; margin: auto;";
        style += "display: flex;";
        row.setAttribute("style", style);

        review.appendChild(column);
        review.appendChild(row);
}

    new_canvas(id, z_index) {
        // derp
        if (this.canvases.has(id)) {
            return;
        }
        let review = document.getElementById("review");
        let canvas = document.createElement("canvas");
        canvas.setAttribute("id", id);
        canvas.setAttribute("width", this.width + this.pad*2);
        canvas.setAttribute("height", this.width + this.pad*2);

        let style = "position: absolute; ";
        style += "left: 0px; ";
        style += "top: 0px; z-index: ";
        style += z_index.toString()+";";

        canvas.setAttribute("style", style);
        review.appendChild(canvas);
        this.canvases.set(id, canvas);
    }

    draw_all() {
        this.draw_board();
        this.draw_lines();
        this.draw_coords();
        this.draw_stars();
    }

    draw_board(hex_color="") {
        if (hex_color == "") {
            hex_color = this.bgcolor;
        }
        let canvas = this.canvases.get("board");
        let ctx = canvas.getContext("2d");
        ctx.beginPath();
        ctx.fillStyle = hex_color;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        this.bgcolor = hex_color;
    }

    draw_lines() {
        var i;
        let canvas = this.canvases.get("lines");
        let ctx = canvas.getContext("2d");
        for (i=0; i<this.size; i++) {
            ctx.beginPath();
            ctx.moveTo(this.side*i + this.pad, this.pad);
            ctx.lineTo(this.side*i + this.pad, this.width + this.pad);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(this.pad, this.side*i + this.pad);
            ctx.lineTo(this.width + this.pad, this.side*i + this.pad);
            ctx.stroke();
        }
    }

    draw_coords() {
        var i;
        let canvas = this.canvases.get("coords");
        let ctx = canvas.getContext("2d");

        let font_size = this.width/36;
        ctx.font = font_size.toString() + "px Arial";
        ctx.fillStyle = "#000000";
        let letters = "ABCDEFGHJKLMNOPQRST";

        for (i=0; i<this.size; i++) {
            ctx.fillText(letters[i], this.side*i+this.pad*7/8, this.pad/2);
            ctx.fillText((this.size-i).toString(), this.pad/8, this.side*i+this.pad*9/8);
        }
    }

    draw_circle(x, y, r, hexColor, id, filled=true) {
        let ctx = this.canvases.get(id).getContext("2d");
        let real_x = x*this.side + this.pad;
        let real_y = y*this.side + this.pad;
        ctx.beginPath();
        if (filled) {
            ctx.strokeStyle = "#00000000";
        } else {
            ctx.lineWidth = 3;
            ctx.strokeStyle = hexColor;
        }
        ctx.arc(real_x, real_y, r, 0, 2*Math.PI);
        if (filled) {
            ctx.fillStyle = hexColor;
            ctx.fill();
        }
        ctx.stroke();
    }

    draw_current(x, y, color) {
        let hexcolor = "#FFFFFF";
        if (color == 2) {
            hexcolor = "#000000";
        }
        this.draw_circle(x, y, this.side/4, hexcolor, "current", false);

    }

    draw_triangle(x, y, hexColor, id) {
        if (x < 0 || x >= this.size || y < 0 || y >= this.size) {
            return;
        }
        let real_x = x*this.side + this.pad;
        let real_y = y*this.side + this.pad;
        let ctx = this.canvases.get(id).getContext("2d");
        let r = (this.side/3);
        let s = 2*r*Math.cos(Math.PI/6);
        let a = r/2;

        ctx.lineWidth = 3;
        ctx.strokeStyle = hexColor;
        ctx.beginPath();
        ctx.moveTo(real_x, real_y-r);
        ctx.lineTo(real_x+s/2, real_y+a);
        ctx.lineTo(real_x-s/2, real_y+a);
        ctx.closePath();
        ctx.stroke();
    }

    draw_ghost_triangle(x, y) {
        this.clear_canvas("ghost-marks");
        if (x < 0 || x >= this.size || y < 0 || y >= this.size) {
            return;
        }
        let hexcolor = "#000000";
        if (this.board.points[x][y] == 1) {
            hexcolor = "#FFFFFF";
        }
        this.draw_triangle(x, y, hexcolor, "ghost-marks");
    }

    draw_star(x, y) {
        let radius = this.side/12;
        this.draw_circle(x, y, radius, "#000000", "lines");
    }

    draw_stars() {
        let start_x = 3;
        if (this.size == 9) {
            start_x = 2;
        }
        let skip = Math.floor((this.size-2*start_x-1)/2);
        let xs = [start_x, start_x+skip, start_x+skip*2];
        var x, y;
        for (x of xs) {
            for (y of xs) {
                this.draw_star(x,y);
            }
        }
    }

    draw_stone(x, y, color) {
        let radius = this.side/2.1;
        let hexcolor = "#000000";
        if (color == 2) {
            hexcolor = "#FFFFFF";
        }
        // this could be more idiomatic and universal
        let id = x.toString() + "-" + y.toString();
        this.new_canvas(id, 900);
        this.draw_circle(x, y, radius, hexcolor, id);
        // check if there's a letter or triangle here too
        let t_id = "triangle-" + id;
        let letter_id = "letter-" + id;

        if (color == 1) {
            hexcolor = "#FFFFFF";
        } else {
            hexcolor = "#000000";
        }
        if (this.canvases.has(t_id)) {
            // redraw triangle in appropriate color
            this.draw_triangle(x, y, hexcolor, t_id);
        }
        if (this.canvases.has(letter_id)) {
            // redraw letter in appropriate color
            let c = this.canvases.get(letter_id);
            let letter = c.getAttribute("value");
            this.draw_letter(x, y, letter, hexcolor, letter_id);
        }
    }

    draw_ghost_stone(x, y, color) {
        this.clear_canvas("ghost");
        if (x < 0 || x >= this.size || y < 0 || y >= this.size) {
            return;
        }
        if (this.board.points[x][y] != 0) {
            return;
        }
        let radius = this.side/2.1;
        let hexcolor = "#00000077";
        if (color == 2) {
            hexcolor = "#FFFFFF77";
        }
        this.draw_circle(x, y, radius, hexcolor, "ghost");
    }

    draw_letter(x, y, letter, color, id) {
        let ctx = this.canvases.get(id).getContext("2d");
        let real_x = x*this.side + this.pad;
        let real_y = y*this.side + this.pad;

        let font_size = this.width/36;

        ctx.font = "bold " + font_size.toString() + "px Arial";
        ctx.fillStyle = color;
        ctx.lineWidth = 2;
        let x_offset = font_size/3;
        if (letter == "I") {
            x_offset = font_size/8;
        }
        let y_offset = font_size/3;
        ctx.fillText(letter, real_x-x_offset, real_y+y_offset);
    }

    draw_ghost_letter(x, y, color) {
        this.clear_canvas("ghost-marks");
        if (x < 0 || x >= this.size || y < 0 || y >= this.size) {
            return;
        }
        let hexcolor = "#000000";
        if (this.board.points[x][y] == 1) {
            hexcolor = "#FFFFFF";
        }
        let letter = letters[this.letter%26];
        this.draw_letter(x, y, letter, hexcolor, "ghost-marks");
    }


    draw_mark(x, y) {
        let hexcolor = "#000000";
        if (this.board.points[x][y] == 1) {
            hexcolor = "#FFFFFF";
        }

        if (this.mark == "triangle") {
            let id = "triangle-" + x.toString() + "-" + y.toString();
            if (this.canvases.has(id)) {
                this.canvases.get(id).remove();
                this.canvases.delete(id);
                return;
            }
            this.new_canvas(id, 1000);
            this.draw_triangle(x, y, hexcolor, id);
        } else if (this.mark == "letter") {
            let id = "letter-" + x.toString() + "-" + y.toString();
            if (this.canvases.has(id)) {
                this.canvases.get(id).remove();
                this.canvases.delete(id);
                let bg_id = "bg-" + x.toString() + "-" + y.toString();
                this.canvases.get(bg_id).remove();
                this.canvases.delete(bg_id);
                return;
            }
            this.new_canvas(id, 1000);
            let c = this.canvases.get(id);
            let letter = letters[this.letter%26];
            c.setAttribute("value", letter);
            let bg_id = "bg-" + x.toString() + "-" + y.toString();
            this.new_canvas(bg_id, 30);
            this.draw_circle(x, y, this.side/3, this.bgcolor, bg_id);
            this.draw_letter(x, y, letter, hexcolor, id);
            this.letter++;
        }
    }

    draw_ghost_mark(x, y) {
        if (this.mark == "triangle") {
            this.draw_ghost_triangle(x, y);
        } else if (this.mark == "letter") {
            this.draw_ghost_letter(x, y);
        }
    }

    clear_canvas(id) {
        let canvas = this.canvases.get(id);
        let ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    pos_to_coord(x, y) {
        let canvas = this.canvases.get("board");
        let rect = canvas.getBoundingClientRect();

        let rel_x = x - canvas.offsetLeft - this.pad - rect.left;
        let rel_y = y - canvas.offsetTop - this.pad - rect.top;
        let x_coord = rel_x / this.side;
        let y_coord = rel_y / this.side;
        return [Math.floor(x_coord+0.5), Math.floor(y_coord+0.5)];
    }

    toggle_color() {
        if (this.color == 1) {
            this.color = 2;
        } else {
            this.color = 1;
        }
    }

    set_black() {
        this.saved_color = this.color;
        this.color = 1;
        this.toggling = false;
        this.mark = "";
    }

    set_white() {
        this.saved_color = this.color;
        this.color = 2;
        this.toggling = false;
        this.mark = "";
    }

    set_toggle() {
        this.color = this.saved_color;
        this.toggling = true;
        this.mark = "";
    }

    set_pass() {
        if (this.toggling) {
            this.toggle_color();
            return;
        }
        if (this.saved_color == 1) {
            this.saved_color = 2;
            return;
        }
        this.saved_color = 1;
    }

    set_triangle() {
        this.mark = "triangle";
    }

    set_letter() {
        this.mark = "letter";
    }

    upload() {
        let inp = document.getElementById("myfile");
        inp.onchange = () => {
            const selectedFile = inp.files[0];
            const reader = new FileReader();
            reader.readAsText(selectedFile);

            reader.addEventListener(
                "load",
                () => {
                    console.log(reader.result);
                },
                false,
            );
        }
    }

    download() {
    }

    place(x, y, color) {
        // if out of bounds, just return
        if (x < 0 || x >= this.size || y < 0 || y >= this.size) {
            return;
        }

        if (this.mark != "") {
            this.draw_mark(x, y);
            return;
        }

        let result = this.board.place(x, y, this.color);
        if (!result.ok) {
            return;
        }
        for (let v of result.values) {
            // again, this could be more idiomatic
            let id = v.x.toString() + "-" + v.y.toString();
            this.clear_canvas(id);
        }
        this.clear_canvas("current");
        this.draw_stone(x, y, color);
        this.draw_current(x, y, color);
        if (this.toggling) {
            this.toggle_color();
        }
    }

    left() {
        let result = this.board.tree.left();
        let coord = result[0];
        if (coord == null) {
            return;
        }
        let captured = result[1];
        let color = result[2];
        let c_id = coord.x.toString() + "-" + coord.y.toString();

        // clear previous move
        this.clear_canvas(c_id);
        this.board.set(coord, 0);
        this.clear_canvas("current");

        // find current move
        let cur = this.board.tree.current;

        // draw current
        if (cur.value != null) {
            let v = cur.value;
            let c = cur.color;
            this.draw_current(v.x, v.y, c);
        }

        // get color
        let new_color = 2;
        if (color == 2) {
            new_color = 1;
        }

        // redraw captured stones
        for (let c of captured) {
            this.draw_stone(c.x, c.y, new_color);
            this.board.set(c, new_color);
        }

        if (this.toggling) {
            this.color = color;
        }
    }
    
    right() {
        let result = this.board.tree.right();
        let coord = result[0];
        if (coord == null) {
            return;
        }
        let captured = result[1];
        let color = result[2];
        let c_id = coord.x.toString() + "-" + coord.y.toString();
        this.draw_stone(coord.x, coord.y, color);
        this.board.set(coord, color);
        this.clear_canvas("current");
        this.draw_current(coord.x, coord.y, color);
        let new_color = 2;
        if (color == 2) {
            new_color = 1;
        }
        for (let c of captured) {
            c_id = c.x.toString() + "-" + c.y.toString();
            this.clear_canvas(c_id);
            this.board.set(c, 0);
        }

        if (this.toggling) {
            this.color = new_color;
        }
    }

    layer(payload) {
        let evt = payload["event"];
        if (evt == "mousemove") {
            let coords = payload["value"];
            if (this.mark != "") {
                this.draw_ghost_mark(coords[0], coords[1]);
            } else {
                this.draw_ghost_stone(coords[0], coords[1], this.color);
            }
            return;
        }

        if (this.shared) {
            //console.log("sending:", payload);
            this.socket.send(JSON.stringify(payload));
            // do stuff;
            return;
        }
        this.layer2(payload);
    }

    layer2(payload) {
        let evt = payload["event"];
        if (evt == "keydown") {
            if (payload["value"] == "ArrowLeft") {
                this.left();
            } else if (payload["value"] == "ArrowRight") {
                this.right();
            }
        } else if (evt == "click") {
            let coords = payload["value"];
            this.place(coords[0], coords[1], this.color);
        }
    }

    onmessage(event) {
        //console.log("receiving:", event.data);
        let payload = JSON.parse(event.data);
        this.layer2(payload);
    }

    keydown(event) {
        let payload = {"event": "keydown", "value": event.key};
        let keys = new Set();
        keys.add("ArrowLeft");
        keys.add("ArrowRight");
        if (keys.has(event.key)) {
            this.layer(payload);
        }
    }

    mousemove(event) {
        let coords = this.pos_to_coord(event.clientX, event.clientY);
        let payload = {"event": "mousemove", "value": coords};
        this.layer(payload);
    }

    click(event) {
        let coords = this.pos_to_coord(event.clientX, event.clientY);
        let payload = {"event": "click", "value": coords};
        this.layer(payload);
    }
}

window.onload = function(e) {
    add_style();
    let host = window.location.hostname;
    let path = window.location.pathname;
    let shared = false;
    let debug = true;
    let port = "9000";
    var bg;
    if (debug) {
        bg = new BoardGraphics(shared, "ws://" + host + ":" + port + path);
    } else {
        bg = new BoardGraphics(shared, "wss://" + host + ":" + port + path);
    }
    document.addEventListener("click", function (event) {bg.click(event)});
    document.addEventListener("mousemove", function (event) {bg.mousemove(event)});
    document.addEventListener("keydown", function (event) {bg.keydown(event)});
    bg.draw_all();
}

