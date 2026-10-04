import { introMaxTimer, introMessages } from "./state.js";
import { updateToasts } from "./achievements.js";
import { updateParticles } from "./particles.js";
import { updateMovingPlatforms, updateEnemies } from "./patrols.js";
import { updatePlayer } from "./player.js";
import { loadLevel, updateCampaign } from "./campaign.js";
import { updateEndless } from "./endless.js";
import { die } from "./session.js";

export function update(state, canvas) {
    updateToasts(state.toasts);
    updateParticles(state.particles);
    if (state.gameState === "INTRO") {
        state.introTimer++;
        if (state.introTimer % 38 === 0 && state.introTextIndex < introMessages.length - 1) {
            state.introTextIndex++;
        }
        if (state.introTimer >= introMaxTimer) {
            state.gameState = "CAMPAIGN";
            loadLevel(state);
        }
        return;
    }
    if (state.gameState !== "CAMPAIGN" && state.gameState !== "ENDLESS") return;
    const onDeath = () => die(state);
    updateMovingPlatforms(state);
    if (updateEnemies(state, onDeath)) return;
    updatePlayer(state, onDeath);
    const { player, camera } = state;
    let targetCamX = player.x - canvas.width / 2 + player.w / 2;
    let targetCamY = player.y - canvas.height / 2 + player.h / 2;
    camera.x += (targetCamX - camera.x) * 0.1;
    camera.y += (targetCamY - camera.y) * 0.1;
    if (state.gameState === "CAMPAIGN") updateCampaign(state);
    if (state.gameState === "ENDLESS") updateEndless(state);
}
