let canvas = document.querySelector("#canvas");
canvas.width = canvas.height = 400;
let ctx = canvas.getContext("2d");

// Make the context's points form a standard euclidian grid
// from -1 to 1 in all directions where up and right are positive
ctx.translate(canvas.width / 2, canvas.height / 2);
ctx.scale(-canvas.width / 2, canvas.height / 2);
ctx.rotate(Math.PI);
ctx.lineWidth = 0.02;


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
   let beginDifference = Point.sub(right.begin, left.begin);
   let offsetCross = Point.cross(left.offset, right.offset);
   
   // offsetCross = 0 when the two segments are parallel
   // Technically, when they are also colinear there is still the possibility
   // of them intersecting at a line segment, but that is unlikely to occur in
   // practice and treating such segments as not intersecting is fine for
   // the lighting calculations here.
   if (offsetCross == 0) return false;
   
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
     return Point.add(left.begin, Point.mul_scalar(left.offset, leftInterval));
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


let segments = [];
let rand = () => Math.random() * 2 - 1;
for (var i = 0; i < 10; i++) {
  segments.push(Segment(Point(rand(), rand()), Point(rand(), rand())));
}
segments.forEach(Segment.draw);

ctx.fillStyle = "red";
for (var i = 0; i < segments.length; i++) {
   for (var j = i; j < segments.length; j++) {
      let intersection = Segment.intersection(segments[i], segments[j]);
      if (intersection) Point.draw(intersection);
  }
}