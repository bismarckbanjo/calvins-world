import { WORLD, LEVEL } from "./levels.js";

(() => {
  "use strict";

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");

  const calvinBodyImg = new Image();
  calvinBodyImg.src = "assets/calvin-body.png";
  const calvinLegsImg = new Image();
  calvinLegsImg.src = "assets/calvin-legs.png";
  const calvinJumpLegsImg = new Image();
  calvinJumpLegsImg.src = "assets/calvin-jump-legs.png";

  const hud = document.getElementById("hud");
  const overlay = document.getElementById("overlay");
  const rocker = document.getElementById("rocker");
  const jumpBtn = document.getElementById("jumpBtn");
  const slideBtn = document.getElementById("slideBtn");
  const resetBtn = document.getElementById("resetBtn");

  const GRAVITY = 2300;
  const MAX_FALL = 1800;
  const BEST_KEY = "calvins-world:best-distance";

  const TUNING = {
    groundAccel: 11925,
    airAccel: 2700,
    groundFriction: 0.84,
    airDrag: 0.94,
    jumpCarrySpeedCap: 470,
    jumpHorizontalDamping: 0.82,
    maxRun: 968,
    momentumDelay: 2.0,
    momentumRampTime: 1.4,
    momentumMaxBonus: 417,
    momentumAccelBoost: 1.45,
    airMomentumControlPenalty: 0.42,
    coyote: 0.115,
    jumpBuffer: 0.13,
    smallJumpVy: -610,
    fullJumpVy: -825,
    doubleJumpVy: -760,
    doubleJumpHorizontalKick: 25,
    jumpHoldGravityScale: 0.52,
    apexVelocityWindow: 135,
    apexGravityScale: 0.58,
    jumpCutMultiplier: 0.48,
    maxJumpHold: 0.16,
    ledgeGrabX: 24,
    ledgeGrabY: 34,
    ledgeHangOffsetX: 17,
    ledgeHangOffsetY: 20,
    ledgeClimbTime: 0.24,
    slideDuration: 0.58,
    slideCooldown: 0.12,
    slideRadiusY: 14,
    slideBoost: 235,
    slideFriction: 0.988,
    slideMinSpeed: 520
  };

  function makePlatform(def) {
    return {
      type: "static",
      x: def.x, y: def.y, w: def.w, h: def.h,
      baseX: def.x, baseY: def.y,
      prevX: def.x, prevY: def.y,
      dx: 0, dy: 0,
      active: true
    };
  }

  function makeMovingPlatform(def) {
    return {
      ...makePlatform(def),
      type: "moving",
      path: { x1: def.x1, x2: def.x2, y1: def.y1, y2: def.y2, duration: def.duration },
      t: 0
    };
  }

  function makeCrumblePlatform(def) {
    return {
      ...makePlatform(def),
      type: "crumble",
      touched: false,
      crumbleTimer: 0,
      respawnTimer: 0,
      crumbleDelay: def.crumbleDelay ?? 0.65,
      respawnDelay: def.respawnDelay ?? 2.6,
      dropY: 0
    };
  }

  const platforms = LEVEL.platforms.map(def => {
    if (def.type === "moving") return makeMovingPlatform(def);
    if (def.type === "crumble") return makeCrumblePlatform(def);
    return makePlatform(def);
  });

  const goal = LEVEL.goal;

  let DPR = 1, W = 0, H = 0, scale = 1;
  let cameraX = 0, cameraY = 0;
  let last = 0;
  let state = "title";
  let paused = false;
  let bestDistance = Number(localStorage.getItem(BEST_KEY) || 0);

  let audioCtx = null;
  function ensureAudio() {
    if (audioCtx) return audioCtx;
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (_) { audioCtx = null; }
    return audioCtx;
  }
  function playTone({ freq = 440, dur = 0.12, type = "sine", gain = 0.12, slide = 0 }) {
    const a = ensureAudio();
    if (!a) return;
    if (a.state === "suspended") a.resume();
    const now = a.currentTime;
    const osc = a.createOscillator();
    const g = a.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), now + dur);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(gain, now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.connect(g).connect(a.destination);
    osc.start(now);
    osc.stop(now + dur + 0.02);
  }
  const sfx = {
    jump:   () => playTone({ freq: 380, dur: 0.13, type: "square",   gain: 0.08, slide:  220 }),
    double: () => playTone({ freq: 520, dur: 0.14, type: "triangle", gain: 0.09, slide:  260 }),
    land:   () => playTone({ freq: 180, dur: 0.08, type: "sine",     gain: 0.06, slide:  -40 }),
    slide:  () => playTone({ freq: 260, dur: 0.18, type: "sawtooth", gain: 0.05, slide: -120 }),
    win:    () => { playTone({freq:520,dur:0.12,type:"triangle",gain:0.1}); setTimeout(()=>playTone({freq:780,dur:0.18,type:"triangle",gain:0.1}),120); },
    die:    () => playTone({ freq: 220, dur: 0.32, type: "sawtooth", gain: 0.09, slide: -160 })
  };

  const input = {
    left: false, right: false,
    jump: false, jumpPressed: false, jumpReleased: false,
    down: false,
    slide: false, slidePressed: false,
    move: 0,
    pointerMoveId: null,
    pointerJumpId: null
  };

  const player = {
    x: LEVEL.spawn.x, y: LEVEL.spawn.y,
    vx: 0, vy: 0,
    r: 24,
    grounded: false, wasGrounded: false,
    coyoteTimer: 0, jumpBufferTimer: 0,
    jumpsUsed: 0,
    jumpHoldTimer: 0, holdingJump: false,
    facing: 1,
    runTime: 0,
    squash: 0,
    blink: 0,
    heldDirection: 0, heldDirectionTime: 0,
    momentum: 0,
    ledgeGrabbed: false, ledgePlatform: null, ledgeSide: 0,
    ledgeClimbTimer: 0,
    ledgeClimbFromX: 0, ledgeClimbFromY: 0,
    ledgeClimbToX: 0, ledgeClimbToY: 0,
    sliding: false, slideTimer: 0, slideCooldown: 0, slideDir: 1
  };

  function resize() {
    DPR = Math.max(1, Math.min(2.5, window.devicePixelRatio || 1));
    W = Math.floor(window.innerWidth);
    H = Math.floor(window.innerHeight);
    canvas.width = Math.floor(W * DPR);
    canvas.height = Math.floor(H * DPR);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    scale = Math.min(W / 960, H / 540);
  }

  function bestText() {
    return bestDistance > 0 ? `<p>Best: <strong>${bestDistance}m</strong></p>` : "";
  }

  function reset() {
    Object.assign(player, {
      x: LEVEL.spawn.x, y: LEVEL.spawn.y, vx: 0, vy: 0,
      grounded: false, wasGrounded: false,
      coyoteTimer: 0, jumpBufferTimer: 0,
      jumpsUsed: 0, jumpHoldTimer: 0,
      holdingJump: false, facing: 1, runTime: 0,
      squash: 0, blink: 0,
      ledgeGrabbed: false, ledgePlatform: null, ledgeSide: 0, ledgeClimbTimer: 0,
      sliding: false, slideTimer: 0, slideCooldown: 0
    });
    resetPlatforms();
    cameraX = 0;
    cameraY = 0;
    state = "play";
    overlay.classList.add("hidden");
  }

  function recordDistance() {
    const dist = Math.max(0, Math.floor(player.x / 10));
    if (dist > bestDistance) {
      bestDistance = dist;
      try { localStorage.setItem(BEST_KEY, String(bestDistance)); } catch (_) {}
    }
  }

  function win() {
    state = "win";
    recordDistance();
    sfx.win();
    overlay.innerHTML = `<div class="card"><h1>Nice hops.</h1><p>Calvin reached the goal.</p>${bestText()}<p>Press reset or Space to play again.</p></div>`;
    overlay.classList.remove("hidden");
  }

  function die() {
    state = "dead";
    recordDistance();
    sfx.die();
    overlay.innerHTML = `<div class="card"><h1>Oof.</h1><p>Calvin fell into the clouds.</p>${bestText()}<p>Press reset or Space to try again.</p></div>`;
    overlay.classList.remove("hidden");
  }

  function consumeJumpPress() {
    input.jumpPressed = false;
    player.jumpBufferTimer = TUNING.jumpBuffer;
    if (state !== "play") reset();
  }

  function pressJump() {
    ensureAudio();
    if (!input.jump) input.jumpPressed = true;
    input.jump = true;
  }

  function releaseJump() {
    if (input.jump) input.jumpReleased = true;
    input.jump = false;
  }

  function pressSlide() {
    if (!input.slide) input.slidePressed = true;
    input.slide = true;
  }

  function releaseSlide() { input.slide = false; }

  function setMoveFromBooleans() {
    input.move = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  }

  window.addEventListener("resize", resize);

  window.addEventListener("blur", () => { paused = true; });
  window.addEventListener("focus", () => { paused = false; last = 0; });
  document.addEventListener("visibilitychange", () => {
    paused = document.hidden;
    if (!paused) last = 0;
  });

  window.addEventListener("keydown", e => {
    if (["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Space","KeyA","KeyD","KeyW","KeyS","KeyR","ShiftLeft","ShiftRight"].includes(e.code)) e.preventDefault();
    if (e.code === "ArrowLeft" || e.code === "KeyA") input.left = true;
    if (e.code === "ArrowRight" || e.code === "KeyD") input.right = true;
    if (e.code === "ArrowUp" || e.code === "KeyW" || e.code === "Space") pressJump();
    if (e.code === "ArrowDown" || e.code === "KeyS") input.down = true;
    if (e.code === "ShiftLeft" || e.code === "ShiftRight") pressSlide();
    if (e.code === "KeyR") reset();
    setMoveFromBooleans();
  }, { passive: false });

  window.addEventListener("keyup", e => {
    if (e.code === "ArrowLeft" || e.code === "KeyA") input.left = false;
    if (e.code === "ArrowRight" || e.code === "KeyD") input.right = false;
    if (e.code === "ArrowUp" || e.code === "KeyW" || e.code === "Space") releaseJump();
    if (e.code === "ArrowDown" || e.code === "KeyS") input.down = false;
    if (e.code === "ShiftLeft" || e.code === "ShiftRight") releaseSlide();
    setMoveFromBooleans();
  });

  function bindPointerButton(el, down, up) {
    el.addEventListener("pointerdown", e => {
      e.preventDefault();
      el.setPointerCapture(e.pointerId);
      el.classList.add("active");
      down(e);
    }, { passive: false });
    el.addEventListener("pointerup", e => {
      e.preventDefault();
      el.classList.remove("active");
      up(e);
    }, { passive: false });
    el.addEventListener("pointercancel", e => {
      el.classList.remove("active");
      up(e);
    });
  }

  rocker.addEventListener("pointerdown", e => {
    e.preventDefault();
    input.pointerMoveId = e.pointerId;
    rocker.setPointerCapture(e.pointerId);
    rocker.classList.add("active");
    updateRocker(e);
  }, { passive: false });

  rocker.addEventListener("pointermove", e => {
    if (e.pointerId === input.pointerMoveId) updateRocker(e);
  });

  function updateRocker(e) {
    const rect = rocker.getBoundingClientRect();
    const mid = rect.left + rect.width / 2;
    input.left = e.clientX < mid;
    input.right = e.clientX >= mid;
    setMoveFromBooleans();
  }

  function clearRocker(e) {
    if (e.pointerId !== input.pointerMoveId) return;
    input.pointerMoveId = null;
    input.left = false;
    input.right = false;
    input.move = 0;
    rocker.classList.remove("active");
  }

  rocker.addEventListener("pointerup", clearRocker);
  rocker.addEventListener("pointercancel", clearRocker);

  bindPointerButton(jumpBtn, () => pressJump(), () => releaseJump());
  bindPointerButton(slideBtn, () => pressSlide(), () => releaseSlide());
  bindPointerButton(resetBtn, () => reset(), () => {});

  canvas.addEventListener("pointerdown", e => {
    ensureAudio();
    if (state !== "play") {
      e.preventDefault();
      reset();
    }
  }, { passive: false });

  function playerRadiusY() {
    return player.sliding ? TUNING.slideRadiusY : player.r;
  }

  function rectCircleCollision(cx, cy, r, rect) {
    const closestX = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
    const closestY = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
    const dx = cx - closestX;
    const dy = cy - closestY;
    return dx * dx + dy * dy <= r * r;
  }

  function update(dt) {
    if (input.jumpPressed) consumeJumpPress();

    if (state !== "play") {
      input.jumpPressed = false;
      input.jumpReleased = false;
      input.slidePressed = false;
      return;
    }

    dt = Math.min(dt, 1 / 30);

    if (player.ledgeClimbTimer > 0) {
      player.ledgeClimbTimer -= dt;
      const t = 1 - Math.max(0, player.ledgeClimbTimer / TUNING.ledgeClimbTime);
      const eased = 1 - Math.pow(1 - t, 3);
      player.x = player.ledgeClimbFromX + (player.ledgeClimbToX - player.ledgeClimbFromX) * eased;
      player.y = player.ledgeClimbFromY + (player.ledgeClimbToY - player.ledgeClimbFromY) * eased;
      player.vx = 0;
      player.vy = 0;
      player.grounded = true;
      player.wasGrounded = true;
      player.coyoteTimer = TUNING.coyote;
      player.jumpsUsed = 0;
      input.jumpPressed = false;
      input.jumpReleased = false;
      input.slidePressed = false;
      updatePuffs(dt);
      cameraFollow(dt);
      updateHud("Climbing");
      return;
    }

    if (player.ledgeGrabbed) {
      handleLedgeHang(dt);
      updatePuffs(dt);
      cameraFollow(dt);
      updateHud("Ledge");
      input.jumpPressed = false;
      input.jumpReleased = false;
      input.slidePressed = false;
      return;
    }

    updatePlatforms(dt);

    player.wasGrounded = player.grounded;
    player.grounded = false;

    if (player.jumpBufferTimer > 0) player.jumpBufferTimer -= dt;
    if (player.coyoteTimer > 0) player.coyoteTimer -= dt;

    const desired = input.move;
    if (desired !== 0) player.facing = desired;

    if (desired !== 0) {
      if (desired === player.heldDirection) {
        player.heldDirectionTime += dt;
      } else {
        player.heldDirection = desired;
        player.heldDirectionTime = 0;
        player.momentum = 0;
      }
    } else {
      player.heldDirection = 0;
      player.heldDirectionTime = 0;
      player.momentum = Math.max(0, player.momentum - dt * 1.85);
    }

    const momentumTarget = desired !== 0 && player.heldDirectionTime > TUNING.momentumDelay
      ? Math.min(1, (player.heldDirectionTime - TUNING.momentumDelay) / TUNING.momentumRampTime)
      : 0;

    const momentumEase = 1 - Math.pow(0.001, dt);
    player.momentum += (momentumTarget - player.momentum) * momentumEase;

    const activeMaxRun = TUNING.maxRun + TUNING.momentumMaxBonus * player.momentum;
    const groundAccel = TUNING.groundAccel * (1 + (TUNING.momentumAccelBoost - 1) * player.momentum);
    const airAccel = TUNING.airAccel * (1 - TUNING.airMomentumControlPenalty * player.momentum);
    const accel = player.wasGrounded ? groundAccel : airAccel;

    player.vx += desired * accel * dt;

    if (desired === 0) {
      player.vx *= player.wasGrounded ? Math.pow(TUNING.groundFriction, dt * 60) : Math.pow(TUNING.airDrag, dt * 60);
      if (Math.abs(player.vx) < 5) player.vx = 0;
    }

    const clampSpeed = player.wasGrounded ? activeMaxRun : TUNING.jumpCarrySpeedCap;
    player.vx = Math.max(-clampSpeed, Math.min(clampSpeed, player.vx));

    if (player.slideCooldown > 0) player.slideCooldown -= dt;

    const wantsSlide = input.slidePressed || (input.down && desired !== 0);
    if (wantsSlide && player.wasGrounded && !player.sliding && player.slideCooldown <= 0) {
      beginSlide(desired || player.facing);
    }

    if (player.sliding) updateSlide(dt);

    const canCoyoteJump = player.coyoteTimer > 0;
    const canDoubleJump = player.jumpsUsed < 2 && !canCoyoteJump;

    if (player.jumpBufferTimer > 0 && player.sliding) {
      player.sliding = false;
      player.slideTimer = 0;
    }

    if (player.jumpBufferTimer > 0 && (canCoyoteJump || canDoubleJump)) {
      const isDouble = !canCoyoteJump;
      player.jumpBufferTimer = 0;
      player.grounded = false;
      player.coyoteTimer = 0;
      player.holdingJump = true;
      player.jumpHoldTimer = TUNING.maxJumpHold;

      if (isDouble) {
        player.vy = TUNING.doubleJumpVy;
        player.vx = Math.max(-TUNING.jumpCarrySpeedCap, Math.min(TUNING.jumpCarrySpeedCap, player.vx * TUNING.jumpHorizontalDamping));
        player.vx += input.move * TUNING.doubleJumpHorizontalKick;
        player.jumpsUsed = 2;
        spawnPuff(player.x, player.y + player.r * 0.6, true);
        sfx.double();
      } else {
        player.vy = TUNING.fullJumpVy;
        player.vx = Math.max(-TUNING.jumpCarrySpeedCap, Math.min(TUNING.jumpCarrySpeedCap, player.vx * TUNING.jumpHorizontalDamping));
        player.jumpsUsed = 1;
        spawnPuff(player.x, player.y + player.r, false);
        sfx.jump();
      }

      player.squash = -0.22;
    }

    if (input.jumpReleased && player.vy < 0) {
      player.vy *= TUNING.jumpCutMultiplier;
      player.holdingJump = false;
      player.jumpHoldTimer = 0;
    }

    let gravityScale = 1;

    if (input.jump && player.holdingJump && player.jumpHoldTimer > 0 && player.vy < 0) {
      gravityScale = TUNING.jumpHoldGravityScale;
      player.jumpHoldTimer -= dt;
    } else {
      player.holdingJump = false;
    }

    if (!player.grounded && Math.abs(player.vy) < TUNING.apexVelocityWindow) {
      gravityScale = Math.min(gravityScale, TUNING.apexGravityScale);
    }

    player.vy += GRAVITY * gravityScale * dt;
    player.vy = Math.min(player.vy, MAX_FALL);

    player.x += player.vx * dt;
    for (const p of platforms) {
      if (playerPlatformCollision(p)) {
        const leftPen = (player.x + player.r) - p.x;
        const rightPen = (p.x + p.w) - (player.x - player.r);
        const rY = playerRadiusY();
        const topPen = (player.y + rY) - p.y;
        const bottomPen = (p.y + p.h) - (player.y - rY);
        const minPen = Math.min(leftPen, rightPen, topPen, bottomPen);
        if (minPen === leftPen) player.x = p.x - player.r;
        else if (minPen === rightPen) player.x = p.x + p.w + player.r;
        player.vx = 0;
      }
    }

    player.y += player.vy * dt;
    for (const p of platforms) {
      if (playerPlatformCollision(p)) {
        const rY = playerRadiusY();
        const previousBottom = player.y - player.vy * dt + rY;
        if (player.vy >= 0 && previousBottom <= p.y + 12) {
          player.y = p.y - rY;
          player.x += p.dx;
          player.y += p.dy;
          player.vy = 0;
          player.grounded = true;
          player.coyoteTimer = TUNING.coyote;
          player.jumpsUsed = 0;
          player.holdingJump = false;
          player.jumpHoldTimer = 0;
          touchCrumblePlatform(p);
          if (!player.wasGrounded) {
            player.squash = 0.26;
            spawnPuff(player.x, player.y + player.r, false);
            sfx.land();
          }
        } else if (player.vy < 0) {
          player.y = p.y + p.h + rY;
          player.vy = 0;
          player.holdingJump = false;
        }
      }
    }

    if (!player.grounded && player.vy >= 0) tryLedgeGrab();

    if (player.grounded) player.coyoteTimer = TUNING.coyote;

    player.runTime += Math.abs(player.vx) * dt / 90;
    player.squash *= Math.pow(0.05, dt);
    player.blink += dt;

    updatePuffs(dt);
    cameraFollow(dt);

    if (player.y > WORLD.h + 220) die();

    if (player.x > goal.x && player.x < goal.x + goal.w && player.y + player.r > goal.y && player.y - player.r < goal.y + goal.h) {
      win();
    }

    updateHud();
    input.jumpPressed = false;
    input.jumpReleased = false;
    input.slidePressed = false;
  }

  function updateHud(extra) {
    const dist = Math.max(0, Math.floor(player.x / 10));
    const momentumText = player.momentum > 0.05 ? ` · Momentum: ${Math.round(player.momentum * 100)}%` : "";
    const slideText = player.sliding ? " · Sliding" : "";
    const bestText = bestDistance > 0 ? ` · Best: ${bestDistance}m` : "";
    const extraText = extra ? ` · ${extra}` : "";
    hud.textContent = `Distance: ${dist}m · Jumps: ${player.jumpsUsed}/2${momentumText}${slideText}${bestText}${extraText}`;
  }

  const puffs = [];
  function spawnPuff(x, y, big) {
    for (let i = 0; i < (big ? 18 : 10); i++) {
      puffs.push({
        x, y,
        vx: (Math.random() * 2 - 1) * (big ? 170 : 100),
        vy: -Math.random() * (big ? 150 : 90),
        r: 4 + Math.random() * (big ? 8 : 5),
        life: 0.35 + Math.random() * 0.25,
        max: 0.6
      });
    }
  }

  function rectEllipseCollision(cx, cy, rx, ry, rect) {
    const closestX = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
    const closestY = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
    const dx = (cx - closestX) / rx;
    const dy = (cy - closestY) / ry;
    return dx * dx + dy * dy <= 1;
  }

  function playerPlatformCollision(platform) {
    if (!platform.active) return false;
    if (player.sliding) return rectEllipseCollision(player.x, player.y, player.r, TUNING.slideRadiusY, platform);
    return rectCircleCollision(player.x, player.y, player.r, platform);
  }

  function beginSlide(dir) {
    player.sliding = true;
    player.slideTimer = TUNING.slideDuration;
    player.slideCooldown = TUNING.slideCooldown;
    player.slideDir = dir || player.facing || 1;
    player.facing = player.slideDir;

    const speed = Math.abs(player.vx);
    const boosted = Math.max(speed + TUNING.slideBoost, TUNING.slideMinSpeed);
    const maxSlideSpeed = TUNING.maxRun + TUNING.momentumMaxBonus + TUNING.slideBoost;
    player.vx = player.slideDir * Math.min(boosted, maxSlideSpeed);
    player.squash = 0.36;
    spawnPuff(player.x - player.slideDir * player.r, player.y + player.r, false);
    sfx.slide();
  }

  function updateSlide(dt) {
    player.slideTimer -= dt;
    player.vx *= Math.pow(TUNING.slideFriction, dt * 60);
    player.facing = player.slideDir;

    const shouldStop = player.slideTimer <= 0 || !player.grounded;
    if (shouldStop) {
      player.sliding = false;
      player.slideTimer = 0;
      return;
    }

    if ((input.slide || input.down) && Math.abs(player.vx) > TUNING.slideMinSpeed * 0.65) {
      player.slideTimer = Math.max(player.slideTimer, 0.08);
    }
  }

  function resetPlatforms() {
    for (const p of platforms) {
      p.x = p.baseX;
      p.y = p.baseY;
      p.prevX = p.x;
      p.prevY = p.y;
      p.dx = 0;
      p.dy = 0;
      p.active = true;
      if (p.type === "moving") p.t = 0;
      if (p.type === "crumble") {
        p.touched = false;
        p.crumbleTimer = 0;
        p.respawnTimer = 0;
        p.dropY = 0;
      }
    }
  }

  function updatePlatforms(dt) {
    for (const p of platforms) {
      p.prevX = p.x;
      p.prevY = p.y;
      p.dx = 0;
      p.dy = 0;

      if (p.type === "moving") {
        p.t = (p.t + dt) % p.path.duration;
        const phase = p.t / p.path.duration;
        const wave = (1 - Math.cos(phase * Math.PI * 2)) / 2;
        p.x = p.path.x1 + (p.path.x2 - p.path.x1) * wave;
        p.y = p.path.y1 + (p.path.y2 - p.path.y1) * wave;
      }

      if (p.type === "crumble") {
        if (p.touched && p.active) {
          p.crumbleTimer -= dt;
          if (p.crumbleTimer <= 0) {
            p.active = false;
            p.respawnTimer = p.respawnDelay;
            spawnPuff(p.x + p.w / 2, p.y + p.h / 2, true);
          }
        } else if (!p.active) {
          p.respawnTimer -= dt;
          p.dropY += 520 * dt;
          if (p.respawnTimer <= 0) {
            p.active = true;
            p.touched = false;
            p.crumbleTimer = 0;
            p.dropY = 0;
            p.x = p.baseX;
            p.y = p.baseY;
            spawnPuff(p.x + p.w / 2, p.y + 6, false);
          }
        }
      }

      p.dx = p.x - p.prevX;
      p.dy = p.y - p.prevY;
    }
  }

  function touchCrumblePlatform(platform) {
    if (platform.type !== "crumble" || platform.touched || !platform.active) return;
    platform.touched = true;
    platform.crumbleTimer = platform.crumbleDelay;
  }

  function cameraFollow(dt) {
    const targetCamX = Math.max(0, Math.min(WORLD.w - W, player.x - W * 0.38));
    cameraX += (targetCamX - cameraX) * (1 - Math.pow(0.001, dt));
    cameraY += ((WORLD.h - H) - cameraY) * (1 - Math.pow(0.001, dt));
    cameraY = Math.max(0, cameraY);
  }

  function tryLedgeGrab() {
    if (player.ledgeGrabbed || player.ledgeClimbTimer > 0 || player.sliding) return;
    if (player.vy < 80) return;

    for (const p of platforms) {
      if (!p.active) continue;
      const rY = playerRadiusY();
      const nearTop = player.y + rY > p.y - TUNING.ledgeGrabY &&
                      player.y + rY < p.y + TUNING.ledgeGrabY;
      if (!nearTop) continue;

      const nearLeft = Math.abs((player.x + player.r) - p.x) < TUNING.ledgeGrabX;
      const nearRight = Math.abs((player.x - player.r) - (p.x + p.w)) < TUNING.ledgeGrabX;

      if (nearLeft && player.x < p.x) { beginLedgeGrab(p, -1); return; }
      if (nearRight && player.x > p.x + p.w) { beginLedgeGrab(p, 1); return; }
    }
  }

  function beginLedgeGrab(platform, side) {
    player.ledgeGrabbed = true;
    player.ledgePlatform = platform;
    player.ledgeSide = side;
    player.grounded = false;
    player.wasGrounded = false;
    player.vx = 0;
    player.vy = 0;
    player.holdingJump = false;
    player.jumpHoldTimer = 0;
    player.jumpsUsed = Math.min(player.jumpsUsed, 1);

    if (side < 0) {
      player.x = platform.x - player.r + TUNING.ledgeHangOffsetX;
    } else {
      player.x = platform.x + platform.w + player.r - TUNING.ledgeHangOffsetX;
    }
    player.y = platform.y + TUNING.ledgeHangOffsetY;

    spawnPuff(player.x, player.y + player.r * 0.25, false);
  }

  function handleLedgeHang(dt) {
    const p = player.ledgePlatform;
    if (!p) { player.ledgeGrabbed = false; return; }

    player.vx = 0;
    player.vy = 0;
    player.grounded = false;
    player.coyoteTimer = 0;

    const pressingTowardPlatform =
      (player.ledgeSide < 0 && input.move > 0) ||
      (player.ledgeSide > 0 && input.move < 0);

    if (pressingTowardPlatform || input.jumpPressed) {
      beginLedgeClimb();
      return;
    }

    const pressingAway =
      (player.ledgeSide < 0 && input.move < 0) ||
      (player.ledgeSide > 0 && input.move > 0);

    if (pressingAway && input.jumpReleased) {
      player.ledgeGrabbed = false;
      player.ledgePlatform = null;
      player.ledgeSide = 0;
      player.vy = 120;
    }
  }

  function beginLedgeClimb() {
    const p = player.ledgePlatform;
    if (!p) return;

    player.ledgeGrabbed = false;
    player.ledgeClimbTimer = TUNING.ledgeClimbTime;
    player.ledgeClimbFromX = player.x;
    player.ledgeClimbFromY = player.y;

    const targetX = player.ledgeSide < 0
      ? p.x + player.r + 8
      : p.x + p.w - player.r - 8;

    player.ledgeClimbToX = targetX;
    player.ledgeClimbToY = p.y - player.r;

    player.ledgePlatform = null;
    player.ledgeSide = 0;
    player.squash = -0.12;
    touchCrumblePlatform(p);
  }

  function updatePuffs(dt) {
    for (let i = puffs.length - 1; i >= 0; i--) {
      const p = puffs[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 300 * dt;
      if (p.life <= 0) puffs.splice(i, 1);
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    drawBackground();

    ctx.save();
    ctx.translate(-cameraX, -cameraY);
    drawPlatforms();
    drawGoal();
    drawPuffs();
    drawApexHangCue();
    drawSlideDust();
    drawPlayer();
    drawMomentumLines();
    ctx.restore();

    if (state === "play") drawVignette();
    if (paused && state === "play") drawPaused();
  }

  function drawBackground() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#dff3ff");
    g.addColorStop(0.55, "#f7fbff");
    g.addColorStop(1, "#eaf6ee");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.globalAlpha = 0.38;
    for (let i = 0; i < 14; i++) {
      const x = ((i * 390 - cameraX * 0.22) % (W + 300)) - 160;
      const y = 70 + (i % 5) * 58;
      drawCloud(x, y, 0.75 + (i % 3) * 0.22);
    }
    ctx.restore();

    ctx.save();
    ctx.translate(-cameraX * 0.12, 0);
    ctx.fillStyle = "rgba(39,52,71,.08)";
    for (let i = -2; i < 20; i++) {
      const x = i * 360;
      ctx.beginPath();
      ctx.moveTo(x, H);
      ctx.lineTo(x + 170, H - 190);
      ctx.lineTo(x + 370, H);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function drawCloud(x, y, s) {
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(x, y, 26 * s, 0, Math.PI * 2);
    ctx.arc(x + 28 * s, y - 10 * s, 34 * s, 0, Math.PI * 2);
    ctx.arc(x + 66 * s, y, 28 * s, 0, Math.PI * 2);
    ctx.arc(x + 42 * s, y + 8 * s, 30 * s, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawPlatforms() {
    for (const p of platforms) {
      if (!p.active && p.type !== "crumble") continue;

      const drawY = p.y + (p.active ? 0 : p.dropY);
      const alpha = p.active ? 1 : Math.max(0, p.respawnTimer / p.respawnDelay) * 0.35;

      ctx.save();
      ctx.globalAlpha = alpha;

      if (p.type === "moving" && p.active) {
        ctx.strokeStyle = "rgba(17,24,39,.16)";
        ctx.lineWidth = 3;
        ctx.setLineDash([12, 12]);
        ctx.beginPath();
        ctx.moveTo(p.path.x1 + p.w / 2, p.path.y1 + p.h / 2);
        ctx.lineTo(p.path.x2 + p.w / 2, p.path.y2 + p.h / 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      ctx.fillStyle = "rgba(15,23,42,.14)";
      roundRect(p.x + 9, drawY + 14, p.w, p.h, 18);
      ctx.fill();

      let body = "#273447";
      let top = "#56687f";

      if (p.type === "moving") {
        body = "#263a4d";
        top = "#78a0c4";
      }

      if (p.type === "crumble") {
        const warning = p.touched ? Math.max(0, p.crumbleTimer / p.crumbleDelay) : 1;
        body = p.touched ? "#5a3640" : "#3d3345";
        top = p.touched ? "#d78686" : "#8d789f";
        ctx.translate((Math.random() - 0.5) * (1 - warning) * 5, (Math.random() - 0.5) * (1 - warning) * 3);
      }

      ctx.fillStyle = body;
      roundRect(p.x, drawY, p.w, p.h, 16);
      ctx.fill();

      ctx.fillStyle = top;
      roundRect(p.x, drawY, p.w, 13, 13);
      ctx.fill();

      if (p.type === "crumble") {
        ctx.strokeStyle = "rgba(255,255,255,.22)";
        ctx.lineWidth = 2;
        for (let x = p.x + 36; x < p.x + p.w - 30; x += 52) {
          ctx.beginPath();
          ctx.moveTo(x, drawY + 16);
          ctx.lineTo(x + 20, drawY + 32);
          ctx.stroke();
        }
      } else {
        ctx.fillStyle = "rgba(255,255,255,.18)";
        for (let x = p.x + 28; x < p.x + p.w - 20; x += 58) {
          ctx.fillRect(x, drawY + 20, 22, 3);
        }
      }

      ctx.restore();
    }
  }

  function roundRect(x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  function drawGoal() {
    ctx.save();
    ctx.translate(goal.x, goal.y);
    ctx.fillStyle = "rgba(17,24,39,.20)";
    ctx.fillRect(22, 12, 8, goal.h);
    ctx.fillStyle = "#111827";
    ctx.fillRect(24, 0, 6, goal.h + 18);
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.moveTo(30, 4);
    ctx.lineTo(86, 20);
    ctx.lineTo(30, 38);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#111827";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
  }

  function drawPuffs() {
    ctx.save();
    for (const p of puffs) {
      ctx.globalAlpha = Math.max(0, p.life / p.max) * 0.45;
      ctx.fillStyle = "#111827";
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawSlideDust() {
    if (!player.sliding) return;
    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.strokeStyle = "#111827";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";

    const dir = player.slideDir || player.facing;
    for (let i = 0; i < 5; i++) {
      const x = player.x - dir * (player.r + 8 + i * 13);
      const y = player.y + TUNING.slideRadiusY + 8 + (i % 2) * 4;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - dir * (14 + i * 4), y + 1);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawApexHangCue() {
    if (player.grounded || player.ledgeGrabbed || player.ledgeClimbTimer > 0) return;
    if (Math.abs(player.vy) >= TUNING.apexVelocityWindow) return;

    const strength = 1 - Math.abs(player.vy) / TUNING.apexVelocityWindow;
    ctx.save();
    ctx.globalAlpha = 0.08 + strength * 0.16;
    ctx.strokeStyle = "#111827";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(player.x, player.y + player.r + 8, player.r * (0.9 + strength * 0.4), 5 + strength * 3, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function drawMomentumLines() {
    if (!player.grounded || player.momentum < 0.18 || Math.abs(player.vx) < TUNING.maxRun * 0.85) return;
    ctx.save();
    ctx.globalAlpha = 0.18 + player.momentum * 0.18;
    ctx.strokeStyle = "#111827";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";

    const dir = Math.sign(player.vx) || player.facing;
    const baseX = player.x - dir * 38;
    const baseY = player.y + 2;

    for (let i = 0; i < 4; i++) {
      const y = baseY + (i - 1.5) * 10;
      const len = 18 + player.momentum * 34 - i * 2;
      ctx.beginPath();
      ctx.moveTo(baseX - dir * (i * 9), y);
      ctx.lineTo(baseX - dir * (len + i * 9), y);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawPlayer() {
    const p = player;
    const speed = Math.abs(p.vx);
    const facing = p.facing || 1;

    const bodyLoaded = calvinBodyImg.complete && calvinBodyImg.naturalWidth > 0;
    const legsLoaded = calvinLegsImg.complete && calvinLegsImg.naturalWidth > 0;
    const jumpLegsLoaded = calvinJumpLegsImg.complete && calvinJumpLegsImg.naturalWidth > 0;

    const squash = p.squash;
    const slideScaleY = p.sliding ? 0.54 : 1;
    const slideScaleX = p.sliding ? 1.22 : 1;
    const bodyScaleX = (1 + squash * 0.5) * slideScaleX;
    const bodyScaleY = (1 - squash * 0.5) * slideScaleY;

    let tilt = 0;
    if (!p.grounded && !p.ledgeGrabbed) {
      tilt = Math.max(-0.22, Math.min(0.22, p.vy / 1600)) * facing;
    }
    if (p.sliding) tilt = -0.12 * facing;

    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + playerRadiusY() + 15, p.r * (1.3 + speed / 1100), 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if ((legsLoaded || jumpLegsLoaded) && !p.ledgeGrabbed) {
      ctx.save();
      const airborne = !p.grounded && !p.sliding;
      const legBob = p.grounded && !p.sliding ? Math.sin(p.runTime * (8.2 + p.momentum * 2.2)) * Math.min(1, speed / TUNING.maxRun) : 0;
      const legSquashY = p.sliding ? 0.62 : 1;
      const legSquashX = p.sliding ? 1.18 : 1;

      if (airborne && jumpLegsLoaded) {
        const jumpTilt = Math.max(-0.16, Math.min(0.16, p.vy / 2200)) * facing;
        ctx.translate(p.x, p.y + 6);
        ctx.scale(facing, 1);
        ctx.rotate(jumpTilt);
        ctx.drawImage(calvinJumpLegsImg, -48, -42, 96, 96);
      } else if (legsLoaded) {
        ctx.translate(p.x, p.y + 4 + Math.abs(legBob) * 1.5);
        ctx.scale(facing * legSquashX, legSquashY);
        ctx.rotate(legBob * 0.035);
        ctx.drawImage(calvinLegsImg, -48, -44, 96, 96);
      }
      ctx.restore();
    }

    if (p.ledgeGrabbed) {
      ctx.save();
      ctx.strokeStyle = "#8a5a2c";
      ctx.lineWidth = 5;
      ctx.lineCap = "round";
      const reachDir = p.ledgeSide < 0 ? 1 : -1;
      ctx.beginPath();
      ctx.moveTo(p.x + reachDir * 13, p.y - 7);
      ctx.lineTo(p.x + reachDir * 30, p.y - 22);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(p.x + reachDir * 2, p.y - 4);
      ctx.lineTo(p.x + reachDir * 23, p.y - 21);
      ctx.stroke();
      ctx.restore();
    }

    if (bodyLoaded) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.scale(facing * bodyScaleX, bodyScaleY);
      ctx.rotate(tilt);

      let bob = 0;
      if (p.grounded && !p.sliding) bob = Math.sin(p.runTime * (7.2 + p.momentum * 2.0)) * Math.min(2.4, speed / 280);
      if (p.ledgeGrabbed) bob = Math.sin(performance.now() / 180) * 1.2;

      const drawW = p.sliding ? 101 : 108;
      const drawH = p.sliding ? 62 : 85;
      const drawX = -drawW / 2;
      const drawY = p.sliding ? -12 : -34 + bob;

      ctx.drawImage(calvinBodyImg, drawX, drawY, drawW, drawH);
      ctx.restore();
    } else {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.fillStyle = "#050505";
      ctx.beginPath();
      ctx.arc(0, 0, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    if (p.grounded && !p.sliding && speed > TUNING.maxRun * 0.55) {
      ctx.save();
      ctx.globalAlpha = 0.08 + p.momentum * 0.08;
      ctx.fillStyle = "#111827";
      ctx.beginPath();
      ctx.arc(p.x - facing * 28, p.y + playerRadiusY() + 6, 4 + p.momentum * 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawVignette() {
    const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.2, W / 2, H / 2, Math.max(W, H) * 0.75);
    g.addColorStop(0, "rgba(255,255,255,0)");
    g.addColorStop(1, "rgba(15,23,42,.15)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  function drawPaused() {
    ctx.save();
    ctx.fillStyle = "rgba(15,23,42,.45)";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#fff";
    ctx.font = "700 28px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Paused", W / 2, H / 2);
    ctx.restore();
  }

  function loop(t) {
    const now = t / 1000;
    if (paused) {
      last = 0;
      draw();
      requestAnimationFrame(loop);
      return;
    }
    const dt = last ? now - last : 1 / 60;
    last = now;

    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  resize();
  requestAnimationFrame(loop);
})();
