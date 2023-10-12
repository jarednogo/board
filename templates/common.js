export {
    Coord,
    opposite,
    ObjectSet,
    Result,
}

class Coord {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

function opposite(color) {
    if (color == 1) {
        return 2;
    }
    return 1;
}

class ObjectSet extends Set{
    add(elem) {
        return super.add(typeof elem === 'object' ? JSON.stringify(elem) : elem);
    }
    has(elem) {
        return super.has(typeof elem === 'object' ? JSON.stringify(elem) : elem);
    }
}

class Result {
    constructor(ok, values) {
        this.ok = ok;
        this.values = values;
    }
}


