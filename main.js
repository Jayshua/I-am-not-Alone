
   let canvas = document.getElementById("canvas");
   let ctx = canvas.getContext("2d");


// So here's my reasoning: "this" takes up four characters. That's four characters that can't be removed. Ever.
// If, on the other hand, all input attributes are taken as arguments, "this" can be reduced to a single-letter
// variable. We give up inheritance for that, but in this case it's not a big deal. I don't know whether
// this will actually improve the final file size, but I decided to try it out and see what happens.

// UPDATE: Turned out the symmetry gained by this type of thing is really beautiful from a mathematical perspective.
// Also, it's really nice not to have to worry about rebinding "this" when passing methods around.


const ARENA_WIDTH = 800;
const ARENA_HEIGHT = 800;
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 800;
const VIEWPORT_WIDTH = 150;
const VIEWPORT_HEIGHT = 150;

// TAU makes more sense anyway.
const TAU = Math.PI * 2;



// Yes, yes. I know. "Don't change the prototype!" Blah, blah, blah.
// Well, I control this entire codebase, so I'll avoid the problems.
Array.prototype.flatMap = function(lambda) {
  return Array.prototype.concat.apply([], this.map(lambda));
};

// ForEach doesn't return the original array, which means it can't be used in
// map/reduce/etc. chains. This function is forEach, but it returns the original
// array, allowing it to be chained.
Array.prototype.forAll = function(lambda) {
  Array.prototype.forEach.apply(this, arguments);
  return this;
};




let random = (min, max) => Math.random() * (max - min) + min;













// Represents a, *wait for it*, Point!
let Point = (x, y) => ({x, y});
Point.add = (left, right) => Point(left.x + right.x, left.y + right.y);
Point.sub = (left, right) => Point(left.x - right.x, left.y - right.y);
Point.mul_scalar = (point, scalar) => Point(point.x * scalar, point.y * scalar);
Point.div_scalar = (point, scalar) => Point(point.x / scalar, point.y / scalar);
Point.cross = (left, right) => left.x * right.y - right.x * left.y;
Point.equals = (left, right) => left.x == right.x && left.y == right.y;
Point.UP = Point(0, -1);
Point.DOWN = Point(0, 1);
Point.LEFT = Point(-1, 0);
Point.RIGHT = Point(1, 0);










// Represents a rectangle
let Rectangle = (location, width, height) => ({
   location,
   width,
   height,
   topLeft: location,
   topRight: Point(location.x + width, location.y),
   bottomLeft: Point(location.x, location.y + height),
   bottomRight: Point(location.x + width, location.y + height),

   top: location.y,
   bottom: location.y + height,
   left: location.x,
   right: location.x + width
});

Rectangle.render = (rectangle, ctx) => {
   ctx.fillRect(rectangle.location.x, rectangle.location.y, rectangle.width, rectangle.height);
};

Rectangle.collision = (a, b) =>
   a.left < b.right
   && a.right > b.left
   && a.top < b.bottom
   && a.bottom > b.top;

Rectangle.inside = (rect, point) =>
   point.x > rect.left
   && point.x < rect.right
   && point.y > rect.top
   && point.y < rect.bottom;

Rectangle.grow = (rect, amount) =>
   Rectangle(Point(rect.location.x - amount / 2, rect.location.y - amount / 2), rect.width + amount, rect.height + amount);







// Represents a line segment (with a beginning and end)
// Offset is the end-point relative to the beginning point.
let Segment = (begin, end) => ({begin, end, offset: Point.sub(end, begin)});

Segment.intersection = (left, right) => {
   // offsetCross == 0 when the two segments are parallel
   // Technically, when they are also colinear there is still the possibility
   // of them intersecting at a line segment, but that is unlikely to occur in
   // practice and treating such segments as not intersecting is fine for
   // the lighting calculations here.
   let offsetCross = Point.cross(left.offset, right.offset);
   if (offsetCross == 0) return false;
   
   let beginDifference = Point.sub(right.begin, left.begin);
   let leftInterval = Point.cross(beginDifference, right.offset) / offsetCross;
   let rightInterval = Point.cross(beginDifference, left.offset) / offsetCross;
   
   // The two segments intersect when offsetCross != 0 (already checked above) and
   // when thisInterval and otherInterval are both between 0 and 1.
   // Otherwise the segments do not intersect.
   if (
     0 <= rightInterval
     && rightInterval <= 1
     && 0 <= leftInterval
     && leftInterval <= 1
   ) {
     return {
       distance: leftInterval,
       point: Point.add(left.begin, Point.mul_scalar(left.offset, leftInterval))
     };
   } else {
     return false;
   }
};

Segment.intersectsRect = (segment, rect) =>
   Rectangle.inside(rect, segment.begin)
   || Rectangle.inside(rect, segment.end)
   || (segment.begin.x < rect.left && segment.end.x > rect.right)
   || (segment.begin.y < rect.top  && segment.end.y > rect.bottom);

Segment.draw = segment => {
   ctx.beginPath();
   ctx.lineWidth = 0.5;
   ctx.moveTo(segment.begin.x, segment.begin.y);
   ctx.lineTo(segment.end.x, segment.end.y);
   ctx.strokeStyle = "blue";
   ctx.stroke();
};
















let Bullet = (location, velocity) => ({location, velocity, used: false});

Bullet.update = (bullet, game, controls) => ({
   location: Point.add(bullet.location, bullet.velocity),
   velocity: bullet.velocity,
   used: bullet.used
});

Bullet.isAlive = (bullet, game) =>
   bullet.used === false; //&& !Maze.collidesWithWall(game.maze, bullet.location);

Bullet.render = (bullet, game, ctx) => {
   ctx.fillStyle = "green";
   ctx.fillRect(bullet.location.x, bullet.location.y, 5.5, 5.5);
};











let Hero = location => ({location});

Hero.update = (hero, game, controls) => {
   let direction = Point(0, 0);
   if (controls.up)    direction = Point.add(direction, Point.UP);
   if (controls.left)  direction = Point.add(direction, Point.LEFT);
   if (controls.right) direction = Point.add(direction, Point.RIGHT);
   if (controls.down)  direction = Point.add(direction, Point.DOWN);

   return Hero(Point.add(hero.location, Point.mul_scalar(direction, 1)));
};

Hero.render = (hero, game, ctx) => {
   ctx.fillStyle = "red";
   ctx.fillRect(hero.location.x, hero.location.y, 2, 2);
};
















/*
The Maze is represented in three distinct ways, each for a different purpose.

The most obvious way is as an array of cells, where each cell contains whether their
is a wall present or not. This is the most convenient representation for most maze
generation algorithms, and is also used for collision detection.

The second representation is as an array of vertexes. Each grid cell has four corners,
and shares each vertex on those corners with it's neighbor. Where x and y indicate a cell
in the previous representation, x and y represent a vertex in this representation. Therefore
x and y span one additional digit, since there is one extra vertex in each direction than
the number of cells. This representation is used by the lighting algorithm to determine
where rays must be cast.

The third and final representation is as an array of edges. Edges are created with points
from the second representation, and this representation has no coordinate space. It's just
and array of edges. This representation is also used by the lighting algorithm, to determine
whether the cast rays intersect any walls.

The maze generator creates the first representation, which is then used to generate the edges
and the edges are then used to generate the points.

Some pictures:

The first grid representation:
    0   1   2   3
   --- --- --- ---
0 |   |   |   |   |
   --- --- --- ---
1 |   |   |   |   |
   --- --- --- ---
2 |   |   |   |   |
   --- --- --- ---


The second, vertex representation:
  0   1   2   3   4
0 o---o---o---o---o
  |   |   |   |   |
1 o---o---o---o---o
  |   |   |   |   |
2 o---o---o---o---o
  |   |   |   |   |
3 o---o---o---o---o


The third, edge representation:

 o--- ---- ---o
 |           |
     o--- ---o
 |
 o--- ---o

(As an array of Segments: [Segment, Segment, Segment, Segment, Segment])

*/


let Maze = () => {
   let maze = {};
   maze.width = 51;
   maze.height = 51;

   // Create the grid
   maze.grid = [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,1,0,1,1,1,0,1,0,1,1,1,0,1,0,1,0,1,1,1,1,1,1,1,0,1,0,1,0,1,0,1,1,1,1,1,1,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,1,0,0,0,1,0,1,0,0,0,1,0,0,0,1,0,0,0,0,0,1,0,1,0,0,0,1,0,1,0,1,0,0,0,0,0,1,0,0,0,1,0,1,0,1,0,0,0,1,0,1,1,1,1,0,1,0,1,1,1,0,1,1,1,1,1,1,1,0,1,0,1,0,1,1,1,1,1,0,1,0,1,0,1,1,1,0,1,0,1,1,1,0,1,0,1,1,1,1,1,0,1,1,0,1,0,1,0,1,0,0,0,1,0,1,0,0,0,0,0,1,0,0,0,1,0,0,0,1,0,1,0,1,0,0,0,1,0,1,0,1,0,0,0,0,0,0,0,1,0,0,0,1,1,0,1,0,1,0,1,0,1,1,1,0,1,0,1,1,1,1,1,1,1,1,1,0,1,0,1,0,1,0,1,1,1,0,1,0,1,1,1,0,1,1,1,1,1,1,1,0,1,1,1,1,0,0,0,1,0,0,0,1,0,1,0,0,0,0,0,0,0,1,0,0,0,1,0,1,0,0,0,1,0,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,0,1,0,1,1,1,1,1,1,1,0,1,0,1,0,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,0,1,0,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,1,0,1,0,1,0,1,0,1,0,0,0,0,0,1,0,0,0,1,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,1,1,0,1,1,1,1,1,1,1,0,1,0,1,1,1,0,1,0,1,0,1,0,1,0,1,1,1,1,1,0,1,0,1,0,1,1,1,1,1,0,1,1,1,1,1,1,1,0,1,0,1,1,0,0,0,0,0,0,0,1,0,1,0,0,0,1,0,1,0,1,0,1,0,0,0,1,0,0,0,1,0,1,0,1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,1,0,1,1,1,1,1,1,1,1,0,1,0,1,1,1,0,1,0,1,0,1,0,1,1,1,1,1,0,1,0,1,0,1,0,1,1,1,1,1,0,1,1,1,1,1,0,1,0,1,1,1,1,1,1,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,1,0,0,0,1,0,1,0,1,0,0,0,1,0,1,0,1,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,0,1,0,1,0,1,1,1,1,1,0,1,0,1,0,1,1,1,0,1,1,1,1,1,1,1,1,1,0,1,1,0,0,0,1,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,1,0,0,0,1,0,0,0,1,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,0,1,1,0,1,0,1,0,1,0,1,1,1,1,1,0,1,1,1,1,1,1,1,0,1,1,1,0,1,0,1,0,1,0,1,1,1,1,1,0,1,1,1,0,1,0,1,0,1,0,1,1,1,1,0,1,0,1,0,1,0,1,0,0,0,0,0,0,0,1,0,0,0,1,0,1,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,1,0,1,0,1,0,1,1,1,0,1,1,1,0,1,0,1,0,1,0,1,0,1,0,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,0,1,1,1,0,1,1,1,1,1,1,1,1,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,1,0,1,0,1,0,1,0,0,0,1,0,0,0,0,0,0,0,1,0,1,0,0,0,1,0,0,0,1,0,0,0,0,0,1,1,0,1,1,1,0,1,0,1,1,1,1,1,1,1,0,1,0,1,0,1,0,1,1,1,0,1,0,1,1,1,1,1,0,1,0,1,0,1,1,1,0,1,1,1,1,1,1,1,0,1,1,0,1,0,0,0,1,0,0,0,0,0,1,0,0,0,1,0,1,0,1,0,0,0,1,0,1,0,1,0,0,0,0,0,1,0,1,0,1,0,1,0,1,0,0,0,1,0,1,0,1,1,0,1,0,1,1,1,1,1,1,1,0,1,0,1,1,1,0,1,0,1,1,1,0,1,0,1,0,1,1,1,1,1,1,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,1,0,1,0,0,0,1,0,0,0,1,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,1,0,0,0,1,0,1,1,0,1,1,1,1,1,0,1,0,1,0,1,1,1,1,1,1,1,1,1,1,1,0,1,0,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,0,1,0,1,1,0,1,0,0,0,1,0,1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,1,0,1,1,0,1,0,1,0,1,1,1,1,1,1,1,0,1,0,1,1,1,0,1,0,1,1,1,0,1,0,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,0,0,0,1,0,0,0,1,0,1,0,0,0,1,0,1,0,1,0,0,0,1,0,1,0,1,0,1,0,0,0,0,0,0,0,0,0,1,0,1,0,0,0,1,0,1,0,0,0,1,1,1,1,1,1,0,1,0,1,0,1,0,1,1,1,0,1,0,1,1,1,1,1,0,1,0,1,0,1,0,1,1,1,1,1,1,1,0,1,0,1,1,1,1,1,0,1,0,1,1,1,1,0,0,0,1,0,1,0,1,0,0,0,1,0,0,0,1,0,1,0,1,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,1,0,1,1,1,1,0,1,0,1,1,1,0,1,0,1,0,1,1,1,0,1,0,1,0,1,1,1,1,1,0,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,0,1,1,0,0,0,1,0,0,0,1,0,1,0,1,0,0,0,0,0,1,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1,1,0,1,1,1,1,1,0,1,0,1,1,1,1,1,1,1,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,1,0,1,1,1,1,1,0,1,0,1,1,1,1,1,0,1,1,1,1,0,0,0,0,0,1,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,1,0,0,0,1,0,0,0,1,0,1,0,0,0,1,0,1,0,1,0,1,0,0,0,1,0,0,0,1,1,0,1,0,1,0,1,0,1,1,1,0,1,0,1,0,1,1,1,0,1,0,1,1,1,1,1,0,1,1,1,0,1,1,1,0,1,0,1,0,1,0,1,0,1,0,1,1,1,0,1,1,0,1,0,1,0,0,0,0,0,0,0,1,0,1,0,0,0,1,0,1,0,0,0,1,0,1,0,1,0,0,0,0,0,1,0,1,0,1,0,1,0,0,0,1,0,1,0,0,0,1,1,0,1,1,1,1,1,0,1,1,1,1,1,0,1,1,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,1,1,1,1,0,1,0,1,1,1,1,0,1,0,0,0,0,0,1,0,0,0,1,0,1,0,1,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,1,0,1,0,0,0,1,0,0,0,0,0,1,0,1,0,1,0,1,1,0,1,0,1,1,1,1,1,0,1,1,1,0,1,0,1,0,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,0,1,0,1,0,1,0,1,1,0,1,0,1,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,0,1,1,1,1,0,1,0,1,0,1,1,1,1,1,0,1,0,1,1,1,0,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,0,1,0,1,1,1,1,1,0,1,1,1,0,1,1,1,1,0,0,0,1,0,1,0,0,0,1,0,1,0,1,0,0,0,1,0,0,0,1,0,1,0,0,0,1,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,1,0,0,0,1,0,1,1,0,1,1,1,0,1,1,1,0,1,0,1,0,1,1,1,0,1,1,1,0,1,0,1,0,1,1,1,1,1,1,1,0,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,0,1,1,0,0,0,1,0,0,0,1,0,1,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,1,1,1,1,0,1,1,1,1,1,0,1,0,1,1,1,0,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,0,1,0,1,1,1,1,1,0,1,0,1,1,1,1,1,0,1,0,1,1,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,1,0,1,0,1,1,0,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,0,1,0,1,1,1,1,1,1,1,0,1,0,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,0,1,0,1,1,0,1,0,0,0,1,0,0,0,1,0,0,0,0,0,1,0,1,0,1,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,1,1,0,1,0,1,1,1,1,1,0,1,1,1,1,1,0,1,0,1,0,1,0,1,0,1,0,1,1,1,0,1,1,1,1,1,1,1,0,1,0,1,0,1,0,1,0,1,1,1,0,1,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1];

   // Mark the horizontal and vertical edges
   let horizontalEdges = Array((maze.height + 1) * maze.width).fill(false);
   let verticalEdges = Array((maze.width + 1) * maze.height).fill(false);
   let horizontalIndex = (x, y) => x + y * maze.width;
   let verticalIndex = (x, y) => y + x * maze.height;
   Maze.forEachCell(maze, (cell, x, y) => {
      horizontalEdges[horizontalIndex(x, y)    ] = Maze.cellAbove(maze, x, y) !== cell;
      horizontalEdges[horizontalIndex(x, y + 1)] = Maze.cellBelow(maze, x, y) !== cell;
      verticalEdges  [verticalIndex  (x, y)    ] = Maze.cellLeft (maze, x, y) !== cell;
      verticalEdges  [verticalIndex  (x + 1, y)] = Maze.cellRight(maze, x, y) !== cell;
   });


   // Create the line segments
   maze.edges = [];

   // Horizontal Segments
   for (let y = 0; y < maze.height + 1; y++) {
      let currentPoint = horizontalEdges[horizontalIndex(0, y)] ? {x: 0, y} : null;

      for (let x = 0; x < maze.width - 1; x++) {
         if (horizontalEdges[horizontalIndex(x, y)] !== horizontalEdges[horizontalIndex(x + 1, y)]) {
            if (currentPoint === null) {
               currentPoint = {x: x + 1, y};
            } else {
               maze.edges.push({begin: currentPoint, end: {x: x + 1, y}});
               currentPoint = null;
            }
         }
      }

      if (currentPoint !== null) {
         maze.edges.push({begin: currentPoint, end: {x: maze.width, y}});
      }
   }

   // Vertical Segments
   for (let x = 0; x < maze.width + 1; x++) {
      let currentPoint = verticalEdges[verticalIndex(x, 0)] ? {x, y: 0} : null;

      for (let y = 0; y < maze.height - 1; y++) {
         if (verticalEdges[verticalIndex(x, y)] !== verticalEdges[verticalIndex(x, y + 1)]) {
            if (currentPoint === null) {
               currentPoint = {x, y: y + 1};
            } else {
               maze.edges.push({begin: currentPoint, end: {x, y: y + 1}});
               currentPoint = null;
            }
         }
      }

      if (currentPoint !== null) {
         maze.edges.push({begin: currentPoint, end: {x, y: maze.height}});
      }
   }


   // Vertexes
   let vertexesWithDuplicates = maze.edges.reduce((vertexes, edge) => vertexes.concat([edge.begin, edge.end]), []);
   maze.vertexes = [];
   outer:
   for (let i = 0; i < vertexesWithDuplicates.length; i++) {
      for (let j = i + 1; j < vertexesWithDuplicates.length; j++) {
         if (Point.equals(vertexesWithDuplicates[i], vertexesWithDuplicates[j]))
            continue outer;
      }
      maze.vertexes.push(vertexesWithDuplicates[i]);
   }


   // Transform the edges and vertexes from grid coordinates into arena coordinates
   let cellWidth = ARENA_WIDTH / maze.width;
   let cellHeight = ARENA_HEIGHT / maze.height;
   maze.vertexes = maze.vertexes.map(vertex => Point(vertex.x * cellWidth, vertex.y * cellHeight));
   maze.edges = maze.edges.map(edge => Segment(Point(edge.begin.x * cellWidth, edge.begin.y * cellHeight), Point(edge.end.x * cellWidth, edge.end.y * cellHeight)));
   maze.cellWidth = cellWidth;
   maze.cellHeight = cellHeight;
   return maze;
};

Maze.forEachCell = (maze, lambda) => {
   for (let y = 0; y < maze.height; y++) {
      for (let x = 0; x < maze.width; x++) {
         lambda(maze.grid[y * maze.width + x], x, y);
      }
   }
};


Maze.cellAtPoint = (maze, point) =>
   Maze.cellAtGrid(
      maze,
      Math.floor((point.x / ARENA_WIDTH) * maze.gridWidth),
      Math.floor((point.y / ARENA_HEIGHT) * maze.gridHeight)
   );

Maze.cellAtGrid = (maze, x, y) =>
   (x < 0 || x >= maze.width || y < 0 || y >= maze.height)
   ? 0
   : maze.grid[x + y * maze.width];
Maze.cellAbove = (maze, x, y) => Maze.cellAtGrid(maze, x, y - 1);
Maze.cellBelow = (maze, x, y) => Maze.cellAtGrid(maze, x, y + 1);
Maze.cellLeft  = (maze, x, y) => Maze.cellAtGrid(maze, x - 1, y);
Maze.cellRight = (maze, x, y) => Maze.cellAtGrid(maze, x + 1, y);


Maze.collidesWithWall = (maze, location) =>
   this.cellAtLocation(location) == 2;













let generateShadow = (shape, edges, light) => shape
  // atan2 is always relative to the origin. Move everything such that the light is at the center
  .map(point => Point.sub(point, light))
  // Compute the angle of the shape's point relative to the light
  .map(point => Math.atan2(point.y, point.x))
  // Sort the angles so that drawing the final shadow can be done simply by connecting points
  .sort((a, b) => a - b)
  // Convert each angle into two angles: one counter-clockwise, and one clockwise because otherwise
  // collisions will be decided when the ray collides directly with the tip of the edge it's testing against
  .flatMap(angle => [angle - 0.0001, angle + 0.0001])
  // Convert each angle back into a point.
  .map(angle => Point(Math.cos(angle) * 200, Math.sin(angle) * 200))
  // Undo the translation to the origin back in step one
  .map(point => Point.add(light, point))
  // Convert each point into a line segment starting at the light
  .map(point => Segment(light, point))
  // Draw the line segments for debugging purposes
  // .forAll(Segment.draw)
  // Find the closest intersecting point out of all of the edges in the scene
  .map(ray => edges
      // Get the ray's intersection point with each edge in the scene
      .map(edge => Segment.intersection(ray, edge))
      // Filter out the edges that didn't actually intersect
      .filter(maybeIntersection => maybeIntersection !== false)
      // Out of the remaining edges that did intersect, find the closest one
      .reduce((closestIntersection, intersection) => {
        if (closestIntersection === false) return intersection;
        if (closestIntersection.distance > intersection.distance) return intersection;
        return closestIntersection;
      }, false))
  // Filter out the rays that didn't intersect with any edges
  .filter(intersection => intersection !== false)
  // Map each intersection object (which includes its distance) into its raw intersection location
  .map(intersection => intersection.point);



























let Game = () => ({tick: 0, maze: Maze(), hero: Hero(Point(10, 10)), bullets: []});

Game.update = (game, controls) => {
   return {
      maze: game.maze,
      tick: game.tick + 1,
      hero: Hero.update(game.hero, game, controls),
      bullets: game.bullets
         .map(bullet => Bullet.update(bullet, game, controls))
         .filter(bullet => Bullet.isAlive(bullet, game))
   };
};


Game.render = (game, ctx, time) => {
   // Compute the visible viewport
   let desiredX = game.hero.location.x - (VIEWPORT_WIDTH / 2);
   let desiredY = game.hero.location.y - (VIEWPORT_HEIGHT / 2);
   desiredX = Math.max(desiredX, -0.000001); // This 0.000001 adjustment fixes a minor error in the lighting calculations
   desiredY = Math.max(desiredY, -0.000001);
   desiredX = Math.min(desiredX, ARENA_WIDTH - VIEWPORT_WIDTH + 0.00001);
   desiredY = Math.min(desiredY, ARENA_HEIGHT - VIEWPORT_HEIGHT + 0.00001);
   let viewport = Rectangle(Point(desiredX, desiredY), VIEWPORT_WIDTH, VIEWPORT_HEIGHT);

   // Set the canvas to render at the viewport
   ctx.setTransform(1, 0, 0, 1, 0, 0);
   ctx.scale(CANVAS_WIDTH / VIEWPORT_WIDTH, CANVAS_HEIGHT / VIEWPORT_HEIGHT);
   ctx.translate(-viewport.location.x, -viewport.location.y);

   // Clear the screen
   // ctx.fillStyle = "black";
   // ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
   // ctx.strokeStyle = "black";
   // ctx.strokeRect(viewport.location.x, viewport.location.y, viewport.width, viewport.height);
   ctx.fillStyle = "#030303";
   ctx.fillRect(viewport.location.x, viewport.location.y, viewport.width, viewport.height);

   // Render everything
   game.bullets.forAll(bullet => Bullet.render(bullet, game, ctx));

   // Render the maze


   // ctx.fillStyle = "black";
   // Maze.forEachCell(maze, (cell, x, y) => {
   //    if (cell === 1)
   //    ctx.fillRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight);
   // });

   let visibleVertexes = game.maze.vertexes.filter(vertex => Rectangle.inside(viewport, vertex));
   let visibleEdges = game.maze.edges.filter(segment => Segment.intersectsRect(segment, viewport));
   let viewportTop = Segment(viewport.topLeft, viewport.topRight);
   let viewportLeft = Segment(viewport.topLeft, viewport.bottomLeft);
   let viewportBottom = Segment(viewport.bottomLeft, viewport.bottomRight);
   let viewportRight = Segment(viewport.topRight, viewport.bottomRight);
   visibleVertexes = visibleVertexes.concat(
      visibleEdges
         .map(edge => Segment.intersection(viewportTop, edge))
         .filter(e => e !== false)
         .map(e => e.point),
      visibleEdges
         .map(edge => Segment.intersection(viewportBottom, edge))
         .filter(e => e !== false)
         .map(e => e.point),
      visibleEdges
         .map(edge => Segment.intersection(viewportLeft, edge))
         .filter(e => e !== false)
         .map(e => e.point),
      visibleEdges
         .map(edge => Segment.intersection(viewportRight, edge))
         .filter(e => e !== false)
         .map(e => e.point)
   );
   visibleEdges.push(viewportTop, viewportLeft, viewportBottom, viewportRight);


   // ctx.fillStyle = "green";
   // visibleVertexes.forEach(vertex => ctx.fillRect(vertex.x, vertex.y, 5, 5));
   // ctx.strokeStyle = "blue";
   // ctx.beginPath();
   // visibleEdges.forEach(edge => {
   //    ctx.moveTo(edge.begin.x, edge.begin.y);
   //    ctx.lineTo(edge.end.x, edge.end.y);
   // });
   // ctx.stroke();

   let shadowFill = ctx.createRadialGradient(game.hero.location.x, game.hero.location.y, 0, game.hero.location.x, game.hero.location.y, 100);
   shadowFill.addColorStop(0, "hsla(350, 50%, 85%, 1)");
   shadowFill.addColorStop(1, "hsla(350, 50%, 0%, 0)");

   let fringes = [];
   let steps = 10;
   let stepSize = TAU / steps;
   for (var i = 0; i < steps; i++) {
      let x = Math.cos(stepSize * i) * 5 + game.hero.location.x;
      let y = Math.sin(stepSize * i) * 5 + game.hero.location.y;
      fringes.push(generateShadow(visibleVertexes, visibleEdges, Point(x, y)));
   }

   ctx.globalAlpha = 0.1;
   ctx.fillStyle = shadowFill;
   fringes.forEach(fringe => {
      ctx.beginPath();
      fringe.forEach(point => ctx.lineTo(point.x, point.y));
      ctx.fill();
   });
   ctx.globalAlpha = 1;

   // let shadow = generateShadow(visibleVertexes, visibleEdges, game.hero.location);
   // shadow.forEach(point => ctx.lineTo(point.x, point.y));
   // ctx.fill();

   Hero.render(game.hero, game, ctx);


   ctx.fillStyle = "black";
   Maze.forEachCell(game.maze, (cell, x, y) => {
      if (cell === 1)
         ctx.fillRect(x * game.maze.cellWidth, y * game.maze.cellHeight, game.maze.cellWidth, game.maze.cellHeight);
   });

   // let visiblePoints = game.maze.points.filter(point => Rectangle.inside(viewport, point));
   // let visibleEdges = game.maze.edges.filter(segment => Segment.intersectsRect(segment, viewport));
   // let shadow = generateShadow(visiblePoints, visibleEdges, game.hero.location);
   // ctx.beginPath();
   // shadow.forEach(point => ctx.lineTo(point.x, point.y));
   // ctx.fillStyle = "red";
   // ctx.fill();
};














let Controls = () => {
   let controls = {
      up: false,
      down: false,
      left: false,
      right: false,
      fire: false,
      mouse: Point(0, 0)
   };

   let keymap = {
      "w": "up",
      "s": "down",
      "a": "left",
      "d": "right",
      " ": "fire",
   };

   let handleKeyDown = event => controls[keymap[event.key]] = true;
   let handleKeyUp = event => controls[keymap[event.key]] = false;
   let handeMouseMove = event => controls.mouse = Point(event.clientX, event.clientY);

   document.addEventListener("keydown",   handleKeyDown);
   document.addEventListener("keyup",     handleKeyUp);
   document.addEventListener("mousemove", handeMouseMove);

   return controls;
};








(function() {
   canvas.width = ARENA_WIDTH;
   canvas.height = ARENA_HEIGHT;
   ctx.fillStyle = "white";
   ctx.fillRect(0, 0, 800, 800);


   let game = Game();
   for (let i = 0; i < 10; i++) game.bullets.push(Bullet(Point(random(0, 800), random(0, 800)), Point(0, 1)));
   let controls = Controls();
   let render = (t) => {
      game = Game.update(game, controls);
      Game.render(game, ctx, t);
      requestAnimationFrame(render.bind(null, t + 1));
   };
   render(0);
}());










   // let maze = Maze();
   // let cellWidth = 10;
   // let cellHeight = 10;

   // ctx.fillStyle = "black";
   // Maze.forEachCell(maze, (cell, x, y) => {
   //    if (cell === 1)
   //    ctx.fillRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight);
   // });

   // // ctx.fillStyle = "blue";
   // // maze.horizontalEdges.forEach((edge, i) => {
   // //    let x = (i % maze.width) * cellWidth;
   // //    let y = Math.floor(i / maze.width) * cellHeight;
   // //    if (edge)
   // //       ctx.fillRect(x, y, cellWidth, 2);
   // // });

   // // ctx.fillStyle = "red";
   // // maze.verticalEdges.forEach((edge, i) => {
   // //    let x = Math.floor(i / maze.height) * cellWidth;
   // //    let y = (i % maze.height) * cellHeight;
   // //    if (edge)
   // //       ctx.fillRect(x, y, 2, cellHeight);
   // // });

   // ctx.strokeStyle = "red";
   // ctx.fillStyle = "red";
   // ctx.lineWidth = 2;
   // // ctx.beginPath();
   // maze.vertexes.forEach(vertex => {
   //    ctx.fillRect(vertex.x * cellWidth, vertex.y * cellHeight, 2, 2);
   // });
   // // ctx.stroke();
