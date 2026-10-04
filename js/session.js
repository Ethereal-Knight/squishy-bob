import { resetPlayer } from "./player.js";
import { loadLevel } from "./campaign.js";
import { startEndless } from "./endless.js";
import { createDeathExplosion } from "./particles.js";
import { unlockAchievement } from "./achievements.js";

export function returnToMenu(state, menuDiv, reset = false) {
    state.gameState = "MENU";
    menuDiv.style.display = "flex";
    if (reset) resetPlayer(state.player);
}

export function startCampaignWithIntro(state, menuDiv) {
    menuDiv.style.display = "none";
    state.gameState = "INTRO";
    state.introTimer = 0;
    state.introTextIndex = 0;
    state.currentLevel = 0;
}

export function startGame(state, menuDiv, mode) {
    menuDiv.style.display = "none";
    state.gameState = mode;
    if (mode === "CAMPAIGN") {
        state.currentLevel = 0;
        loadLevel(state);
    } else if (mode === "ENDLESS") {
        startEndless(state);
    }
}

export function showAchievements(state, menuDiv) {
    menuDiv.style.display = "none";
    state.gameState = "ACHIEVEMENTS";
}

export function die(state) {
    createDeathExplosion(state, state.player.x, state.player.y);
    state.stats.deaths++;
    if (state.stats.deaths >= 5) unlockAchievement(state, "clumsy");
    if (state.gameState === "CAMPAIGN") {
        loadLevel(state);
    } else if (state.gameState === "ENDLESS") {
        if (state.endlessDistance > state.stats.highEndless) state.stats.highEndless = state.endlessDistance;
        state.gameState = "ENDLESS_OVER";
    }
}
