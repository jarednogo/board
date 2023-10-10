export {
    Node,
    Tree
}

class Node {
    constructor(value, captured, color, up) {
        this.value = value;
        this.captured = captured;
        this.color = color;
        this.down = [];
        this.up = up;
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
        this.current = this.current.down[0];
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
        this.current = this.current.down[0];
        return [this.current.value, this.current.captured, this.current.color];
    }
}
