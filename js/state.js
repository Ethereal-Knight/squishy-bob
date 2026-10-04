import { createAchievements } from "./achievements.js";

export const introMaxTimer = 160;
export const introMessages = [
    "> INITIATING BOBSHELL v2.5...",
    "> LOADING NEON MAZE PROTOCOLS...",
    "> CORRUPTED DATA DETECTED (GLITCH ENEMIES)...",
    "> SQUISH ENGINE ENGAGED!"
];

export function createState() {
    return {
        gameState: "MENU",
        currentLevel: 0,
        endlessDistance: 0,
        endlessSpeed: 3.5,
        introTimer: 0,
        introTextIndex: 0,
        keys: {
            w: false, a: false, s: false, d: false, space: false,
            ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false
        },
        spaceWasPressed: false,
        upWasPressed: false,
        player: {
            x: 50, y: 400,
            baseW: 26, baseH: 26,
            w: 26, h: 26,
            renderW: 26, renderH: 26,
            vx: 0, vy: 0,
            speed: 6.2, jumpPower: 11.2,
            gravity: 0.58, friction: 0.82,
            grounded: false,
            standingOn: null,
            coyoteTimer: 0,
            jumpsLeft: 2,
            isSquishingFlat: false,
            flipAngle: 0,
            isFlipping: false,
            blinkTimer: 100,
            isBlinking: false
        },
        camera: { x: 0, y: 0 },
        platforms: [],
        movingPlatforms: [],
        lavas: [],
        enemies: [],
        goal: { x: 0, y: 0, w: 40, h: 40 },
        particles: [],
        energyBits: [],
        stats: { deaths: 0, maxLevel: 0, highEndless: 0, bitsCollected: 0, flips: 0, flatSquishes: 0 },
        achievements: createAchievements(),
        toasts: []
    };
}
