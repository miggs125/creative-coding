export const getDistanceSquared = (a, b) => {
  const dx = a.pos.x - b.pos.x;
  const dy = a.pos.y - b.pos.y;
  return dx * dx + dy * dy;
};

export const getDistance = (a, b) => Math.sqrt(getDistanceSquared(a, b));
