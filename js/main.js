import { createState } from "./state.js";
import { bindInput } from "./input.js";
import { startCampaignWithIntro, startGame, showAchievements, returnToMenu } from "./session.js";
import { update } from "./update.js";
import { draw } from "./rendering/index.js";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const menuDiv = document.getElementById("main-menu");
export const state = createState();

document.getElementById("campaign-button").addEventListener("click", () => startCampaignWithIntro(state, menuDiv));
document.getElementById("endless-button").addEventListener("click", () => startGame(state, menuDiv, "ENDLESS"));
document.getElementById("achievements-button").addEventListener("click", () => showAchievements(state, menuDiv));
bindInput(window, state, reset => returnToMenu(state, menuDiv, reset));

function gameLoop() {
    update(state, canvas);
    draw(ctx, canvas, state);
    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
