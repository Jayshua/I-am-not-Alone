class Point {
   constructor(x, y) {
      this.x = x;
      this.y = y;
   }

   add(other) {
      return new Point(this.x + other.x, this.y + other.y)
   }

   sub(other) {
      return new Point(this.x - other.x, this.y - other.y);
   }

   div(other) {
      return new Point(this.x / other.x, this.y / other.y);
   }

   mul(other) {
      return new Point(this.x * other.x, this.y * other.y);
   }

   magnitude() {
      return Math.sqrt(this.x * this.x + this.y * this.y);
   }

   normalize() {
      return this.div_scalar(this.magnitude());
   }

   div_scalar(scalar) {
      return new Point(this.x / scalar, this.y / scalar);
   }

   mul_scalar(scalar) {
      return new Point(this.x * scalar, this.y * scalar);
   }
}

Point.UP = new Point(0, -1);
Point.DOWN = new Point(0, 1);
Point.LEFT = new Point(-1, 0);
Point.RIGHT = new Point(1, 0);


class Rect {
   constructor(location, width, height) {
      this.topLeft = location;
      this.bottomRight = new Point(location.x + width, location.y + height);
      this.widthHeight = new Point(width, height);
      this.width = width;
      this.height = height;
   }

   intersects(obj) {
      if (obj.constructor === Point) {
         return obj.x > this.topLeft.x
            && obj.x < this.bottomRight.x
            && obj.y > this.topLeft.y
            && obj.y < this.bottomRight.y;
      } else if (obj.constructor === Rect) {
         return this.intersects(obj.topLeft) || this.intersects(obj.bottomRight);
      } else {
         console.error("Tried to find the intersection of an object that wasn't a point or rect", obj);
      }
   }

   randomPointIn() {
      let size = this.bottomRight.sub(this.topLeft);
      size.x *= Math.random();
      size.y *= Math.random();
      return size.add(this.topLeft);
   }
}




