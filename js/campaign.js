import { levels } from "./levels/index.js";
import { resetPlayer } from "./player.js";
import { unlockAchievement } from "./achievements.js";
import { overlaps } from "./collisions.js";

export function loadLevel(state) {
    let lvl = levels[state.currentLevel];
    state.platforms = lvl.p.map(arr => ({ x: arr[0], y: arr[1], w: arr[2], h: arr[3] }));
    state.movingPlatforms = lvl.mp.map(o => ({ ...o }));
    state.lavas = lvl.l.map(arr => ({ x: arr[0], y: arr[1], w: arr[2], h: arr[3] }));
    state.enemies = lvl.e.map(o => ({ ...o }));
    state.goal = { x: lvl.g[0], y: lvl.g[1], w: 40, h: 40 };
    state.player.x = lvl.s[0];
    state.player.y = lvl.s[1];
    state.energyBits = [];
    resetPlayer(state.player);
    if (state.currentLevel === 0) unlockAchievement(state, "first");
    if (state.currentLevel === 4) unlockAchievement(state, "maze");
    state.stats.maxLevel = Math.max(state.stats.maxLevel, state.currentLevel + 1);
}

export function updateCampaign(state) {
    if (overlaps(state.player, state.goal)) {
        state.currentLevel++;
        if (state.currentLevel >= levels.length) {
            unlockAchievement(state, "master");
            state.gameState = "CAMPAIGN_WIN";
        } else {
            loadLevel(state);
        }
    }
}
