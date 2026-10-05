const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const html = fs.readFileSync(path.join(__dirname, "..", "squishy Bob v1.3.html"), "utf8");
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];

function createGame() {
    const listeners = {};
    const menu = { style: {} };
    const canvas = { width: 800, height: 500, getContext: () => ({}) };
    const context = vm.createContext({
        document: { getElementById: id => id === "gameCanvas" ? canvas : menu },
        window: { addEventListener: (name, handler) => { listeners[name] = handler; } },
        requestAnimationFrame: () => {}
    });
    vm.runInContext(script, context);
    return {
        menu,
        run: code => vm.runInContext(code, context),
        press(key) {
            let prevented = false;
            listeners.keydown({ key, preventDefault: () => { prevented = true; } });
            return prevented;
        },
        release(key) { listeners.keyup({ key, preventDefault: () => {} }); }
    };
}

function finishSector(game, index) {
    game.run(`
        beginRun("story", ${index});
        player.x = LV.goal.x + 7; player.y = LV.goal.y + 14; player.vy = 0;
        for (let i = 0; i < 80 && levelIndex === ${index}; i++) update();
    `);
}

test("arrow keys prevent scrolling only in gameplay and sector select", () => {
    const game = createGame();
    for (const state of ["MENU", "INTRO", "ACHIEVEMENTS", "CAMPAIGN_WIN", "ENDLESS_OVER", "CAMPAIGN", "ENDLESS", "SELECT"]) {
        game.run(`gameState = "${state}"; paused = false;`);
        for (const key of ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]) {
            assert.equal(game.press(key), ["CAMPAIGN", "ENDLESS", "SELECT"].includes(state), `${state}: ${key}`);
            assert.equal(game.run(`keys["${key.toLowerCase()}"]`), true);
            game.release(key);
        }
    }
});

test("campaign has 13 distinct sectors plus a boss arena", () => {
    const game = createGame();
    assert.equal(game.run("LEVELS.length"), 14);
    assert.equal(game.run("BOSS_LEVEL"), 13);
    assert.equal(game.run("LEVELS[BOSS_LEVEL].boss"), true);
    const names = game.run("LEVELS.map(l => l.name)");
    assert.equal(new Set(names).size, 14);
    // levels are not all flat horizontal strips: several are taller than wide
    assert.ok(game.run("LEVELS.filter(l => l.h > l.w).length") >= 4);
    for (let i = 0; i < 13; i++) {
        const info = game.run(`(() => { const L = buildLevel(${i}); return { goal: !!L.goal, cps: L.checkpoints.length }; })()`);
        assert.ok(info.goal, `sector ${i + 1} has a goal`);
    }
    assert.ok(game.run("[4,5,9,12].every(i => buildLevel(i).saws.length > 0)"), "saw levels contain saws");
});

test("completing a sector unlocks its achievement, records a split and advances", () => {
    const game = createGame();
    finishSector(game, 0);
    assert.equal(game.run("save.ach.first"), true);
    assert.equal(game.run("levelIndex"), 1);
    assert.ok(game.run("save.unlocked") >= 2);
    assert.ok(game.run("save.bestLevel[0]") > 0);
});

test("checkpoints set the respawn point", () => {
    const game = createGame();
    game.run(`beginRun("story", 0); const c = LV.checkpoints[0]; player.x = c.x; player.y = c.y + 38; checkInteractions(inputState());`);
    assert.equal(game.run("LV.checkpoints[0].active"), true);
    game.run("killPlayer(); for (let i = 0; i < 60; i++) update();");
    assert.equal(game.run("player.dead"), 0);
    assert.equal(game.run("Math.round(player.x)"), game.run("Math.round(LV.checkpoints[0].x - 1)"));
});

test("speedrun timer runs during play and formats times", () => {
    const game = createGame();
    game.run(`startSpeedrun(); for (let i = 0; i < 120; i++) update();`);
    assert.equal(game.run("runTicks"), 120);
    assert.equal(game.run("fmtTime(4530)"), "01:15.50");
    game.press("p");
    game.run("for (let i = 0; i < 30; i++) update();");
    assert.equal(game.run("runTicks"), 120, "timer pauses");
});

test("boss can be shot and moves through three phases", () => {
    const game = createGame();
    game.run(`beginRun("practice", BOSS_LEVEL);`);
    assert.equal(game.run("boss.phase"), 1);
    assert.equal(game.run("boss.hp"), 36);
    game.run(`boss.x = player.x + 200; boss.y = player.y; boss.mode = "recover"; boss.mt = -1000; player.face = 1; keys["x"] = true; for (let i = 0; i < 30; i++) update(); keys["x"] = false;`);
    assert.ok(game.run("boss.hp") < 36, "shots damage the boss");
    game.run("boss.inv = 0; damageBoss(boss.hp - 24);");
    assert.equal(game.run("boss.phase"), 2);
    game.run("boss.inv = 0; damageBoss(boss.hp - 12);");
    assert.equal(game.run("boss.phase"), 3);
    game.run("boss.inv = 0; damageBoss(99);");
    assert.ok(game.run("boss.dying") > 0);
    game.run("for (let i = 0; i < 260; i++) update();");
    assert.equal(game.run("gameState"), "CAMPAIGN_WIN");
    assert.equal(game.run("save.ach.master"), true);
});

test("entering Endless clears boss state", () => {
    const game = createGame();
    game.run(`beginRun("story", BOSS_LEVEL); bossShots.push({ x: 1, y: 1, vx: 0, vy: 0, r: 7, life: 10 });`);
    game.press("m");
    assert.equal(game.menu.style.display, "flex");
    game.run(`startGame("ENDLESS")`);
    assert.equal(game.run("gameState"), "ENDLESS");
    assert.equal(game.run("boss"), null);
    assert.equal(game.run("bossShots.length"), 0);
    game.run("for (let i = 0; i < 300; i++) update();");
    assert.ok(game.run("LV.w") > 40, "endless keeps generating chunks");
});

test("enemies can be stomped", () => {
    const game = createGame();
    game.run(`beginRun("story", 0); const e = LV.enemies.find(e => e.type === "crawler");
        player.x = e.x; player.y = e.y - 26 + 6; player.prevY = e.y - 30; player.vy = 4; checkInteractions(inputState());`);
    assert.ok(game.run("LV.enemies.find(e => e.type === 'crawler').dead") > 0);
    assert.equal(game.run("player.dead"), 0);
});
