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
        run: code => vm.runInContext(code, context),
        press(key) {
            let prevented = false;
            listeners.keydown({ key, preventDefault: () => { prevented = true; } });
            return prevented;
        }
    };
}

function finishSector(game, index) {
    game.run(`
        currentLevel = ${index};
        gameState = "CAMPAIGN";
        loadLevel();
        player.x = goal.x;
        player.y = goal.y;
        update();
    `);
}

test("arrow keys prevent scrolling only in active gameplay", () => {
    const game = createGame();
    for (const state of ["MENU", "INTRO", "ACHIEVEMENTS", "CAMPAIGN_WIN", "ENDLESS_OVER", "CAMPAIGN", "ENDLESS"]) {
        game.run(`gameState = "${state}"`);
        for (const key of ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]) {
            assert.equal(game.press(key), state === "CAMPAIGN" || state === "ENDLESS", `${state}: ${key}`);
            assert.equal(game.run(`keys.${key}`), true);
        }
    }
});

test("entering Endless from the boss sector clears all boss state", () => {
    const game = createGame();
    game.run(`
        startGame("CAMPAIGN");
        currentLevel = 29;
        loadLevel();
        bossProjectiles.push({ x: 100, y: 300, w: 14, h: 14, vx: 0, vy: 0 });
        bossAttackTimer = 1;
    `);
    assert.equal(game.run("boss.hp"), 7);
    game.press("m");
    game.run(`startGame("ENDLESS"); update();`);
    assert.equal(game.run("gameState"), "ENDLESS");
    assert.equal(game.run("boss"), null);
    assert.equal(game.run("bossProjectiles.length"), 0);
    assert.equal(game.run("bossAttackTimer"), 0);
    assert.equal(game.run("stats.deaths"), 0);
    assert.ok(game.run("endlessDistance") > 0);
});

test("Maze Navigator unlocks only on completing sector 18", () => {
    const game = createGame();
    for (const index of [4, 17]) {
        game.run(`currentLevel = ${index}; gameState = "CAMPAIGN"; loadLevel();`);
        assert.equal(game.run(`achievements.find(a => a.id === "maze").unlocked`), false);
    }
    finishSector(game, 4);
    assert.equal(game.run(`achievements.find(a => a.id === "maze").unlocked`), false);
    finishSector(game, 17);
    assert.equal(game.run("currentLevel"), 18);
    assert.equal(game.run(`achievements.find(a => a.id === "maze").unlocked`), true);
    assert.match(game.run(`achievements.find(a => a.id === "maze").desc`), /sector 18: Laserless Labyrinth/);
});

test("System Boot unlocks on completion rather than loading level 1", () => {
    const game = createGame();
    game.run(`startGame("CAMPAIGN");`);
    assert.equal(game.run(`achievements.find(a => a.id === "first").unlocked`), false);
    finishSector(game, 0);
    assert.equal(game.run(`achievements.find(a => a.id === "first").unlocked`), true);
});

test("campaign retains 30 sectors and a seven-hit boss with a locked exit", () => {
    const game = createGame();
    assert.equal(game.run("levels.length"), 30);
    finishSector(game, 29);
    assert.equal(game.run("gameState"), "CAMPAIGN");
    assert.equal(game.run("currentLevel"), 29);
    for (let hit = 0; hit < 7; hit++) {
        game.run(`
            player.x = boss.x + 20;
            player.y = boss.y - player.h - 1;
            player.vx = 0;
            player.vy = 1;
            update();
        `);
    }
    assert.equal(game.run("gameState"), "CAMPAIGN_WIN");
    assert.equal(game.run("boss"), null);
});
