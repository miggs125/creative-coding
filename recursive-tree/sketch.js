const canvasSketch = require("canvas-sketch");

const settings = {
  dimensions: [2048, 2048],
};

const sketch = ({ context, width, height }) => {
  const branch = (length) => {
    const slice = 3;
    const angle = Math.PI / slice;
    if (Math.abs(length) < 10) return;
    const newLength = length * 0.67;
    context.beginPath();
    context.moveTo(0, 0);
    context.lineTo(0, newLength);
    context.stroke();
    context.translate(0, newLength);

    for (let i = 1; i <= slice; i++) {
      let branchAngle = angle - 2 * i * (angle / slice);
      context.save();
      context.rotate(branchAngle);
      branch(newLength);
      context.restore();
    }
  };

  const drawTree = () => {
    context.strokeStyle = "white";
    context.translate(width / 2, height);
    context.lineWidth = 1;
    branch(-height * 0.2);
  };

  return ({ context, width, height }) => {
    context.fillStyle = "grey";
    context.fillRect(0, 0, width, height);
    drawTree();
  };
};

canvasSketch(sketch, settings);
