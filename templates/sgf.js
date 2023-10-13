import { Node } from './tree.js';
import { letters2coord } from './common.js';

class Expr {
    constructor(type, value) {
        this.type = type;
        this.value = value;
    }
}

let x = 0;

function iswhitespace(c) {
    return (c == "\n" || c == " " || c == "\t" || c == "\r");
}

class Parser {
    constructor(text) {
        this.text = text;
        this.index = 0;
    }

    parse() {
        this.skip_whitespace();
        let c = this.read();
        if (c == "(") {
            return this.parse_branch();
        } else {
            return new Expr("error", "unexpected " + c);
        }
    }

    skip_whitespace() {
        while (true) {
            if (iswhitespace(this.peek(0))) {
                this.read();
            } else {
                break;
            }
        }
        return new Expr("whitespace", "");
    }

    parse_key() {
        let s = "";
        while (true) {
            let c = this.peek(0);
            if (c == "\0") {
                return new Expr("error", "bad key");
            } else if (c < "A" || c > "Z") {
                break;
            }
            s += this.read();
        }
        return new Expr("key", s);
    }

    parse_field() {
        let s = "";
        while (true) {
            let t = this.read();
            if (t == "\0") {
                return new Expr("error", "bad field");
            } else if (t == "]") {
                break;
            } else if (t == "\\" && this.peek(0) == "]") {
                t = this.read();
            }
            s += t;
        }
        return new Expr("field", s);
    }

    parse_nodes() {
        let n = this.parse_node();
        if (n.type == "error") {
            return n;
        }
        let root = n.value;
        let cur = root;
        while (true) {
            let c = this.peek(0);
            if (c == ";") {
                this.read();
                let m = this.parse_node();
                    if (m.type == "error") {
                        return m;
                    }
                    let next = m.value;
                    cur.down.push(next);
                    cur = next;
            } else {
                break;
            }
        }
        return new Expr("nodes", [root, cur]);
    }

    parse_node() {
        var result;
        let fields = new Map();
        let labels = new Map();
        let triangles = [];
        let color = 0;
        let move = "";
        while (true) {
            this.skip_whitespace();
            let c = this.peek(0);
            if (c == "(" || c == ";" || c == ")") {
                break;
            }
            if (c < "A" || c > "Z") {
                return new Expr("error", "bad node (expected key)" + c);
            }
            result = this.parse_key();
            if (result.type == "error") {
                return result;
            }
            let key = result.value;

            let multifield = [];
            this.skip_whitespace();
            if (this.read() != "[") {
                return new Expr("error", "bad node (expected field) " + this.read());
            }
            result = this.parse_field();
            if (result.type == "error") {
                return result;
            }
            multifield.push(result.value);

            while (true) {
                this.skip_whitespace();
                if (this.peek(0) == "[") {
                    this.read();
                    result = this.parse_field();
                    if (result.type == "error") {
                        return result;
                    }
                    multifield.push(result.value);
                } else {
                    break;
                }
            }

            this.skip_whitespace();
            switch (key) {
                case "TR":
                    for (let f of multifield) {
                        triangles.push(f);
                    }
                    break;
                case "LB":
                    for (let f of multifield) {
                        let spl = f.split(":");
                        if (spl.length != 2) {
                            console.log("label error: " + f);
                        }
                        labels.set(spl[0], spl[1]);
                    }
                    break;
                case "B":
                    color = 1;
                    move = multifield[0];
                    break;

                case "W":
                    color = 2;
                    move = multifield[0];
                    break;
                default:
                    fields.set(key, multifield);
            }
        }
        let v = letters2coord(move);
        let n = new Node(v, [], color, null, labels, triangles, fields);
        return new Expr("node", n);
    }

    parse_branch() {
        let root = null;
        let current = null;
        while (true) {
            let c = this.read();
            if (c == "\0") {
                return new Expr("error", "unfinished branch, expected ')'");
            } else if (c == ";") {
                let result = this.parse_nodes();
                if (result.type == "error") {
                    return result;
                }
                let node = result.value[0];
                let cur = result.value[1];
                if (root == null) {
                    root = node;
                    current = cur;
                } else {
                    current.down.push(node);
                    current = cur;
                }
            } else if (c == "(") {
                let result = this.parse_branch();
                if (result.type == "error") {
                    return result;
                }
                let new_branch = result.value;
                if (root == null) {
                    root = new_branch;
                    current = new_branch;
                } else {
                    current.down.push(new_branch);
                }
            } else if (c == ")") {
                break;
            }
        }
        return new Expr("branch", root);
    }

    read() {
        if (this.index >= this.text.length) {
            return "\0";
        }
        let result = this.text[this.index];
        this.index++;
        return result;
    }

    unread() {
        if (this.index == 0) {
            return;
        }
        this.index--;
    }

    peek(n) {
        if (this.index+n >= this.text.length) {
            return "\0";
        }
        return this.text[this.index+n];
    }


}

function test() {
    let data = `(;GM[1]FF[4]CA[UTF-8]AP[CGoban:3]ST[2]
RU[Japanese]SZ[19]KM[6.50]
PW[ tony ]PB[jared ]
(;B[pd]
(;W[qf]
;B[nc]
(;W[qc]
;B[qd]C[comment [some comment\\]])
(;W[qd]
;B[qc]
;W[rc]TR[qd]
;B[qe]
;
;W[rd]
;B[pe]))
(;W[qc]
;B[qd]
;W[pc]TR[qc][pd][qd]
;B[od]LB[pc:D][qc:B][pd:A][qd:C])
(;W[oc]
;B[pc]
;W[mc]))
(;B[qg]))`

    let p = new Parser(data);
    let result = p.parse();
    if (result.type == "error") {
        console.log(result);
        return;
    }
    console.log(result.value);
}

test();



