const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const html = fs.readFileSync(path.join(__dirname, "..", "squishy Bob v1.3.html"), "utf8");
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];

function createGame(options = {}) {
    const listeners = {};
    const canvasListeners = {};
    const texts = [], warnings = [], colors = [];
    const drawing = new Proxy({
        createLinearGradient: () => ({ addColorStop: (_offset, color) => colors.push(color) }),
        createRadialGradient: () => ({ addColorStop: () => {} }),
        fillText: text => texts.push(text)
    }, { get: (target, key) => key in target ? target[key] : () => {} });
    const menu = { style: {} };
    const canvas = { width: 800, height: 500, getContext: () => drawing,
        addEventListener: (name, handler) => { canvasListeners[name] = handler; },
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 500 }) };
    const storage = options.storage || new Map();
    const context = vm.createContext({
        document: { getElementById: id => id === "gameCanvas" ? canvas : menu, createElement: () => canvas },
        window: { addEventListener: (name, handler) => { listeners[name] = handler; } },
        localStorage: {
            getItem: key => storage.get(key) || null,
            setItem: (key, value) => {
                if (options.failStorage) throw new Error("Storage blocked");
                storage.set(key, value);
            }
        },
        console: { warn: (...args) => warnings.push(args) },
        requestAnimationFrame: () => {}
    });
    vm.runInContext(script, context);
    return {
        menu,
        storage, texts, warnings, colors,
        run: code => vm.runInContext(code, context),
        click(x, y) { canvasListeners.click({ clientX: x, clientY: y }); },
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
    for (const state of ["MENU", "INTRO", "ACHIEVEMENTS", "CAMPAIGN_WIN", "ENDLESS_OVER", "CAMPAIGN", "ENDLESS", "SELECT", "SHOP"]) {
        game.run(`gameState = "${state}"; paused = false;`);
        for (const key of ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]) {
            assert.equal(game.press(key), ["CAMPAIGN", "ENDLESS", "SELECT", "SHOP"].includes(state), `${state}: ${key}`);
            assert.equal(game.run(`keys["${key.toLowerCase()}"]`), true);
            game.release(key);
        }
    }
});

test("campaign has 18 distinct sectors plus a final boss arena", () => {
    const game = createGame();
    assert.equal(game.run("LEVELS.length"), 19);
    assert.equal(game.run("BOSS_LEVEL"), 18);
    assert.equal(game.run("LEVELS[BOSS_LEVEL].boss"), true);
    const names = game.run("LEVELS.map(l => l.name)");
    assert.equal(new Set(names).size, 19);
    // levels are not all flat horizontal strips: several are taller than wide
    assert.ok(game.run("LEVELS.filter(l => l.h > l.w).length") >= 4);
    for (let i = 0; i < 18; i++) {
        const info = game.run(`(() => { const L = buildLevel(${i}); return { goal: !!L.goal, cps: L.checkpoints.length }; })()`);
        assert.ok(info.goal, `sector ${i + 1} has a goal`);
        if (i >= 13) {
            assert.ok(info.cps >= 2, `new sector ${i + 1} has checkpoints`);
            assert.ok(game.run(`buildLevel(${i}).bits.length`) >= 4);
        }
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

function stompBoss(game) {
    game.run(`boss.x = 400; boss.y = 362; boss.mode = "recover"; boss.mt = 0; boss.inv = 0;
        player.x = 387; player.y = 309; player.prevY = 299; player.vy = 5; player.dead = 0;
        updateBoss();`);
}

test("boss is defeated with nine exposed-core bounces through three phases", () => {
    const game = createGame();
    game.run(`beginRun("practice", BOSS_LEVEL);`);
    assert.equal(game.run("boss.phase"), 1);
    assert.equal(game.run("boss.hp"), 9);
    for (let i = 0; i < 3; i++) stompBoss(game);
    assert.equal(game.run("boss.phase"), 2);
    assert.equal(game.run("boss.hp"), 6);
    for (let i = 0; i < 3; i++) stompBoss(game);
    assert.equal(game.run("boss.phase"), 3);
    for (let i = 0; i < 3; i++) stompBoss(game);
    assert.ok(game.run("boss.dying") > 0);
    game.run("for (let i = 0; i < 260; i++) update();");
    assert.equal(game.run("gameState"), "CAMPAIGN_WIN");
    assert.equal(game.run("save.ach.master"), true);
    assert.equal(game.run("save.stars[BOSS_LEVEL]"), 3);
    assert.equal(game.run("save.unlocked"), 19);
    assert.equal(game.run("stats.stomps"), 9);
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

test("old shooting keys do not damage the Warden and its shield rejects damage", () => {
    const game = createGame();
    game.run(`beginRun("practice", BOSS_LEVEL); player.inv = 1000;
        keys.x = true; keys.j = true; keys.k = true; for (let i = 0; i < 30; i++) update();`);
    assert.equal(game.run("boss.hp"), 9);
    assert.equal(game.run("damageBoss(1)"), false);
    game.run("boss.mode = 'recover'; boss.inv = 20;");
    assert.equal(game.run("damageBoss(1)"), false);
});

test("every boss phase telegraphs a fixed dive and exposes a reachable core", () => {
    const game = createGame();
    for (const phase of [1, 2, 3]) {
        game.run(`beginRun("practice", BOSS_LEVEL); boss.phase = ${phase}; boss.hp = PHASE_HP[${phase}];
            boss.atkCount = 2; bossAttack(); player.dead = 1;`);
        assert.equal(game.run("boss.mode"), "tele");
        const target = game.run("boss.tx");
        game.run("player.x = 600; for (let i = 0; i < 60; i++) updateBoss();");
        assert.equal(game.run("boss.mode"), "dash");
        assert.equal(game.run("boss.tx"), target, "warning target does not chase Bob");
        game.run("for (let i = 0; i < 30; i++) updateBoss();");
        assert.equal(game.run("boss.mode"), "recover");
        assert.equal(game.run("boss.y"), 362);
        assert.equal(game.run("bossShots.length"), 0);
        game.run("for (let i = 0; i < 100; i++) updateBoss();");
        assert.equal(game.run("boss.mode"), "recover", "ample time to jump on the core");
        game.run("for (let i = 0; i < 100; i++) updateBoss();");
        assert.equal(game.run("boss.mode"), "float", "missing a bounce resumes the fight");
    }
});

test("Bob can reach and bounce on the exposed core using real jump physics", () => {
    const game = createGame();
    game.run(`beginRun("practice", BOSS_LEVEL); boss.x = 300; boss.y = 362; boss.mode = "recover";
        resetPlayerAt(287, 390); player.inv = 300;
        for (let i = 0; i < 3; i++) stepPlayer({ jumpHeld: false });
        for (let i = 0; i < 90 && boss.hp === 9; i++) {
            stepPlayer({ jumpPressed: i === 0, jumpHeld: true });
            updateBoss();
        }`);
    assert.equal(game.run("boss.hp"), 8);
    assert.equal(game.run("player.vy"), -12, "stomp bounces Bob clear");
    assert.equal(game.run("player.jumpsLeft"), 1);
    assert.equal(game.run("boss.mode"), "float");
});

test("side contact and rising contact cannot damage an exposed boss", () => {
    const game = createGame();
    for (const contact of [
        "player.x = 420; player.y = 350; player.prevY = 345; player.vy = 5;",
        "player.x = 387; player.y = 335; player.prevY = 340; player.vy = -5;"
    ]) {
        game.run(`beginRun("practice", BOSS_LEVEL); boss.x = 400; boss.y = 362; boss.mode = "recover"; ${contact} updateBoss();`);
        assert.equal(game.run("boss.hp"), 9);
        assert.equal(game.run("player.hearts"), 2);
    }
});

test("respawn restores current boss phase and clears hazards", () => {
    const game = createGame();
    game.run(`beginRun("practice", BOSS_LEVEL); boss.phase = 2; boss.hp = 4; boss.mode = "recover";
        spawnRollSaw(); bossShoot(0, 4); respawn();`);
    assert.equal(game.run("boss.phase"), 2);
    assert.equal(game.run("boss.hp"), 6);
    assert.equal(game.run("boss.mode"), "float");
    assert.equal(game.run("bossShots.length"), 0);
    assert.equal(game.run("LV.saws.length"), 0);
});

test("star thresholds are inclusive for every sector and never erase better awards", () => {
    const game = createGame();
    for (let i = 0; i < 19; i++) {
        const [fast, quick] = game.run(`STAR_TIMES[${i}]`);
        assert.ok(fast > 0 && quick > fast);
        for (const [ticks, stars] of [[fast * 60, 3], [fast * 60 + 1, 2], [quick * 60, 2], [quick * 60 + 1, 1]]) {
            assert.equal(game.run(`starsForTime(${i}, ${ticks})`), stars);
        }
    }
    game.run('beginRun("practice", 13); levelTicks = 1500; completeLevel();');
    assert.equal(game.run("save.stars[13]"), 3);
    game.run('transition = null; beginRun("practice", 13); levelTicks = 3001; completeLevel();');
    assert.equal(game.run("splitInfo.stars"), 1);
    assert.equal(game.run("save.stars[13]"), 3);
    assert.equal(game.run("save.bestLevel[13]"), 1500);
    const reloaded = createGame({ storage: game.storage });
    assert.equal(reloaded.run("save.stars[13]"), 3);
});

test("campaign advances through all five new sectors into the final arena", () => {
    const game = createGame();
    for (let i = 13; i < 18; i++) {
        finishSector(game, i);
        assert.equal(game.run("levelIndex"), i + 1);
        assert.ok(game.run(`save.stars[${i}]`) >= 1);
        assert.ok(game.run("save.unlocked") >= i + 2);
    }
    assert.equal(game.run("LV.boss"), true);
});

test("Bits fund a persistent wallet in campaign and Endless without respawn duplicates", () => {
    const game = createGame();
    game.run(`beginRun("practice", 0); const bit = LV.bits[0];
        player.x = bit.x - 13; player.y = bit.y - 13; checkInteractions(inputState()); checkInteractions(inputState());`);
    assert.equal(game.run("save.wallet"), 1);
    game.run("respawn(); player.x = bit.x - 13; player.y = bit.y - 13; checkInteractions(inputState());");
    assert.equal(game.run("save.wallet"), 1);
    game.run(`startEndless(); const endlessBit = LV.bits[0];
        player.x = endlessBit.x - 13; player.y = endlessBit.y - 13; checkInteractions(inputState());`);
    assert.equal(game.run("save.wallet"), 2);
    assert.equal(game.run("stats.bitsCollected"), 2);
    assert.equal(createGame({ storage: game.storage }).run("save.wallet"), 2);
});

test("shop prevents overspending, purchases once, equips for free and reloads ownership", () => {
    const game = createGame();
    game.run("openShop();");
    assert.equal(game.run("useShopItem(1)"), false);
    assert.match(game.run("shopMessage"), /Need 20 more Bits/);
    assert.equal(game.run("save.skin"), "bob");
    game.run("save.wallet = 100; useShopItem(1);");
    assert.equal(game.run("save.wallet"), 80);
    assert.equal(game.run("save.skin"), "berry");
    game.run("useShopItem(1); useShopItem(0); useShopItem(6);");
    assert.equal(game.run("save.wallet"), 50);
    assert.equal(game.run("save.skin"), "bob");
    assert.equal(game.run("save.worldStyle"), "sunset");
    const reloaded = createGame({ storage: game.storage });
    assert.equal(reloaded.run("save.wallet"), 50);
    assert.equal(reloaded.run("save.ownedSkins.includes('berry')"), true);
    assert.equal(reloaded.run("save.worldStyle"), "sunset");
    reloaded.run("useShopItem(1); useShopItem(5);");
    assert.equal(reloaded.run("save.wallet"), 50);
    assert.equal(reloaded.run("save.skin"), "berry");
    assert.equal(reloaded.run("save.worldStyle"), "original");
    assert.equal(reloaded.run("useShopItem(999)"), false);
    assert.match(reloaded.run("shopMessage"), /Select/);
});

test("all purchasable cosmetics render and world themes preserve ice physics", () => {
    const game = createGame();
    game.run("save.wallet = 1000;");
    for (let i = 0; i < 9; i++) {
        game.run(`useShopItem(${i}); beginRun("practice", 10); render();`);
    }
    assert.equal(game.run("themeAtCol(2).ice"), true);
    assert.equal(game.run("paletteAtCol(2).edge"), "#c5b9ff");
    game.run(`save.skin = "berry"; drawSquishyBob();`);
    assert.ok(game.colors.includes("#ffb4ed"));
    assert.ok(game.colors.includes("#b82c9c"));
    for (const state of ["MENU", "INTRO", "SELECT", "SHOP", "ACHIEVEMENTS", "CAMPAIGN_WIN", "ENDLESS_OVER"]) {
        game.run(`gameState = "${state}"; render();`);
    }
    for (const phase of [1, 2, 3]) {
        for (const mode of ["float", "tele", "dash", "recover"]) {
            game.run(`beginRun("practice", BOSS_LEVEL); boss.phase = ${phase}; boss.mode = "${mode}"; render();`);
        }
    }
    assert.ok(game.texts.includes("BOUNCE HERE!"));
    assert.ok(game.texts.includes("CORE EXPOSED: JUMP ON TOP!"));
});

test("shop keyboard and click controls work and all 19 sector cards fit on screen", () => {
    const game = createGame();
    game.run("openShop(); save.wallet = 100;");
    game.press("ArrowRight"); game.release("ArrowRight"); game.press("Enter"); game.release("Enter");
    assert.equal(game.run("save.skin"), "berry");
    const card = game.run("shopCell(6)");
    game.click(card.x + 10, card.y + 10);
    assert.equal(game.run("save.worldStyle"), "sunset");
    game.press("Escape");
    assert.equal(game.run("gameState"), "MENU");
    assert.equal(game.menu.style.display, "flex");
    for (let i = 0; i < 19; i++) {
        const c = game.run(`selectCell(${i})`);
        assert.ok(c.x >= 0 && c.x + c.w <= 800);
        assert.ok(c.y >= 96 && c.y + c.h < 440);
    }
    game.run("save.unlocked = 19; openSectorSelect();");
    const bossCard = game.run("selectCell(BOSS_LEVEL)");
    game.click(bossCard.x + 20, bossCard.y + 20);
    assert.equal(game.run("levelIndex"), 18);
});

test("legacy progress migrates boss records and credits previously collected Bits only once", () => {
    const storage = new Map([["squishyBob.save.v2", JSON.stringify({
        save: { unlocked: 14, bestLevel: { 0: 100, 13: 200 }, bestRun: 300, ach: { master: true } },
        stats: { bitsCollected: 120 }
    })]]);
    const game = createGame({ storage });
    assert.equal(game.run("save.bestLevel[0]"), 100);
    assert.equal(game.run("save.bestLevel[18]"), 200);
    assert.equal(game.run("save.bestLevel[13]"), undefined);
    assert.equal(game.run("save.bestRun"), null, "short campaign records cannot compete with expanded runs");
    assert.equal(game.run("save.legacyBestRun"), 300, "original campaign record is archived");
    assert.equal(game.run("save.unlocked"), 19);
    assert.equal(game.run("save.wallet"), 120);
    game.run("useShopItem(1);");
    const reloaded = createGame({ storage });
    assert.equal(reloaded.run("save.wallet"), 100);
    assert.equal(reloaded.run("save.bestLevel[18]"), 200);
});

test("boss completion time stops on the winning bounce, not after the celebration", () => {
    const game = createGame();
    game.run(`beginRun("practice", BOSS_LEVEL); levelTicks = STAR_TIMES[BOSS_LEVEL][0] * 60;
        runTicks = levelTicks; boss.phase = 3; boss.hp = 1;`);
    stompBoss(game);
    game.run("for (let i = 0; i < 260; i++) update();");
    assert.equal(game.run("save.bestLevel[BOSS_LEVEL]"), 6000);
    assert.equal(game.run("save.stars[BOSS_LEVEL]"), 3);
    assert.equal(game.run("lastResult.time"), 6000);
});

test("blocked storage reports a visible error rather than silent saving", () => {
    const game = createGame({ failStorage: true });
    game.run("save.wallet = 100; useShopItem(1); render();");
    assert.match(game.run("saveError"), /not saved/);
    assert.equal(game.warnings.length, 1);
    assert.ok(game.texts.some(text => text.includes("Progress is not saved")));
    const broken = createGame({ storage: new Map([["squishyBob.save.v2", "{bad json"]]) });
    assert.match(broken.run("saveError"), /Could not load/);
    assert.equal(broken.warnings.length, 1);
});
