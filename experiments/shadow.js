let canvas = document.querySelector("#canvas");
canvas.width = canvas.height = 400;
let ctx = canvas.getContext("2d");

// Make the context's points form a standard euclidian grid
// from -1 to 1 in all directions where up and right are positive
ctx.translate(canvas.width / 2, canvas.height / 2);
ctx.scale(-canvas.width / 2, canvas.height / 2);
ctx.rotate(Math.PI);
ctx.lineWidth = 0.01;


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

ctx.beginPath();
shape.forEach(point => ctx.lineTo(point.x, point.y));
ctx.fill();


ctx.fillStyle = "blue";
ctx.strokeStyle = "red";

Array.prototype.flatMap = function(lambda) {
  return Array.prototype.concat.apply([], this.map(lambda));
};
Array.prototype.forAll = function(lambda) {
  Array.prototype.forEach.apply(this, arguments);
  return this;
};

let center = Point(0.5, 0.5);
let shadowShape = shape
  .map(point => Point.sub(point, center))
  .map(point => Math.atan2(point.y, point.x))
  .sort((a, b) => a - b)
  .flatMap(angle => [angle - 0.0001, angle, angle + 0.0001])
  .map(angle => Point(Math.cos(angle) * 200, Math.sin(angle) * 200))
  .map(point => Point.add(center, point))
  .forAll(Point.draw)
  .map(point => Segment(center, point))
  .forAll(Segment.draw)
  .map(ray => edges
      .map(edge => Segment.intersection(ray, edge))
      .filter(maybeIntersection => maybeIntersection !== false)
      .reduce((closestIntersection, intersection) =>
              closestIntersection.distance > intersection.distance
              ? intersection
              : closestIntersection, false))
  .filter(intersection => intersection !== false)
  .map(intersection => intersection.point);

ctx.beginPath();
shadowShape.forEach(point => ctx.lineTo(point.x, point.y));
ctx.fillStyle = "rgba(90, 90, 90, 0.8)";
ctx.fill();
console.log("HERE");
// rays.forEach(Segment.draw);

/*
shape.forEach(point => {
  let ray = Segment(center, Point.mul_scalar(point, 3));
  Segment.draw(ray);

  let intersection = edges
    .map(edge => Segment.intersection(ray, edge))
    .filter(maybeIntersection => maybeIntersection !== false)
    .reduce((closestIntersection, intersection) =>
            closestIntersection.distance > intersection.distance
            ? intersection
            : closestIntersection);

  if (intersection) {
    console.log("HERE5");
    Point.draw(intersection.point);
  }
});
*/
// let hues = ["green", "blue", "yellow", "purple", "grey"];
// int.forEach((intersection, index) => {
//   console.log(index);
//   ctx.fillStyle = hues[index];
//   Point.draw(intersection.point);
// });

// ctx.strokeStyle="red";
// Segment.draw(ray);
// // edges.filter(edge => )