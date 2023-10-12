import { Node } from './tree.js';

class Expr {
    constructor(type, value) {
        this.type = type;
        this.value = value;
    }
}

class Branch {
    constructor() {
        this.nodes = [];
        this.branches = [];
    }
}

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
                return new Expr("error", "bad node (expected key)");
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
        let n = new Node(move, [], color, null, labels, triangles, fields);
        return new Expr("node", n);
    }

    parse_branch() {
        let branch = new Branch();
        while (true) {
            let c = this.read();
            if (c == "\0") {
                return new Expr("error", "unfinished branch, expected ')'");
            } else if (c == ";") {
                let node = this.parse_node();
                if (node.type == "error") {
                    return node;
                }
                branch.nodes.push(node);
            } else if (c == "(") {
                let new_branch = this.parse_branch();
                if (new_branch.type == "error") {
                    return new_branch;
                }
                branch.branches.push(new_branch);
            } else if (c == ")") {
                break;
            }
        }
        return new Expr("branch", branch);
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
PW[tony]PB[jared]
;B[pd]
(;W[qf]
;B[nc]
(;W[qc]
;B[qd]C[comment [some comment\\]])
(;W[qd]
;B[qc]
;W[rc]TR[qd]
;B[qe]
;W[rd]
;B[pe]))
(;W[qc]
;B[qd]
;W[pc]TR[qd][pd][qd]
;B[od]LB[pc:D][qc:B][pd:A][qd:C]))`

    let p = new Parser(data);
    console.log(p.parse());
}

test();



