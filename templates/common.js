export {
    Coord,
    opposite,
    ObjectSet,
    Result,
    letters2coord,
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

function letters2coord(s) {
    if (s.length != 2) {
        return null;
    }
    let a = s[0].toLowerCase();
    let b = s[1].toLowerCase();
    let x = a.charCodeAt(0) - 97;
    let y = b.charCodeAt(0) - 97;
    return new Coord(x,y);
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


