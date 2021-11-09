const canvasSketch = require("canvas-sketch");
const Color = require("../utils/Color");
const { getDistanceSquared } = require("../utils/general");
const settings = {
  dimensions: [window.innerWidth, window.innerHeight],
  animate: true,
  duration: 10,
  fps: 36,
};

const drawCircle = (x, y, radius, context, progress) => {
  let p = progress * 2;

  const steps = 100;
  let color1 = undefined;
  let color2 = undefined;

  context.save();
  context.translate(x, y);
  const start = new Color(Math.cos(progress) * 255 + 100, 0, 0);
  const end = new Color(0, 0, Math.cos(progress) * 255 + 100);
  if (p < 1) {
    color1 = start;
    color2 = end;
  } else {
    color2 = start;
    color1 = end;
    p = p - 1;
  }
  context.lineWidth = 4;

  context.beginPath();

  context.fillStyle = `rgb(${color1.r * p + color2.r * (1 - p)},${
    color1.g * p + color2.g * (1 - p)
  },${color1.b * p + color2.b * (1 - p)})`;

  for (let m = 0; m < steps; m++) {
    const theta = (m / steps) * 2 * Math.PI;
    const x = radius * Math.sin(theta);
    const y = radius * Math.cos(theta);

    context.lineTo(x, y);
  }
  context.closePath();
  context.fill();

  context.lineWidth = 4;

  context.beginPath();

  const ph = p * 2 - 1;
  for (let n = 0; n < steps; n++) {
    const theta = (n / steps) * 2 * Math.PI;
    let xx = radius * Math.sin(theta);
    const yy = radius * Math.cos(theta);

    if (theta > Math.PI) {
      xx *= ph;
    }
    context.lineTo(xx, yy);
  }
  context.closePath();
  context.fill();
  context.restore();
};

const hexGrid = (width, height, radius) => {
  const offset = radius * 0.5;
  const cols = Math.ceil(width / radius);
  const root3 = Math.sqrt(3);
  const rows = Math.ceil(height / ((radius * root3) / 2));
  const coordinates = [];

  for (let row = 0; row < rows; row++) {
    const offsetRow = row % 2;
    for (let col = 0; col < cols; col++) {
      const x = col * radius + offset * offsetRow - width / 2;
      const y = (row * radius * root3) / 2 + radius / 4 - height / 2;

      coordinates.push({ x, y });
    }
  }

  return coordinates;
};

const sketch = ({ context, width, height }) => {
  const maxDist = getDistanceSquared(
    { pos: { x: 0, y: 0 } },
    { pos: { x: width / 2, y: height / 2 } }
  );
  const radius = 15;
  const grid = hexGrid(width, height, radius * 2);
 
  return ({ context, width, height, playhead }) => {
    context.fillStyle = "#ccc";
    context.fillRect(0, 0, width, height);
    context.translate(width / 2, height / 2);

    grid.forEach(({ x, y }) => {
      const distFactor =
        getDistanceSquared({ pos: { x: 0, y: 0 } }, { pos: { x, y } }) /
        maxDist;  

      const angleFactor = Math.atan2(y, x) / Math.PI;
      const prog = (distFactor + playhead + angleFactor + 4) % 1;

      drawCircle(x, y, radius, context, prog);
    });

  };
};

canvasSketch(sketch, settings);
