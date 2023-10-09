export {
    Board,
    hello
}

function hello() {
    console.log("hello world");
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


class Coord {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

class Group {
    constructor(coords, rep, color, libs) {
        this.coords = coords;
        this.rep = rep;
        this.color = color;
        this.libs = libs;
    }
}

class Board {
    constructor(size) {
        this.size = size;
        this.points = [];
        var i,j;
        for (i=0; i<size; i++) {
            let row = [];
            for (j=0; j<size; j++) {
                row.push(0);
            }
            this.points.push(row);
        }
    }

    copy() {
        let b = new Board(this.size);
        var i,j;
        for (i=0; i<b.size; i++) {
            for (j=0; j<b.size; j++) {
                b.points[i][j] = this.points[i][j];
            }
        }
        return b;
    }

    set(start, color) {
        this.points[start.x][start.y] = color;
    }

    get(start) {
        return this.points[start.x][start.y];
    }

    place(i, j, color) {
        let dead = [];
        // check to see if move is illegal
        let start = new Coord(i, j);
        let results = this.legal(start, color);
        if (!results.ok) {
            return new Result(false, dead);
        }

        // put the stone on the board
        this.set(start, color);

        // remove dead groups (from the "legal" method)
        for (let coord of results.values) {
            this.set(coord, 0);
            dead.push(coord);
        }

        // recompute groups
        let gps = this.groups();

        // compute dead groups (0 libs)
        for (let gp of gps) {
            if (gp.libs.size == 0) {
                for (let coord of gp.coords) {
                    this.set(coord, 0);
                    dead.push(coord);
                }
            }
        }
        return new Result(true, dead);

    }

    legal(start, color) {
        // if there's already a stone there, it's illegal
        if (this.get(start) != 0) {
            return new Result(false, []);
        }
        this.set(start, color);
        // if it has >0 libs, it's legal
        let gp = this.find_group(start);
        if (gp.libs.size > 0) {
            return new Result(true, []);
        }
        // remove any groups of opposite color with 0 libs
        // important: only check neighboring area
        let dead_set = new ObjectSet();
        let killed_something = false;
        let nbs = this.neighbors(start);
        for (let nb of nbs) {
            if (this.get(nb) == 0) {
                continue;
            }
            let gp = this.find_group(nb);
            if ((gp.libs.size == 0) && (gp.color == opposite(color))) {
                for (let coord of gp.coords) {
                    this.set(coord, 0);
                    dead_set.add(coord);
                    killed_something = true;
                }
            }
        }
        if (!killed_something) {
            this.set(start, 0);
        }
        let dead = [];
        for (let d of dead_set) {
            dead.push(JSON.parse(d));
        }
        return new Result(killed_something, dead);
    }

    neighbors(start) {
        let nbs = [];
        var x,y;
        for (x=-1; x<=1; x++) {
            for (y=-1; y<=1; y++) {
                if ((x!=0 && y!=0) || (x==0 && y==0)) {
                    continue;
                }
                let new_x = start.x+x;
                let new_y = start.y+y;
                if (new_x < 0 || new_y < 0) {
                    continue;
                }
                if (new_x >= this.size || new_y >= this.size) {
                    continue;
                }
                nbs.push(new Coord(new_x, new_y));
            }
        }
        return nbs;
    }

    find_group(start) {
        let c = this.copy();
        let color = this.get(start);
        let stack = [start];
        c.set(start, 0);
        let group = [];
        let libs = new ObjectSet();
        if (color == 0) {
            return group;
        }
        let rep = start;
        var point;
        while (stack.length > 0) {
            point = stack.pop();
            group.push(point);
            if (point.x < rep.x) {
                rep = point;
            } else if ((point.x == rep.x) && (point.y < rep.y)) {
                rep = point;
            }
            let nbs = this.neighbors(point);
            var nb;
            for (nb of nbs) {
                if (c.get(nb) == color) {
                    stack.push(nb);
                }
                if (this.get(nb) == 0) {
                    libs.add([nb.x, nb.y]);
                }
                c.set(nb, 0);
            }
        }
        return new Group(group, rep, color, libs);
    }

    groups() {
        var i,j;
        let check = [];
        for (i=0; i<this.size; i++) {
            check.push([]);
            for(j=0; j<this.size; j++) {
                check[i].push(0);
            }
        }
        let groups = [];
        for (i=0; i<this.size; i++) {
            for(j=0; j<this.size; j++) {
                if (check[i][j] == 0 && this.points[i][j] != 0) {
                    let group = this.find_group(new Coord(i,j));
                    for (let c of group.coords) {
                        check[i][j] = 1;
                    }
                    groups.push(group);
                }
            }
        }
        return groups;
    }
}
