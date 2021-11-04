const canvasSketch = require("canvas-sketch");
const random = require("canvas-sketch-util/random");
const Vector = require("../utils/Vector");
const Color = require("../utils/Color");

const settings = {
  dimensions: [window.innerWidth, window.innerHeight],
  animate: true,
};

const normalize = (min, max, curr) => (curr - min) / (max - min);

const sketch = ({ context, width, height }) => {
  class Agent {
    constructor(
      x = undefined,
      y = undefined,
      radius = 2,
      vel = new Vector(random.range(-2, 2), random.range(-2, 2)),
      color = "white"
    ) {
      this.pos = new Vector(x, y);
      this.radius = radius;
      this.vel = vel;
      this.color = color;
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
      context.fillStyle = `rgb(${this.color.r},${this.color.g},${this.color.b})`;
      context.lineWidth = 2;
      context.translate(this.pos.x, this.pos.y);
      context.beginPath();
      context.arc(0, 0, this.radius, 0, Math.PI * 2);
      context.fill();
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

  const mouse = new Agent(0, 0, height * 0.15, new Vector(0, 0));

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
    // normalize to match canvas coordinates
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

  const numParticles = 350;

  let color1 = new Color(255, 0, 0);
  let color2 = new Color(0, 0, 255);

  const particles = new Array(numParticles).fill({}).map((o) => {
    const x = random.range(0, width);
    const y = random.range(0, height);

    const normalizedPos = normalize(0, width, x);

    return new Agent(
      x,
      y,
      5,
      new Vector(random.range(-2, 2), random.range(-2, 2)),
      // invert particle color based on position on background gradient
      new Color(color1.r * (1 - normalizedPos), 0, color2.b * normalizedPos)
    );
  });

  let timer = 0;

  return ({ context, width, height }) => {
    timer++;

    // cool colour changes using cosine 
    color1.r = 255 - Math.cos(timer / 120) * 255;
    color1.g = Math.cos(timer / 160) * 255;
    color1.b = Math.cos(timer / 140) * 255;

    color2.r = Math.cos(timer / 200) * 255;
    color2.g = Math.cos(timer / 180) * 255;
    color2.b = 255 - Math.cos(timer / 180) * 255;

    // Create gradient
    let grd = context.createLinearGradient(0, height / 2, width, height / 2);
    grd.addColorStop(0, `rgb(${color1.r},${color1.g},${color1.b})`);
    grd.addColorStop(1, `rgb(${color2.r},${color2.g},${color2.b})`);
    context.fillStyle = grd;
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

          // collision handling
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
      // invert color based on background gradient
      const normalizedPosition = normalize(0, width, particle.pos.x);
      particle.color.r = 255 - (color1.r - color2.r) * (1 - normalizedPosition);
      particle.color.b = 255 - (color1.r - color2.r) * normalizedPosition;
    });

    for (let i = 0; i < particles.length; i++)
      for (let j = i + 1; j < particles.length; j++) {
        const particle = particles[i];
        const other = particles[j];
        const distance = particle.getDistanceSquared(other);
        const maxDistance = 20000; // arbitraty value 

        // draw line between particles
        if (distance < maxDistance) {
          const normalizedDistance = normalize(0, maxDistance, distance);
          const colorRangeR = particle.color.r - other.color.r;
          const colorRangeB = particle.color.b - other.color.b;
          context.save();

          // normalize line color based on both particle colors
          context.strokeStyle = `rgb(${
            normalizedDistance * colorRangeR + particle.color.r
          },0,${normalizedDistance * colorRangeB - particle.color.b})`;
          context.lineWidth = 1 * (1 - normalizedDistance);
          context.beginPath();
          context.moveTo(particle.pos.x, particle.pos.y);
          context.lineTo(other.pos.x, other.pos.y);
          context.stroke();
          context.restore();
        }
      }

    particles.forEach((particle) => void particle.draw());
  };
};

canvasSketch(sketch, settings);
