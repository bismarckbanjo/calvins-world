export const WORLD = { w: 5200, h: 760 };

export const LEVEL = {
  spawn: { x: 110, y: 540 },
  goal: { x: 4920, y: 478, w: 54, h: 82 },
  platforms: [
    { type: "static",   x: 0,    y: 650, w: 520, h: 80 },
    { type: "static",   x: 620,  y: 585, w: 260, h: 42 },
    { type: "moving",   x: 980,  y: 510, w: 240, h: 42, x1: 980,  x2: 1220, y1: 510, y2: 510, duration: 2.8 },
    { type: "static",   x: 1350, y: 585, w: 320, h: 42 },
    { type: "crumble",  x: 1790, y: 500, w: 220, h: 42, crumbleDelay: 0.55, respawnDelay: 2.4 },
    { type: "moving",   x: 2130, y: 430, w: 220, h: 42, x1: 2130, x2: 2130, y1: 430, y2: 565, duration: 2.4 },
    { type: "static",   x: 2470, y: 540, w: 360, h: 42 },
    { type: "crumble",  x: 2990, y: 470, w: 220, h: 42, crumbleDelay: 0.65, respawnDelay: 2.7 },
    { type: "moving",   x: 3300, y: 390, w: 220, h: 42, x1: 3300, x2: 3550, y1: 390, y2: 455, duration: 3.2 },
    { type: "static",   x: 3620, y: 500, w: 340, h: 42 },
    { type: "crumble",  x: 4100, y: 430, w: 260, h: 42, crumbleDelay: 0.7,  respawnDelay: 2.5 },
    { type: "static",   x: 4520, y: 560, w: 600, h: 80 }
  ]
};
