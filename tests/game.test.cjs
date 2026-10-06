const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const html = fs.readFileSync(path.join(__dirname, "..", "squishy Bob v1.3.html"), "utf8");
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];

function createGame(localStorage) {
    const listeners = {};
    const menu = { style: {} };
    const canvas = { width: 800, height: 500, getContext: () => ({}) };
    const context = vm.createContext({
        document: { getElementById: id => id === "gameCanvas" ? canvas : menu },
        window: { addEventListener: (name, handler) => { listeners[name] = handler; } },
        requestAnimationFrame: () => {},
        ...(localStorage ? { localStorage } : {})
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

test("touch controls feed the same input state as the keyboard", () => {
    const game = createGame();
    game.run(`setTouchKey("@right", true); setTouchKey("@jump", true);`);
    assert.equal(game.run("inputState().right"), true);
    assert.equal(game.run("inputState().jumpPressed"), true);
    game.run("pressed = {}");
    assert.equal(game.run("inputState().jumpPressed"), false, "jump is an edge, not a repeat");
    assert.equal(game.run("inputState().jumpHeld"), true);
    game.run(`setTouchKey("@jump", false); setTouchKey("@up", true); pressed = {};`);
    assert.equal(game.run("inputState().up"), true);
    assert.equal(game.run("inputState().jumpHeld || inputState().jumpPressed"), false, "aiming up on the stick never jumps");
    game.run(`setTouchKey("@shoot", true); setTouchKey("@down", true);`);
    assert.equal(game.run("inputState().shoot && inputState().down"), true);
    game.run("releaseTouch()");
    const inp = game.run("inputState()");
    assert.equal(inp.left || inp.right || inp.up || inp.down || inp.jumpHeld || inp.shoot, false);
});

test("touch and keyboard hold the same direction independently", () => {
    const game = createGame();
    game.press("ArrowLeft");
    game.run(`setTouchKey("@left", true)`);
    game.release("ArrowLeft");
    assert.equal(game.run("inputState().left"), true, "lifting the key keeps the thumb's input");
    game.run(`setTouchKey("@left", false); keys["arrowleft"] = true;`);
    assert.equal(game.run("inputState().left"), true, "lifting the thumb keeps the key's input");
});

test("joystick only squishes on a deliberate downward push", () => {
    const game = createGame();
    const dirs = (deg, len = 1) => game.run(`(() => {
        const a = ${deg} * Math.PI / 180, d = stickDirs(Math.cos(a) * ${len} * STICK_R, Math.sin(a) * ${len} * STICK_R, STICK_R);
        return [d.left, d.right, d.up, d.down].map(Number).join("");
    })()`);
    assert.equal(dirs(0), "0100", "right");
    assert.equal(dirs(25), "0100", "running with thumb drift does not squish");
    assert.equal(dirs(45), "0101", "down-right crawls through ducts");
    assert.equal(dirs(90), "0001", "straight down squishes");
    assert.equal(dirs(180), "1000", "left");
    assert.equal(dirs(-60), "0110", "up-right aims diagonally");
    assert.equal(dirs(-90), "0010", "up aims");
    assert.equal(dirs(0, 0.2), "0000", "dead zone");
    assert.equal(dirs(90, 0.35), "0000", "a light touch down does not squish");
});

test("touch jump button jumps, and holding it jumps higher", () => {
    const game = createGame();
    const height = holdFrames => game.run(`(() => {
        beginRun("practice", 0);
        for (let t = 0; t < 200 && !player.grounded; t++) { update(); pressed = {}; }
        const y0 = player.y; let minY = y0;
        setTouchKey("@jump", true);
        for (let i = 0; i < 70; i++) {
            if (i === ${holdFrames}) setTouchKey("@jump", false);
            update(); pressed = {}; minY = Math.min(minY, player.y);
        }
        releaseTouch();
        return y0 - minY;
    })()`);
    const tap = height(2), held = height(70);
    assert.ok(tap > 8, `tap jumps (${tap}px)`);
    assert.ok(held > tap * 1.5, `held jump (${held}px) is higher than a tap (${tap}px)`);
});

test("touch fire button damages the boss", () => {
    const game = createGame();
    game.run(`beginRun("practice", BOSS_LEVEL); boss.x = player.x + 200; boss.y = player.y; boss.mode = "recover"; boss.mt = -1000; player.face = 1;
        setTouchKey("@shoot", true); for (let i = 0; i < 30; i++) { update(); pressed = {}; } releaseTouch();`);
    assert.ok(game.run("boss.hp") < 36);
});

test("touch pause menu resumes, respawns and returns to the menu", () => {
    const game = createGame();
    game.run(`beginRun("story", 0); paused = true; pauseAction("resume");`);
    assert.equal(game.run("paused"), false);
    game.run(`player.x += 300; paused = true; pauseAction("respawn");`);
    assert.equal(game.run("paused"), false);
    assert.equal(game.run("Math.round(player.x)"), game.run("Math.round(respawnPoint.x)"));
    game.run(`paused = true; pauseAction("menu");`);
    assert.equal(game.run("gameState"), "MENU");
});

test("settings panel swallows game keys and closes with Escape", () => {
    const game = createGame();
    game.run(`beginRun("story", 0); paused = true; openSettings();`);
    game.press("p");
    assert.equal(game.run("paused"), true, "P does not unpause behind the settings panel");
    game.press("Escape");
    assert.equal(game.run("touch.settingsOpen"), false);
    assert.equal(game.run("paused"), true);
});

test("touch control opacity is saved", () => {
    const store = {};
    const localStorage = { getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = v; } };
    const game = createGame(localStorage);
    assert.equal(game.run("save.stickAlpha"), 0.5);
    assert.equal(game.run("save.btnAlpha"), 0.6);
    game.run("save.stickAlpha = 0.15; save.btnAlpha = 0; closeSettings();");
    const reloaded = createGame(localStorage);
    assert.equal(reloaded.run("save.stickAlpha"), 0.15);
    assert.equal(reloaded.run("save.btnAlpha"), 0);
});

test("endless game-over: tap retries, the MENU box returns to the menu", () => {
    const game = createGame();
    game.run(`startEndless(); gameState = "ENDLESS_OVER"; stateTimer = 40; onScreenTap(400, 200);`);
    assert.equal(game.run("gameState"), "ENDLESS");
    game.run(`gameState = "ENDLESS_OVER"; stateTimer = 40; onScreenTap(OVER_MENU.x + 10, OVER_MENU.y + 10);`);
    assert.equal(game.run("gameState"), "MENU");
});
