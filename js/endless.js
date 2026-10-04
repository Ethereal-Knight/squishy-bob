import { resetPlayer } from "./player.js";
import { unlockAchievement } from "./achievements.js";
import { overlaps } from "./collisions.js";

export function startEndless(state) {
    state.endlessDistance = 0;
    state.endlessSpeed = 3.5;
    state.platforms = [{ x: 0, y: 400, w: 800, h: 100 }];
    state.movingPlatforms = [];
    state.lavas = [];
    state.enemies = [];
    state.energyBits = [];
    state.player.x = 100;
    state.player.y = 300;
    resetPlayer(state.player);
}

export function updateEndless(state) {
    const { platforms, energyBits, player, stats } = state;
    state.endlessDistance += state.endlessSpeed / 10;
    state.endlessSpeed += 0.0008;
    if (state.endlessDistance > 1000) unlockAchievement(state, "runner");
    for (let i = 0; i < platforms.length; i++) platforms[i].x -= state.endlessSpeed;
    for (let i = energyBits.length - 1; i >= 0; i--) {
        energyBits[i].x -= state.endlessSpeed;
        let eb = energyBits[i];
        if (overlaps(player, eb)) {
            stats.bitsCollected++;
            energyBits.splice(i, 1);
            if (stats.bitsCollected >= 10) unlockAchievement(state, "hoarder");
        }
    }
    if (player.x < 10) player.x = 10;
    if (platforms[0] && platforms[0].x + platforms[0].w < 0) platforms.shift();
    let lastP = platforms[platforms.length - 1];
    if (lastP && lastP.x + lastP.w < 850) {
        let w = Math.random() * 150 + 100;
        let h = 20;
        let gapX = Math.random() * 100 + 70;
        let gapY = (Math.random() - 0.5) * 140;
        let nextY = lastP.y + gapY;
        if (nextY < 150) nextY = 150;
        if (nextY > 440) nextY = 440;
        let newP = { x: lastP.x + lastP.w + gapX, y: nextY, w: w, h: h };
        platforms.push(newP);
        if (Math.random() > 0.4) {
            energyBits.push({
                x: newP.x + newP.w / 2 - 6,
                y: newP.y - 25,
                w: 12, h: 12
            });
        }
    }
}
