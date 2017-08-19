let Point = (x, y) => ({x, y});
Point.add = (left, right) => Point(left.x + right.x, left.y + right.y);
Point.sub = (left, right) => Point(left.x - right.x, left.y - right.y);
Point.mul_scalar = (point, scalar) => Point(point.x * scalar, point.y * scalar);
Point.div_scalar = (point, scalar) => Point(point.x / scalar, point.y / scalar);
Point.cross = (left, right) => left.x * right.y - right.x * left.y;
Point.draw = point => {
   ctx.beginPath();
   ctx.arc(point.x, point.y, 0.03, 0, Math.PI * 2);
   ctx.fill();
};



let Segment = (begin, end) => ({begin, end, offset: Point.sub(end, begin)});

Segment.intersection = (left, right) => {
   let offsetCross = Point.cross(left.offset, right.offset);
   
   // offsetCross = 0 when the two segments are parallel
   // Technically, when they are also colinear there is still the possibility
   // of them intersecting at a line segment, but that is unlikely to occur in
   // practice and treating such segments as not intersecting is fine for
   // the lighting calculations here.
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

Segment.draw = segment => {
   ctx.beginPath();
   ctx.moveTo(segment.begin.x, segment.begin.y);
   ctx.lineTo(segment.end.x, segment.end.y);
   ctx.stroke();
};





// Yes, yes. I know. "Don't change the prototype!" Blah, blah, blah.
// Well, I control this entire codebase, so I'll avoid the problems.
Array.prototype.flatMap = function(lambda) {
  return Array.prototype.concat.apply([], this.map(lambda));
};

// ForEach doesn't return the original array, which means it can't be used in
// map/reduce/etc. chains. The function is forEach, but it returns the original
// array, allowing it to be chained.
Array.prototype.forAll = function(lambda) {
  Array.prototype.forEach.apply(this, arguments);
  return this;
};


let generateShadow = (shape, edges, hero) => shape
  // atan2 is always relative to the origin. Move everything such that the hero is at the center
  .map(point => Point.sub(point, hero))
  // Compute the angle of the shape's point relative to the hero
  .map(point => Math.atan2(point.y, point.x))
  // Sort the angles so that drawing the final shadow can be done simply by connecting points
  .sort((a, b) => a - b)
  // Convert each angle into three angles: one counter-clockwise, the original, and one clockwise
  // for the fading effect
  .flatMap(angle => [angle - 0.0001, angle, angle + 0.0001])
  // Convert each angle back into a point. NOTE: If the rays are not long enough they
  // may not intersect with any edges. This will cause a runtime error in the "find intersection"
  // step because the reduce call does not provide a default value. :( This should probably
  // be fixed at some point
  .map(angle => Point(Math.cos(angle) * 200, Math.sin(angle) * 200))
  // Undo the translation to the origin back in step one
  .map(point => Point.add(hero, point))
  // Convert each point into a line segment starting at the hero
  .map(point => Segment(hero, point))
  // Draw the line segments for debugging purposes
  .forAll(Segment.draw)
  // Find the closest intersecting point out of all of the edges in the scene
  .map(ray => edges
      // Get the ray's intersection point with each edge in the scene
      .map(edge => Segment.intersection(ray, edge))
      // Filter out the edges that didn't actually intersect
      .filter(maybeIntersection => maybeIntersection !== false)
      // Out of the remaning edges that did intersect, find the closest one
      .reduce((closestIntersection, intersection) => {
        if (closestIntersection === false) return intersection;
        if (closestIntersection.distance > intersection.distance) return intersection;
        return closestIntersection;
      }, false))
  // Filter out the rays that didn't intersect with any edges
  .filter(intersection => intersection !== false)
  // Map each intersection object (which includes its distance) into its raw intersection location
  .map(intersection => intersection.point);





let canvas = document.querySelector("#canvas");
canvas.width = canvas.height = 400;
let ctx = canvas.getContext("2d");

// Make the context's points form a standard euclidian grid
// from -1 to 1 in all directions
ctx.translate(canvas.width / 2, canvas.height / 2);
ctx.scale(canvas.width / 2, canvas.height / 2);
ctx.lineWidth = 0.01;


let mouse = (function() {
  let location = {x: 0, y: 0};
  document.addEventListener("mousemove", event => {
    location.x = (event.clientX / canvas.width) * 2 - 1;
    location.y = (event.clientY / canvas.height) * 2 - 1;
  });
  return location;
}());



let shape = [
  Point(-1, 1),
  Point(0.2, 1),
  Point(0.2, 0.2),
  Point(0.4, 0.2),
  Point(0.4, 1),
  Point(1, 1),
  Point(1, -1),
  Point(-1, -1)
];

let edges = shape.map((point, index, points) =>
  Segment(point, points[(index + 1) % points.length]));


let render = () => {
  // Clear the screen
  ctx.fillStyle = "white";
  ctx.fillRect(-1, -1, 2, 2);

  // Draw the shape
  ctx.fillStyle = "black";
  ctx.beginPath();
  shape.forEach(point => ctx.lineTo(point.x, point.y));
  ctx.fill();

  // Draw the shadow
  ctx.strokeStyle = "red";
  let shadow = generateShadow(shape, edges, mouse);
  ctx.fillStyle = "rgba(90, 90, 90, 0.8)";
  ctx.beginPath();
  shadow.forEach(point => ctx.lineTo(point.x, point.y));
  ctx.fill();
};
setInterval(render, 80);
