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







let config = {
   background: "#111",
   walls: "#444"
};



class Bullet {
   constructor(location, velocity) {
      this.location = location;
      this.velocity = velocity;
      this.used = false;
   }

   update(game) {
      this.location = this.location.add(this.velocity).mul_scalar(game.delta);
   }

   isAlive(game) {
      return this.used === false && !game.maze.collidesWithWall(this.location);
   }

   draw(ctx) {
      ctx.fillStyle = "white";
      ctx.fillRect(this.location.x, this.location.y, 0.5, 0.5);
   }
}



class Hero {
   constructor() {
      this.location = new Point(0, 20);
      this.coolDown = 0;
   }

   update(game) {
      var direction = new Point(0, 0);
      if (game.controls.up)    direction = direction.add(Point.UP);
      if (game.controls.left)  direction = direction.add(Point.LEFT);
      if (game.controls.right) direction = direction.add(Point.RIGHT);
      if (game.controls.down)  direction = direction.add(Point.DOWN);

      if (game.controls.fire && this.coolDown <= 0) {
         let vector = game.controls.mouse.sub(this.location).normalize().mul_scalar(2);
         game.bullets.push(new Bullet(this.location, vector));
         this.coolDown = 8;
      }

      let newX = this.location.x + direction.x * game.delta * 0.5;
      let newY = this.location.y + direction.y * game.delta * 0.5;
      let newLocation = new Point(newX, newY);

      if (game.maze.collidesWithWall(newLocation)) {
         // Check if horizontal or vertical motion is possible
         let verticalMotion = new Point(newX, this.location.y);
         let horizontalMotion = new Point(this.location.x, newY);
         if (!game.maze.collidesWithWall(verticalMotion)) {
            this.location = verticalMotion;
         } else if (!game.maze.collidesWithWall(horizontalMotion)) {
            this.location = horizontalMotion;
         }
      } else {
         this.location = newLocation;
      }

      this.coolDown -= 1;
   }

   draw(ctx) {
      ctx.fillStyle = "red";
      ctx.fillRect(this.location.x, this.location.y, 2, 2);
   }
}

class Monster {
   constructor(location) {
      this.location = location;
      this.direction = "down";
   }

   update(game) {
      let newLocation;
      if (this.direction === "down") {
         newLocation = this.location.add(Point.DOWN.mul_scalar(game.delta * 0.4));
      } else if (this.direction === "up") {
         newLocation = this.location.add(Point.UP.mul_scalar(game.delta * 0.4));
      }

      if (game.maze.collidesWithWall(newLocation)) {
         this.direction = this.direction === "down" ? "up" : "down";
      } else {
         this.location = newLocation;
      }
   }

   isAlive(game) {
      let boundingBox = new Rect(this.location, 2, 2);
      return !game.bullets.some(b => {
         if (boundingBox.intersects(b.location))
            return b.used = true;
      });
   }

   draw(ctx) {
      ctx.fillStyle = "blue";
      ctx.fillRect(this.location.x, this.location.y, 2, 2);
   }
}



class Controls {
   constructor(game) {
      document.addEventListener("keydown", this.handleKeyDown.bind(this));
      document.addEventListener("keyup", this.handleKeyUp.bind(this));
      document.addEventListener("mousemove", this.handeMouseMove.bind(this));
      this.game = game;
      let canvasBounds = game.canvas.getBoundingClientRect();
      this.canvasOffset = new Point(canvasBounds.left, canvasBounds.top);

      this.remap = {
         "w": "up",
         "s": "down",
         "a": "left",
         "d": "right",
         " ": "fire",
      };
   }

   handeMouseMove(event) {
      this.mouse = new Point(event.clientX, event.clientY)
         .sub(this.canvasOffset)
         .div(this.game.canvasSize.widthHeight)
         .mul(this.game.viewport.widthHeight)
         .add(this.game.viewport.topLeft);
   }

   handleKeyDown(event) {
      this[this.remap[event.key]] = true;
   }

   handleKeyUp(event) {
      this[this.remap[event.key]] = false;
   }
}














class Maze {
   constructor() {
      this.width = 51;
      this.height = 51;
      this.grid = [
         2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,
         1,1,1,1,1,1,2,0,0,0,0,0,2,0,0,0,2,0,0,0,0,0,0,0,2,0,0,0,2,0,0,0,0,0,0,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,2,
         2,0,2,2,2,1,2,0,2,2,2,0,2,0,2,0,2,2,2,2,2,2,2,0,2,0,2,0,2,0,2,2,2,2,2,2,2,0,2,0,2,0,2,0,2,0,2,0,2,0,2,
         2,0,0,0,2,1,2,0,0,0,2,0,0,0,2,0,0,0,0,0,2,0,2,0,0,0,2,0,2,0,2,0,0,0,0,0,2,0,0,0,2,0,2,0,2,0,0,0,2,0,2,
         2,2,2,0,2,1,2,2,2,0,2,2,2,2,2,2,2,0,2,0,2,0,2,2,2,2,2,0,2,0,2,0,2,2,2,0,2,0,2,2,2,0,2,0,2,2,2,2,2,0,2,
         2,0,2,0,2,1,2,0,0,0,2,0,2,0,0,0,0,0,2,0,0,0,2,0,0,0,2,0,2,0,2,0,0,0,2,0,2,0,2,0,0,0,0,0,0,0,2,0,0,0,2,
         2,0,2,0,2,1,2,0,2,2,2,0,2,0,2,2,2,2,2,2,2,2,2,0,2,0,2,0,2,0,2,2,2,0,2,0,2,2,2,0,2,2,2,2,2,2,2,0,2,2,2,
         2,0,0,0,2,1,1,1,2,0,2,0,0,0,0,0,0,0,2,0,0,0,2,0,2,0,0,0,2,0,0,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,0,0,0,0,2,
         2,2,2,2,2,2,2,1,2,0,2,2,2,2,2,2,2,0,2,0,2,0,2,0,2,2,2,2,2,2,2,2,2,2,2,2,2,0,2,0,2,0,2,2,2,2,2,2,2,2,2,
         2,1,1,1,1,1,1,1,2,0,2,0,0,0,0,0,2,0,2,0,2,0,2,0,2,0,0,0,0,0,2,0,0,0,2,0,0,0,2,0,2,0,0,0,0,0,0,0,0,0,2,
         2,1,2,2,2,2,2,2,2,0,2,0,2,2,2,0,2,0,2,0,2,0,2,0,2,2,2,2,2,0,2,0,2,0,2,2,2,2,2,0,2,2,2,2,2,2,2,0,2,0,2,
         2,1,1,1,1,1,1,1,2,0,2,0,0,0,2,0,2,0,2,0,2,0,0,0,2,0,0,0,2,0,2,0,2,0,0,0,0,0,2,0,0,0,0,0,2,0,0,0,2,0,2,
         2,2,2,2,2,2,2,1,2,0,2,2,2,0,2,0,2,0,2,0,2,2,2,2,2,0,2,0,2,0,2,0,2,2,2,2,2,0,2,2,2,2,2,0,2,0,2,2,2,2,2,
         2,0,0,0,0,1,1,1,2,0,0,0,0,0,2,0,0,0,2,0,0,0,2,0,2,0,2,0,0,0,2,0,2,0,2,0,0,0,0,0,2,0,0,0,2,0,0,0,0,0,2,
         2,2,2,2,2,1,2,2,2,2,2,2,2,2,2,2,2,0,2,2,2,0,2,0,2,0,2,2,2,2,2,0,2,0,2,0,2,2,2,0,2,2,2,2,2,2,2,2,2,0,2,
         2,1,1,1,2,1,2,0,0,0,0,0,0,0,2,0,0,0,0,0,2,0,2,0,0,0,2,0,0,0,2,0,2,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,0,0,2,
         2,1,2,1,2,1,2,0,2,2,2,2,2,0,2,2,2,2,2,2,2,0,2,2,2,0,2,0,2,0,2,0,2,2,2,2,2,0,2,2,2,0,2,0,2,0,2,0,2,2,2,
         2,1,2,1,2,1,2,0,2,1,1,1,1,1,1,1,2,1,1,1,2,0,2,0,0,0,0,0,2,0,0,0,2,0,0,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,2,
         2,1,2,1,2,1,2,2,2,1,2,2,2,0,2,1,2,1,2,1,2,0,2,0,2,2,2,2,2,2,2,2,2,2,2,0,2,2,2,0,2,2,2,0,2,2,2,2,2,2,2,
         2,1,2,1,1,1,2,1,1,1,2,0,0,0,2,1,2,1,2,1,2,0,2,0,0,0,2,0,0,0,0,0,0,0,2,0,2,0,0,0,2,0,0,0,2,0,0,0,0,0,2,
         2,1,2,2,2,0,2,1,2,2,2,2,2,2,2,1,2,1,2,1,2,0,2,2,2,0,2,0,2,2,2,2,2,0,2,0,2,0,2,2,2,0,2,2,2,2,2,2,2,0,2,
         2,1,2,0,0,0,2,1,1,1,1,1,2,1,1,1,2,1,2,1,2,0,0,0,2,0,2,0,2,0,0,0,0,0,2,0,2,0,2,0,2,0,2,0,0,0,2,0,2,0,2,
         2,1,2,0,2,2,2,2,2,2,2,1,2,1,2,2,2,1,2,1,2,2,2,0,2,0,2,0,2,2,2,2,2,2,2,0,2,0,2,0,2,0,2,0,2,0,2,0,2,0,2,
         2,1,2,0,0,0,2,0,0,0,2,1,2,1,1,1,1,1,2,1,1,1,1,1,1,1,2,0,0,0,0,0,0,0,0,0,2,0,2,0,0,0,0,0,2,0,0,0,2,0,2,
         2,1,2,2,2,2,2,0,2,0,2,1,2,2,2,2,2,2,2,2,2,2,2,0,2,1,2,2,2,2,2,2,2,2,2,2,2,0,2,2,2,2,2,2,2,2,2,0,2,0,2,
         2,1,2,1,1,1,2,0,2,0,0,1,1,1,2,0,0,0,0,0,2,0,0,0,2,1,2,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,2,0,0,0,2,0,2,
         2,1,2,1,2,1,2,2,2,2,2,2,2,1,2,0,2,2,2,0,2,0,2,2,2,1,2,0,2,2,2,2,2,2,2,2,2,2,2,0,2,2,2,0,2,0,2,2,2,0,2,
         2,1,1,1,2,1,0,0,2,0,2,1,1,1,2,0,2,0,2,0,0,0,2,0,2,1,2,0,2,1,1,1,1,1,1,1,1,1,2,0,2,0,0,0,2,0,2,0,0,0,2,
         2,2,2,2,2,1,2,0,2,0,2,1,2,2,2,0,2,0,2,2,2,2,2,0,2,1,2,0,2,1,2,2,2,2,2,2,2,1,2,0,2,2,2,2,2,0,2,0,2,2,2,
         2,0,0,0,2,1,2,0,2,1,1,1,2,0,0,0,2,0,2,0,2,0,0,0,2,1,1,1,1,1,2,1,1,1,1,1,1,1,2,0,0,0,0,0,2,0,0,0,2,0,2,
         2,2,2,0,2,1,2,2,2,1,2,0,2,0,2,2,2,0,2,0,2,0,2,2,2,2,2,0,2,2,2,1,2,2,2,2,2,2,2,2,2,2,2,0,2,2,2,2,2,0,2,
         2,0,0,0,2,1,1,1,2,1,2,0,2,0,0,0,0,0,2,0,2,0,0,0,2,0,0,0,2,1,1,1,2,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,2,
         2,0,2,2,2,2,2,1,2,1,2,2,2,2,2,2,2,2,2,0,2,2,2,0,2,0,2,2,2,1,2,2,2,0,2,2,2,2,2,0,2,0,2,2,2,2,2,0,2,2,2,
         2,0,0,0,0,0,2,1,2,1,1,1,2,0,0,0,2,0,0,0,2,0,2,0,0,0,2,1,1,1,2,0,2,0,0,0,2,0,2,0,2,0,2,0,0,0,2,0,0,0,2,
         2,0,2,0,2,0,2,1,2,2,2,1,2,0,2,0,2,2,2,0,2,0,2,2,2,2,2,1,2,2,2,0,2,2,2,0,2,0,2,0,2,0,2,0,2,0,2,2,2,0,2,
         2,0,2,0,2,0,0,1,1,1,1,1,2,0,2,0,0,0,2,0,2,0,0,0,2,0,2,1,2,1,1,1,1,1,2,0,2,0,2,0,2,0,0,0,2,0,2,0,0,0,2,
         2,0,2,2,2,2,2,0,2,2,2,2,2,0,2,2,2,0,2,0,2,0,2,0,2,0,2,1,2,1,2,0,2,1,2,0,2,0,2,0,2,2,2,2,2,0,2,0,2,2,2,
         2,0,2,0,0,0,0,0,2,0,0,0,2,0,2,0,2,0,2,0,0,0,2,0,0,0,2,1,1,1,2,0,2,1,2,0,0,0,2,0,0,0,0,0,2,0,2,0,2,0,2,
         2,0,2,0,2,2,2,2,2,0,2,2,2,0,2,0,2,0,2,2,2,0,2,2,2,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,2,0,2,0,2,0,2,0,2,
         2,0,2,0,2,0,0,0,2,0,0,0,0,0,0,0,2,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,2,1,1,1,1,1,1,1,0,0,2,0,0,0,2,
         2,2,2,0,2,0,2,0,2,2,2,2,2,0,2,0,2,2,2,0,2,2,2,2,2,2,2,2,2,0,2,2,2,2,2,1,2,1,2,2,2,2,2,1,2,2,2,0,2,2,2,
         2,0,0,0,2,0,2,0,0,0,2,0,2,0,2,0,0,0,2,0,0,0,2,0,2,0,0,0,2,0,0,0,0,0,2,1,1,1,2,1,1,1,1,1,2,0,0,0,2,0,2,
         2,0,2,2,2,0,2,2,2,0,2,0,2,0,2,2,2,0,2,2,2,0,2,0,2,0,2,2,2,2,2,2,2,0,2,2,2,2,2,1,2,2,2,2,2,2,2,2,2,0,2,
         2,0,0,0,2,0,0,0,2,0,2,0,2,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,0,0,0,0,2,0,2,0,0,0,0,1,2,0,0,0,0,0,0,0,2,0,2,
         2,2,2,0,2,2,2,2,2,0,2,0,2,2,2,0,2,2,2,2,2,0,2,2,2,2,2,2,2,2,2,0,2,0,2,2,2,2,2,1,2,0,2,2,2,2,2,0,2,0,2,
         2,0,0,0,2,0,0,0,0,0,2,0,0,0,0,0,2,0,0,0,2,0,0,0,0,0,0,0,0,0,2,0,0,0,2,1,1,1,1,1,2,0,0,0,0,0,2,0,2,0,2,
         2,0,2,2,2,0,2,2,2,2,2,2,2,2,2,2,2,0,2,0,2,2,2,2,2,2,2,0,2,0,2,2,2,2,2,1,2,2,2,2,2,2,2,2,2,2,2,0,2,0,2,
         2,0,2,0,0,0,2,0,0,0,2,0,0,0,0,0,2,0,2,0,2,0,0,0,2,0,0,0,2,1,1,1,1,1,1,1,2,1,1,1,2,1,1,1,2,0,0,0,2,0,2,
         2,0,2,0,2,2,2,2,2,0,2,2,2,2,2,0,2,0,2,0,2,0,2,0,2,0,2,2,2,1,2,2,2,2,2,2,2,1,2,1,2,1,2,1,2,0,2,2,2,0,2,
         2,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,2,0,0,0,0,0,2,1,1,1,1,1,1,1,1,1,2,1,1,1,2,1,1,1,1,1,1,1,1,
         2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2
      ];
   }

   getRandomOpenLocation(game) {
      let gridX = Math.floor(Math.random() * this.width);
      let gridY = Math.floor(Math.random() * this.height);

      while (this.cellAtGrid(gridX, gridY) == 2) {
         gridX = Math.floor(Math.random() * this.width);
         gridY = Math.floor(Math.random() * this.height);
      }

      let cellWidth = game.arena.width / this.width;
      let cellHeight = game.arena.height / this.height;
      let x = (gridX / this.width * game.arena.width) + cellWidth / 2;
      let y = (gridY / this.height * game.arena.height) + cellHeight / 2;

      return new Point(x, y);
   }

   cellAtLocation(location) {
      let gridX = Math.floor((location.x / game.arena.width) * this.width);
      let gridY = Math.floor((location.y / game.arena.height) * this.height);
      return this.cellAtGrid(gridX, gridY);
   }

   cellAtGrid(x, y) {
      return this.grid[x + y * this.width];
   }

   collidesWithWall(location) {
      return this.cellAtLocation(location) == 2;
   }

   drawWalls(ctx, game) {
      let cellWidth = game.arena.width / this.width;
      let cellHeight = game.arena.height / this.height;
      let quad = (x, y) => {
         ctx.moveTo(x, y);
         ctx.lineTo(x + cellWidth, y);
         ctx.lineTo(x + cellWidth, y + cellHeight);
         ctx.lineTo(x, y + cellHeight);
         ctx.lineTo(x, y);
      }

      // Draw walls
      ctx.beginPath();
      this.grid.forEach((cell, index) => {
         if (cell !== 2) return;
         let x = (index % this.height) * cellWidth;
         let y = Math.floor(index / this.height) * cellHeight;
         quad(x, y);
      });
      ctx.fillStyle = config.walls;
      ctx.fill();
   }

   drawPath(ctxx, game) {
      let cellWidth = game.arena.width / this.width;
      let cellHeight = game.arena.height / this.height;
      // Draw path
      ctx.beginPath();
      let equal = (a, b) => a.x == b.x && a.y == b.y;
      let current = {x: 0, y: 1};
      let last = {x: 0, y: 0};

      while (current.x != 50 && current.y != 50) {
         let above = {x: current.x, y: current.y - 1};
         let below = {x: current.x, y: current.y + 1};
         let left  = {x: current.x - 1, y: current.y};
         let right = {x: current.x + 1, y: current.y};

         let next;
         if (!equal(above, last) && this.cellAtGrid(above.x, above.y) === 1)      next = above;
         else if (!equal(below, last) && this.cellAtGrid(below.x, below.y) === 1) next = below;
         else if (!equal(left, last) && this.cellAtGrid(left.x, left.y) === 1)    next = left;
         else if (!equal(right, last) && this.cellAtGrid(right.x, right.y) === 1) next = right;

         let x = next.x * cellWidth;
         let y = next.y * cellHeight;
         ctx.lineTo(x + cellWidth / 2, y + cellHeight / 2);

         last = current;
         current = next;
      };
      ctx.strokeStyle = "yellow";
      ctx.lineWidth = 0.25;
      ctx.stroke();

      // ctx.beginPath();
      // this.grid.forEach((cell, index) => {
      //    if (cell !== 1) return;
      //    let x = (index % this.height) * cellWidth;
      //    let y = Math.floor(index / this.height) * cellHeight;
      //    quad(x, y);
      // });
      // ctx.fillStyle = "yellow";
      // ctx.fill();
   }
}



























class Game {
   constructor(canvas) {
      this.hero = new Hero();
      this.monsters = [];
      this.bullets = [];
      this.tick = 0;
      this.delta = 1.0;
      this.canvas = canvas;
      this.canvasSize = new Rect(new Point(0, 0), canvas.width, canvas.height);
      this.arena = new Rect(new Point(0, 0), 800, 800);
      this.ctx = canvas.getContext("2d");
      this.controls = new Controls(this);
      this.maze = new Maze();
      this.viewport = new Rect(new Point(0, 0), 150, 150);

      for (let i = 0; i < 200; i++) {
         this.monsters.push(new Monster(this.maze.getRandomOpenLocation(this)));
      }
   }

   update() {
      this.tick += 1;
      this.hero.update(this);
      this.monsters.forEach(m => m.update(this));
      this.bullets.forEach(b => b.update(this));

      this.monsters = this.monsters.filter(m => m.isAlive(this));
      this.bullets = this.bullets.filter(b => b.isAlive(this));
   }

   draw() {
      let ctx = this.ctx;

      // Update the viewport
      let desiredX = this.hero.location.x - (this.viewport.width / 2);
      let desiredY = this.hero.location.y - (this.viewport.height / 2);
      let actualX = Math.min(this.canvasSize.width - this.viewport.width, Math.max(0, desiredX));
      let actualY = Math.min(this.canvasSize.height - this.viewport.height, Math.max(0, desiredY));
      this.viewport = new Rect(new Point(actualX, actualY), this.viewport.width, this.viewport.height);

      // Clear the screen
      ctx.fillStyle = config.background;
      ctx.fillRect(this.viewport.topLeft.x, this.viewport.topLeft.y, this.viewport.width, this.viewport.height);

      let horizontalScale = this.canvasSize.width / this.viewport.width;
      let verticalScale = this.canvasSize.height / this.viewport.height;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(horizontalScale, verticalScale);
      ctx.translate(-actualX, -actualY);

      // Render everything
      this.maze.drawWalls(ctx, this);
      this.hero.draw(ctx);
      this.monsters.forEach(m => m.draw(ctx));

      // Apply the flashlight effect
      let flashLight = ctx.createRadialGradient(this.hero.location.x, this.hero.location.y, 0, this.hero.location.x, this.hero.location.y, 30);
      flashLight.addColorStop(0, "rgba(0, 0, 0, 1)");
      flashLight.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.globalCompositeOperation = "destination-in";
      ctx.fillStyle = flashLight;
      ctx.fillRect(this.hero.location.x - 30, this.hero.location.y - 30, 60, 60);
      ctx.globalCompositeOperation = "source-over";

      // Draw the path
      this.maze.drawPath(ctx, this);
      this.bullets.forEach(b => b.draw(ctx));
   }
}



var canvas = document.getElementById("c");
canvas.width = 800;
canvas.height = 800;
var ctx = canvas.getContext("2d");

ctx.fillStyle = "white";
ctx.fillRect(0,0,1000,1000);

let game = new Game(canvas);
let render = () => {
   game.update();
   game.draw(ctx);
   requestAnimationFrame(render);
};

render();