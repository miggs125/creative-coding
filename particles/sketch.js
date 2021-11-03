const canvasSketch = require("canvas-sketch");
const random = require("canvas-sketch-util/random");

const settings = {
  dimensions: [window.innerWidth, window.innerHeight],
  animate: true,
};

const normalize = (min, max, curr) => (curr - min) / (max - min);

const sketch = ({ context, width, height }) => {
  class Vector {
    constructor(x, y) {
      this.x = x;
      this.y = y;
    }
  }

  class Agent {
    constructor(
      x = undefined,
      y = undefined,
      radius = 7,
      vel = new Vector(random.range(-2, 2), random.range(-2, 2))
    ) {
      this.pos = new Vector(x, y);
      this.radius = radius;
      this.vel = vel;
    }

    update() {
      // boundary check
      if (this.pos.y >= height) {
        this.pos.y = this.pos.y - height;
      } else if (this.pos.y <= 0) {
        this.pos.y = height - this.pos.y;
      }

      if (this.pos.x >= width) {
        this.pos.x = this.pos.x - width;
      }
      if (this.pos.x <= 0) {
        this.pos.x = width - this.pos.x;
      }

      //update position
      this.pos.y += this.vel.y;
      this.pos.x += this.vel.x;
    }

    draw() {
      context.save();
      context.fillStyle = "black";
      context.lineWidth = 2;
      context.translate(this.pos.x, this.pos.y);
      context.beginPath();
      context.arc(0, 0, this.radius, 0, Math.PI * 2);
      context.stroke();
      context.restore();

      this.update();
    }

    getDistanceSquared(other) {
      const dx = other.pos.x - this.pos.x;
      const dy = other.pos.y - this.pos.y;
      return dx * dx + dy * dy;
    }
  }

  const canvas = document.getElementsByTagName("canvas")[0];
  const canvasRect = canvas.getBoundingClientRect();

  let mouseIn = false;

  const mouse = new Agent(0, 0, height * 0.2, new Vector(0, 0));

  canvas.addEventListener("mouseenter", ({ clientX, clientY }) => {
    mouseIn = true;
    mouse.pos.x = normalize(canvasRect.left, canvasRect.right, clientX) * width;
    mouse.pos.y =
      normalize(canvasRect.top, canvasRect.bottom, clientY) * height;
  });

  let mouseTimeout = undefined;

  canvas.addEventListener("mousemove", ({ clientX, clientY }) => {
    if (mouseTimeout) clearTimeout(mouseTimeout);
    mouseTimeout = setTimeout(() => {
      mouse.vel.y = 0;
      mouse.vel.x = 0;
    }, 50);

    mouseIn = true;
    const currX = normalize(canvasRect.left, canvasRect.right, clientX) * width;
    const currY =
      normalize(canvasRect.top, canvasRect.bottom, clientY) * height;
    mouse.vel.x = currX - mouse.pos.x;
    mouse.vel.y = currY - mouse.pos.y;
    mouse.pos.x = currX;
    mouse.pos.y = currY;
  });

  canvas.addEventListener("mouseleave", () => {
    mouseIn = false;
  });

  const numParticles = 100;

  const particles = new Array(numParticles)
    .fill({})
    .map((o) => new Agent(random.range(0, width), random.range(0, height)));

  return ({ context, width, height }) => {
    context.fillStyle = "white";
    context.fillRect(0, 0, width, height);

    // collision handling with mouse
    particles.forEach((particle) => {
      if (mouseIn) {
        const minDist = Math.sqrt(
          particle.radius * particle.radius + mouse.radius * mouse.radius
        );
        const currDist = Math.sqrt(particle.getDistanceSquared(mouse));

        // particles have collided with mouse
        if (currDist <= minDist) {
          // find overlap
          const overlap = minDist - currDist;
          const deltaX = Math.abs(mouse.pos.x - particle.pos.x);
          const deltaY = Math.abs(mouse.pos.y - particle.pos.y);
          const angle = Math.atan(deltaY / deltaX);

          const overlapX = overlap * Math.cos(angle);
          const overlapY = overlap * Math.sin(angle);

          particle.pos.x =
            particle.pos.x - mouse.pos.x > 0
              ? particle.pos.x + overlapX
              : particle.pos.x - overlapX;

          particle.pos.y =
            particle.pos.y - mouse.pos.y > 0
              ? particle.pos.y + overlapY
              : particle.pos.y - overlapY;
        }
      }
    });

    for (let i = 0; i < particles.length; i++)
      for (let j = i + 1; j < particles.length; j++) {
        const particle = particles[i];
        const other = particles[j];
        const distance = particle.getDistanceSquared(other);
        const maxDistance = 20000;

        // draw line between particles
        if (distance < maxDistance) {
          context.fillStyle = "black";
          context.lineWidth = 2 * (1 - normalize(0, maxDistance, distance));
          context.beginPath();
          context.moveTo(particle.pos.x, particle.pos.y);
          context.lineTo(other.pos.x, other.pos.y);
          context.stroke();
        }
      }

    particles.forEach((particle) => void particle.draw());
  };
};

canvasSketch(sketch, settings);
