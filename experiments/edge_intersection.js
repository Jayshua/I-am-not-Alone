let canvas = document.querySelector("#canvas");
canvas.width = canvas.height = 400;
let ctx = canvas.getContext("2d");

// Make the context's points form a standard euclidian grid
// from -1 to 1 in all directions where up and right are positive
ctx.translate(canvas.width / 2, canvas.height / 2);
ctx.scale(-canvas.width / 2, canvas.height / 2);
ctx.rotate(Math.PI);
ctx.lineWidth = 0.02;


class Point {
  constructor(x, y) {this.x = x; this.y = y;}
  translate(amount) {return new Point(this.x + amount.x, this.y + amount.y);}
  negate() {return new Point(-this.x, -this.y);}
  sub(other) {return new Point(this.x - other.x, this.y - other.y);}
  cross(other) {return this.x * other.y - other.x * this.y;}
  // NOTE: This equals method is intended for determining whether two
  // points came from the same original point. Because floating point
  // comparison is not reliable, it is not accurate for comparing
  // points that have been put through equations.
  equals(other) {return other.x === this.x && other.y === this.y;}
}

class Segment {
  constructor(begin, end) {this.begin = begin; this.end = end;}

  // Determine whether the given point is to the right of the segment
  pointRightOf(point) {
    // The cross product will convienently tell us exactly what we
    // are looking for. I have no idea why, but I believe it has
    // something to do with Unicorn Horns and Pixi Dust?
    // Regardless, it only works if the line is situated starting
    // on the origin. So move the line over to the origin, which
    // means we also must move the point being tested too.
    let originEnd = this.end.translate(this.begin.negate());
    let originPoint = point.translate(this.begin.negate());
    return originEnd.cross(originPoint) < 0;
  }
  
  // Determine whether the given line intersects with this segment
  // NOTE: While this segment class deals with line segments which
  // have a beginning and end, the line parameter taken here is
  // treated as a true geometric line with no beginning or end.
  intersectsLine(line) {
    // This segment intersectst the given line if both of its
    // endpoints are on either side of the line. Binary xor
    // works correctly on booleans, but returns an integer.
    // !! (two NOTs) is used to convert it to a boolean.
    return !!(this.pointRightOf(line.begin) ^ this.pointRightOf(line.end));
  }
  
  // Determine whether the given segment intersects with this segment.
  intersects(segment) {
    return this.intersectsLine(segment)
      && segment.intersectsLine(this)
      // I suppose since the math is so elegant two line segments that
      // share a point intersect. But that's not terribly useful for
      // this algorithm since the rays are created directly to an endpoint
      // and thus always share a point. Therefore, "adjust" the intersection
      // algorithm slightly so that simply sharing a single point no longer
      // indicates an intersection.
      && !this.begin.equals(segment.begin)
      && !this.begin.equals(segment.end)
      && !this.end.equals(segment.begin)
      && !this.end.equals(segment.end);
  }
  
  getIntersection(segment) {
    let a = b => (q.sub(p)).cross(b.div_scalar(r.cross(s)));
    let u = a(r);
    let t = a(s);
    
  }
  
  // Draw the line to the canvas. This was used for debugging purposes.
  draw(ctx) {
    ctx.beginPath();
    ctx.moveTo(this.begin.x, this.begin.y);
    ctx.lineTo(this.end.x, this.end.y);
    ctx.stroke();
  }
}


let shape = [
  new Point(-1, 1),
  new Point(0.2, 1),
  new Point(0.2, 0.2),
  new Point(0.4, 0.2),
  new Point(0.4, 1),
  new Point(1, 1),
  new Point(1, -1),
  new Point(-1, -1)
];

let edges = shape.map((point, index, points) =>
  new Segment(point, points[(index + 1) % points.length]));

ctx.beginPath();
shape.forEach(point => ctx.lineTo(point.x, point.y));
ctx.fill();

let hue = 0;
edges.forEach(line => {
  ctx.strokeStyle = `hsl(${hue}, 50%, 50%)`;
  hue += 20;
  ctx.beginPath();
  ctx.moveTo(line.begin.x, line.begin.y);
  ctx.lineTo(line.end.x, line.end.y);
  ctx.stroke();
});

ctx.strokeStyle = "red";

let center = new Point(0, 0);
// let ray = new Segment(center, shape[4]);
// ray.draw(ctx);
// console.log("",ray.intersects(edges[1]));
// console.log(edges[1].intersects(ray));
// edges[2].draw(ctx);
ctx.globalCompositeOperation = "lighten";
let viewShape = shape.filter(point => {
  let ray = new Segment(point, center);
  if (edges.some(edge => ray.intersects(edge)))
    ctx.strokeStyle = "green";
  else
    ctx.strokeStyle = "red";

  ray.draw(ctx);
  return !edges.some(edge => edge.intersects(ray));
});

ctx.globalCompositeOperation = "source-over";
ctx.strokeStyle="blued";
ctx.beginPath();
viewShape.forEach(p => ctx.lineTo(p.x, p.y));
ctx.stroke();