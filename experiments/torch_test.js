let canvas = document.getElementById("c");
let ctx = canvas.getContext("2d");

canvas.width = 800;
canvas.height = 800;
ctx.fillStyle = "white";
ctx.fillRect(0, 0, canvas.width, canvas.height);
ctx.translate(canvas.width / 2, canvas.height / 2);


class Particle {
   constructor(location) {
      this.location = new Point(0, 0);
      this.velocity = new Point(Math.random() * 0.10 - 0.05, Math.random() * -0.5 - 0.1);
      this.hue = Math.random() * 40 + 330;
      this.offset = Math.random() * Math.PI * 2;
      this.multiplier = Math.random() * 2 + 2;
   }

   draw(ctx) {
      let distance = 0.8 - (this.location.magnitude() / 40) * 0.8;
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = `hsla(${this.hue}, 40%, ${distance * 50 + 20}%, 0.7)`;
      ctx.fillRect(this.location.x, this.location.y, distance, distance);
   }

   update() {
      this.location = this.location.add(this.velocity);
      this.location.x = Math.sin(this.location.y * Math.PI * 2) * this.multiplier + this.offset;
   }

   isAlive() {
      return this.location.magnitude() < 40;
   }
}

let particles = [];


let particleCount = 150;
let render = () => {
   ctx.globalCompositeOperation = "source-over";
   ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
   ctx.fillRect(-canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);

   ctx.fillStyle = "yellow";
   particles.forEach(x => x.update());
   particles.forEach(x => x.draw(ctx));
   particles = particles.filter(x => x.isAlive());

   if (particles.length < particleCount) {
      particleCount -= 0.1;
      particles.push(new Particle());
   }

   requestAnimationFrame(render);
};
render();

