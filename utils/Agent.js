const Vector = require('./Vector');

class Agent {
  constructor(x, y, radius, vel, color) {
    this.pos = new Vector(x, y);
    this.radius = radius;
    this.vel = vel;
    this.color = color;
  }
}

module.exports = Agent
