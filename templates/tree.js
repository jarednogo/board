export {
    Node,
    Tree
}

class Node {
    constructor(value, captured, color, up, labels, triangles, fields) {
        this.value = value;
        this.captured = captured;
        this.color = color;
        this.down = [];
        this.up = up;
        this.labels = labels;
        this.triangles = triangles;
        this.fields = fields;
    }
}

class Tree {
    constructor() {
        this.root = new Node(null, [], null);
        this.current = this.root;
    }

    push(v, captured, color) {
        let n = new Node(v, captured, color, this.current);
        this.current.down.push(n);
        let index = this.current.down.length - 1;
        this.current = this.current.down[index];
    }

    left() {
        if (this.current.up == null) {
            return [null, []];
        }
        let result = [this.current.value, this.current.captured, this.current.color];
        this.current = this.current.up;
        return result;
    }

    right() {
        if (this.current.down.length == 0) {
            return [null, []];
        }
        let index = this.current.down.length - 1;
        this.current = this.current.down[index];
        return [this.current.value, this.current.captured, this.current.color];
    }
}
