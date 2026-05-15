export const WORLD = { w: 5200, h: 760 };

// Continuous ground at y=600 (with gaps = manholes).
// Buildings/rooftops sit above. Obstacles sit on the sidewalk.
//
// type   = collision behavior: "static" | "moving" | "crumble"
// kind   = visual/thematic label: "ground" | "barrel" | "bench" | "cone" |
//          "car" | "awning" | "windowsill" | "rooftop"
//
// manholes = gaps in the sidewalk. Touching one ends the run.
// bones    = collectibles. Cluster on rooftops/sills for the bigger rewards.

export const LEVEL = {
  spawn: { x: 80, y: 540 },
  goal: { x: 5050, y: 318, w: 54, h: 82 },

  platforms: [
    // ----- SIDEWALK (continuous, with 3 manhole gaps) -----
    { type: "static", kind: "ground", x: 0,    y: 600, w: 1080, h: 160 },
    { type: "static", kind: "ground", x: 1180, y: 600, w: 1220, h: 160 },
    { type: "static", kind: "ground", x: 2480, y: 600, w: 1220, h: 160 },
    { type: "static", kind: "ground", x: 3780, y: 600, w: 1420, h: 160 }, // includes flagpole base

    // ----- STREET OBSTACLES (hurdles + step-stones) -----
    { type: "static", kind: "barrel", x: 250,  y: 560, w: 40,  h: 40 },
    { type: "static", kind: "bench",  x: 600,  y: 560, w: 120, h: 40 },
    { type: "static", kind: "cone",   x: 900,  y: 565, w: 30,  h: 35 },
    { type: "static", kind: "car",    x: 1300, y: 540, w: 180, h: 60 },
    { type: "static", kind: "barrel", x: 1700, y: 560, w: 40,  h: 40 },
    { type: "static", kind: "barrel", x: 1745, y: 560, w: 40,  h: 40 },
    { type: "static", kind: "bench",  x: 2050, y: 560, w: 120, h: 40 },
    { type: "static", kind: "cone",   x: 2300, y: 565, w: 30,  h: 35 },
    { type: "static", kind: "cone",   x: 2335, y: 565, w: 30,  h: 35 },
    { type: "static", kind: "car",    x: 2700, y: 540, w: 180, h: 60 },
    { type: "static", kind: "bench",  x: 3100, y: 560, w: 120, h: 40 },
    { type: "static", kind: "car",    x: 3900, y: 540, w: 180, h: 60 },
    { type: "static", kind: "barrel", x: 4400, y: 560, w: 40,  h: 40 },
    { type: "static", kind: "bench",  x: 4600, y: 560, w: 120, h: 40 },

    // ----- AWNINGS + WINDOW SILLS (single-jump reachable, often from an obstacle) -----
    { type: "static", kind: "awning",     x: 350,  y: 440, w: 140, h: 20 },
    { type: "static", kind: "windowsill", x: 1450, y: 450, w: 90,  h: 18 },
    { type: "static", kind: "windowsill", x: 2200, y: 440, w: 90,  h: 18 },
    { type: "static", kind: "awning",     x: 3050, y: 440, w: 160, h: 20 },
    { type: "static", kind: "windowsill", x: 4100, y: 440, w: 90,  h: 18 },

    // ----- ROOFTOPS (double-jump reachable; often from a car/awning) -----
    { type: "static", kind: "rooftop", x: 500,  y: 260, w: 400, h: 30 },
    { type: "static", kind: "rooftop", x: 1100, y: 280, w: 260, h: 30 },
    { type: "static", kind: "rooftop", x: 1550, y: 250, w: 400, h: 30 },
    { type: "moving", kind: "rooftop", x: 2050, y: 270, w: 180, h: 28, x1: 2050, x2: 2300, y1: 270, y2: 270, duration: 3.4 },
    { type: "static", kind: "rooftop", x: 2400, y: 240, w: 480, h: 30 },
    { type: "static", kind: "rooftop", x: 3000, y: 270, w: 240, h: 30 },
    { type: "static", kind: "rooftop", x: 3300, y: 230, w: 460, h: 30 },
    { type: "moving", kind: "rooftop", x: 3850, y: 280, w: 160, h: 28, x1: 3850, x2: 4080, y1: 280, y2: 360, duration: 3.0 },
    { type: "static", kind: "rooftop", x: 4180, y: 220, w: 360, h: 30 },
    { type: "static", kind: "rooftop", x: 4700, y: 280, w: 360, h: 30 }  // flagpole sits here
  ],

  // Open manholes in the sidewalk gaps. Falling in = run over.
  manholes: [
    { x: 1080, y: 600, w: 100 },
    { x: 2400, y: 600, w: 80  },
    { x: 3700, y: 600, w: 80  }
  ],

  // Small bones along the sidewalk; bigger clusters up high.
  bones: [
    // Sidewalk-level breadcrumbs
    { x: 180,  y: 570 },
    { x: 420,  y: 570 },
    { x: 800,  y: 570 },
    { x: 1620, y: 570 },
    { x: 1900, y: 570 },
    { x: 2200, y: 570 },
    { x: 2900, y: 570 },
    { x: 3260, y: 570 },
    { x: 3580, y: 570 },
    { x: 4300, y: 570 },
    { x: 4520, y: 570 },

    // Awning + window-sill rewards
    { x: 400,  y: 410 },
    { x: 1470, y: 420 },
    { x: 2220, y: 410 },
    { x: 3110, y: 410 },
    { x: 4120, y: 410 },

    // Rooftop clusters
    { x: 600,  y: 230 }, { x: 660,  y: 230 }, { x: 720,  y: 230 },
    { x: 1660, y: 220 }, { x: 1720, y: 220 }, { x: 1780, y: 220 },
    { x: 2500, y: 210 }, { x: 2560, y: 210 }, { x: 2620, y: 210 }, { x: 2680, y: 210 },
    { x: 3400, y: 200 }, { x: 3460, y: 200 }, { x: 3520, y: 200 },
    { x: 4220, y: 190 }, { x: 4280, y: 190 }, { x: 4340, y: 190 }
  ]
};
