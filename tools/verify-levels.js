// Headless solvability checker: BFS over macro-actions using the real game physics.
// Usage: node tools/verify-levels.js [levelNumber ...]
const fs = require("fs");
const path = require("path");
const vm = require("vm");

function loadGame() {
    const html = fs.readFileSync(path.join(__dirname, "..", "squishy Bob v1.3.html"), "utf8");
    const src = html.match(/<script>([\s\S]*)<\/script>/)[1];
    const el = () => ({ style: {}, getContext: () => ({}), textContent: "" });
    const g = {
        console, Math, JSON, Date, Map, Set,
        document: { getElementById: el },
        requestAnimationFrame: () => { },
        __SQUISHY_HEADLESS: true,
        addEventListener: () => { }
    };
    g.window = g;
    vm.createContext(g);
    vm.runInContext(src, g);
    return g.__squishy;
}

const G = loadGame();
const { T, player } = G;
const KEYS = ["x", "y", "vx", "vy", "h", "squish", "grounded", "groundType", "coyote", "jumpBuf", "jumpsLeft", "wallLock", "jumping", "dropTimer", "ride", "wallDir", "prevY"];
const snap = () => { const o = {}; for (const k of KEYS) o[k] = player[k]; return o; };
const restore = s => { for (const k of KEYS) player[k] = s[k]; };

// Moving platforms become one-way tiles along their travel path (static approximation).
function flattenPlatforms(L) {
    G.setLV(L);
    const paths = L.platforms.map(pl => ({ pl, x0: pl.x, x1: pl.x, y0: pl.y, y1: pl.y }));
    for (let i = 0; i < 3000; i++) {
        G.updatePlatforms();
        for (const p of paths) { p.x0 = Math.min(p.x0, p.pl.x); p.x1 = Math.max(p.x1, p.pl.x); p.y0 = Math.min(p.y0, p.pl.y); p.y1 = Math.max(p.y1, p.pl.y); }
    }
    for (const { pl, x0, x1, y0, y1 } of paths) {
        const c0 = Math.floor(x0 / T), c1 = Math.floor((x1 + pl.w - 1) / T);
        const r0 = Math.ceil(y0 / T), r1 = Math.floor(y1 / T);
        for (let r = r0; r <= r1; r += (pl.kind === "v" ? 3 : 1))
            for (let c = c0; c <= c1; c++) if (L.grid[r] && L.grid[r][c] === " ") L.grid[r][c] = "-";
    }
    L.platforms = [];
}

const ACTIONS = [];
for (const dir of [-1, 0, 1]) {
    ACTIONS.push({ dir, jump: 0, down: 0 });
    ACTIONS.push({ dir, jump: 1, down: 0 });
    ACTIONS.push({ dir, jump: 2, down: 0 }); // tap = short hop
    ACTIONS.push({ dir, jump: 0, down: 1 });
}

function verify(i, limit) {
    const L = G.buildLevel(i);
    if (L.def.boss) return { ok: true, note: "boss arena" };
    flattenPlatforms(L);
    L.enemies = [];
    G.setLV(L);
    const staticSaws = L.saws.filter(s => s.kind === "static");
    Object.assign(player, { x: L.start.x, y: L.start.y, w: 26, h: 26, vx: 0, vy: 0, grounded: false, squish: false, coyote: 0, jumpBuf: 0, jumpsLeft: 1, wallLock: 0, jumping: false, dropTimer: 0, ride: null, dead: 0, inv: 0 });
    const gx = L.goal.x + L.goal.w / 2, gy = L.goal.y + L.goal.h / 2;
    const W8 = Number(process.env.VERIFY_DEPTH_W) || 10;
    const pri = (s, d) => Math.abs(s.x - gx) + Math.abs(s.y - gy) + d * W8;
    const heap = [];
    const push = (s, p) => { heap.push([p, s]); let i = heap.length - 1; while (i > 0) { const j = (i - 1) >> 1; if (heap[j][0] <= heap[i][0]) break;[heap[i], heap[j]] = [heap[j], heap[i]]; i = j; } };
    const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0; for (; ;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === i) break;[heap[i], heap[m]] = [heap[m], heap[i]]; i = m; } } return top[1]; };
    const start = snap(), seen = new Set();
    start.d = 0; push(start, pri(start, 0));
    const key = s => [Math.round(s.x / 8), Math.round(s.y / 8), Math.round(s.vx / 2.5), Math.round(s.vy / 4), s.jumpsLeft, s.squish ? 1 : 0, s.grounded ? 1 : 0, s.wallLock > 0 ? 1 : 0].join(",");
    seen.add(key(start));
    let best = { x: 0, y: 1e9 };
    while (heap.length && seen.size < limit) {
        const s = pop();
        for (const a of ACTIONS) {
            restore(s);
            let dead = false, win = false, elapsed = 0;
            for (let f = 0; f < 6; f++) {
                G.stepPlayer({ left: a.dir < 0, right: a.dir > 0, up: false, down: !!a.down, jumpPressed: !!a.jump && f === 0, jumpHeld: a.jump === 1 });
                elapsed = f + 1;
                const hb = G.playerHurtbox();
                if (player.y > L.h * T + 60 || G.tileHazardHit(hb) || staticSaws.some(sw => {
                    const nx = Math.max(hb.x, Math.min(sw.x, hb.x + hb.w)), ny = Math.max(hb.y, Math.min(sw.y, hb.y + hb.h));
                    return (sw.x - nx) ** 2 + (sw.y - ny) ** 2 < (sw.r - 2) ** 2;
                })) { dead = true; break; }
                if (L.goal && G.overlap(hb, L.goal)) { win = true; break; }
            }
            if (win) return { ok: true, states: seen.size, ticks: s.d * 6 + elapsed };
            if (dead) continue;
            const n = snap(); n.d = s.d + 1; const k = key(n);
            if (seen.has(k)) continue;
            seen.add(k); push(n, pri(n, n.d));
            if (n.x > best.x) best.x = n.x;
            if (n.y < best.y) best.y = n.y;
        }
    }
    return { ok: false, states: seen.size, maxCol: Math.floor(best.x / T), minRow: Math.floor(best.y / T) };
}

const only = process.argv.length > 2 ? process.argv.slice(2).map(n => Number(n) - 1) : G.LEVELS.map((_, i) => i);
if (only.some(i => !Number.isInteger(i) || i < 0 || i >= G.LEVELS.length)) {
    console.error(`Sector numbers must be integers from 1 to ${G.LEVELS.length}.`);
    process.exit(1);
}
let fail = 0;
for (const i of only) {
    const t0 = Date.now();
    const r = verify(i, Number(process.env.VERIFY_LIMIT) || 600000);
    if (!r.ok) fail++;
    console.log(`${String(i + 1).padStart(2)} ${G.LEVELS[i].name.padEnd(18)} ${r.ok ? "SOLVABLE" : "STUCK   "} ${JSON.stringify(r)} ${Date.now() - t0}ms`);
}
process.exit(fail ? 1 : 0);
