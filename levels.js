export const WORLD = { w: 5200, h: 760 };

// Top-down road. XY on the road plane + a Z axis for jump height.
//
// platforms come in two flavours, identified by `solidFromBelow`:
//
//   true  — road obstacles. Solid 0..top in Z. Calvin walks around them
//           or jumps OVER them when his z >= top.
//   false — elevated platforms (awnings, window sills, rooftops).
//           Calvin can pass under them freely. Only one-way landing
//           from above when he descends through their `top`.
//
// kind sets the visual style: ground obstacles `barrel|cone|bench|car`,
// elevated `awning|windowsill|rooftop`.

export const ROAD = { top: 540, bottom: 700 };

export const LEVEL = {
  spawn: { x: 90, y: 620 },
  goal: { x: 5070, y: 580, w: 54, h: 82 },

  platforms: [
    // ---------- Road-level hurdles (jumpable) ----------
    { type: "static", kind: "barrel", x: 380,  y: 670, w: 40,  h: 40, top: 40,  solidFromBelow: true },
    { type: "static", kind: "cone",   x: 760,  y: 560, w: 30,  h: 35, top: 35,  solidFromBelow: true },
    { type: "static", kind: "bench",  x: 1080, y: 655, w: 140, h: 40, top: 40,  solidFromBelow: true },
    { type: "static", kind: "car",    x: 1620, y: 600, w: 180, h: 60, top: 60,  solidFromBelow: true },
    { type: "static", kind: "barrel", x: 2100, y: 555, w: 40,  h: 40, top: 40,  solidFromBelow: true },
    { type: "static", kind: "cone",   x: 2480, y: 670, w: 30,  h: 35, top: 35,  solidFromBelow: true },
    { type: "static", kind: "bench",  x: 2860, y: 555, w: 140, h: 40, top: 40,  solidFromBelow: true },
    { type: "static", kind: "car",    x: 3320, y: 620, w: 180, h: 60, top: 60,  solidFromBelow: true },
    { type: "static", kind: "barrel", x: 3760, y: 555, w: 40,  h: 40, top: 40,  solidFromBelow: true },
    { type: "static", kind: "cone",   x: 4120, y: 670, w: 30,  h: 35, top: 35,  solidFromBelow: true },
    { type: "static", kind: "bench",  x: 4460, y: 620, w: 140, h: 40, top: 40,  solidFromBelow: true },

    // ---------- Elevated platforms (one-way landings) ----------
    // Footprints span the full road band so a jumped-from-anywhere lands on them.
    // Awnings: easy single-jump reach.
    { type: "static", kind: "awning",     x: 200,  y: 540, w: 180, h: 160, top: 80,  solidFromBelow: false },
    { type: "static", kind: "awning",     x: 580,  y: 540, w: 180, h: 160, top: 80,  solidFromBelow: false },
    { type: "static", kind: "windowsill", x: 880,  y: 540, w: 110, h: 160, top: 110, solidFromBelow: false },
    // First rooftop — needs a double jump (or a step from the window sill below)
    { type: "static", kind: "rooftop",    x: 1120, y: 540, w: 360, h: 160, top: 170, solidFromBelow: false },

    { type: "static", kind: "windowsill", x: 1880, y: 540, w: 110, h: 160, top: 110, solidFromBelow: false },
    { type: "static", kind: "rooftop",    x: 2080, y: 540, w: 320, h: 160, top: 170, solidFromBelow: false },

    { type: "static", kind: "awning",     x: 2520, y: 540, w: 180, h: 160, top: 90,  solidFromBelow: false },
    { type: "static", kind: "rooftop",    x: 2780, y: 540, w: 320, h: 160, top: 170, solidFromBelow: false },

    { type: "static", kind: "windowsill", x: 3200, y: 540, w: 110, h: 160, top: 110, solidFromBelow: false },
    { type: "static", kind: "rooftop",    x: 3500, y: 540, w: 380, h: 160, top: 180, solidFromBelow: false },

    { type: "static", kind: "awning",     x: 3960, y: 540, w: 180, h: 160, top: 80,  solidFromBelow: false },
    { type: "static", kind: "rooftop",    x: 4200, y: 540, w: 380, h: 160, top: 180, solidFromBelow: false },

    { type: "static", kind: "awning",     x: 4640, y: 540, w: 200, h: 160, top: 90,  solidFromBelow: false }
  ],

  bones: [
    // Road-level breadcrumbs (light scatter to keep walking interesting)
    { x: 170,  y: 620 }, { x: 500,  y: 680 }, { x: 900,  y: 560 },
    { x: 1380, y: 680 }, { x: 1850, y: 560 }, { x: 2300, y: 680 },
    { x: 2780, y: 560 }, { x: 3160, y: 680 }, { x: 3650, y: 620 },
    { x: 4040, y: 560 }, { x: 4420, y: 680 }, { x: 4900, y: 620 },

    // Reward bones on the elevated platforms — most of the haul lives up high
    { x: 240,  y: 640 }, { x: 320,  y: 640 },                                     // awning 1
    { x: 640,  y: 620 }, { x: 720,  y: 620 },                                     // awning 2
    { x: 920,  y: 640 },                                                          // window sill 1
    { x: 1200, y: 620 }, { x: 1280, y: 620 }, { x: 1360, y: 620 }, { x: 1440, y: 620 }, // rooftop 1
    { x: 1920, y: 620 },                                                          // window sill 2
    { x: 2160, y: 640 }, { x: 2240, y: 640 }, { x: 2320, y: 640 },                // rooftop 2
    { x: 2580, y: 620 }, { x: 2660, y: 620 },                                     // awning 3
    { x: 2860, y: 640 }, { x: 2940, y: 640 }, { x: 3020, y: 640 },                // rooftop 3
    { x: 3240, y: 620 },                                                          // window sill 3
    { x: 3580, y: 640 }, { x: 3680, y: 640 }, { x: 3780, y: 640 }, { x: 3860, y: 640 }, // rooftop 4
    { x: 4020, y: 620 }, { x: 4100, y: 620 },                                     // awning 4
    { x: 4280, y: 640 }, { x: 4400, y: 640 }, { x: 4520, y: 640 },                // rooftop 5
    { x: 4700, y: 640 }, { x: 4800, y: 640 }                                      // awning 5
  ]
};
