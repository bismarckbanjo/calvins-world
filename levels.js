export const WORLD = { w: 5200, h: 760 };

// Top-down road runner.
// Road band runs from y=540 (back of road) to y=700 (front of road).
// Calvin can walk in X (forward) and Y (between lanes) freely.
//
// platforms = solid obstacles Calvin walks around. type stays "static",
//             kind = "barrel" | "cone" | "bench" | "car".
// bones     = collectibles scattered across all lanes.
// goal      = flag at the far end, also at road level.

export const ROAD = { top: 540, bottom: 700 };

export const LEVEL = {
  spawn: { x: 90, y: 620 },
  goal: { x: 5050, y: 580, w: 54, h: 82 },

  platforms: [
    // Cluster 1 — easy intro: lone obstacles per lane so the player learns to dodge
    { type: "static", kind: "barrel", x: 350,  y: 560, w: 40,  h: 40 },
    { type: "static", kind: "cone",   x: 520,  y: 660, w: 30,  h: 35 },
    { type: "static", kind: "bench",  x: 700,  y: 555, w: 120, h: 40 },

    // Cluster 2 — pick a lane
    { type: "static", kind: "car",    x: 1000, y: 560, w: 180, h: 60 },
    { type: "static", kind: "barrel", x: 1100, y: 670, w: 40,  h: 40 },
    { type: "static", kind: "cone",   x: 1220, y: 545, w: 30,  h: 35 },

    // Cluster 3 — bench + cones squeeze you to the back
    { type: "static", kind: "bench",  x: 1500, y: 660, w: 140, h: 40 },
    { type: "static", kind: "cone",   x: 1650, y: 600, w: 30,  h: 35 },

    // Cluster 4 — parked car in the middle, weave around
    { type: "static", kind: "car",    x: 1900, y: 595, w: 180, h: 60 },
    { type: "static", kind: "barrel", x: 2150, y: 545, w: 40,  h: 40 },
    { type: "static", kind: "barrel", x: 2200, y: 660, w: 40,  h: 40 },

    // Cluster 5 — cone alley
    { type: "static", kind: "cone",   x: 2450, y: 555, w: 30,  h: 35 },
    { type: "static", kind: "cone",   x: 2500, y: 610, w: 30,  h: 35 },
    { type: "static", kind: "cone",   x: 2550, y: 665, w: 30,  h: 35 },

    // Cluster 6
    { type: "static", kind: "bench",  x: 2800, y: 595, w: 140, h: 40 },
    { type: "static", kind: "car",    x: 3050, y: 560, w: 180, h: 60 },
    { type: "static", kind: "barrel", x: 3300, y: 670, w: 40,  h: 40 },

    // Cluster 7
    { type: "static", kind: "cone",   x: 3550, y: 545, w: 30,  h: 35 },
    { type: "static", kind: "bench",  x: 3700, y: 655, w: 140, h: 40 },
    { type: "static", kind: "barrel", x: 3900, y: 580, w: 40,  h: 40 },

    // Cluster 8
    { type: "static", kind: "car",    x: 4150, y: 600, w: 180, h: 60 },
    { type: "static", kind: "cone",   x: 4200, y: 545, w: 30,  h: 35 },
    { type: "static", kind: "barrel", x: 4400, y: 670, w: 40,  h: 40 },

    // Final stretch
    { type: "static", kind: "bench",  x: 4650, y: 555, w: 140, h: 40 },
    { type: "static", kind: "cone",   x: 4800, y: 660, w: 30,  h: 35 }
  ],

  bones: [
    // Scattered across all lanes so exploring Y pays off
    { x: 180,  y: 580 }, { x: 250,  y: 670 }, { x: 420,  y: 555 },
    { x: 600,  y: 670 }, { x: 850,  y: 555 }, { x: 950,  y: 670 },
    { x: 1100, y: 560 }, { x: 1300, y: 620 }, { x: 1400, y: 560 },
    { x: 1450, y: 690 }, { x: 1750, y: 555 }, { x: 1820, y: 690 },
    { x: 2050, y: 555 }, { x: 2100, y: 690 }, { x: 2300, y: 600 },
    { x: 2450, y: 690 }, { x: 2620, y: 555 }, { x: 2750, y: 690 },
    { x: 2950, y: 555 }, { x: 3000, y: 690 }, { x: 3200, y: 690 },
    { x: 3350, y: 555 }, { x: 3500, y: 690 }, { x: 3650, y: 555 },
    { x: 3850, y: 690 }, { x: 3950, y: 555 }, { x: 4050, y: 690 },
    { x: 4300, y: 690 }, { x: 4500, y: 690 }, { x: 4600, y: 555 },
    { x: 4750, y: 690 }, { x: 4900, y: 620 }
  ]
};
